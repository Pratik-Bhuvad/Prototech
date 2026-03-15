// components/judge/TeamList.jsx
import { useState, useEffect } from "react";
import { fetchJudgeTeams, fetchJudgeEvaluations, submitEvaluation, judgeLogout, verifyTeamForJudge  } from "@/lib/judgeAuth";
import { EVAL_CATEGORIES, TOTAL_MAX } from "@/lib/constants";

// ── Score input row ──
function ScoreRow({ cat, value, onChange, error }) {
  const pct = Math.round((value / cat.max) * 100);

  return (
    <div className="border border-gray-100 bg-gray-50 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="mono text-xs text-gray-700">{cat.label}</p>
          <p className="mono text-xs text-gray-400">Max {cat.max} pts</p>
        </div>
        {/* Number input */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={cat.max}
            step={0.5}
            value={value === "" ? "" : value}
            onChange={e => {
              const v = e.target.value;
              if (v === "") { onChange(""); return; }
              const n = parseFloat(v);
              if (!isNaN(n)) onChange(Math.min(cat.max, Math.max(0, n)));
            }}
            onBlur={e => {
              if (e.target.value === "") onChange(0);
            }}
            className={`w-16 px-2 py-1.5 text-center border text-sm font-bold text-gray-900 outline-none mono transition-all
              ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white focus:border-gray-900"}`}
          />
          <span className="mono text-xs text-gray-400">/{cat.max}</span>
        </div>
      </div>
      {/* Progress fill */}
      <div className="h-1 bg-gray-200 overflow-hidden">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#374151"
          }}
        />
      </div>
      {error && <p className="mono text-xs text-red-500 mt-1">✕ {error}</p>}
    </div>
  );
}

