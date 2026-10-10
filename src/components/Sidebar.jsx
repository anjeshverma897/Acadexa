import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">

      <h2>Acadexa</h2>

      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/tasks">Tasks</Link>
        <Link to="/planner">Study Planner</Link>
        <Link to="/dsa">DSA Tracker</Link>
        <Link to="/exams">Exams</Link>
        <Link to="/notes">Notes</Link>
        <Link to="/assistant">AI Assistant</Link>
        <Link to="/profile">Profile</Link>
      </nav>

    </div>
  );
}

export default Sidebar;