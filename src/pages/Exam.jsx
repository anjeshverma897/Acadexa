
import { useEffect, useState } from "react";
import {
  STORAGE_KEYS,
  DATA_UPDATED_EVENT,
  readArray,
  writeStorage,
} from "../utils/storage";

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysRemaining(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split("-").map(Number);
  const examDate = new Date(year, month - 1, day);
  const today = new Date();

  if (Number.isNaN(examDate.getTime())) return null;

  today.setHours(0, 0, 0, 0);
  examDate.setHours(0, 0, 0, 0);

  return Math.round(
    (examDate.getTime() - today.getTime()) / 86400000
  );
}

function formatDate(dateString) {
  if (!dateString) return "Date not set";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Exam() {
  const [exams, setExams] = useState(() =>
    readArray(STORAGE_KEYS.exams)
  );

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(getToday);
  const [type, setType] = useState("Midterm");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Synchronize exam data across Acadexa pages and browser tabs.
  useEffect(() => {
    function refreshExams() {
      setExams(readArray(STORAGE_KEYS.exams));
    }

    function handleStorage(event) {
      if (!event.key || event.key === STORAGE_KEYS.exams) {
        refreshExams();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshExams);
    window.addEventListener(DATA_UPDATED_EVENT, refreshExams);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshExams);
      window.removeEventListener(
        DATA_UPDATED_EVENT,
        refreshExams
      );
    };
  }, []);

  // Save through the shared storage utility.
  function saveExams(updated) {
    const saved = writeStorage(STORAGE_KEYS.exams, updated);

    if (saved) {
      setExams(updated);
      return true;
    }

    alert("Unable to save exams in browser storage.");
    return false;
  }

  function resetForm() {
    setTitle("");
    setSubject("");
    setDate(getToday());
    setType("Midterm");
    setNotes("");
    setEditingId(null);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !subject.trim() || !date) {
      alert("Please fill in the exam title, subject, and date.");
      return;
    }

    const examData = {
      title: title.trim(),
      subject: subject.trim(),
      date,
      type,
      notes: notes.trim(),
    };

    let saved = false;

    if (editingId !== null) {
      const updated = exams.map((exam) =>
        exam.id === editingId
          ? { ...exam, ...examData }
          : exam
      );

      saved = saveExams(updated);
    } else {
      const newExam = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
        ...examData,
        completed: false,
      };

      saved = saveExams([...exams, newExam]);
    }

    if (saved) {
      resetForm();
    }
  }

  function editExam(exam) {
    setEditingId(exam.id);
    setTitle(exam.title || "");
    setSubject(exam.subject || "");
    setDate(exam.date || getToday());
    setType(exam.type || "Midterm");
    setNotes(exam.notes || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteExam(id) {
    if (!window.confirm("Delete this exam?")) return;

    const updated = exams.filter((exam) => exam.id !== id);

    if (saveExams(updated) && editingId === id) {
      resetForm();
    }
  }

  function toggleCompleted(id) {
    const updated = exams.map((exam) =>
      exam.id === id
        ? { ...exam, completed: !exam.completed }
        : exam
    );

    saveExams(updated);
  }

  const sortedExams = [...exams].sort((a, b) =>
    (a.date || "").localeCompare(b.date || "")
  );

  const upcomingCount = exams.filter((exam) => {
    const days = getDaysRemaining(exam.date);
    return !exam.completed && days !== null && days >= 0;
  }).length;

  const completedCount = exams.filter(
    (exam) => exam.completed
  ).length;

  const overdueCount = exams.filter((exam) => {
    const days = getDaysRemaining(exam.date);
    return !exam.completed && days !== null && days < 0;
  }).length;

  return (
    <div className="exam-page">
      <header className="exam-header">
        <div>
          <h1>Exams Manager 📚</h1>
          <p>
            Organize exams, track deadlines, and prepare confidently.
          </p>
        </div>
      </header>

      {/* Statistics */}
      <section className="exam-stats">
        <div className="exam-stat-card">
          <span>Total Exams</span>
          <strong>{exams.length}</strong>
        </div>

        <div className="exam-stat-card">
          <span>Upcoming</span>
          <strong>{upcomingCount}</strong>
        </div>

        <div className="exam-stat-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>

        <div className="exam-stat-card">
          <span>Past Due</span>
          <strong>{overdueCount}</strong>
        </div>
      </section>

      {/* Add or edit exam */}
      <section className="exam-card">
        <h2>
          {editingId !== null ? "Edit Exam" : "Add New Exam"}
        </h2>

        <form className="exam-form" onSubmit={handleSubmit}>
          <label>
            Exam Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Midterm Examination"
              required
            />
          </label>

          <label>
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Linear Control Systems"
              required
            />
          </label>

          <label>
            Exam Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>

          <label>
            Exam Type
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option>Midterm</option>
              <option>End Semester</option>
              <option>Quiz</option>
              <option>Practical</option>
              <option>Viva</option>
              <option>Assignment</option>
              <option>Other</option>
            </select>
          </label>

          <label className="exam-notes-field">
            Notes (optional)
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Syllabus, chapters, or preparation notes..."
              rows={3}
            />
          </label>

          <div className="exam-form-actions">
            <button
              type="submit"
              className="exam-primary-btn"
            >
              {editingId !== null ? "Save Changes" : "+ Add Exam"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="exam-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Exam list */}
      <section className="exam-card">
        <h2>Your Exams</h2>

        {sortedExams.length === 0 ? (
          <div className="exam-empty">
            <span>📝</span>
            <h3>No exams added yet</h3>
            <p>Add your first exam using the form above.</p>
          </div>
        ) : (
          <div className="exam-list">
            {sortedExams.map((exam) => {
              const days = getDaysRemaining(exam.date);

              const countdownClass = exam.completed
                ? "exam-countdown-done"
                : days !== null && days < 0
                ? "exam-countdown-overdue"
                : days !== null && days <= 7
                ? "exam-countdown-soon"
                : "";

              let countdownText = "Date not set";

              if (exam.completed) {
                countdownText = "Completed";
              } else if (days !== null && days < 0) {
                countdownText = `${Math.abs(days)} days past`;
              } else if (days === 0) {
                countdownText = "Today!";
              } else if (days !== null) {
                countdownText = `${days} days left`;
              }

              return (
                <article className="exam-item" key={exam.id}>
                  <input
                    type="checkbox"
                    checked={Boolean(exam.completed)}
                    onChange={() => toggleCompleted(exam.id)}
                    aria-label={`Mark ${exam.title} completed`}
                  />

                  <div className="exam-item-info">
                    <h3>{exam.title}</h3>

                    <p>
                      {exam.subject} · {exam.type}
                    </p>

                    <p className="exam-date">
                      📅 {formatDate(exam.date)}
                    </p>

                    {exam.notes && (
                      <p className="exam-notes">{exam.notes}</p>
                    )}
                  </div>

                  <div
                    className={`exam-countdown ${countdownClass}`}
                  >
                    {countdownText}
                  </div>

                  <div className="exam-item-actions">
                    <button
                      type="button"
                      onClick={() => editExam(exam)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="exam-delete-btn"
                      onClick={() => deleteExam(exam.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Exam;
