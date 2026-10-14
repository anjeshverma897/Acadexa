
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const user = data.user || data.data?.user;
      const token = data.token || data.data?.token;

      if (!user || !token) {
        throw new Error("The server did not return a user and authentication token.");
      }

      if (!user.name || !user.email) {
        throw new Error("The server response is missing the user's name or email.");
      }

      localStorage.setItem("acadexa_token", token);
      localStorage.setItem(
        "acadexa_user",
        JSON.stringify({
          id: user.id || user._id,
          name: user.name,
          email: user.email,
        })
      );

      // Refresh components that listen for Acadexa data updates.
      window.dispatchEvent(new Event("acadexa:data-updated"));

      window.location.assign("/dashboard");
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          Acadexa
        </Link>

        <h1>Welcome back</h1>
        <p className="auth-subtitle">
          Log in to continue your learning journey.
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </section>
    </main>
  );
}
