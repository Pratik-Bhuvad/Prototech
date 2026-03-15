// lib/judgeAuth.js
import { supabase } from "./supabase";

const SESSION_KEY = "judge_session_token";

// ── Login: match username + password, create session token ──
export async function judgeLogin(username, password) {
  const { data, error } = await supabase
    .from("judges")
    .select("*")
    .eq("username", username.trim())
    .eq("password", password)
    .single();

  if (error || !data) {
    return { judge: null, error: "Invalid username or password." };
  }

  // Create session
  const { data: session, error: sErr } = await supabase
    .from("judge_sessions")
    .insert({ judge_id: data.id })
    .select()
    .single();

  if (sErr || !session) {
    return { judge: null, error: "Session creation failed. Try again." };
  }

  // Persist token in localStorage
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
  // Get batches assigned to this judge
  const { data: batches, error: bErr } = await supabase
    .from("batches")
    .select("id, name")
    .eq("judge_id", judgeId);

  if (bErr || !batches?.length) return { batches: [], teams: [], error: bErr?.message || null };

  const batchIds = batches.map(b => b.id);

  // Get teams in those batches
  const { data: teams, error: tErr } = await supabase
    .from("teams")
    .select("id, name, domain, batch_id")
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
  // Get judge's batch ids
  const { data: batches, error: bErr } = await supabase
    .from("batches")
    .select("id")
    .eq("judge_id", judgeId);

  if (bErr || !batches?.length) return { allowed: false, reason: "No batches assigned to you." };

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


// ── Submit evaluation ──
export async function submitEvaluation(payload) {
  // payload: { judge_id, team_id, batch_id, ...category scores, remarks }
  const { error } = await supabase
    .from("evaluations")
    .upsert(payload, { onConflict: "judge_id,team_id" });

  return { error: error?.message || null };
}