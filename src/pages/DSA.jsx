import "./DSA.css";
import { useEffect, useMemo, useState } from "react";
import {
  STORAGE_KEYS,
  DATA_UPDATED_EVENT,
  readArray,
  readObject,
  writeStorage,
} from "../utils/storage";

const TOPICS = [
  "Array",
  "String",
  "Linked List",
  "Stack",
  "Queue",
  "Binary Tree",
  "BST",
  "Greedy",
  "Graph",
  "Dynamic Programming",
  "Backtracking",
  "Heap",
  "Trie",
  "Other",
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isValidHttpUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getValidTargets(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      ([, target]) =>
        Number.isInteger(Number(target)) &&
        Number(target) > 0
    )
  );
}

export default function DSA() {
  const [problems, setProblems] = useState(() =>
    readArray(STORAGE_KEYS.problems)
  );

  const [targets, setTargets] = useState(() =>
    getValidTargets(readObject(STORAGE_KEYS.targets))
  );

  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("Array");
  const [difficulty, setDifficulty] = useState("Medium");
  const [link, setLink] = useState("");

  const [filterTopic, setFilterTopic] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");

  const [targetTopic, setTargetTopic] = useState("Array");
  const [targetInput, setTargetInput] = useState("");

  // Keep this page synchronized with changes from other tabs/pages.
  useEffect(() => {
    function refreshData() {
      setProblems(readArray(STORAGE_KEYS.problems));
      setTargets(
        getValidTargets(readObject(STORAGE_KEYS.targets))
      );
    }

    function handleStorage(event) {
      if (
        !event.key ||
        event.key === STORAGE_KEYS.problems ||
        event.key === STORAGE_KEYS.targets
      ) {
        refreshData();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshData);
    window.addEventListener("acadexa:data-updated", refreshData);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshData);
      window.removeEventListener(
        "acadexa:data-updated",
        refreshData
      );
    };
  }, []);

  function saveProblems(updated) {
    if (writeStorage(STORAGE_KEYS.problems, updated)) {
      setProblems(updated);
    } else {
      alert("Failed to save problems. Please try again.");
    }
  }

  function saveTargets(updated) {
    if (writeStorage(STORAGE_KEYS.targets, updated)) {
      setTargets(updated);
    } else {
      alert("Failed to save targets. Please try again.");
    }
  }

  function addProblem(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedLink = link.trim();

    if (!trimmedTitle) {
      alert("Please enter a problem title.");
      return;
    }

    if (!isValidHttpUrl(trimmedLink)) {
      alert("Enter a valid link starting with http:// or https://.");
      return;
    }

    const problem = {
      id: createId(),
      title: trimmedTitle,
      topic,
      difficulty,
      link: trimmedLink,
      solvedAt: new Date().toISOString(),
    };

    saveProblems([problem, ...problems]);

    setTitle("");
    setLink("");
  }

  function deleteProblem(id) {
    const updated = problems.filter((problem) => problem.id !== id);
    saveProblems(updated);
  }

  function saveTarget(event) {
    event.preventDefault();

    const value = Number(targetInput);

    if (!Number.isInteger(value) || value < 1) {
      alert("Please enter a positive whole-number target.");
      return;
    }

    saveTargets({
      ...targets,
      [targetTopic]: value,
    });

    setTargetInput("");
  }

  function removeTarget(selectedTopic) {
    const updated = { ...targets };
    delete updated[selectedTopic];
    saveTargets(updated);
  }

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesTopic =
        filterTopic === "All" || problem.topic === filterTopic;

      const matchesDifficulty =
        filterDifficulty === "All" ||
        problem.difficulty === filterDifficulty;

      return matchesTopic && matchesDifficulty;
    });
  }, [problems, filterTopic, filterDifficulty]);

  const difficultyCounts = useMemo(() => {
    return {
      Easy: problems.filter((p) => p.difficulty === "Easy").length,
      Medium: problems.filter((p) => p.difficulty === "Medium").length,
      Hard: problems.filter((p) => p.difficulty === "Hard").length,
    };
  }, [problems]);

  const topicStats = useMemo(() => {
    const topics = new Set([
      ...TOPICS,
      ...problems.map((problem) => problem.topic),
      ...Object.keys(targets),
    ]);

    return [...topics].map((currentTopic) => {
      const solved = problems.filter(
        (problem) => problem.topic === currentTopic
      ).length;

      const target = Number(targets[currentTopic]) || 0;

      return {
        topic: currentTopic,
        solved,
        target,
        percentage:
          target > 0
            ? Math.min(100, Math.round((solved / target) * 100))
            : 0,
      };
    });
  }, [problems, targets]);

  const totalTarget = Object.values(targets).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0
  );

  const topicsWithTargets = topicStats.filter(
    (item) => item.target > 0
  );

  const totalTargetProgress = topicsWithTargets.reduce(
    (sum, item) =>
      sum + Math.min(item.solved, item.target),
    0
  );

  const overallPercentage =
    totalTarget > 0
      ? Math.round((totalTargetProgress / totalTarget) * 100)
      : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>DSA Tracker</h1>
          <p>Track solved problems and reach your topic-wise targets.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Solved</span>
          <h2>{problems.length}</h2>
        </div>

        <div className="stat-card">
          <span className="stat-label">Easy</span>
          <h2>{difficultyCounts.Easy}</h2>
        </div>

        <div className="stat-card">
          <span className="stat-label">Medium</span>
          <h2>{difficultyCounts.Medium}</h2>
        </div>

        <div className="stat-card">
          <span className="stat-label">Hard</span>
          <h2>{difficultyCounts.Hard}</h2>
        </div>
      </div>

      {/* Add a solved problem */}
      <section className="card">
        <h2>Add Solved Problem</h2>

        <form onSubmit={addProblem} className="form-grid">
          <div className="form-group">
            <label htmlFor="problem-title">Problem Title</label>
            <input
              id="problem-title"
              type="text"
              placeholder="e.g. Two Sum"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="problem-topic">Topic</label>
            <select
              id="problem-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            >
              {TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="problem-difficulty">Difficulty</label>
            <select
              id="problem-difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              {DIFFICULTIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="problem-link">Problem Link (optional)</label>
            <input
              id="problem-link"
              type="url"
              placeholder="https://leetcode.com/problems/..."
              value={link}
              onChange={(event) => setLink(event.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Add Problem
          </button>
        </form>
      </section>

      {/* Topic targets */}
      <section className="card">
        <h2>Topic-wise Targets</h2>
        <p>Set a goal for each topic and track your progress.</p>

        <form onSubmit={saveTarget} className="form-grid">
          <div className="form-group">
            <label htmlFor="target-topic">Select Topic</label>
            <select
              id="target-topic"
              value={targetTopic}
              onChange={(event) => setTargetTopic(event.target.value)}
            >
              {TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="target-count">Target Problems</label>
            <input
              id="target-count"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 50"
              value={targetInput}
              onChange={(event) => setTargetInput(event.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Save Target
          </button>
        </form>

        <div className="target-summary">
          <p>
            <strong>Total target:</strong> {totalTarget} problems
          </p>
          <p>
            <strong>Target progress:</strong> {totalTargetProgress} /{" "}
            {totalTarget} ({overallPercentage}%)
          </p>

          <div
            className="progress-track"
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

        <div className="topic-progress-grid">
          {topicStats
            .filter((item) => item.target > 0 || item.solved > 0)
            .map((item) => (
              <div className="topic-progress-card" key={item.topic}>
                <div className="topic-progress-header">
                  <h3>{item.topic}</h3>
                  {item.target > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => removeTarget(item.topic)}
                      aria-label={`Remove ${item.topic} target`}
                    >
                      Remove Target
                    </button>
                  )}
                </div>

                <p>
                  <strong>{item.solved}</strong>
                  {item.target > 0
                    ? ` / ${item.target} solved`
                    : " solved · No target set"}
                </p>

                {item.target > 0 && (
                  <>
                    <div
                      className="progress-track"
                      role="progressbar"
                      aria-label={`${item.topic} target progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.percentage}
                    >
                      <div
                        className="progress-fill"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <small>{item.percentage}% complete</small>
                  </>
                )}
              </div>
            ))}
        </div>
      </section>

      {/* Topic statistics */}
      <section className="card">
        <h2>Topic Progress</h2>

        <div className="topic-stats-grid">
          {topicStats.map((item) => (
            <div className="topic-stat-card" key={item.topic}>
              <span>{item.topic}</span>
              <strong>{item.solved}</strong>
              <small>
                {item.target > 0
                  ? `Target: ${item.target} · ${item.percentage}%`
                  : "Problems solved"}
              </small>
            </div>
          ))}
        </div>
      </section>

      {/* Problem list */}
      <section className="card">
        <div className="section-header">
          <h2>Solved Problems</h2>
          <span>{filteredProblems.length} problems</span>
        </div>

        <div className="filters">
          <div className="form-group">
            <label htmlFor="filter-topic">Filter by Topic</label>
            <select
              id="filter-topic"
              value={filterTopic}
              onChange={(event) => setFilterTopic(event.target.value)}
            >
              <option value="All">All Topics</option>
              {TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="filter-difficulty">
              Filter by Difficulty
            </label>
            <select
              id="filter-difficulty"
              value={filterDifficulty}
              onChange={(event) =>
                setFilterDifficulty(event.target.value)
              }
            >
              <option value="All">All Difficulties</option>
              {DIFFICULTIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredProblems.length === 0 ? (
          <div className="empty-state">
            <h3>No problems found</h3>
            <p>Add a solved problem or change your filters.</p>
          </div>
        ) : (
          <div className="problem-list">
            {filteredProblems.map((problem) => (
              <div className="problem-item" key={problem.id}>
                <div className="problem-info">
                  <h3>{problem.title}</h3>
                  <div className="problem-meta">
                    <span>{problem.topic}</span>
                    <span>{problem.difficulty}</span>
                    {problem.solvedAt && (
                      <span>
                        {new Date(problem.solvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {problem.link && isValidHttpUrl(problem.link) && (
                    <a
                      href={problem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Problem
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => deleteProblem(problem.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
