
import { useEffect, useState } from "react";
import {
  STORAGE_KEYS,
  DATA_UPDATED_EVENT,
  readArray,
  writeStorage,
} from "../utils/storage";

function Task() {
  // Load tasks safely.
  const [tasks, setTasks] = useState(() =>
    readArray(STORAGE_KEYS.tasks)
  );

  // Form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [deadline, setDeadline] = useState("");

  // Search and filter
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");

  // Editing
  const [editingId, setEditingId] = useState(null);

  // Synchronize changes from other pages and browser tabs.
  useEffect(() => {
    function refreshTasks() {
      setTasks(readArray(STORAGE_KEYS.tasks));
    }

    function handleStorage(event) {
      if (
        !event.key ||
        event.key === STORAGE_KEYS.tasks
      ) {
        refreshTasks();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshTasks);
    window.addEventListener(DATA_UPDATED_EVENT, refreshTasks);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshTasks);
      window.removeEventListener(
        DATA_UPDATED_EVENT,
        refreshTasks
      );
    };
  }, []);

  // Save tasks using the shared storage utility.
  function saveTasks(updatedTasks) {
    const saved = writeStorage(
      STORAGE_KEYS.tasks,
      updatedTasks
    );

    if (saved) {
      setTasks(updatedTasks);
      return true;
    }

    alert(
      "Unable to save tasks. Please check your browser storage and try again."
    );

    return false;
  }

  // Add or update a task.
  function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    if (!deadline) {
      alert("Please select a deadline.");
      return;
    }

    if (editingId !== null) {
      const updatedTasks = tasks.map((task) =>
        task.id === editingId
          ? {
              ...task,
              title: title.trim(),
              subject: subject.trim() || "General",
              priority,
              deadline,
            }
          : task
      );

      if (saveTasks(updatedTasks)) {
        setEditingId(null);
        clearForm();
      }
    } else {
      const newTask = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
        title: title.trim(),
        subject: subject.trim() || "General",
        priority,
        deadline,
        completed: false,
      };

      if (saveTasks([...tasks, newTask])) {
        clearForm();
      }
    }
  }

  // Clear form.
  function clearForm() {
    setTitle("");
    setSubject("");
    setPriority("Medium");
    setDeadline("");
  }

  // Edit task.
  function editTask(task) {
    setEditingId(task.id);
    setTitle(task.title || "");
    setSubject(task.subject || "");
    setPriority(task.priority || "Medium");
    setDeadline(task.deadline || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Cancel editing.
  function cancelEdit() {
    setEditingId(null);
    clearForm();
  }

  // Toggle task completion.
  function toggleTask(id) {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            completed: !task.completed,
          }
        : task
    );

    saveTasks(updatedTasks);
  }

  // Delete task.
  function deleteTask(id) {
    const updatedTasks = tasks.filter(
      (task) => task.id !== id
    );

    if (saveTasks(updatedTasks) && editingId === id) {
      setEditingId(null);
      clearForm();
    }
  }

  // Format deadline.
  function formatDeadline(date) {
    if (!date) return "No deadline";

    // Parse date-only values in local time to avoid
    // displaying the previous day in some time zones.
    const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? (() => {
          const [year, month, day] = date
            .split("-")
            .map(Number);

          return new Date(year, month - 1, day);
        })()
      : new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Invalid date";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Check overdue tasks.
  function isOverdue(task) {
    if (task.completed || !task.deadline) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = /^\d{4}-\d{2}-\d{2}$/.test(
      task.deadline
    )
      ? (() => {
          const [year, month, day] = task.deadline
            .split("-")
            .map(Number);

          return new Date(year, month - 1, day);
        })()
      : new Date(task.deadline);

    if (Number.isNaN(deadlineDate.getTime())) {
      return false;
    }

    deadlineDate.setHours(0, 0, 0, 0);

    return deadlineDate < today;
  }

  // Search and filter tasks.
  const searchText = search.trim().toLowerCase();

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      String(task.title || "")
        .toLowerCase()
        .includes(searchText) ||
      String(task.subject || "")
        .toLowerCase()
        .includes(searchText);

    const matchesPriority =
      filterPriority === "All" ||
      task.priority === filterPriority;

    return matchesSearch && matchesPriority;
  });

  // Statistics.
  const pendingTasks = tasks.filter(
    (task) => !task.completed
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const overdueTasks = tasks.filter(
    (task) => isOverdue(task)
  ).length;

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="tasks-header">
        <h1>Tasks</h1>
        <p>Manage your academic tasks</p>
      </div>

      {/* Statistics */}
      <div className="task-stats">
        <div className="task-stat">
          <span>Total</span>
          <strong>{tasks.length}</strong>
        </div>

        <div className="task-stat pending">
          <span>Pending</span>
          <strong>{pendingTasks}</strong>
        </div>

        <div className="task-stat completed">
          <span>Completed</span>
          <strong>{completedTasks}</strong>
        </div>

        <div className="task-stat overdue">
          <span>Overdue</span>
          <strong>{overdueTasks}</strong>
        </div>
      </div>

      {/* Add / Edit */}
      <div className="task-form-card">
        <h2>{editingId !== null ? "Edit Task" : "Add New Task"}</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            required
          />

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(event) =>
              setSubject(event.target.value)
            }
          />

          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value)
            }
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <input
            type="date"
            value={deadline}
            onChange={(event) =>
              setDeadline(event.target.value)
            }
            required
          />

          <button type="submit">
            {editingId !== null ? "Update Task" : "+ Add Task"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-btn"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Search and Filter */}
      <div className="task-controls">
        <input
          type="text"
          placeholder="🔍 Search tasks or subjects..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={filterPriority}
          onChange={(event) =>
            setFilterPriority(event.target.value)
          }
        >
          <option value="All">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Task List */}
      <div className="task-list-card">
        <div className="task-list-header">
          <h2>My Tasks</h2>
          <span>{filteredTasks.length} Tasks</span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-task">
            <div className="empty-icon">📋</div>
            <p>No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const taskPriority = [
              "High",
              "Medium",
              "Low",
            ].includes(task.priority)
              ? task.priority
              : "Medium";

            return (
              <div
                className={`task-row ${
                  task.completed ? "task-completed" : ""
                }`}
                key={task.id}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={Boolean(task.completed)}
                  onChange={() => toggleTask(task.id)}
                  aria-label={`Complete ${task.title}`}
                />

                {/* Task Info */}
                <div className="task-info">
                  <h3>{task.title}</h3>
                  <p>{task.subject || "General"}</p>
                </div>

                {/* Priority */}
                <span
                  className={`priority ${taskPriority.toLowerCase()}`}
                >
                  {taskPriority}
                </span>

                {/* Deadline */}
                <span
                  className={`task-deadline ${
                    isOverdue(task) ? "overdue" : ""
                  }`}
                >
                  📅 {formatDeadline(task.deadline)}

                  {isOverdue(task) && (
                    <small>Overdue</small>
                  )}
                </span>

                {/* Edit */}
                <button
                  type="button"
                  className="edit-btn"
                  onClick={() => editTask(task)}
                >
                  Edit
                </button>

                {/* Delete */}
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => deleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Task;
