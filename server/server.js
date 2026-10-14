
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import mongoose from "mongoose";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import authRoutes from "./routes/auth.js";

dotenv.config();

// Validate required environment variables.
for (const key of ["GROQ_API_KEY", "MONGODB_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing ${key} in server/.env`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_TEXT_CHARS = 30000;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Keep your existing Groq models unchanged.
const TEXT_MODEL =
  process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-20b";

const VISION_MODEL =
  process.env.GROQ_VISION_MODEL ||
  "meta-llama/llama-4-scout-17b-16e-instruct";

// CORS
app.use(
  cors({
    origin:
      process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);

// Normal text chat uses JSON.
// File attachments are handled separately through multipart/form-data.
app.use(express.json({ limit: "1mb" }));

// Authentication diagnostic route
app.get("/api/auth/test", (req, res) => {
  res.json({
    message: "Acadexa backend and API routing are working.",
  });
});

// Authentication routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Acadexa AI backend",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Configure in-memory upload with a 5 MB limit.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_BYTES,
    files: 1,
    fields: 10,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      return callback(null, true);
    }

    const error = new Error(
      "Upload a PDF, JPG, PNG, WEBP, or GIF file."
    );
    error.status = 400;
    callback(error);
  },
});

// Extract selectable text from PDFs using pdf-parse v2.
async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return (result.text || "").trim();
  } finally {
    await parser.destroy();
  }
}

// Shared assistant handler for both JSON and multipart requests.
async function handleAssistant(req, res) {
  try {
    const isMultipart = Boolean(req.file);

    const message = isMultipart
      ? req.body.message || ""
      : req.body?.message || "";

    let history = [];
    let studentContext = null;

    try {
      history = isMultipart
        ? JSON.parse(req.body.history || "[]")
        : req.body?.history || [];

      studentContext = isMultipart
        ? JSON.parse(req.body.studentContext || "null")
        : req.body?.studentContext ?? null;
    } catch {
      return res.status(400).json({
        error: "Invalid chat history or student context.",
      });
    }

    if (typeof message !== "string" || message.length > 5000) {
      return res.status(400).json({
        error: "Message must be under 5000 characters.",
      });
    }

    if (!message.trim() && !req.file) {
      return res.status(400).json({
        error: "Enter a message or attach a file.",
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter(
            (item) =>
              item &&
              ["user", "assistant"].includes(item.role) &&
              typeof item.content === "string"
          )
          .map(({ role, content }) => ({
            role,
            content: content.slice(0, 5000),
          }))
      : [];

    let model = TEXT_MODEL;
    let userContent = message.trim();

    let systemPrompt =
      "You are Acadexa AI, a helpful student assistant. " +
      "Explain DSA, C++, web development, AI/ML, engineering " +
      "subjects, and exam preparation clearly, step by step.";

    if (
      studentContext &&
      typeof studentContext === "object"
    ) {
      systemPrompt +=
        "\n\nThe following is the student's saved Acadexa " +
        "study context. Use it when relevant, and do not " +
        "invent missing records:\n" +
        JSON.stringify(studentContext).slice(0, 12000);
    }

    // Process an uploaded PDF or image.
    if (req.file) {
      const file = req.file;

      const isPdf =
        file.mimetype === "application/pdf" ||
        file.originalname.toLowerCase().endsWith(".pdf");

      if (isPdf) {
        const extractedText = await extractPdfText(file.buffer);

        if (!extractedText) {
          return res.status(422).json({
            error:
              "No selectable text was found in this PDF. " +
              "Scanned PDFs require OCR support.",
          });
        }

        userContent =
          (message.trim() ||
            "Summarize this PDF and explain its important points.") +
          `\n\nAttached PDF: ${file.originalname}\n\n` +
          "Extracted PDF text:\n" +
          extractedText.slice(0, MAX_PDF_TEXT_CHARS);
      } else {
        const allowedImages = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ];

        if (!allowedImages.includes(file.mimetype)) {
          return res.status(400).json({
            error: "Unsupported image format.",
          });
        }

        // Keep using your existing vision model.
        model = VISION_MODEL;

        userContent = [
          {
            type: "text",
            text:
              message.trim() ||
              "Analyze this image and explain its contents clearly.",
          },
          {
            type: "image_url",
            image_url: {
              url:
                `data:${file.mimetype};base64,` +
                file.buffer.toString("base64"),
            },
          },
        ];
      }
    }

    // Keep the existing Groq chat completion flow.
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...safeHistory,
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.6,
      max_completion_tokens: 1500,
    });

    const reply = completion.choices[0]?.message?.content;

    return res.json({
      reply: reply || "Sorry, I could not generate a response.",
    });
  } catch (error) {
    console.error("Acadexa assistant error:", error.message);

    if (error instanceof multer.MulterError) {
      return res.status(
        error.code === "LIMIT_FILE_SIZE" ? 413 : 400
      ).json({
        error:
          error.code === "LIMIT_FILE_SIZE"
            ? "File exceeds the 5 MB limit."
            : error.message,
      });
    }

    if (error.status === 429 || error.statusCode === 429) {
      return res.status(429).json({
        error: "Groq rate limit reached. Please try again later.",
      });
    }

    if ([400, 413, 422].includes(error.status)) {
      return res.status(error.status).json({
        error: error.message,
      });
    }

    return res.status(502).json({
      error:
        "The AI request failed. Check the backend terminal " +
        "for details.",
    });
  }
}

// Accept multipart attachments and ordinary JSON chat requests.
app.post(
  "/api/assistant",
  (req, res, next) => {
    if (!req.is("multipart/form-data")) {
      return handleAssistant(req, res);
    }

    upload.single("attachment")(req, res, (error) => {
      if (error) {
        if (error instanceof multer.MulterError) {
          return res.status(
            error.code === "LIMIT_FILE_SIZE" ? 413 : 400
          ).json({
            error:
              error.code === "LIMIT_FILE_SIZE"
                ? "File exceeds the 5 MB limit."
                : error.message,
          });
        }

        return res.status(error.status || 400).json({
          error: error.message || "Unable to process uploaded file.",
        });
      }

      return handleAssistant(req, res);
    });
  }
);

// Connect to MongoDB before accepting requests.
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Acadexa backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
