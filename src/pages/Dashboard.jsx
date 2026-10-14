
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const KEYS = {
  tasks: "acadexa_tasks",
  sessions: "acadexa_study_sessions",
  problems: "acadexa_dsa_problems",
  targets: "acadexa_dsa_targets",
  exams: "acadexa_exams",
  profile: "acadexa_profile",
};

function readArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  } catch {
    return {};
  }
}

function getInitialData() {
  return {
    tasks: readArray(KEYS.tasks),
    sessions: readArray(KEYS.sessions),
    problems: readArray(KEYS.problems),
    exams: readArray(KEYS.exams),
  };
}

function getGreeting(date) {
  const hour = date.getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function parseDate(value) {
  if (!value) return null;

  const text = String(value).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(text);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function daysUntil(value, today) {
  const date = parseDate(value);
  if (!date) return null;

  return Math.round(
    (startOfDay(date).getTime() - today.getTime()) / 86400000
  );
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "Date not set";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTaskTitle(task) {
  return task?.title || task?.name || "Untitled task";
}

function getExamTitle(exam) {
  return exam?.subject || exam?.title || exam?.name || "Untitled exam";
}

function getExamDate(exam) {
  return exam?.date ?? exam?.examDate ?? exam?.deadline ?? null;
}

function getTopic(problem) {
  return problem?.topic || problem?.category || "Other";
}

// The current DSA Tracker records only solved problems.
function isSolved(problem) {
  if (typeof problem?.solved === "boolean") return problem.solved;
  if (typeof problem?.isSolved === "boolean") return problem.isSolved;
  if (typeof problem?.completed === "boolean") return problem.completed;

  if (typeof problem?.status === "string") {
    return ["solved", "completed", "accepted", "done"].includes(
      problem.status.toLowerCase()
    );
  }

  return Boolean(problem?.title && problem?.solvedAt);
}

function formatStudyTime(minutes) {
  const value = Math.max(0, Number(minutes) || 0);

  if (value >= 60) return `${Number((value / 60).toFixed(1))} hrs`;
  return `${Math.round(value)} min`;
}

function Dashboard() {
  const [data, setData] = useState(getInitialData);
  const [dsaTargets, setDsaTargets] = useState(() =>
    readObject(KEYS.targets)
  );
  const [profile, setProfile] = useState(() =>
    readObject(KEYS.profile)
  );
  const [now, setNow] = useState(() => new Date());

  const refreshDashboard = useCallback(() => {
    setData(getInitialData());
    setDsaTargets(readObject(KEYS.targets));
    setProfile(readObject(KEYS.profile));
    setNow(new Date());
  }, []);

  useEffect(() => {
    refreshDashboard();

    const handleStorage = () => refreshDashboard();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshDashboard();
      }
    };

    window.addEventListener("focus", handleStorage);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("acadexa:data-updated", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleStorage);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("acadexa:data-updated", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshDashboard]);

  const today = useMemo(() => startOfDay(now), [now]);

  const studentName =
    profile.name || profile.fullName || profile.studentName || "";

  // TASK STATISTICS
  const completedTasks = data.tasks.filter((task) => task.completed);
  const pendingTasks = data.tasks.filter((task) => !task.completed);

  const overdueTasks = pendingTasks.filter((task) => {
    const remaining = daysUntil(task.deadline, today);
    return remaining !== null && remaining < 0;
  });

  const dashboardTasks = [...pendingTasks]
    .sort((a, b) => {
      const aDate = parseDate(a.deadline)?.getTime() ?? Infinity;
      const bDate = parseDate(b.deadline)?.getTime() ?? Infinity;
      return aDate - bDate;
    })
    .slice(0, 5);

  function isOverdue(task) {
    if (!task.deadline || task.completed) return false;

    const remaining = daysUntil(task.deadline, today);
    return remaining !== null && remaining < 0;
  }

  // STUDY SESSIONS
  // Assumes completed Planner sessions store duration in minutes.
  const totalStudyMinutes = data.sessions
    .filter((session) => session.completed)
    .reduce((total, session) => {
      const duration = Number(session.duration);

      return total + (
        Number.isFinite(duration) && duration > 0 ? duration : 0
      );
    }, 0);

  // DSA TOTALS
  const solvedProblems = data.problems.filter(isSolved);
  const totalSolved = solvedProblems.length;

  const totalTarget = Object.values(dsaTargets).reduce((total, value) => {
    const target = Number(value);
    return total + (
      Number.isFinite(target) && target > 0 ? target : 0
    );
  }, 0);

  const overallPercentage =
    totalTarget > 0
      ? Math.min(100, Math.round((totalSolved / totalTarget) * 100))
      : 0;

  // Include topics that have solved problems OR a saved target.
  const dsaTopics = useMemo(() => {
    const counts = new Map();

    data.problems.forEach((problem) => {
      if (!isSolved(problem)) return;

      const topic = getTopic(problem);
      counts.set(topic, (counts.get(topic) || 0) + 1);
    });

    const topicNames = new Set([
      ...counts.keys(),
      ...Object.keys(dsaTargets),
    ]);

    return [...topicNames]
      .map((name) => {
        const solved = counts.get(name) || 0;
        const target = Number(dsaTargets[name]) || 0;

        return {
          name,
          solved,
          target,
          percentage:
            target > 0
              ? Math.min(100, Math.round((solved / target) * 100))
              : null,
        };
      })
      .filter((item) => item.solved > 0 || item.target > 0)
      .sort((a, b) => b.solved - a.solved || a.name.localeCompare(b.name));
  }, [data.problems, dsaTargets]);

  // UPCOMING EXAMS
  const upcomingExams = useMemo(() => {
    return data.exams
      .filter((exam) => !exam.completed && !exam.isCompleted)
      .map((exam) => ({
        ...exam,
        dashboardDate: getExamDate(exam),
        daysLeft: daysUntil(getExamDate(exam), today),
      }))
      .filter((exam) => exam.daysLeft !== null && exam.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data.exams, today]);

  function countdown(days) {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  }

  return (
    <div className="dashboard">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>{getGreeting(now)} 👋</h1>

          <p>
            Welcome back{studentName ? `, ${studentName}` : ""} to Acadexa
          </p>

          <p className="current-date">
            {now.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <Link to="/profile">
          <button type="button" className="profile-btn">
            My Profile
          </button>
        </Link>
      </div>

      {/* STATISTICS */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div>
            <p>Total Tasks</p>
            <h2>{data.tasks.length}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div>
            <p>Study Hours</p>
            <h2>{formatStudyTime(totalStudyMinutes)}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💻</div>
          <div>
            <p>Total Solved Problems</p>
            <h2>{totalSolved}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div>
            <p>Upcoming Exams</p>
            <h2>{upcomingExams.length}</h2>
          </div>
        </div>
      </div>

      {/* TASK SUMMARY */}
      <div className="dashboard-task-summary">
        <div>
          <span>Pending</span>
          <strong>{pendingTasks.length}</strong>
        </div>

        <div>
          <span>Completed</span>
          <strong className="completed-number">
            {completedTasks.length}
          </strong>
        </div>

        <div>
          <span>Overdue</span>
          <strong className="overdue-number">
            {overdueTasks.length}
          </strong>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-grid">
        {/* TASKS */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Today's Tasks</h2>
            <Link to="/tasks">
              <button type="button">View All</button>
            </Link>
          </div>

          {dashboardTasks.length === 0 ? (
            <div className="dashboard-empty">
              <div>🎉</div>
              <p>No pending tasks!</p>
              <Link to="/tasks">
                <button type="button">+ Add Task</button>
              </Link>
            </div>
          ) : (
            dashboardTasks.map((task, index) => (
              <div
                className={`dashboard-task ${
                  isOverdue(task) ? "dashboard-task-overdue" : ""
                }`}
                key={task.id ?? `${getTaskTitle(task)}-${index}`}
              >
                <div className="dashboard-task-info">
                  <h3>{getTaskTitle(task)}</h3>
                  <p>{task.subject || task.category || "General"}</p>
                </div>

                {task.priority && (
                  <span
                    className={`priority ${String(
                      task.priority
                    ).toLowerCase()}`}
                  >
                    {task.priority}
                  </span>
                )}

                <div
                  className={`dashboard-deadline ${
                    isOverdue(task) ? "deadline-overdue" : ""
                  }`}
                >
                  📅 {task.deadline ? formatDate(task.deadline) : "No deadline"}
                  {isOverdue(task) && <span> Overdue</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* DSA PROGRESS */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>DSA Progress</h2>
            <Link to="/dsa">
              <button type="button">Manage Targets</button>
            </Link>
          </div>

          <div className="dsa-dashboard-total">
            <div>
              <span>Total Solved Problems</span>
              <strong>{totalSolved}</strong>
            </div>

            <div>
              <span>Combined Topic Targets</span>
              <strong>{totalTarget}</strong>
            </div>
          </div>

          {totalTarget > 0 && (
            <div className="progress-item">
              <div className="progress-label">
                <span>Overall Progress</span>
                <span>{overallPercentage}%</span>
              </div>

              <div
                className="progress-bar"
                role="progressbar"
                aria-label="Overall DSA target progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={overallPercentage}
              >
                <div
                  className="progress-fill"
                  style={{ width: `${overallPercentage}%` }}
                />
              </div>
            </div>
          )}

          {dsaTopics.length === 0 ? (
            <div className="dashboard-empty">
              <div>💻</div>
              <p>No DSA problems or targets yet.</p>
              <Link to="/dsa">
                <button type="button">Open DSA Tracker</button>
              </Link>
            </div>
          ) : (
            dsaTopics.slice(0, 8).map((item) => (
              <div className="progress-item" key={item.name}>
                <div className="progress-label">
                  <span>{item.name}</span>
                  <span>
                    {item.solved} / {item.target || "No target"}
                    {item.target > 0 ? ` · ${item.percentage}%` : ""}
                  </span>
                </div>

                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-label={`${item.name} DSA progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.percentage ?? 0}
                >
                  <div
                    className="progress-fill"
                    style={{
                      width: `${item.percentage ?? 0}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* UPCOMING EXAMS */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Upcoming Exams</h2>
            <Link to="/exams">
              <button type="button">View All</button>
            </Link>
          </div>

          {upcomingExams.length === 0 ? (
            <div className="dashboard-empty">
              <div>📚</div>
              <p>No upcoming exams added.</p>
              <Link to="/exams">
                <button type="button">+ Add Exam</button>
              </Link>
            </div>
          ) : (
            upcomingExams.slice(0, 5).map((exam, index) => (
              <div
                className="exam"
                key={
                  exam.id ??
                  `${getExamTitle(exam)}-${exam.dashboardDate}-${index}`
                }
              >
                <div>
                  <h3>{getExamTitle(exam)}</h3>
                  <p>{exam.type || exam.examType || exam.title || "Exam"}</p>
                  <small>{formatDate(exam.dashboardDate)}</small>
                </div>

                <strong>{countdown(exam.daysLeft)}</strong>
              </div>
            ))
          )}
        </div>

        {/* QUICK ACTIONS */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>

          <div className="quick-actions">
            <Link to="/tasks">
              <button type="button">+ Add Task</button>
            </Link>

            <Link to="/planner">
              <button type="button">📅 Study Session</button>
            </Link>

            <Link to="/exams">
              <button type="button">📚 Add Exam</button>
            </Link>

            <Link to="/assistant">
              <button type="button">🤖 Ask AI</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
