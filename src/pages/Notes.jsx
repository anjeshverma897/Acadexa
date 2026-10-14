
import { useEffect, useState } from "react";
import {
  STORAGE_KEYS,
  DATA_UPDATED_EVENT,
  readArray,
  writeStorage,
} from "../utils/storage";

const CATEGORIES = [
  "DSA",
  "Web Development",
  "AI/ML",
  "College",
  "Projects",
  "Other",
];

function Notes() {
  const [notes, setNotes] = useState(() =>
    readArray(STORAGE_KEYS.notes)
  );

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("DSA");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);

  // Synchronize notes across Acadexa pages and browser tabs.
  useEffect(() => {
    function refreshNotes() {
      setNotes(readArray(STORAGE_KEYS.notes));
    }

    function handleStorage(event) {
      if (!event.key || event.key === STORAGE_KEYS.notes) {
        refreshNotes();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshNotes);
    window.addEventListener(DATA_UPDATED_EVENT, refreshNotes);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshNotes);
      window.removeEventListener(
        DATA_UPDATED_EVENT,
        refreshNotes
      );
    };
  }, []);

  // Save through the shared storage utility.
  function saveNotes(updatedNotes) {
    const saved = writeStorage(
      STORAGE_KEYS.notes,
      updatedNotes
    );

    if (saved) {
      setNotes(updatedNotes);
      return true;
    }

    alert("Unable to save notes in browser storage.");
    return false;
  }

  function resetForm() {
    setTitle("");
    setContent("");
    setCategory("DSA");
    setEditingId(null);
  }

  // Create or update a note.
  function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please enter a title and note content.");
      return;
    }

    const now = new Date().toISOString();
    let saved = false;

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

      saved = saveNotes(updated);
    } else {
      const newNote = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
        title: title.trim(),
        content: content.trim(),
        category,
        createdAt: now,
        updatedAt: now,
      };

      saved = saveNotes([newNote, ...notes]);
    }

    if (saved) {
      resetForm();
    }
  }

  function editNote(note) {
    setEditingId(note.id);
    setTitle(note.title || "");
    setContent(note.content || "");
    setCategory(note.category || "Other");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function deleteNote(id) {
    if (!window.confirm("Delete this note permanently?")) {
      return;
    }

    const updated = notes.filter((note) => note.id !== id);

    if (saveNotes(updated) && editingId === id) {
      resetForm();
    }
  }

  // Search, filter, and sort notes.
  const query = search.trim().toLowerCase();

  const filteredNotes = [...notes]
    .filter((note) => {
      const matchesSearch =
        String(note.title || "")
          .toLowerCase()
          .includes(query) ||
        String(note.content || "")
          .toLowerCase()
          .includes(query);

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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="notes-page">
      {/* Header */}
      <header className="notes-header">
        <div>
          <h1>My Notes 📝</h1>
          <p>
            Capture ideas, organize subjects, and revise faster.
          </p>
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
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
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
              onChange={(event) =>
                setContent(event.target.value)
              }
              required
            />
          </label>

          <div className="notes-form-actions">
            <button
              type="submit"
              className="notes-primary-btn"
            >
              {editingId !== null
                ? "Save Changes"
                : "+ Save Note"}
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
          <span>{filteredNotes.length} found</span>
        </div>

        <div className="notes-filters">
          <input
            type="search"
            placeholder="Search titles and content..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search notes"
          />

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
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
                    {note.category || "Other"}
                  </span>

                  <span className="note-date">
                    {formatDate(
                      note.updatedAt || note.createdAt
                    )}
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
