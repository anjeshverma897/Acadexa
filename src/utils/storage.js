
export const STORAGE_KEYS = {
  tasks: "acadexa_tasks",
  sessions: "acadexa_study_sessions",
  problems: "acadexa_dsa_problems",
  targets: "acadexa_dsa_targets",
  exams: "acadexa_exams",
  notes: "acadexa_notes",
  profile: "acadexa_profile",
};

export const DATA_UPDATED_EVENT = "acadexa:data-updated";

// Read any JSON value safely.
export function readStorage(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);

    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to read storage "${key}":`, error);
    return fallback;
  }
}

// Save JSON data and notify other pages.
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));

    window.dispatchEvent(
      new CustomEvent(DATA_UPDATED_EVENT, {
        detail: { key },
      })
    );

    return true;
  } catch (error) {
    console.error(`Failed to save storage "${key}":`, error);
    return false;
  }
}

// Read an array safely.
export function readArray(key) {
  const value = readStorage(key, []);

  return Array.isArray(value) ? value : [];
}

// Read an object safely.
export function readObject(key) {
  const value = readStorage(key, {});

  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return value;
}

// Remove data and notify other pages.
export function removeStorage(key) {
  try {
    localStorage.removeItem(key);

    window.dispatchEvent(
      new CustomEvent(DATA_UPDATED_EVENT, {
        detail: { key },
      })
    );

    return true;
  } catch (error) {
    console.error(`Failed to remove storage "${key}":`, error);
    return false;
  }
}
