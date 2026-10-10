
import { useState } from "react";

const STORAGE_KEY = "acadexa_dsa_problems";

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

function loadProblems() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function DSA() {
  const [problems, setProblems] = useState(loadProblems);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("Array");
  const [difficulty, setDifficulty] = useState("Medium");
  const [link, setLink] = useState("");
  const [filterTopic, setFilterTopic] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");

  function saveProblems(updated) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setProblems(updated);
    } catch {
      alert("Unable to save your DSA progress.");
    }
  }

  function addProblem(e) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Enter a problem title.");
      return;
    }

    if (link.trim()) {
      try {
        const url = new URL(link);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid URL");
        }
      } catch {
        alert("Enter a valid HTTP or HTTPS problem link.");
        return;
      }
    }

    const problem = {
      id: `${Date.now()}-${Math.random()}`,
      title: title.trim(),
      topic,
      difficulty,
      link: link.trim(),
      solvedAt: new Date().toISOString(),
    };

    saveProblems([problem, ...problems]);
    setTitle("");
    setLink("");
  }

  function deleteProblem(id) {
    saveProblems(problems.filter((p) => p.id !== id));
  }

  const easy = problems.filter(
    (p) => p.difficulty === "Easy"
  ).length;

  const medium = problems.filter(
    (p) => p.difficulty === "Medium"
  ).length;

  const hard = problems.filter(
    (p) => p.difficulty === "Hard"
  ).length;

  const filteredProblems = problems.filter((p) => {
    const matchesTopic =
      filterTopic === "All" || p.topic === filterTopic;

    const matchesDifficulty =
      filterDifficulty === "All" ||
      p.difficulty === filterDifficulty;

    return matchesTopic && matchesDifficulty;
  });

  const topicStats = TOPICS
    .filter((name) => name !== "Other")
    .map((name) => ({
      name,
      count: problems.filter((p) => p.topic === name).length,
    }))
    .filter((item) => item.count > 0);

  return (
    <div className="dsa-page">
      <header className="dsa-header">
        <div>
          <h1>DSA Tracker 💻</h1>
          <p>Track every problem. Build consistency.</p>
        </div>
      </header>

      {/* Statistics */}
      <section className="dsa-stats">
        <div className="dsa-stat-card">
          <span>Total Solved</span>
          <strong>{problems.length}</strong>
        </div>

        <div className="dsa-stat-card">
          <span>Easy</span>
          <strong className="easy-text">{easy}</strong>
        </div>

        <div className="dsa-stat-card">
          <span>Medium</span>
          <strong className="medium-text">{medium}</strong>
        </div>

        <div className="dsa-stat-card">
          <span>Hard</span>
          <strong className="hard-text">{hard}</strong>
        </div>
      </section>

      {/* Add problem */}
      <section className="dsa-card">
        <h2>Record Solved Problem</h2>

        <form className="dsa-form" onSubmit={addProblem}>
          <label>
            Problem Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Number of Islands"
              required
            />
          </label>

          <label>
            Topic
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              {TOPICS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>

          <label>
            Problem Link (optional)
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://leetcode.com/problems/..."
            />
          </label>

          <button type="submit" className="dsa-add-btn">
            + Record Problem
          </button>
        </form>
      </section>

      {/* Topic progress */}
      <section className="dsa-card">
        <h2>Topic Progress</h2>

        {topicStats.length === 0 ? (
          <p className="dsa-empty-text">
            Record your first problem to see topic statistics.
          </p>
        ) : (
          <div className="dsa-topic-grid">
            {topicStats.map((item) => (
              <div className="dsa-topic-card" key={item.name}>
                <span>{item.name}</span>
                <strong>{item.count}</strong>
                <small>problems recorded</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Problem list */}
      <section className="dsa-card">
        <h2>Solved Problems</h2>

        <div className="dsa-filters">
          <select
            aria-label="Filter by topic"
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
          >
            <option value="All">All Topics</option>
            {TOPICS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by difficulty"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
          >
            <option value="All">All Difficulties</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>

        {filteredProblems.length === 0 ? (
          <div className="dsa-empty">
            <span>🎯</span>
            <h3>No problems found</h3>
            <p>Record a solved problem or change your filters.</p>
          </div>
        ) : (
          <div className="dsa-problem-list">
            {filteredProblems.map((problem) => (
              <article className="dsa-problem" key={problem.id}>
                <div className="dsa-problem-info">
                  <h3>{problem.title}</h3>
                  <p>
                    {problem.topic} ·{" "}
                    {new Date(problem.solvedAt).toLocaleDateString(
                      "en-IN"
                    )}
                  </p>
                </div>

                <span
                  className={`dsa-difficulty ${problem.difficulty.toLowerCase()}`}
                >
                  {problem.difficulty}
                </span>

                {problem.link && (
                  <a
                    href={problem.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                )}

                <button
                  type="button"
                  className="dsa-delete-btn"
                  onClick={() => deleteProblem(problem.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default DSA;
