'use client';

import { useState, useEffect } from "react";
import { fetchEvaluationsAggregated, fetchTotalTeamCount } from "@/lib/db";
import { EVAL_CATEGORIES, TOTAL_MAX } from "@/lib/constants";
import { MedalIcon } from "./Icons";

// Export function to download current results as CSV
function exportResultsCSV(aggregated) {
  const catHeaders = EVAL_CATEGORIES.map(c => c.label).join(",");
  const header = `Rank,Team ID,Team Name,Domain,Batch,Judges,${catHeaders},Total\n`;

  const rows = aggregated.map((entry, i) => {
    const catValues = EVAL_CATEGORIES.map(c =>
      entry.avgs[c.key].toFixed(1)
    ).join(",");
    return [
      i + 1,
      entry.team.id,
      `"${entry.team.name}"`,
      `"${entry.team.domain || ""}"`,
      `"${entry.batch?.name || ""}"`,
      entry.count,
      catValues,
      entry.total,
    ].join(",");
  }).join("\n");

  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prototech-results-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsTab() {
  const [rows, setRows] = useState([]);
  const [totalTeams, setTotalTeams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [fetchErr, setFetchErr] = useState("");

  useEffect(() => {
    (async () => {
      const [
        { data: eData, error: eErr },
        { count }
      ] = await Promise.all([
        fetchEvaluationsAggregated(),
        fetchTotalTeamCount(),
      ]);

      if (eErr) {
        setFetchErr("Failed to load evaluations: " + eErr.message);
        setLoading(false);
        return;
      }

      setRows(eData || []);
      setTotalTeams(count);
      setLoading(false);
    })();
  }, []);

  // ── Aggregate rows by team ──────────────────────────────────
  const teamMap = {};
  rows.forEach(r => {
    const tid = r.teams?.id;
    if (!tid) return;

    if (!teamMap[tid]) {
      teamMap[tid] = {
        team: r.teams,
        batch: r.batches,
        judges: [],
        sums: Object.fromEntries(EVAL_CATEGORIES.map(c => [c.key, 0])),
        count: 0,
        remarks: [],
        rows: [],
      };
    }

    EVAL_CATEGORIES.forEach(c => {
      teamMap[tid].sums[c.key] += Number(r[c.key] || 0);
    });

    teamMap[tid].count++;
    teamMap[tid].judges.push(r.judges);
    teamMap[tid].rows.push(r);
    if (r.remarks) {
      teamMap[tid].remarks.push({
        judge: r.judges?.display_name || "—",
        text: r.remarks,
      });
    }
  });

  // Build sorted aggregated list
  const aggregated = Object.values(teamMap)
    .map(entry => {
      const avgs = Object.fromEntries(
        EVAL_CATEGORIES.map(c => [
          c.key,
          entry.count ? entry.sums[c.key] / entry.count : 0
        ])
      );
      const total = parseFloat(
        EVAL_CATEGORIES.reduce((s, c) => s + avgs[c.key], 0).toFixed(1)
      );
      return { ...entry, avgs, total };
    })
    .sort((a, b) => b.total - a.total);

  // ── Insight counts ──────────────────────────────────────────
  const evaluatedTeams = aggregated.length;
  const remainingTeams = totalTeams - evaluatedTeams;
  const totalVotes = rows.length;

  // ── Loading ─────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-20 gap-3">
      <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      <p className="mono text-xs text-gray-400 tracking-widest uppercase">Loading evaluations...</p>
    </div>
  );

  // ── Error ───────────────────────────────────────────────────
  if (fetchErr) return (
    <div className="border border-red-200 bg-red-50 px-5 py-4 mono text-xs text-red-600">
      ✕ {fetchErr}
    </div>
  );

  return (
    <div>
      {/* ── Insight tiles ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200 border border-gray-200 mb-7">
        {[
          { label: "Total Teams", value: totalTeams },
          { label: "Evaluated", value: evaluatedTeams },
          { label: "Remaining", value: remainingTeams },
          { label: "Total Votes", value: totalVotes },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-5 py-4 text-center">
            <p className="syne text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>
            <p className="mono text-xs text-gray-400 tracking-widest uppercase mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Header row with export ── */}
      {aggregated.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="mono text-xs text-gray-400 tracking-widests uppercase">
            {aggregated.length} Teams · {totalVotes} Evaluations
          </p>
          <button
            onClick={() => exportResultsCSV(aggregated)}
            className="mono text-xs tracking-widest uppercase px-4 py-2 border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!aggregated.length && (
        <div className="border-2 border-dashed border-gray-200 py-16 flex flex-col items-center gap-2">
          <p className="mono text-xs text-gray-300 tracking-widest uppercase">No evaluations yet</p>
          <p className="mono text-xs text-gray-300">Scores will appear here once judges submit</p>
        </div>
      )}

      {/* ── Results list ── */}
      {aggregated.length > 0 && (
        <div className="border border-gray-200 overflow-hidden divide-y divide-gray-100">

          {/* Table header */}
          <div className="grid grid-cols-[48px_1fr_130px_160px] bg-gray-50 border-b border-gray-200">
            {["Rank", "Team", "Score", "Progress"].map((h, i) => (
              <div
                key={h}
                className={`mono text-xs text-gray-400 tracking-widest uppercase px-4 py-3 font-medium ${i === 3 ? "hidden sm:block" : ""}`}
              >
                {h}
              </div>
            ))}
          </div>

          {aggregated.map((entry, i) => {
            const isOpen = expanded === entry.team.id;
            const pct = Math.round((entry.total / TOTAL_MAX) * 100);

            return (
              <div key={entry.team.id}>
                {/* ── Result row ── */}
                <div
                  onClick={() => setExpanded(isOpen ? null : entry.team.id)}
                  className={`grid grid-cols-[48px_1fr_130px_160px] items-center cursor-pointer transition-colors
                                        ${isOpen ? "bg-gray-50" : "hover:bg-gray-50/60"}`}
                >
                  {/* Rank */}
                  <div className="px-4 py-4 mono text-sm font-bold">
                    <MedalIcon rank={i + 1} />
                  </div>

                  {/* Team */}
                  <div className="px-4 py-4 min-w-0">
                    <p className="syne text-sm font-bold text-gray-900 truncate">{entry.team.name}</p>
                    <p className="mono text-xs text-gray-400 mt-0.5 truncate">{entry.team.domain}</p>
                    {entry.team.projectTitle && (
                      <p className="mono text-xs text-green-600 mt-0.5 truncate bg-green-50 px-1.5 py-0.5 inline-block">{entry.team.projectTitle}</p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="px-4 py-4 flex items-baseline gap-1 flex-wrap">
                    <span
                      className="syne text-xl font-extrabold"
                      style={{ color: i === 0 ? "#16a34a" : "#111" }}
                    >
                      {entry.total}
                    </span>
                    <span className="mono text-xs text-gray-400">/{TOTAL_MAX}</span>
                    <span className="mono text-xs text-gray-300 w-full">
                      {entry.count} judge{entry.count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="px-4 py-4 hidden sm:flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: i === 0 ? "#6366f1" : "#374151",
                          animation: `growBar 0.8s ease ${i * 0.08}s both`
                        }}
                      />
                    </div>
                    <span className="mono text-xs text-gray-400 w-9 text-right">{pct}%</span>
                    <svg
                      width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      className={`text-gray-400 transition-transform ml-1 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* ── Accordion: breakdown ── */}
                {isOpen && (
                  <div
                    className="border-t border-gray-100 bg-white px-6 py-5"
                    style={{ animation: "fadeUp 0.18s ease both" }}
                  >
                    {/* Average category scores */}
                    <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-4">
                      Average Scores
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
                      {EVAL_CATEGORIES.map(cat => (
                        <div
                          key={cat.key}
                          className="border border-gray-100 bg-gray-50 px-3 py-3 text-center"
                        >
                          <p className="syne text-base font-extrabold text-gray-900">
                            {entry.avgs[cat.key].toFixed(1)}
                            <span className="mono text-xs text-gray-400 font-normal">
                              /{cat.max}
                            </span>
                          </p>
                          <p className="mono text-xs text-gray-500 mt-1 leading-4">
                            {cat.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Per-judge breakdown — only if multiple judges */}
                    {entry.count > 1 && (
                      <>
                        <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-3">
                          Individual Judge Scores
                        </p>
                        <div className="border border-gray-100 overflow-hidden mb-4">
                          {/* Header */}
                          <div className="grid bg-gray-50 border-b border-gray-100"
                            style={{ gridTemplateColumns: `160px repeat(${EVAL_CATEGORIES.length}, 1fr) 80px` }}>
                            <div className="mono text-xs text-gray-400 px-3 py-2">Judge</div>
                            {EVAL_CATEGORIES.map(cat => (
                              <div key={cat.key} className="mono text-xs text-gray-400 px-2 py-2 text-center truncate" title={cat.label}>
                                {cat.label.split(" ")[0]}
                              </div>
                            ))}
                            <div className="mono text-xs text-gray-400 px-3 py-2 text-right">Total</div>
                          </div>
                          {/* Rows */}
                          {entry.rows.map(r => {
                            const judgeTotal = EVAL_CATEGORIES.reduce(
                              (s, c) => s + Number(r[c.key] || 0), 0
                            );
                            return (
                              <div
                                key={r.id}
                                className="grid border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                                style={{ gridTemplateColumns: `160px repeat(${EVAL_CATEGORIES.length}, 1fr) 80px` }}
                              >
                                <div className="mono text-xs text-gray-700 px-3 py-2.5 truncate font-medium">
                                  {r.judges?.display_name || "—"}
                                </div>
                                {EVAL_CATEGORIES.map(cat => (
                                  <div key={cat.key} className="mono text-xs text-gray-500 px-2 py-2.5 text-center">
                                    {Number(r[cat.key] || 0)}
                                  </div>
                                ))}
                                <div className="mono text-xs font-bold text-gray-900 px-3 py-2.5 text-right">
                                  {judgeTotal}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {/* Remarks */}
                    {entry.remarks.length > 0 && (
                      <div className="space-y-2">
                        <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-2">
                          Remarks
                        </p>
                        {entry.remarks.map((rem, ri) => (
                          <div
                            key={ri}
                            className="bg-gray-50 border border-gray-100 px-4 py-3"
                          >
                            <p className="mono text-xs text-gray-400 mb-1">{rem.judge}</p>
                            <p className="mono text-xs text-gray-600 leading-5">{rem.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}