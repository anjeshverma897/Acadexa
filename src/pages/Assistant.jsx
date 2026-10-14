import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./Assistant.css";

const STORAGE_KEY = "acadexa_ai_conversations";
const LEGACY_KEY = "acadexa_ai_chat_history";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const suggestions = [
  {
    icon: "📅",
    title: "Generate today's study plan",
    description: "Plan around your saved tasks and exams.",
    prompt:
      "Using my saved Acadexa tasks, study sessions, and upcoming exams, create a realistic study plan for today. Prioritize urgent work and explain your choices.",
  },
  {
    icon: "📊",
    title: "Analyze my DSA progress",
    description: "Identify topics to revise next.",
    prompt:
      "Analyze my saved DSA problems by topic and difficulty. Identify my strongest areas, topics needing revision, and the next five topics or problems I should practice. Do not invent problem records.",
  },
  {
    icon: "🎓",
    title: "Prepare for upcoming exams",
    description: "Build a focused exam strategy.",
    prompt:
      "Review my saved upcoming exams and study sessions. Help me prioritize subjects and create a preparation strategy based on the available information.",
  },
  {
    icon: "✅",
    title: "Review pending tasks",
    description: "Find your next important actions.",
    prompt:
      "Review my saved tasks, deadlines, and priorities. Summarize completed and pending work, highlight overdue tasks, and recommend my next three actions.",
  },
];

function createConversation() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: "New chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Could not read ${key}:`, error);
    return fallback;
  }
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (message) =>
        message &&
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string",
    )
    .map((message) => ({
      id: message.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: message.role,
      content: message.content,
    }));
}

function getInitialState() {
  const saved = readStorage(STORAGE_KEY, null);
  if (Array.isArray(saved) && saved.length) {
    const conversations = saved
      .filter((chat) => chat && typeof chat === "object")
      .map((chat) => ({
        id: chat.id || createConversation().id,
        title: chat.title || "New chat",
        messages: normalizeMessages(chat.messages),
        updatedAt: Number(chat.updatedAt) || Date.now(),
      }));
    if (conversations.length) {
      return { conversations, activeId: conversations[0].id };
    }
  }

  const oldMessages = readStorage(LEGACY_KEY, []);
  if (Array.isArray(oldMessages) && oldMessages.length) {
    const conversation = {
      ...createConversation(),
      title: "Previous conversation",
      messages: normalizeMessages(oldMessages),
    };
    return { conversations: [conversation], activeId: conversation.id };
  }

  const conversation = createConversation();
  return { conversations: [conversation], activeId: conversation.id };
}

function getChatTitle(messages) {
  const firstQuestion = messages.find((message) => message.role === "user");
  if (!firstQuestion) return "New chat";
  const title = firstQuestion.content.trim();
  return title.length > 35 ? `${title.slice(0, 35)}…` : title;
}

function getStudentContext() {
  const tasks = readStorage("acadexa_tasks", []);
  const sessions = readStorage("acadexa_study_sessions", []);
  const problems = readStorage("acadexa_dsa_problems", []);
  const exams = readStorage("acadexa_exams", []);
  const notes = readStorage("acadexa_notes", []);
  const safeArray = (value) => (Array.isArray(value) ? value : []);
  const validTasks = safeArray(tasks);
  const validSessions = safeArray(sessions);
  const validProblems = safeArray(problems);
  const validExams = safeArray(exams);
  const validNotes = safeArray(notes);
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const byTopic = validProblems.reduce((result, problem) => {
    const topic = problem.topic || "Other";
    result[topic] = (result[topic] || 0) + 1;
    return result;
  }, {});
  const completedSessions = validSessions.filter((session) => session.completed);
  const completedMinutes = completedSessions.reduce(
    (total, session) => total + (Number(session.duration) || 0),
    0,
  );

  return {
    today,
    tasks: {
      total: validTasks.length,
      completed: validTasks.filter((task) => task.completed).length,
      pending: validTasks.filter((task) => !task.completed).length,
      items: validTasks.slice(-50).map((task) => ({
        title: task.title,
        subject: task.subject,
        priority: task.priority,
        deadline: task.deadline,
        completed: Boolean(task.completed),
      })),
    },
    studySessions: {
      total: validSessions.length,
      completed: completedSessions.length,
      completedHours: Number((completedMinutes / 60).toFixed(2)),
      items: validSessions.slice(-50).map((session) => ({
        subject: session.subject,
        topic: session.topic,
        date: session.date,
        startTime: session.startTime,
        duration: session.duration,
        completed: Boolean(session.completed),
      })),
    },
    dsaProgress: {
      totalSolved: validProblems.length,
      byTopic,
      recentProblems: validProblems.slice(-30).map((problem) => ({
        title: problem.title,
        topic: problem.topic,
        difficulty: problem.difficulty,
      })),
    },
    exams: validExams.slice(-30).map((exam) => ({
      title: exam.title,
      subject: exam.subject,
      date: exam.date,
      completed: Boolean(exam.completed),
    })),
    notes: validNotes.slice(-20).map((note) => ({
      title: note.title,
      subject: note.subject,
      content: String(note.content ?? note.body ?? note.text ?? "").slice(0, 3000),
    })),
  };
}

