
import { useState } from "react";

const STORAGE_KEY = "acadexa_exams";

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadExams() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function Exam() {
  const [exams, setExams] = useState(loadExams);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(getToday());
  const [type, setType] = useState("Midterm");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState(null);

  function saveExams(updated) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setExams(updated);
    } catch {
      alert("Unable to save exams in browser storage.");
    }
  }

  function resetForm() {
    setTitle("");
    setSubject("");
    setDate(getToday());
    setType("Midterm");
    setNotes("");
    setEditingId(null);
  }

  function handleSubmit(e) {
    e.preventDefault();

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

    if (editingId !== null) {
      saveExams(
        exams.map((exam) =>
          exam.id === editingId
            ? { ...exam, ...examData }
            : exam
        )
      );
    } else {
      saveExams([
        ...exams,
        {
          id: `${Date.now()}-${Math.random()}`,
          ...examData,
          completed: false,
        },
      ]);
    }

    resetForm();
  }

  function editExam(exam) {
    setEditingId(exam.id);
    setTitle(exam.title);
    setSubject(exam.subject);
    setDate(exam.date);
    setType(exam.type);
    setNotes(exam.notes || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteExam(id) {
    if (window.confirm("Delete this exam?")) {
      saveExams(exams.filter((exam) => exam.id !== id));

      if (editingId === id) {
        resetForm();
      }
    }
  }

  function toggleCompleted(id) {
    saveExams(
      exams.map((exam) =>
        exam.id === id
          ? { ...exam, completed: !exam.completed }
          : exam
      )
    );
  }

  function daysRemaining(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);
    const examDate = new Date(year, month - 1, day);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    examDate.setHours(0, 0, 0, 0);

    return Math.round(
      (examDate.getTime() - today.getTime()) / 86400000
    );
  }

  function formatDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  const sortedExams = [...exams].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const upcomingCount = exams.filter(
    (exam) =>
      !exam.completed && daysRemaining(exam.date) >= 0
  ).length;

  const completedCount = exams.filter(
    (exam) => exam.completed
  ).length;

  const overdueCount = exams.filter(
    (exam) =>
      !exam.completed && daysRemaining(exam.date) < 0
  ).length;

  return (
    <div className="exam-page">
      <header className="exam-header">
        <div>
          <h1>Exams Manager 📚</h1>
          <p>Organize exams, track deadlines, and prepare confidently.</p>
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

      {/* Form */}
      <section className="exam-card">
        <h2>{editingId !== null ? "Edit Exam" : "Add New Exam"}</h2>

        <form className="exam-form" onSubmit={handleSubmit}>
          <label>
            Exam Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Examination"
              required
            />
          </label>

          <label>
            Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Linear Control Systems"
              required
            />
          </label>

          <label>
            Exam Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label>
            Exam Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
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
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Syllabus, chapters, or preparation notes..."
              rows="3"
            />
          </label>

          <div className="exam-form-actions">
            <button type="submit" className="exam-primary-btn">
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
              const days = daysRemaining(exam.date);

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
                    className={`exam-countdown ${
                      exam.completed
                        ? "exam-countdown-done"
                        : days < 0
                        ? "exam-countdown-overdue"
                        : days <= 7
                        ? "exam-countdown-soon"
                        : ""
                    }`}
                  >
                    {exam.completed
                      ? "Completed"
                      : days < 0
                      ? `${Math.abs(days)} days past`
                      : days === 0
                      ? "Today!"
                      : `${days} days left`}
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
