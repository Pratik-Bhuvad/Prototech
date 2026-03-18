// components/judge/TeamList.jsx
import { useState, useEffect } from "react";
import { fetchJudgeTeams, fetchJudgeEvaluations, submitEvaluation, judgeLogout, verifyTeamForJudge } from "@/lib/judgeAuth";
import EvalPanel from "./EvalPanel";

// ── Main TeamList component ──
export default function TeamList({ judge, onLogout, autoOpenTeamId }) {
  const [teams, setTeams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [evaluated, setEvaluated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evalTeam, setEvalTeam] = useState(null);
  const [filterBatch, setFilter] = useState("all");
  const [err, setErr] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | done

  useEffect(() => {
    (async () => {
      const [{ batches: b, teams: t, error }, done] = await Promise.all([
        fetchJudgeTeams(judge.id),
        fetchJudgeEvaluations(judge.id),
      ]);
      if (error) { setErr(error); setLoading(false); return; }
      setBatches(b);
      setTeams(t);
      setEvaluated(done);
      setLoading(false);

      // Auto-open eval modal if came from QR scan
      // Auto-open eval modal if came from QR scan — with batch guard
      if (autoOpenTeamId && t.length) {
        const match = t.find(tm => tm.id === autoOpenTeamId);
        if (match) {
          // Team is already filtered to this judge's batches — safe to open
          setEvalTeam(match);
        } else {
          // Team exists but not in judge's batch
          setErr(`Team ${autoOpenTeamId} is not assigned to your batch. Please scan the correct QR code.`);
        }
      }
    })();
  }, [judge.id, autoOpenTeamId]);


  const handleLogout = async () => {
    await judgeLogout();
    onLogout();
  };

  const onSaved = (teamId) => setEvaluated(p => [...p, teamId]);

  const getVisibleTeams = () => {
    let filtered = filterBatch === "all"
      ? teams
      : teams.filter(t => t.batch_id === filterBatch);

    if (statusFilter === "pending") {
      filtered = filtered.filter(t => !evaluated.includes(t.id));
    } else if (statusFilter === "done") {
      filtered = filtered.filter(t => evaluated.includes(t.id));
    }
    return filtered;
  };

  const visible = getVisibleTeams();
  const doneCount = teams.filter(t => evaluated.includes(t.id)).length;
  const pendingCount = teams.length - doneCount;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center gap-3">
      <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      <p className="mono text-xs text-gray-400 tracking-widest uppercase">Loading your teams...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-white"
      style={{
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 0%,rgba(210,210,255,.1) 0%,transparent 60%),linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)",
        backgroundSize: "100% 100%,44px 44px,44px 44px"
      }}>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16">

        {/* Header - Only show evaluation progress */}
        {!evalTeam && (
          <div className="mb-8" style={{ animation: "fadeUp 0.4s ease both" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="mono text-xs text-gray-400 tracking-widest uppercase">{doneCount} / {teams.length} evaluated</p>
              <p className="mono text-xs text-gray-900 font-medium">{Math.round((doneCount / (teams.length || 1)) * 100)}%</p>
            </div>
            <div className="h-1.5 bg-gray-100 overflow-hidden mb-6">
              <div
                className="h-full bg-gray-900 transition-all duration-700"
                style={{ width: teams.length ? `${(doneCount / teams.length) * 100}%` : "0%" }}
              />
            </div>

            {/* Status tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <button onClick={() => setStatusFilter("all")}
                className={`mono text-xs tracking-widest uppercase px-4 py-2 border transition-colors ${statusFilter === "all" ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-400 hover:border-gray-400"}`}>
                All ({teams.length})
              </button>
              <button onClick={() => setStatusFilter("pending")}
                className={`mono text-xs tracking-widest uppercase px-4 py-2 border transition-colors ${statusFilter === "pending" ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-400 hover:border-gray-400"}`}>
                Pending ({pendingCount})
              </button>
              <button onClick={() => setStatusFilter("done")}
                className={`mono text-xs tracking-widest uppercase px-4 py-2 border transition-colors ${statusFilter === "done" ? "bg-purple-600 text-white border-purple-600" : "border-gray-200 text-gray-400 hover:border-gray-400"}`}>
                Done ({doneCount})
              </button>
            </div>
          </div>
        )}

        {/* Batch filter */}
        {!evalTeam && batches.length > 1 && (
          <div className="flex gap-2 mb-5 flex-wrap" style={{ animation: "fadeUp 0.4s ease 0.15s both" }}>
            <button onClick={() => setFilter("all")}
              className={`mono text-xs tracking-widest uppercase px-4 py-1.5 border transition-colors ${filterBatch === "all" ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-400 hover:border-gray-400"}`}>
              All
            </button>
            {batches.map(b => (
              <button key={b.id} onClick={() => setFilter(b.id)}
                className={`mono text-xs tracking-widest uppercase px-4 py-1.5 border transition-colors ${filterBatch === b.id ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-400 hover:border-gray-400"}`}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        {/* Error */}
        {err && <p className="mono text-xs text-red-500 mb-4">✕ {err}</p>}

        {/* Show evaluation form on page or teams list */}
        {evalTeam ? (
          <>
            <div className="flex items-center gap-2 mb-4" style={{ animation: "fadeUp 0.2s ease both" }}>
              <button
                onClick={() => setEvalTeam(null)}
                className="mono text-xs text-gray-400 hover:text-gray-900 tracking-widest uppercase flex items-center gap-1.5 transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Back to Teams
              </button>
              <span className="mono text-xs text-gray-300">/</span>
              <span className="mono text-xs text-gray-500">{evalTeam.name}</span>
            </div>
            <EvalPanel
              team={evalTeam}
              judge={judge}
              onClose={() => setEvalTeam(null)}
              onSaved={onSaved}
              isEdit={evaluated.includes(evalTeam.id)}
            />
          </>
        ) : (
          <>
            {/* Empty state */}
            {!loading && teams.length === 0 && (
              <div className="border-2 border-dashed border-gray-200 py-16 flex flex-col items-center gap-2">
                <p className="mono text-xs text-gray-300 tracking-widest uppercase">No teams assigned to you yet</p>
                <p className="mono text-xs text-gray-300">Contact the admin to assign a batch</p>
              </div>
            )}

            {/* Teams list */}
            <div className="space-y-2" style={{ animation: "fadeUp 0.4s ease 0.2s both" }}>
              {visible.map((team, i) => {
                const done = evaluated.includes(team.id);
                return (
                  <div key={team.id}
                    className={`border bg-white px-4 py-4 flex items-center justify-between transition-all hover:shadow-sm
                      ${done ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 hover:border-gray-300"}`}
                    style={{ animation: `fadeUp 0.25s ease ${i * 0.04}s both` }}>

                    <div className="flex items-center gap-3 min-w-0">
                      {/* Status dot */}
                      <div className={`w-2 h-2 rounded-full shrink-0 ${done ? "bg-emerald-500" : "bg-gray-300"}`} />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="mono text-xs text-gray-400 shrink-0">{team.id}</span>
                          <span className="syne text-sm font-bold text-gray-900 truncate">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {team.domain && (
                            <span className="mono text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5">{team.domain}</span>
                          )}
                          <span className="mono text-xs text-gray-400">{team.batchName}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => !done && setEvalTeam(team)}
                      disabled={done}
                      className={`shrink-0 ml-4 mono text-xs tracking-widest uppercase px-4 py-2 border transition-colors
                        ${done
                          ? "border-gray-700 text-gray-700 opacity-50 cursor-not-allowed"
                          : "border-gray-900 bg-gray-900 text-white hover:bg-black"
                        }`}
                    >
                      {done ? "Evaluated" : "Evaluate →"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}