import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Register from "./pages/Resister";
import Dashboard from "./pages/Dashboard";
import Task from "./pages/Task";
import Planner from "./pages/Planner";
import DSA from "./pages/DSA";
import Exam from "./pages/Exam";
import Notes from "./pages/Notes";
import Assistant from "./pages/Assistant";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/tasks" element={<Layout><Task /></Layout>} />
        <Route path="/planner" element={<Layout><Planner /></Layout>} />
        <Route path="/dsa" element={<Layout><DSA /></Layout>} />
        <Route path="/exams" element={<Layout><Exam /></Layout>} />
        <Route path="/notes" element={<Layout><Notes /></Layout>} />
        <Route path="/assistant" element={<Layout><Assistant /></Layout>} />
        <Route path="/profile" element={<Layout><Profile /></Layout>} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;