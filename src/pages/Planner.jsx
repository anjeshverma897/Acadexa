
import { useEffect, useMemo, useState } from "react";
import {
  STORAGE_KEYS,
  DATA_UPDATED_EVENT,
  readArray,
  writeStorage,
} from "../utils/storage";

function getLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function Planner() {
  const [sessions, setSessions] = useState(() =>
    readArray(STORAGE_KEYS.sessions)
  );

  const [subject, setSubject] = useState("DSA");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(getLocalDate);
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState("1");
  const [filterDate, setFilterDate] = useState(getLocalDate);

  // Refresh sessions if they change in another tab or page.
  useEffect(() => {
    function refreshSessions() {
      setSessions(readArray(STORAGE_KEYS.sessions));
    }

    function handleStorage(event) {
      if (
        !event.key ||
        event.key === STORAGE_KEYS.sessions
      ) {
        refreshSessions();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshSessions);
    window.addEventListener(DATA_UPDATED_EVENT, refreshSessions);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshSessions);
      window.removeEventListener(
        DATA_UPDATED_EVENT,
        refreshSessions
      );
    };
  }, []);

  // Save sessions using the shared storage utility.
  function saveSessions(updatedSessions) {
    const saved = writeStorage(
      STORAGE_KEYS.sessions,
      updatedSessions
    );

    if (saved) {
      setSessions(updatedSessions);
    } else {
      alert("Unable to save sessions in this browser.");
    }
  }

  // Add a study session.
  function handleSubmit(event) {
    event.preventDefault();

    if (!topic.trim()) {
      alert("Please enter a topic.");
      return;
    }

    if (!date || !startTime) {
      alert("Please select a date and start time.");
      return;
    }

    const durationValue = Number(duration);

    if (!Number.isFinite(durationValue) || durationValue <= 0) {
      alert("Please select a valid session duration.");
      return;
    }

    const newSession = {
      id: `${Date.now()}-${Math.random()}`,
      subject,
      topic: topic.trim(),
      date,
      startTime,
      duration: durationValue,
      completed: false,
    };

    saveSessions([...sessions, newSession]);
    setTopic("");
  }

  // Toggle session completion.
  function toggleSession(id) {
    const updated = sessions.map((session) =>
      session.id === id
        ? { ...session, completed: !session.completed }
        : session
    );

    saveSessions(updated);
  }

  // Delete a session.
  function deleteSession(id) {
    saveSessions(
      sessions.filter((session) => session.id !== id)
    );
  }

  // Filter and sort sessions for the selected date.
  const visibleSessions = useMemo(() => {
    return sessions
      .filter((session) => session.date === filterDate)
      .sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      );
  }, [sessions, filterDate]);

  const completedCount = sessions.filter(
    (session) => session.completed
  ).length;

  const completedHours = sessions
    .filter((session) => session.completed)
    .reduce(
      (total, session) =>
        total + (Number(session.duration) || 0),
      0
    );

  function formatTime(time) {
    if (!time) return "Time not set";

    const [hours, minutes] = time.split(":");
    const parsedHours = Number(hours);

    if (
      !Number.isFinite(parsedHours) ||
      parsedHours < 0 ||
      parsedHours > 23 ||
      !minutes
    ) {
      return time;
    }

    const period = parsedHours >= 12 ? "PM" : "AM";
    const displayHour = parsedHours % 12 || 12;

    return `${displayHour}:${minutes} ${period}`;
  }

  return (
    <div className="planner-page">
      <header className="planner-header">
        <div>
          <h1>Study Planner 📅</h1>
          <p>Plan your sessions and build consistent habits.</p>
        </div>
      </header>

      {/* Statistics */}
      <div className="planner-stats">
        <div className="planner-stat">
          <span>Total Sessions</span>
          <strong>{sessions.length}</strong>
        </div>

        <div className="planner-stat">
          <span>Completed Sessions</span>
          <strong>{completedCount}</strong>
        </div>

        <div className="planner-stat">
          <span>Completed Study Hours</span>
          <strong>
            {Number(completedHours.toFixed(2))} hrs
          </strong>
        </div>
      </div>

      {/* Add session */}
      <section className="planner-card">
        <h2>Add Study Session</h2>

        <form className="planner-form" onSubmit={handleSubmit}>
          <label>
            Subject
            <select
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              <option value="DSA">DSA</option>
              <option value="Web Development">Web Development</option>
              <option value="AI/ML">AI/ML</option>
              <option value="College Study">College Study</option>
              <option value="Project">Project</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Topic
            <input
              type="text"
              placeholder="e.g. Graph Algorithms"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              required
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label>
            Start Time
            <input
              type="time"
              value={startTime}
              onChange={(event) =>
                setStartTime(event.target.value)
              }
              required
            />
          </label>

          <label>
            Duration
            <select
              value={duration}
              onChange={(event) =>
                setDuration(event.target.value)
              }
            >
              <option value="0.5">30 minutes</option>
              <option value="1">1 hour</option>
              <option value="1.5">1.5 hours</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
            </select>
          </label>

          <button type="submit" className="planner-add-btn">
            + Add Session
          </button>
        </form>
      </section>

      {/* Schedule */}
      <section className="planner-card">
        <div className="planner-list-header">
          <h2>Study Schedule</h2>

          <input
            type="date"
            aria-label="Filter schedule by date"
            value={filterDate}
            onChange={(event) =>
              setFilterDate(event.target.value)
            }
          />
        </div>

        {visibleSessions.length === 0 ? (
          <div className="planner-empty">
            <span>📚</span>
            <h3>No sessions for this date</h3>
            <p>Add a session or select another date.</p>
          </div>
        ) : (
          visibleSessions.map((session) => (
            <div
              className={`session-row ${
                session.completed ? "session-completed" : ""
              }`}
              key={session.id}
            >
              <input
                type="checkbox"
                checked={Boolean(session.completed)}
                onChange={() => toggleSession(session.id)}
                aria-label={`Complete ${session.topic}`}
              />

              <div className="session-time">
                {formatTime(session.startTime)}
              </div>

              <div className="session-info">
                <h3>{session.topic}</h3>
                <p>
                  {session.subject} · {session.duration}{" "}
                  {Number(session.duration) === 1 ? "hour" : "hours"}
                </p>
              </div>

              <span
                className={`session-status ${
                  session.completed ? "done" : "planned"
                }`}
              >
                {session.completed ? "Completed" : "Planned"}
              </span>

              <button
                type="button"
                className="session-delete-btn"
                onClick={() => deleteSession(session.id)}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

export default Planner;
