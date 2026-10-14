
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Auth.css";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

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

    if (form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
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

        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Start organizing your studies and learning goals.
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="register-name">Full name</label>
          <input
            id="register-name"
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            autoComplete="name"
            minLength={2}
            required
          />

          <label htmlFor="register-email">Email address</label>
          <input
            id="register-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <label htmlFor="register-confirm-password">
            Confirm password
          </label>
          <input
            id="register-confirm-password"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Enter your password again"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
