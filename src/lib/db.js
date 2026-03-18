import { supabase, ADMIN_SUPABASE_EMAIL } from "@/lib/supabase";

// ─── TEAMS ──────────────────────────────────────────────────────
export const fetchTeams = async () => {
  const { data, error } = await supabase.from("teams").select("*").order("id");
  return { data, error };
};

export const deleteTeam = async (teamId) => {
  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  return { error };
};

export const importTeams = async (teamsData) => {
  // Wipe existing teams then insert new ones
  await supabase.from("teams").delete().neq("id", "__none__");
  const { error } = await supabase.from("teams").insert(teamsData);
  return { error };
};

// ─── JUDGES ─────────────────────────────────────────────────────
export const fetchJudges = async () => {
  const { data, error } = await supabase.from("judges").select("*").order("id");
  return { data, error };
};

export const createJudge = async (judgeData) => {
  const { error } = await supabase.from("judges").insert(judgeData);
  return { error };
};

export const deleteJudge = async (judgeId) => {
  const { error } = await supabase.from("judges").delete().eq("id", judgeId);
  return { error };
};

// ─── BATCHES ────────────────────────────────────────────────────
export const fetchBatches = async () => {
  const { data, error } = await supabase.from("batches").select("id, name, judge_ids").order("id");
  // Ensure judge_ids is always an array
  if (data) {
    data.forEach(b => {
      b.judge_ids = Array.isArray(b.judge_ids) ? b.judge_ids : [];
    });
  }
  if (error) console.error("Error fetching batches:", error);
  return { data, error };
};

export const fetchTeamsWithBatch = async () => {
  const { data, error } = await supabase.from("teams").select("id,name,batch_id").order("id");
  return { data, error };
};

export const createBatch = async (batchData) => {
  // Accepts judge_ids array
  const { error } = await supabase.from("batches").insert(batchData);
  return { error };
};

export const assignBatchToTeams = async (batchId, teamIds) => {
  const { error } = await supabase.from("teams").update({ batch_id: batchId }).in("id", teamIds);
  return { error };
};

export const updateTeamsBatch = async (teamIds, batchId) => {
  const { error } = await supabase.from("teams").update({ batch_id: batchId }).in("id", teamIds);
  if (error) return { data: null, error };
  const { data, error: fetchError } = await supabase.from("teams").select("id,name,batch_id").order("id");
  return { data, error: fetchError };
};

export const assignJudgesToBatch = async (batchId, judgeIds) => {
  // judgeIds: array of judge UUIDs
  console.log("Updating batch", batchId, "with judges", judgeIds);
  const { error } = await supabase.from("batches").update({ judge_ids: judgeIds }).eq("id", batchId);
  if (error) {
    console.error("Error updating judges for batch", batchId, error);
  } else {
    console.log("Successfully updated batch", batchId);
  }
  return { error };
};

export const unlinkTeamsFromBatch = async (batchId) => {
  const { error } = await supabase.from("teams").update({ batch_id: null }).eq("batch_id", batchId);
  return { error };
};

export const deleteBatch = async (batchId) => {
  // Unlink teams first
  await unlinkTeamsFromBatch(batchId);
  const { error } = await supabase.from("batches").delete().eq("id", batchId);
  return { error };
};

// ─── EVALUATIONS ────────────────────────────────────────────────
export const fetchEvaluations = async () => {
  const { data: eData, error: eErr } = await supabase
    .from("evaluations")
    .select(`
      id, remarks, created_at,
      introduction, objectives,
      implementation, results, implication,
      teams   ( id, name, domain, batch_id ),
      judges  ( id, display_name, username ),
      batches ( id, name )
    `);
  return { data: eData, error: eErr };
};

export const fetchAllTeams = async () => {
  const { data, error } = await supabase.from("teams").select("id");
  return { data, error };
};

// ─── AUTH ───────────────────────────────────────────────────────
export const loginAdmin = async (password) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_SUPABASE_EMAIL,
    password: password,
  });
  return { error };
};

export const getAdminSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

export const setupAuthListener = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return subscription;
};

export async function fetchEvaluationByJudgeAndTeam(judgeId, teamId) {
    const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("judge_id", judgeId)
        .eq("team_id", teamId)
        .single();
    return { data, error };
}

export async function fetchEvaluationsAggregated() {
    const { data, error } = await supabase
        .from("evaluations")
        .select(`
            id,
            remarks,
            created_at,
            introduction,
            objectives,
            implementation,
            results,
            implication,
            teams   ( id, name, domain, batch_id ),
            judges  ( id, display_name, username ),
            batches ( id, name )
        `)
        .order("created_at", { ascending: false });

    return { data, error };
}

export async function fetchTotalTeamCount() {
    const { count, error } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true });

    return { count: count ?? 0, error };
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────
export async function fetchEvaluationNotifications() {
    // Fetch all evaluations with team and judge info, sorted by creation date (newest first)
    const { data, error } = await supabase
        .from("evaluations")
        .select(`
            id,
            created_at,
            teams ( id, name, email, domain, batch_id ),
            judges ( id, display_name, username ),
            batches ( id, name )
        `)
        .order("created_at", { ascending: false });

    return { data, error };
}