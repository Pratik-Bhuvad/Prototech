// lib/judgeAuth.js
import { supabase } from "./supabase";

const SESSION_KEY = "judge_session_token";

import {
  // ...existing imports...
  fetchEvaluationByJudgeAndTeam,
} from "./db";

// ── Create a new judge session with unique token ──
export async function createJudgeSession(judgeId) {
  // Generate a unique token
  const token = crypto.randomUUID();

  // Store in database
  const { data, error } = await supabase
    .from("judge_sessions")
    .insert([{ judge_id: judgeId, token }])
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

// Add this function:
export async function fetchExistingEvaluation(judgeId, teamId) {
  const { data, error } = await fetchEvaluationByJudgeAndTeam(judgeId, teamId);
  if (error || !data) return null;
  return data;
}

// ── Login: match username + password, create session token ──
export async function judgeLogin(username, password) {
    // Fetch by username only — never query by plaintext password
    const { data, error } = await supabase
        .from("judges")
        .select("*")
        .eq("username", username.trim())
        .single();

    if (error || !data) return { judge: null, error: "Invalid username or password." };

    // Verify password against stored hash
    const { verifyPassword } = await import("@/lib/hash");
    const valid = await verifyPassword(password, data.password);
    if (!valid) return { judge: null, error: "Invalid username or password." };

    // Create session
    const { data: session, error: sErr } = await createJudgeSession(data.id);
    if (sErr || !session) return { judge: null, error: "Session creation failed. Try again." };

    localStorage.setItem(SESSION_KEY, session.token);
    return { judge: { ...data, displayName: data.display_name }, error: null };
}

// ── Restore session on page reload ──
export async function restoreJudgeSession() {
  const token = localStorage.getItem(SESSION_KEY);
  if (!token) return null;

  const { data, error } = await supabase
    .from("judge_sessions")
    .select("judge_id, judges(*)")
    .eq("token", token)
    .single();

  if (error || !data) {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }

  const j = data.judges;
  return { ...j, displayName: j.display_name };
}

// ── Logout: delete session token from DB + localStorage ──
export async function judgeLogout() {
  const token = localStorage.getItem(SESSION_KEY);
  if (token) {
    await supabase.from("judge_sessions").delete().eq("token", token);
    localStorage.removeItem(SESSION_KEY);
  }
}

// ── Fetch teams assigned to this judge's batches ──
export async function fetchJudgeTeams(judgeId) {
  // Get all batches
  const { data: allBatches, error: bErr } = await supabase
    .from("batches")
    .select("id, name, judge_ids");

  if (bErr) return { batches: [], teams: [], error: bErr.message };

  // Filter batches where this judge is assigned
  const batches = allBatches.filter(b => 
    Array.isArray(b.judge_ids) && b.judge_ids.includes(judgeId)
  );

  if (!batches?.length) return { batches: [], teams: [], error: null };

  const batchIds = batches.map(b => b.id);

  // Get teams in those batches
  const { data: teams, error: tErr } = await supabase
    .from("teams")
    .select("id, name, domain, batch_id, email")
    .in("batch_id", batchIds)
    .order("id");

  if (tErr) return { batches, teams: [], error: tErr.message };

  // Attach batch name to each team
  const batchMap = Object.fromEntries(batches.map(b => [b.id, b.name]));
  const enriched = teams.map(t => ({ ...t, batchName: batchMap[t.batch_id] || "—" }));

  return { batches, teams: enriched, error: null };
}

// ── Verify a scanned team belongs to this judge's batches ──
export async function verifyTeamForJudge(judgeId, teamId) {
  // Get all batches
  const { data: allBatches, error: bErr } = await supabase
    .from("batches")
    .select("id, judge_ids");

  if (bErr) return { allowed: false, reason: "Error fetching batches." };

  // Filter batches where this judge is assigned
  const batches = allBatches.filter(b => 
    Array.isArray(b.judge_ids) && b.judge_ids.includes(judgeId)
  );

  if (!batches?.length) return { allowed: false, reason: "No batches assigned to you." };

  const batchIds = batches.map(b => b.id);

  // Check if team is in one of those batches
  const { data: team, error: tErr } = await supabase
    .from("teams")
    .select("id, name, batch_id")
    .eq("id", teamId)
    .in("batch_id", batchIds)
    .single();

  if (tErr || !team) {
    return { allowed: false, reason: "This team is not assigned to your batch." };
  }

  return { allowed: true, reason: null };
}

// ── Check if judge already submitted evaluation for a team ──
export async function fetchJudgeEvaluations(judgeId) {
  const { data, error } = await supabase
    .from("evaluations")
    .select("team_id")
    .eq("judge_id", judgeId);

  if (error) return [];
  return data.map(e => e.team_id);
}


// ── Submit evaluation (one-time only, no updates allowed) ──
export async function submitEvaluation(payload) {
  // Always INSERT - prevent updates after submission
  const { error } = await supabase
    .from("evaluations")
    .insert(payload);

  // If duplicate key error, evaluation already exists
  if (error?.code === "23505" || error?.message?.includes("duplicate")) {
    return { error: "Your evaluation has already been submitted and cannot be updated." };
  }

  return { error: error?.message || null };
}

// ── Send evaluation completion notification (no scores or judge details) ──
export async function sendEvaluationEmail({ teamName, teamEmail }) {
    console.log("🚀 sendEvaluationEmail function called with:", { teamName, teamEmail });
    
    // Skip silently if no email
    if (!teamEmail) {
        console.log("⚠️  No email provided, skipping");
        return { error: null };
    }

    try {
        console.log("📧 Sending evaluation email to:", teamEmail);
        const res = await fetch("/api/evaluations/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamName, teamEmail }),
        });
        const json = await res.json();
        console.log("📧 Notify response:", json);
        if (!res.ok) {
            console.error("📧 Notify failed:", json.error);
            return { error: json.error };
        }
        console.log("✅ Email sent");
        return { error: null };
    } catch (err) {
        console.error("❌ Email send error:", err.message);
        return { error: err.message };
    }
}