function CodeBlock({ className, children }) {
  const [copied, setCopied] = useState(false);
  const language = /language-([\w+#.-]+)/.exec(className || "")?.[1] || "text";
  const code = String(children).replace(/\n$/, "");

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Could not copy code:", error);
    }
  }

  return (
    <div className="assistant-code-block">
      <div className="assistant-code-header">
        <span>{language}</span>
        <button type="button" onClick={copyCode}>
          {copied ? "Copied!" : "Copy code"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "16px",
          borderRadius: "0 0 12px 12px",
          fontSize: "13px",
          overflowX: "auto",
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

export default function Assistant() {
  const [initialState] = useState(getInitialState);
  const [conversations, setConversations] = useState(initialState.conversations);
  const [activeId, setActiveId] = useState(initialState.activeId);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attachment, setAttachment] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeConversation =
    conversations.find((chat) => chat.id === activeId) || conversations[0];
  const messages = activeConversation?.messages || [];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (storageError) {
      console.error("Could not save conversations:", storageError);
      setError("Unable to save chat history in this browser.");
    }
  }, [conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  function updateConversation(id, updater) {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id
          ? { ...updater(conversation), updatedAt: Date.now() }
          : conversation,
      ),
    );
  }

  function startNewChat() {
    if (loading) return;
    const conversation = createConversation();
    setConversations((previous) => [conversation, ...previous]);
    setActiveId(conversation.id);
    setQuestion("");
    setAttachment(null);
    setError("");
    inputRef.current?.focus();
  }

  function openConversation(id) {
    if (loading) return;
    setActiveId(id);
    setQuestion("");
    setAttachment(null);
    setError("");
  }

  function renameConversation(id) {
    if (loading) return;
    const current = conversations.find((chat) => chat.id === id);
    if (!current) return;
    const title = window.prompt("Enter a name for this conversation:", current.title);
    if (!title?.trim()) return;
    updateConversation(id, (conversation) => ({
      ...conversation,
      title: title.trim().slice(0, 60),
    }));
  }

  function deleteConversation(id) {
    if (loading) return;
    const current = conversations.find((chat) => chat.id === id);
    if (!current || !window.confirm(`Delete "${current.title}"?`)) return;
    const remaining = conversations.filter((chat) => chat.id !== id);
    if (!remaining.length) {
      const newChat = createConversation();
      setConversations([newChat]);
      setActiveId(newChat.id);
    } else {
      setConversations(remaining);
      if (activeId === id) setActiveId(remaining[0].id);
    }
    setError("");
    setQuestion("");
    setAttachment(null);
  }

  async function readAttachment(file) {
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      setError("Please select an image or PDF file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Please select a file smaller than 5 MB.");
      return;
    }
    const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (isImage && !allowedImages.includes(file.type)) {
      setError("Use a JPG, PNG, WEBP, or GIF image.");
      return;
    }

    try {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read this file."));
        reader.readAsDataURL(file);
      });
      if (typeof data !== "string") throw new Error("Could not read this file.");
      setAttachment({
        type: isImage ? "image" : "pdf",
        name: file.name,
        mimeType: isPdf ? "application/pdf" : file.type,
        data,
      });
      setError("");
    } catch (readError) {
      setError(readError.message || "Could not read this file.");
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) readAttachment(file);
    event.target.value = "";
  }

  function handlePaste(event) {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (file) {
      event.preventDefault();
      readAttachment(file);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading && (question.trim() || attachment)) handleSend();
    }
  }

  async function copyAnswer(content) {
    try {
      await navigator.clipboard.writeText(content);
      setError("");
    } catch (copyError) {
      console.error("Could not copy answer:", copyError);
      setError("Unable to copy the answer. Please try again.");
    }
  }

  async function handleSend(text = question) {
    const userQuestion = String(text ?? "").trim();
    const selectedAttachment = attachment;
    if ((!userQuestion && !selectedAttachment) || loading || !activeConversation) return;

    const conversationId = activeConversation.id;
    const existingMessages = activeConversation.messages || [];
    const previousMessages = existingMessages.slice(-10);
    const attachmentLabel = selectedAttachment
      ? `[Attached ${selectedAttachment.type}: ${selectedAttachment.name}]`
      : "";
    const displayContent = [userQuestion, attachmentLabel].filter(Boolean).join("\n\n");
    const userMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: displayContent,
    };
    const updatedMessages = [...existingMessages, userMessage];

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title:
        conversation.title === "New chat"
          ? getChatTitle(updatedMessages)
          : conversation.title,
      messages: updatedMessages,
    }));

    setQuestion("");
    setAttachment(null);
    setError("");
    setLoading(true);

    try {
      const studentContext = getStudentContext();
      const history = previousMessages.map(({ role, content }) => ({ role, content }));
      let response;

      if (selectedAttachment) {
        const formData = new FormData();
        formData.append(
          "message",
          userQuestion ||
            (selectedAttachment.type === "image"
              ? "Analyze this image and explain it clearly."
              : "Summarize this PDF and explain its important points."),
        );
        formData.append("history", JSON.stringify(history));
        formData.append("studentContext", JSON.stringify(studentContext ?? null));

        const fileResponse = await fetch(selectedAttachment.data);
        if (!fileResponse.ok) throw new Error("Could not read the selected attachment.");
        const blob = await fileResponse.blob();
        const file = new File([blob], selectedAttachment.name, {
          type: selectedAttachment.mimeType,
        });
        formData.append("attachment", file);

        response = await fetch("/api/assistant", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userQuestion, history, studentContext }),
        });
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error(`Invalid server response (${response.status}).`);
      }
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
      }
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The AI returned an empty response.");
      }

      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: [
          ...conversation.messages,
          {
            id: `${Date.now()}-assistant`,
            role: "assistant",
            content: data.reply,
          },
        ],
      }));
    } catch (sendError) {
      console.error("Acadexa AI error:", sendError);
      setError(sendError.message || "Unable to connect to the AI assistant.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className={`acadexa-chat ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="history-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">✳</span>
          <span className="sidebar-brand-name">Acadexa</span>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            ‹
          </button>
        </div>

        <button
          type="button"
          className="sidebar-new-chat"
          onClick={startNewChat}
          disabled={loading}
        >
          <span>＋</span> New chat
        </button>

        <p className="history-heading">YOUR CONVERSATIONS</p>
        <div className="history-list">
          {conversations
            .slice()
            .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
            .map((conversation) => (
              <div
                key={conversation.id}
                className={`history-item ${conversation.id === activeId ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="history-select"
                  onClick={() => openConversation(conversation.id)}
                  disabled={loading}
                  title={conversation.title}
                >
                  <span className="history-chat-icon">▤</span>
                  <span className="history-chat-title">{conversation.title}</span>
                </button>
                <div className="history-actions">
                  <button
                    type="button"
                    title="Rename chat"
                    aria-label="Rename chat"
                    onClick={() => renameConversation(conversation.id)}
                    disabled={loading}
                  >
                    ⋯
                  </button>
                  <button
                    type="button"
                    title="Delete chat"
                    aria-label="Delete chat"
                    onClick={() => deleteConversation(conversation.id)}
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
        </div>

        <div className="sidebar-bottom">
          <span className="sidebar-avatar">A</span>
          <div>
            <strong>Acadexa AI</strong>
            <span>Personal study space</span>
          </div>
        </div>
      </aside>

      <section className="chat-workspace">
        <header className="chat-header">
          <div className="chat-brand">
            {!sidebarOpen && (
              <button
                type="button"
                className="open-sidebar-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                ☰
              </button>
            )}
            <div className="chat-brand-icon">✳</div>
            <div>
              <h1>{activeConversation?.title || "Acadexa AI"}</h1>
              <p>Your personal learning companion</p>
            </div>
          </div>
          <div className="chat-header-actions">
            <span className="online-status">
              <span className="online-dot" />
              AI Assistant
            </span>
            <button
              className="clear-chat-btn"
              type="button"
              onClick={startNewChat}
              disabled={loading}
            >
              ＋ New chat
            </button>
          </div>
        </header>

        <main className="chat-main">
          {messages.length === 0 ? (
            <section className="chat-welcome">
              <div className="welcome-badge">
                <span>✦</span> YOUR AI STUDY PARTNER
              </div>
              <h2>
                Learn smarter.
                <br />
                <span>Build something great.</span>
              </h2>
              <p className="welcome-description">
                Ask questions, understand difficult concepts, debug code, and make
                progress toward your goals. Your saved study data can help personalize
                answers.
              </p>
              <div className="suggestion-grid">
                {suggestions.map((item) => (
                  <button
                    className="suggestion-card"
                    type="button"
                    key={item.title}
                    onClick={() => handleSend(item.prompt)}
                    disabled={loading}
                  >
                    <span className="suggestion-icon">{item.icon}</span>
                    <span className="suggestion-title">{item.title}</span>
                    <span className="suggestion-description">{item.description}</span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="chat-messages" aria-live="polite">
              {messages.map((message, index) => (
                <article
                  key={message.id || `${activeId}-${index}-${message.role}`}
                  className={`chat-message ${
                    message.role === "user" ? "user-message" : "ai-message"
                  }`}
                >
                  <div className="message-avatar">
                    {message.role === "user" ? "Y" : "✳"}
                  </div>
                  <div className="message-content">
                    <div className="message-author">
                      {message.role === "user" ? "You" : "Acadexa AI"}
                      {message.role === "assistant" && (
                        <span className="message-ai-label">AI</span>
                      )}
                    </div>
                    <div className="markdown-content">
                      {message.role === "assistant" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ className, children, ...props }) {
                              if (className && /language-/.test(className)) {
                                return (
                                  <CodeBlock className={className}>{children}</CodeBlock>
                                );
                              }
                              return (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            a({ href, children, ...props }) {
                              const safeHref = /^(https?:|mailto:)/i.test(href || "")
                                ? href
                                : undefined;
                              return (
                                <a
                                  href={safeHref}
                                  target={safeHref ? "_blank" : undefined}
                                  rel={safeHref ? "noopener noreferrer" : undefined}
                                  {...props}
                                >
                                  {children}
                                </a>
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                    {message.role === "assistant" && (
                      <button
                        className="copy-answer-btn"
                        type="button"
                        onClick={() => copyAnswer(message.content)}
                      >
                        Copy answer
                      </button>
                    )}
                  </div>
                </article>
              ))}
              {loading && (
                <article className="chat-message ai-message">
                  <div className="message-avatar">✳</div>
                  <div className="message-content">
                    <div className="message-author">Acadexa AI</div>
                    <div className="typing-indicator">
                      <span />
                      <span />
                      <span />
                      <p>Thinking through your question...</p>
                    </div>
                  </div>
                </article>
              )}
              <div ref={bottomRef} />
            </section>
          )}
        </main>

        {error && (
          <div className="chat-error" role="alert">
            <span>!</span>
            <p>{error}</p>
            <button type="button" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}

        <footer className="chat-footer">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
              onChange={handleFileChange}
              hidden
            />
            <button
              type="button"
              className="attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              aria-label="Attach image or PDF"
              title="Attach image or PDF"
            >
              📎
            </button>
            <textarea
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Message Acadexa AI..."
              rows={1}
              maxLength={5000}
              disabled={loading}
              aria-label="Message Acadexa AI"
            />

            {attachment && (
              <div className="attachment-preview">
                <span>
                  {attachment.type === "image" ? "🖼️" : "📄"} {attachment.name}
                </span>
                {attachment.type === "image" && (
                  <img
                    src={attachment.data}
                    alt="Selected attachment preview"
                    className="attachment-image-preview"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  disabled={loading}
                >
                  Remove ×
                </button>
              </div>
            )}

            <div className="composer-bottom">
              <span className="composer-hint">
                <kbd>Enter</kbd> to send · <kbd>Shift + Enter</kbd> for a new line
              </span>
              <div className="composer-actions">
                <span className="character-count">{question.length}/5000</span>
                <button
                  className="send-btn"
                  type="submit"
                  disabled={loading || (!question.trim() && !attachment)}
                  aria-label="Send message"
                >
                  {loading ? "..." : "↑"}
                </button>
              </div>
            </div>
          </form>
          <p className="chat-disclaimer">
            ✦ AI can make mistakes. Verify important academic information. Relevant
            saved study data is sent to the configured AI service when you send a
            message.
          </p>
        </footer>
      </section>
    </div>
  );
}
