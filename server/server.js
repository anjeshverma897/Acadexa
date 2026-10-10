
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("Missing GROQ_API_KEY in server/.env");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Acadexa AI backend",
  });
});

app.post("/api/assistant", async (req, res) => {
  try {
    const { message, history = [] } = req.body ?? {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message.",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        error: "Message must be under 5000 characters.",
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

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are Acadexa AI, a helpful student assistant. Explain DSA, C++, web development, AI/ML, engineering subjects, and exam preparation clearly, step by step.",
        },
        ...safeHistory,
        { role: "user", content: message.trim() },
      ],
      temperature: 0.6,
      max_completion_tokens: 1500,
    });

    const reply = completion.choices[0]?.message?.content;

    return res.json({
      reply: reply || "Sorry, I could not generate a response.",
    });
  } catch (error) {
    console.error("Groq API error:", error.message);

    return res.status(error.status === 429 ? 429 : 502).json({
      error:
        error.status === 429
          ? "Groq rate limit reached. Please try again later."
          : "Groq API request failed. Check your API key, model access, and server logs.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Acadexa backend running at http://localhost:${PORT}`);
});
