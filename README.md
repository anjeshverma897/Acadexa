
# Acadexa — Your Personal Academic Companion

Acadexa is a student productivity platform that combines study planning, task management, DSA progress tracking, exam preparation, notes, and an AI learning assistant.

**GitHub Repository:** https://github.com/anjeshverma897/Acadexa

## Features

- **Dashboard:** Overview of your academic activities.
- **Task Management:** Create and track academic tasks.
- **Study Planner:** Organize study sessions.
- **DSA Tracker:** Track solved problems and progress by topic.
- **Exam Preparation:** Organize upcoming exams.
- **Notes:** Save and manage study notes.
- **AI Assistant:** Ask questions, understand concepts, and debug code.
- **Chat History:** Access previous AI conversations.
- **Authentication:** Register and sign in.
- **File Attachments:** Image and PDF support, when configured in the backend.

## Tech Stack

### Frontend
- React
- Vite
- React Markdown
- Remark GFM
- React Syntax Highlighter
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Groq SDK
- Multer for file uploads
- pdf-parse for PDF text extraction

## Project Structure

```text
Acadexa/
├── src/
│   ├── pages/
│   │   ├── Assistant.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DSA.jsx
│   │   ├── Exam.jsx
│   │   ├── Notes.jsx
│   │   ├── Planner.jsx
│   │   ├── Profile.jsx
│   │   └── Task.jsx
│   ├── utils/
│   ├── App.jsx
│   └── index.css
├── server/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── .env.example
├── package.json
└── README.md
```

## Requirements

- Node.js and npm
- MongoDB or MongoDB Atlas account
- Groq API key

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/anjeshverma897/Acadexa.git
cd Acadexa
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `server/.env` file:

```env
PORT=5000
FRONTEND_ORIGIN=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GROQ_API_KEY=your_groq_api_key

GROQ_TEXT_MODEL=openai/gpt-oss-20b
GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```

Use model IDs supported by your Groq account. Never commit your actual `.env` file or credentials.

### 5. Start the backend

From the `server` directory, use the start command configured in `server/package.json`, for example:

```bash
npm run dev
```

### 6. Start the frontend

Open another terminal in the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite, typically:

http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend health status |
| POST | `/api/assistant` | Send a message to the AI assistant |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Retrieve the authenticated user |

Actual endpoint availability depends on the current backend implementation.

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend port |
| `FRONTEND_ORIGIN` | Allowed frontend origin |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `GROQ_API_KEY` | Groq API key |
| `GROQ_TEXT_MODEL` | Text model identifier |
| `GROQ_VISION_MODEL` | Vision model identifier |

## Troubleshooting

### MongoDB connection fails
- Check the connection string and database credentials.
- Check the MongoDB Atlas network access allowlist.

### AI requests fail
- Verify your Groq API key.
- Confirm the configured model is available to your account.
- Check backend terminal logs.

### Image and PDF uploads fail
- Ensure the frontend sends `multipart/form-data`.
- Ensure the backend uses `multer` to receive the `attachment` field.
- Ensure images are processed by a vision-capable model.
- Ensure PDF text is extracted before sending it to the AI model.

## Security

- Never commit API keys, database passwords, or JWT secrets.
- Keep `.env` files in `.gitignore`.
- Validate uploaded files on the backend.
- Verify AI-generated information before relying on it.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Review your changes for accidental secrets.
5. Submit a pull request.

