// ─── Login Validation ───────────────────────────────────────────
export const validateLoginForm = (form, adminId) => {
  const errors = {};
  if (!form.id.trim()) errors.id = "Admin ID is required.";
  if (!form.password) errors.password = "Password is required.";
  if (form.id !== adminId.trim()) errors.id = "Invalid credentials. Please try again.";
  return errors;
};

// ─── Judge Validation ───────────────────────────────────────────
export const validateJudgeForm = (form, existingJudges = []) => {
  const errors = {};
  if (!form.displayName.trim()) errors.displayName = "Required";
  if (!form.username.trim()) errors.username = "Required";
  else if (/\s/.test(form.username)) errors.username = "No spaces allowed";
  else if (existingJudges.find(j => j.username === form.username.trim())) errors.username = "Username taken";
  if (!form.password) errors.password = "Required";
  else if (form.password.length < 6) errors.password = "Min 6 characters";
  return errors;
};

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
        name: obj.name || obj["team name"] || obj["teamname"] || "—",
        domain: obj.domain || obj["track"] || obj["category"] || "—",
      };
    })
    .filter(r => r.name && r.name !== "—");
};

export const validateCSVFile = (file) => {
  if (!file) return { error: "No file selected" };
  if (!file.name.endsWith(".csv")) return { error: "Please upload a .csv file." };
  return { error: null };
};
