
import { useState } from "react";

const STORAGE_KEY = "acadexa_notes";

const CATEGORIES = [
  "DSA",
  "Web Development",
  "AI/ML",
  "College",
  "Projects",
  "Other",
];

function loadNotes() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function Notes() {
  const [notes, setNotes] = useState(loadNotes);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("DSA");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  function saveNotes(updatedNotes) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedNotes)
      );

      setNotes(updatedNotes);
    } catch {
      alert("Unable to save notes in browser storage.");
    }
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setCategory("DSA");
    setEditingId(null);
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please enter a title and note content.");
      return;
    }

    const now = new Date().toISOString();

    if (editingId !== null) {
      const updated = notes.map((note) =>
        note.id === editingId
          ? {
              ...note,
              title: title.trim(),
              content: content.trim(),
              category,
              updatedAt: now,
            }
          : note
      );

      saveNotes(updated);
    } else {
      const newNote = {
        id: `${Date.now()}-${Math.random()}`,
        title: title.trim(),
        content: content.trim(),
        category,
        createdAt: now,
        updatedAt: now,
      };

      saveNotes([newNote, ...notes]);
    }

    resetForm();
  }

  function editNote(note) {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteNote(id) {
    if (!window.confirm("Delete this note permanently?")) {
      return;
    }

    saveNotes(notes.filter((note) => note.id !== id));

    if (editingId === id) {
      resetForm();
    }
  }

  const filteredNotes = [...notes]
    .filter((note) => {
      const query = search.toLowerCase();

      const matchesSearch =
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query);

      const matchesCategory =
        filter === "All" || note.category === filter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) =>
      (b.updatedAt || b.createdAt || "").localeCompare(
        a.updatedAt || a.createdAt || ""
      )
    );

  function formatDate(value) {
    if (!value) return "";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="notes-page">
      <header className="notes-header">
        <div>
          <h1>My Notes 📝</h1>
          <p>Capture ideas, organize subjects, and revise faster.</p>
        </div>

        <span className="notes-count">
          {notes.length} {notes.length === 1 ? "note" : "notes"}
        </span>
      </header>

      {/* Create or edit */}
      <section className="notes-card">
        <h2>
          {editingId !== null ? "Edit Note" : "Create New Note"}
        </h2>

        <form className="notes-form" onSubmit={handleSubmit}>
          <label>
            Note Title
            <input
              type="text"
              placeholder="e.g. Graph traversal algorithms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="notes-content-label">
            Content
            <textarea
              placeholder="Write your concepts, formulas, examples, or revision points..."
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </label>

          <div className="notes-form-actions">
            <button type="submit" className="notes-primary-btn">
              {editingId !== null ? "Save Changes" : "+ Save Note"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="notes-cancel-btn"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Search and filters */}
      <section className="notes-library">
        <div className="notes-library-header">
          <h2>Notes Library</h2>

          <span>
            {filteredNotes.length} found
          </span>
        </div>

        <div className="notes-filters">
          <input
            type="search"
            placeholder="Search titles and content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notes"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filter notes by category"
          >
            <option value="All">All Categories</option>

            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {filteredNotes.length === 0 ? (
          <div className="notes-empty">
            <span>📚</span>

            <h3>
              {notes.length === 0
                ? "Your notes library is empty"
                : "No matching notes"}
            </h3>

            <p>
              {notes.length === 0
                ? "Create your first note using the form above."
                : "Try another search term or category."}
            </p>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <article className="note-item" key={note.id}>
                <div className="note-item-header">
                  <span className="note-category">
                    {note.category}
                  </span>

                  <span className="note-date">
                    {formatDate(note.updatedAt || note.createdAt)}
                  </span>
                </div>

                <h3>{note.title}</h3>

                <p className="note-content">
                  {note.content}
                </p>

                <div className="note-actions">
                  <button
                    type="button"
                    onClick={() => editNote(note)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="note-delete-btn"
                    onClick={() => deleteNote(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Notes;