// ── Eval form modal ──
function EvalModal({ team, judge, onClose, onSaved }) {
  const blank = Object.fromEntries(EVAL_CATEGORIES.map(c => [c.key, 0]));
  const [scores, setScores] = useState(blank);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [scoreErrs, setScoreErrs] = useState({});

  const total = EVAL_CATEGORIES.reduce((s, c) => s + (Number(scores[c.key]) || 0), 0);

  const validate = () => {
    const e = {};
    EVAL_CATEGORIES.forEach(cat => {
      const v = scores[cat.key];
      if (v === "" || v === null || v === undefined) {
        e[cat.key] = "Required";
      } else if (Number(v) > cat.max) {
        e[cat.key] = `Max is ${cat.max}`;
      } else if (Number(v) < 0) {
        e[cat.key] = "Min is 0";
      }
    });
    return e;
  };

  const handleSubmit = async () => {
    const ve = validate();
    if (Object.keys(ve).length) { setScoreErrs(ve); return; }
    setSaving(true);
    setErr("");

    const numericScores = Object.fromEntries(
      EVAL_CATEGORIES.map(c => [c.key, Number(scores[c.key])])
    );

    const payload = {
      judge_id: judge.id,
      team_id: team.id,
      batch_id: team.batch_id,
      remarks: remarks.trim() || null,
      ...numericScores,
    };

    const { error } = await submitEvaluation(payload);
    if (error) { setErr(error); setSaving(false); return; }
    onSaved(team.id);
    onClose();
  };

  const setScore = (key, val) => {
    setScores(p => ({ ...p, [key]: val }));
    setScoreErrs(p => ({ ...p, [key]: "" }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(3px)" }}
    >
      <div
        className="bg-white border border-gray-200 w-full max-w-lg shadow-2xl my-auto"
        style={{ animation: "fadeUp 0.2s ease both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="syne text-base font-extrabold text-gray-900">{team.name}</p>
            <p className="mono text-xs text-gray-400 mt-0.5">{team.id} · {team.batchName}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-900 text-2xl leading-none transition-colors">×</button>
        </div>

        {/* Total score banner */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <p className="mono text-xs text-gray-400 tracking-widest uppercase">Total Score</p>
          <div className="flex items-baseline gap-1">
            <span
              className="syne text-2xl font-extrabold"
              style={{ color: total >= TOTAL_MAX * 0.8 ? "#16a34a" : total >= TOTAL_MAX * 0.5 ? "#2563eb" : "#111" }}
            >
              {total.toFixed(1)}
            </span>
            <span className="mono text-sm text-gray-400">/ {TOTAL_MAX}</span>
          </div>
        </div>

        {/* Score inputs */}
        <div className="px-6 py-5 space-y-3 border-b border-gray-100">
          <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-1">Category Scores</p>
          {EVAL_CATEGORIES.map(cat => (
            <ScoreRow
              key={cat.key}
              cat={cat}
              value={scores[cat.key]}
              onChange={v => setScore(cat.key, v)}
              error={scoreErrs[cat.key]}
            />
          ))}
        </div>

        {/* Remarks */}
        <div className="px-6 py-4 border-b border-gray-100">
          <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-2">
            Remarks <span className="normal-case text-gray-300">(optional)</span>
          </label>
          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            placeholder="Notes about this team's presentation, strengths, areas to improve..."
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white outline-none text-sm text-gray-700 mono resize-none transition-all"
          />
        </div>

        {err && (
          <div className="px-6 py-3 border-b border-gray-100 mono text-xs text-red-500">
            ✕ {err}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-4 flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 bg-gray-900 text-white mono text-xs tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
              : "Submit Scores →"
            }
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 border border-gray-200 mono text-xs text-gray-500 tracking-widest uppercase hover:border-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Eval form content (for page display) ──
function EvalFormContent({ team, judge, onClose, onSaved }) {
  const blank = Object.fromEntries(EVAL_CATEGORIES.map(c => [c.key, 0]));
  const [scores, setScores] = useState(blank);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [scoreErrs, setScoreErrs] = useState({});

  const total = EVAL_CATEGORIES.reduce((s, c) => s + (Number(scores[c.key]) || 0), 0);

  // Update total score display
  useEffect(() => {
    const elm = document.getElementById("evalTotalScore");
    if (elm) elm.textContent = total.toFixed(1);
  }, [total]);

  const validate = () => {
    const e = {};
    EVAL_CATEGORIES.forEach(cat => {
      const v = scores[cat.key];
      if (v === "" || v === null || v === undefined) {
        e[cat.key] = "Required";
      } else if (Number(v) > cat.max) {
        e[cat.key] = `Max is ${cat.max}`;
      } else if (Number(v) < 0) {
        e[cat.key] = "Min is 0";
      }
    });
    return e;
  };

  const handleSubmit = async () => {
    const ve = validate();
    if (Object.keys(ve).length) { setScoreErrs(ve); return; }
    setSaving(true);
    setErr("");

    const numericScores = Object.fromEntries(
      EVAL_CATEGORIES.map(c => [c.key, Number(scores[c.key])])
    );

    const payload = {
      judge_id: judge.id,
      team_id: team.id,
      batch_id: team.batch_id,
      remarks: remarks.trim() || null,
      ...numericScores,
    };

    const { error } = await submitEvaluation(payload);
    if (error) { setErr(error); setSaving(false); return; }
    onSaved(team.id);
    onClose();
  };

  const setScore = (key, val) => {
    setScores(p => ({ ...p, [key]: val }));
    setScoreErrs(p => ({ ...p, [key]: "" }));
  };

  return (
    <>
      {/* Score inputs */}
      <div className="px-6 py-5 space-y-3 border-b border-gray-100">
        <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-1">Category Scores</p>
        {EVAL_CATEGORIES.map(cat => (
          <ScoreRow
            key={cat.key}
            cat={cat}
            value={scores[cat.key]}
            onChange={v => setScore(cat.key, v)}
            error={scoreErrs[cat.key]}
          />
        ))}
      </div>

      {err && (
        <div className="px-6 py-3 border-b border-gray-100 mono text-xs text-red-500">
          ✕ {err}
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 py-3 bg-gray-900 text-white mono text-xs tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving
            ? <><span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
            : "Submit Scores →"
          }
        </button>
        <button
          onClick={onClose}
          className="px-5 py-3 border border-gray-200 mono text-xs text-gray-500 tracking-widest uppercase hover:border-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </>
  );
}

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
          <div className="border border-gray-200 bg-white" style={{ animation: "fadeUp 0.2s ease both" }}>
            {/* Eval form header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="syne text-base font-extrabold text-gray-900">{evalTeam.name}</p>
                <p className="mono text-xs text-gray-400 mt-0.5">{evalTeam.id} · {evalTeam.batchName}</p>
              </div>
              <button onClick={() => setEvalTeam(null)} className="text-gray-300 hover:text-gray-900 text-2xl leading-none transition-colors">×</button>
            </div>

            {/* Total score banner */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="mono text-xs text-gray-400 tracking-widest uppercase">Total Score</p>
              <div className="flex items-baseline gap-1">
                <span
                  className="syne text-2xl font-extrabold"
                  id="evalTotalScore"
                  style={{ color: "#111" }}
                >
                  0.0
                </span>
                <span className="mono text-sm text-gray-400">/ {TOTAL_MAX}</span>
              </div>
            </div>

            <EvalFormContent
              team={evalTeam}
              judge={judge}
              onClose={() => setEvalTeam(null)}
              onSaved={onSaved}
            />
          </div>
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
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${done ? "bg-emerald-500" : "bg-gray-300"}`} />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="mono text-xs text-gray-400 flex-shrink-0">{team.id}</span>
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
                      onClick={() => setEvalTeam(team)}
                      className={`flex-shrink-0 ml-4 mono text-xs tracking-widest uppercase px-4 py-2 border transition-colors
                        ${done
                          ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          : "border-gray-900 bg-gray-900 text-white hover:bg-black"
                        }`}
                    >
                      {done ? "Edit Scores" : "Evaluate →"}
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