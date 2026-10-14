
import { useCallback, useEffect, useState } from "react";
import "./Profile.css";

import {
  STORAGE_KEYS,
  DATA_UPDATED_EVENT,
  readObject,
  writeStorage,
} from "../utils/storage";

const PROFILE_KEY = STORAGE_KEYS.profile || "acadexa_profile";

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

// Check common login storage keys.
// Replace/add the exact key used by your Login.jsx if necessary.
const AUTH_KEYS = [
  "acadexa_user",
  "acadexa_current_user",
  "acadexaUser",
  "loggedInUser",
  "currentUser",
  "user",
  "userInfo",
  "acadexa_auth",
];

function parseStoredValue(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getLoggedInUser() {
  for (const key of AUTH_KEYS) {
    const stored = parseStoredValue(key);
    if (!stored) continue;

    // Support common shapes: { user: {...} }, { data: { user: {...} } }
    const candidates = [
      stored,
      stored.user,
      stored.data,
      stored.data?.user,
      stored.user?.data,
    ];

    for (const candidate of candidates) {
      if (!candidate || typeof candidate !== "object") continue;

      const name =
        candidate.name ||
        candidate.fullName ||
        candidate.username ||
        candidate.displayName ||
        "";

      const email = candidate.email || candidate.emailAddress || "";

      if (name || email) {
        return {
          name: String(name).trim(),
          email: String(email).trim(),
        };
      }
    }
  }

  return { name: "", email: "" };
}

function getInitialProfile() {
  const savedProfile = readObject(PROFILE_KEY);
  const loggedInUser = getLoggedInUser();

  return {
    ...defaultProfile,
    ...savedProfile,
    // Login account details take priority over old profile values.
    name: loggedInUser.name || savedProfile.name || "",
    email: loggedInUser.email || savedProfile.email || "",
  };
}

export default function Profile() {
  const [profile, setProfile] = useState(getInitialProfile);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const refreshProfile = useCallback(() => {
    const savedProfile = readObject(PROFILE_KEY);
    const loggedInUser = getLoggedInUser();

    setProfile((previous) => ({
      ...defaultProfile,
      ...savedProfile,
      ...previous,
      // Always prefer the current logged-in account details.
      name: loggedInUser.name || savedProfile.name || previous.name || "",
      email: loggedInUser.email || savedProfile.email || previous.email || "",
    }));
  }, []);

  useEffect(() => {
    refreshProfile();

    function handleStorageChange(event) {
      if (
        !event ||
        !event.key ||
        event.key === PROFILE_KEY ||
        AUTH_KEYS.includes(event.key)
      ) {
        refreshProfile();
      }
    }

    function handleDataUpdate() {
      refreshProfile();
    }

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleDataUpdate);
    window.addEventListener(DATA_UPDATED_EVENT, handleDataUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleDataUpdate);
      window.removeEventListener(DATA_UPDATED_EVENT, handleDataUpdate);
    };
  }, [refreshProfile]);

  function handleChange(event) {
    const { name, value } = event.target;

    // Do not let profile edits override the authenticated account name/email.
    const loggedInUser = getLoggedInUser();
    if (name === "name" && loggedInUser.name) return;
    if (name === "email" && loggedInUser.email) return;

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

    const loggedInUser = getLoggedInUser();
    const profileToSave = {
      ...profile,
      name: loggedInUser.name || profile.name.trim(),
      email: loggedInUser.email || profile.email.trim(),
    };

    if (!profileToSave.name) {
      setMessage("Your name is missing. Please check your login account.");
      return;
    }

    const saved = writeStorage(PROFILE_KEY, profileToSave);

    if (saved) {
      setProfile(profileToSave);
      setEditing(false);
      setMessage("Profile saved successfully!");
    } else {
      setMessage("Unable to save profile. Please try again.");
    }
  }

  function cancelEditing() {
    refreshProfile();
    setEditing(false);
    setMessage("");
  }

  const initials =
    profile.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "S";

  const loggedInUser = getLoggedInUser();

  return (
    <main className="profile-page">
      <header className="profile-heading">
        <div>
          <p className="profile-eyebrow">YOUR ACCOUNT</p>
          <h1>My Profile</h1>
          <p>Manage your academic details and learning goals.</p>
        </div>

        <button
          type="button"
          className="profile-edit-button"
          onClick={() => {
            if (editing) {
              cancelEditing();
            } else {
              refreshProfile();
              setEditing(true);
              setMessage("");
            }
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
                placeholder="Name from your login account"
                disabled={!editing || Boolean(loggedInUser.name)}
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
                placeholder="Email from your login account"
                disabled={!editing || Boolean(loggedInUser.email)}
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
            <button
              type="button"
              className="profile-cancel-button"
              onClick={cancelEditing}
            >
              Discard Changes
            </button>

            <button
              type="submit"
              className="profile-save-button"
            >
              Save Profile
            </button>
          </div>
        )}
      </form>
    </main>
  );
}