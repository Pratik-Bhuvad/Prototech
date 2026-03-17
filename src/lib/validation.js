// ─── Login Validation ───────────────────────────────────────────
export const validateLoginForm = (form, adminId) => {
  const errors = {};
  if (!form.id.trim()) errors.id = "Admin ID is required.";
  if (!form.password) errors.password = "Password is required.";
  if (form.id !== adminId.trim()) errors.id = "Invalid credentials. Please try again.";
  return errors;
};

// ─── Judge Validation ───────────────────────────────────────────
export function validateJudgeForm({ displayName, username, password }, existingJudges = []) {
  const e = {};
  if (!displayName?.trim())
    e.displayName = "Required";
  if (!username?.trim())
    e.username = "Required";
  else if (/\s/.test(username))
    e.username = "No spaces allowed";
  else if (!/^[a-zA-Z0-9_]+$/.test(username))
    e.username = "Only letters, numbers and underscores";
  else if (existingJudges.find(j => j.username === username.trim()))
    e.username = "Username already taken";
  if (!password)
    e.password = "Required";
  else if (password.length < 8)
    e.password = "Minimum 8 characters";
  return e;
}

// ─── Batch Validation ───────────────────────────────────────────
export const validateBatchForm = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "Required";
  if (!form.selectedTeams.length) errors.teams = "Select at least one team";
  return errors;
};

// ─── CSV Parsing & Validation ───────────────────────────────────
export const parseCSV = (text) => {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

  return lines.slice(1)
    .map((line, i) => {
      const vals = line.split(",").map(v => v.trim());
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] || ""; });

      return {
        id: obj.id || obj["team id"] || obj["teamid"] || `T-${String(i + 1).padStart(3, "0")}`,
        name: obj.name || obj["team name"] || obj["teamname"] || "",
        domain: obj.domain || obj["track"] || obj["category"] || "",
        projecttitle: obj.title || obj["project title"] || "",
        email: obj.email || obj["team email"] || obj["leader email"] || "",
        college: obj.college || "",
        batch_id: null,
      };
    })
    .filter(r => r.name && r.name !== "—");
};

export const validateCSVFile = (file) => {
  if (!file) return { error: "No file selected" };
  if (!file.name.endsWith(".csv")) return { error: "Please upload a .csv file." };
  return { error: null };
};
