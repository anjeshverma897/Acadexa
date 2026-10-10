
import { useEffect, useState } from "react";
import "./Profile.css";

const PROFILE_KEY = "acadexa_profile";

const defaultProfile = {
  name: "",
  email: "",
  college: "",
  branch: "",
  year: "2nd Year",
  goal: "SDE Internship",
  dailyStudyHours: 6,
  dsaGoal: 750,
};

export default function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        setProfile({ ...defaultProfile, ...JSON.parse(saved) });
      }
    } catch {
      setMessage("Could not load your saved profile.");
    }
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setProfile((previous) => ({
      ...previous,
      [name]:
        name === "dailyStudyHours" || name === "dsaGoal"
          ? Number(value)
          : value,
    }));
  }

  function saveProfile(event) {
    event.preventDefault();

    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setEditing(false);
      setMessage("Profile saved successfully!");
      window.dispatchEvent(new Event("acadexa:data-updated"));
    } catch {
      setMessage("Unable to save profile. Please try again.");
    }
  }

  const initials =
    profile.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "S";

  return (
    <main className="profile-page">
      <header className="profile-heading">
        <div>
          <p className="profile-eyebrow">YOUR ACCOUNT</p>
          <h1>My Profile</h1>
          <p>Manage your academic details and learning goals.</p>
        </div>

        <button
          className="profile-edit-button"
          onClick={() => {
            setEditing((value) => !value);
            setMessage("");
          }}
        >
          {editing ? "Cancel" : "Edit Profile"}
        </button>
      </header>

      {message && (
        <div className="profile-message" role="status">
          {message}
        </div>
      )}

      <section className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-identity">
          <h2>{profile.name || "Student Name"}</h2>
          <p>{profile.email || "Add your email address"}</p>
          <span className="profile-tag">{profile.year}</span>
        </div>
      </section>

      <form onSubmit={saveProfile}>
        <section className="profile-card">
          <div className="profile-card-heading">
            <h2>Personal Information</h2>
            <p>Your basic account details</p>
          </div>

          <div className="profile-fields">
            <label>
              Full Name
              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
                placeholder="Enter your name"
                disabled={!editing}
                required
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={!editing}
              />
            </label>

            <label>
              College / University
              <input
                name="college"
                value={profile.college}
                onChange={handleChange}
                placeholder="Enter your college"
                disabled={!editing}
              />
            </label>

            <label>
              Branch / Department
              <input
                name="branch"
                value={profile.branch}
                onChange={handleChange}
                placeholder="Enter your branch"
                disabled={!editing}
              />
            </label>

            <label>
              Academic Year
              <select
                name="year"
                value={profile.year}
                onChange={handleChange}
                disabled={!editing}
              >
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
                <option>Postgraduate</option>
              </select>
            </label>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-card-heading">
            <h2>Learning Goals</h2>
            <p>Customize your academic targets</p>
          </div>

          <div className="profile-fields">
            <label>
              Primary Career Goal
              <select
                name="goal"
                value={profile.goal}
                onChange={handleChange}
                disabled={!editing}
              >
                <option>SDE Internship</option>
                <option>Software Development Engineer</option>
                <option>AI / ML Engineer</option>
                <option>Data Analyst</option>
                <option>Higher Studies</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Daily Study Goal (hours)
              <input
                type="number"
                name="dailyStudyHours"
                min="1"
                max="24"
                value={profile.dailyStudyHours}
                onChange={handleChange}
                disabled={!editing}
              />
            </label>

            <label>
              DSA Problem Target
              <input
                type="number"
                name="dsaGoal"
                min="1"
                value={profile.dsaGoal}
                onChange={handleChange}
                disabled={!editing}
              />
            </label>
          </div>

          <div className="profile-goal-summary">
            <div>
              <span>Daily target</span>
              <strong>{profile.dailyStudyHours} hours</strong>
            </div>
            <div>
              <span>DSA target</span>
              <strong>{profile.dsaGoal} problems</strong>
            </div>
            <div>
              <span>Career goal</span>
              <strong>{profile.goal}</strong>
            </div>
          </div>
        </section>

        {editing && (
          <div className="profile-form-actions">
            <button type="button" className="profile-cancel-button" onClick={() => {
              try {
                const saved = localStorage.getItem(PROFILE_KEY);
                setProfile(saved ? { ...defaultProfile, ...JSON.parse(saved) } : defaultProfile);
              } catch {
                setProfile(defaultProfile);
              }
              setEditing(false);
              setMessage("");
            }}>
              Discard Changes
            </button>
            <button type="submit" className="profile-save-button">
              Save Profile
            </button>
          </div>
        )}
      </form>
    </main>
  );
}
