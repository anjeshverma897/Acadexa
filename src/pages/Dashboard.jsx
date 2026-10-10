import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  // ================= TIME =================

  const now = new Date();
  const hour = now.getHours();

  let greeting;

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 17) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }

  const currentDate = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });


  // ================= TASKS =================

  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    const savedTasks = localStorage.getItem("acadexa_tasks");

    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      setTasks([]);
    }
  };


  // ================= SAVE TASKS =================

  const saveTasks = (updatedTasks) => {
    setTasks(updatedTasks);

    localStorage.setItem(
      "acadexa_tasks",
      JSON.stringify(updatedTasks)
    );
  };


  // ================= COMPLETE TASK =================

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


  // ================= DEADLINE =================

  const formatDeadline = (deadline) => {
    if (!deadline) {
      return "No deadline";
    }

    return new Date(deadline).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };


  // Check whether task is overdue

  const isOverdue = (task) => {
    if (!task.deadline || task.completed) {
      return false;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(task.deadline);

    deadlineDate.setHours(0, 0, 0, 0);

    return deadlineDate < today;
  };


  // ================= STATISTICS =================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = tasks.filter(
    (task) => !task.completed
  ).length;

  const overdueTasks = tasks.filter(
    (task) => isOverdue(task)
  ).length;


  // Show pending tasks first
  // Maximum 5 tasks on dashboard

  const dashboardTasks = tasks
    .filter((task) => !task.completed)
    .slice(0, 5);


  return (
    <div className="dashboard">

      {/* ================= HEADER ================= */}

      <div className="dashboard-header">

        <div>

          <h1>
            {greeting} 👋
          </h1>

          <p>
            Welcome back to Acadexa
          </p>

          <p className="current-date">
            {currentDate}
          </p>

        </div>


        <Link to="/profile">
          <button className="profile-btn">
            My Profile
          </button>
        </Link>

      </div>


      {/* ================= STATISTICS ================= */}

      <div className="stats-grid">

        {/* Total Tasks */}

        <div className="stat-card">

          <div className="stat-icon">
            📋
          </div>

          <div>
            <p>Total Tasks</p>

            <h2>
              {totalTasks}
            </h2>
          </div>

        </div>


        {/* Study Hours */}

        <div className="stat-card">

          <div className="stat-icon">
            ⏱️
          </div>

          <div>
            <p>Study Hours</p>

            <h2>
              4.5 hrs
            </h2>
          </div>

        </div>


        {/* DSA */}

        <div className="stat-card">

          <div className="stat-icon">
            💻
          </div>

          <div>
            <p>DSA Progress</p>

            <h2>
              62%
            </h2>
          </div>

        </div>


        {/* Exams */}

        <div className="stat-card">

          <div className="stat-icon">
            📚
          </div>

          <div>
            <p>Upcoming Exams</p>

            <h2>
              3
            </h2>
          </div>

        </div>

      </div>


      {/* ================= TASK SUMMARY ================= */}

      <div className="dashboard-task-summary">

        <div>
          <span>Pending</span>
          <strong>
            {pendingTasks}
          </strong>
        </div>

        <div>
          <span>Completed</span>
          <strong className="completed-number">
            {completedTasks}
          </strong>
        </div>

        <div>
          <span>Overdue</span>
          <strong className="overdue-number">
            {overdueTasks}
          </strong>
        </div>

      </div>


      {/* ================= DASHBOARD GRID ================= */}

      <div className="dashboard-grid">


        {/* ================= TODAY'S TASKS ================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              Today's Tasks
            </h2>

            <Link to="/tasks">
              <button>
                View All
              </button>
            </Link>

          </div>


          {dashboardTasks.length === 0 ? (

            <div className="dashboard-empty">

              <div>
                🎉
              </div>

              <p>
                No pending tasks!
              </p>

              <Link to="/tasks">
                <button>
                  + Add Task
                </button>
              </Link>

            </div>

          ) : (

            dashboardTasks.map((task) => (

              <div
                className={`dashboard-task ${
                  isOverdue(task)
                    ? "dashboard-task-overdue"
                    : ""
                }`}
                key={task.id}
              >

                {/* Checkbox */}

                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() =>
                    toggleTask(task.id)
                  }
                />


                {/* Task info */}

                <div className="dashboard-task-info">

                  <h3
                    className={
                      task.completed
                        ? "completed-task"
                        : ""
                    }
                  >
                    {task.title}
                  </h3>

                  <p>
                    {task.subject}
                  </p>

                </div>


                {/* Priority */}

                <span
                  className={`priority ${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </span>


                {/* Deadline */}

                <div
                  className={`dashboard-deadline ${
                    isOverdue(task)
                      ? "deadline-overdue"
                      : ""
                  }`}
                >

                  📅{" "}
                  {formatDeadline(task.deadline)}

                  {isOverdue(task) && (
                    <span>
                      Overdue
                    </span>
                  )}

                </div>

              </div>

            ))

          )}

        </div>


        {/* ================= DSA PROGRESS ================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              DSA Progress
            </h2>

            <Link to="/dsa">
              <button>
                View All
              </button>
            </Link>

          </div>


          <div className="progress-item">

            <div className="progress-label">
              <span>Array</span>
              <span>90%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: "90%" }}
              />
            </div>

          </div>


          <div className="progress-item">

            <div className="progress-label">
              <span>Linked List</span>
              <span>80%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: "80%" }}
              />
            </div>

          </div>


          <div className="progress-item">

            <div className="progress-label">
              <span>Tree</span>
              <span>60%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: "60%" }}
              />
            </div>

          </div>


          <div className="progress-item">

            <div className="progress-label">
              <span>Graph</span>
              <span>30%</span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: "30%" }}
              />
            </div>

          </div>

        </div>


        {/* ================= UPCOMING EXAMS ================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              Upcoming Exams
            </h2>

            <Link to="/exams">
              <button>
                View All
              </button>
            </Link>

          </div>


          <div className="exam">

            <div>
              <h3>
                Linear Control Systems
              </h3>

              <p>
                Midterm
              </p>
            </div>

            <strong>
              12 days
            </strong>

          </div>


          <div className="exam">

            <div>
              <h3>
                Electronics & Instrumentation
              </h3>

              <p>
                Midterm
              </p>
            </div>

            <strong>
              18 days
            </strong>

          </div>


          <div className="exam">

            <div>
              <h3>
                Biomedical Instrumentation
              </h3>

              <p>
                End Semester
              </p>
            </div>

            <strong>
              30 days
            </strong>

          </div>

        </div>


        {/* ================= QUICK ACTIONS ================= */}

        <div className="dashboard-card">

          <div className="card-header">

            <h2>
              Quick Actions
            </h2>

          </div>


          <div className="quick-actions">

            <Link to="/tasks">
              <button>
                + Add Task
              </button>
            </Link>

            <Link to="/planner">
              <button>
                📅 Study Session
              </button>
            </Link>

            <Link to="/exams">
              <button>
                📚 Add Exam
              </button>
            </Link>

            <Link to="/assistant">
              <button>
                🤖 Ask AI
              </button>
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Dashboard;