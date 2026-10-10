import { useState } from "react";

function Task() {
  // Load tasks
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem("acadexa_tasks");
    return savedTasks ? JSON.parse(savedTasks) : [];
  });

  // Form
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [deadline, setDeadline] = useState("");

  // Search & filter
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");

  // Editing
  const [editingId, setEditingId] = useState(null);

  // Save
  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);

    localStorage.setItem(
      "acadexa_tasks",
      JSON.stringify(updatedTasks)
    );
  };

  // Add / Update
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    if (!deadline) {
      alert("Please select a deadline");
      return;
    }

    if (editingId) {
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

      saveTasks(updatedTasks);
      setEditingId(null);
    } else {
      const newTask = {
        id: Date.now(),
        title: title.trim(),
        subject: subject.trim() || "General",
        priority,
        deadline,
        completed: false,
      };

      saveTasks([...tasks, newTask]);
    }

    clearForm();
  };

  // Clear form
  const clearForm = () => {
    setTitle("");
    setSubject("");
    setPriority("Medium");
    setDeadline("");
  };

  // Edit
  const editTask = (task) => {
    setEditingId(task.id);

    setTitle(task.title);
    setSubject(task.subject);
    setPriority(task.priority);
    setDeadline(task.deadline);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    clearForm();
  };

  // Complete
  const toggleTask = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id
        ? {
            ...task,
            completed: !task.completed,
          }
        : task
    );

    saveTasks(updatedTasks);
  };

  // Delete
  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(
      (task) => task.id !== id
    );

    saveTasks(updatedTasks);
  };

  // Format date
  const formatDeadline = (date) => {
    if (!date) return "No deadline";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // Overdue
  const isOverdue = (task) => {
    if (task.completed || !task.deadline) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(task.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    return deadlineDate < today;
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      task.title.toLowerCase().includes(searchText) ||
      task.subject.toLowerCase().includes(searchText);

    const matchesPriority =
      filterPriority === "All" ||
      task.priority === filterPriority;

    return matchesSearch && matchesPriority;
  });

  // Statistics
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

      {/* HEADER */}

      <div className="tasks-header">
        <h1>Tasks</h1>

        <p>
          Manage your academic tasks
        </p>
      </div>


      {/* STATISTICS */}

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


      {/* ADD / EDIT */}

      <div className="task-form-card">

        <h2>
          {editingId
            ? "Edit Task"
            : "Add New Task"}
        </h2>

        <form onSubmit={handleSubmit}>

          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
          />

          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value)
            }
          >
            <option value="High">
              High
            </option>

            <option value="Medium">
              Medium
            </option>

            <option value="Low">
              Low
            </option>
          </select>

          <input
            type="date"
            value={deadline}
            onChange={(e) =>
              setDeadline(e.target.value)
            }
          />

          <button type="submit">
            {editingId
              ? "Update Task"
              : "+ Add Task"}
          </button>

          {editingId && (
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


      {/* SEARCH & FILTER */}

      <div className="task-controls">

        <input
          type="text"
          placeholder="🔍 Search tasks or subjects..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <select
          value={filterPriority}
          onChange={(e) =>
            setFilterPriority(e.target.value)
          }
        >
          <option value="All">
            All Priorities
          </option>

          <option value="High">
            High
          </option>

          <option value="Medium">
            Medium
          </option>

          <option value="Low">
            Low
          </option>
        </select>

      </div>


      {/* TASK LIST */}

      <div className="task-list-card">

        <div className="task-list-header">

          <h2>
            My Tasks
          </h2>

          <span>
            {filteredTasks.length} Tasks
          </span>

        </div>


        {filteredTasks.length === 0 ? (

          <div className="empty-task">

            <div className="empty-icon">
              📋
            </div>

            <p>
              No tasks found
            </p>

          </div>

        ) : (

          filteredTasks.map((task) => (

            <div
              className={`task-row ${
                task.completed
                  ? "task-completed"
                  : ""
              }`}
              key={task.id}
            >

              {/* CHECKBOX */}

              <input
                type="checkbox"
                checked={task.completed}
                onChange={() =>
                  toggleTask(task.id)
                }
              />


              {/* TASK INFO */}

              <div className="task-info">

                <h3>
                  {task.title}
                </h3>

                <p>
                  {task.subject}
                </p>

              </div>


              {/* PRIORITY */}

              <span
                className={`priority ${task.priority.toLowerCase()}`}
              >
                {task.priority}
              </span>


              {/* DEADLINE */}

              <span
                className={`task-deadline ${
                  isOverdue(task)
                    ? "overdue"
                    : ""
                }`}
              >
                📅 {formatDeadline(task.deadline)}

                {isOverdue(task) && (
                  <small>
                    Overdue
                  </small>
                )}
              </span>


              {/* EDIT */}

              <button
                className="edit-btn"
                onClick={() =>
                  editTask(task)
                }
              >
                Edit
              </button>


              {/* DELETE */}

              <button
                className="delete-btn"
                onClick={() =>
                  deleteTask(task.id)
                }
              >
                Delete
              </button>

            </div>

          ))

        )}

      </div>

    </div>
  );
}

export default Task;