'use client';

import { useState, useEffect } from "react";
import { fetchEvaluations, fetchAllTeams } from "@/lib/db";
import { EVAL_CATEGORIES, TOTAL_MAX } from "@/lib/constants";
import { MedalIcon } from "./Icons";

export default function ResultsTab() {
  const [rows, setRows] = useState([]); // raw evaluations
  const [teams, setTeams] = useState([]); // all teams (for remaining count)
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // team_id of open accordion

  useEffect(() => {
    (async () => {
      const [{ data: eData, error: eErr }, { data: tData }] = await Promise.all([
        fetchEvaluations(),
        fetchAllTeams(),
      ]);

      if (eErr) {
        setLoading(false);
        return;
      }

      setRows(eData || []);
      setTeams(tData || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        <p className="mono text-xs text-gray-400 tracking-widest uppercase">
          Loading evaluations...
        </p>
      </div>
    );
  }

  // ── Aggregate: group by team, average each category across judges ──
  const teamMap = {};
  rows.forEach((r) => {
    const tid = r.teams?.id;
    if (!tid) return;

    if (!teamMap[tid]) {
      teamMap[tid] = {
        team: r.teams,
        judges: [],
        sums: Object.fromEntries(EVAL_CATEGORIES.map((c) => [c.key, 0])),
        count: 0,
        remarks: [],
      };
    }

    EVAL_CATEGORIES.forEach((c) => {
      teamMap[tid].sums[c.key] += Number(r[c.key] || 0);
    });
    teamMap[tid].count += 1;
    teamMap[tid].judges.push(r.judges);
    if (r.remarks) {
      teamMap[tid].remarks.push({
        judge: r.judges?.display_name,
        text: r.remarks,
      });
    }
  });

  const aggregated = Object.values(teamMap)
    .map((entry) => {
      const avgs = Object.fromEntries(
        EVAL_CATEGORIES.map((c) => [c.key, entry.count ? entry.sums[c.key] / entry.count : 0])
      );
      const total = EVAL_CATEGORIES.reduce((s, c) => s + avgs[c.key], 0);
      return { ...entry, avgs, total: parseFloat(total.toFixed(1)) };
    })
    .sort((a, b) => b.total - a.total);

  // ── Insight counts ──
  const totalTeams = teams.length;
  const evaluatedTeams = aggregated.length;
  const remainingTeams = totalTeams - evaluatedTeams;
  const totalVotes = rows.length;
  const maxScore = aggregated[0]?.total || TOTAL_MAX;

  return (
    <div>
      {/* ── Insights bar ── */}
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

      {/* ── Empty state ── */}
      {!aggregated.length && (
        <div className="border-2 border-dashed border-gray-200 py-16 flex flex-col items-center justify-center gap-2">
          <p className="mono text-xs text-gray-300 tracking-widest uppercase">
            No evaluations submitted yet
          </p>
          <p className="mono text-xs text-gray-300">Scores appear here once judges submit</p>
        </div>
      )}

      {/* ── Results list ── */}
      {aggregated.length > 0 && (
        <div className="border border-gray-200 overflow-hidden divide-y divide-gray-100">

          {/* Table header */}
          <div className="grid grid-cols-[48px_1fr_120px_180px] bg-gray-50 border-b border-gray-200">
            {["Rank", "Team", "Score", "Progress"].map((h, i) => (
              <div
                key={h}
                className={`mono text-xs text-gray-400 tracking-widest uppercase px-4 py-3 font-medium ${
                  i === 3 ? "hidden sm:block" : ""
                }`}
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
                {/* ── Row ── */}
                <div
                  onClick={() => setExpanded(isOpen ? null : entry.team.id)}
                  className={`grid grid-cols-[48px_1fr_120px_180px] items-center cursor-pointer transition-colors ${
                    isOpen ? "bg-indigo-50/60" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Rank */}
                  <div className="px-4 py-4 mono text-sm font-bold">
                    <MedalIcon rank={i + 1} />
                  </div>

                  {/* Team */}
                  <div className="px-4 py-4">
                    <p className="syne text-sm font-bold text-gray-900">{entry.team.name}</p>
                    <p className="mono text-xs text-gray-400 mt-0.5">{entry.team.domain}</p>
                  </div>

                  {/* Score */}
                  <div className="px-4 py-4 flex items-baseline gap-1">
                    <span
                      className="syne text-xl font-extrabold"
                      style={{ color: i === 0 ? "#16a34a" : "#111" }}
                    >
                      {entry.total}
                    </span>
                    <span className="mono text-xs text-gray-400">/{TOTAL_MAX}</span>
                    <span className="mono text-xs text-gray-400 ml-1">
                      · {entry.count} judge{entry.count !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="px-4 py-4 hidden sm:flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: i === 0 ? "#6366f1" : "#374151",
                          animation: `growBar 0.8s ease ${i * 0.08}s both`,
                        }}
                      />
                    </div>
                    <span className="mono text-xs text-gray-400 w-9 text-right">{pct}%</span>
                    {/* chevron */}
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`text-gray-400 transition-transform ml-1 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                {/* ── Accordion: category breakdown ── */}
                {isOpen && (
                  <div
                    className="border-t border-indigo-100 bg-white px-6 py-5"
                    style={{ animation: "fadeUp 0.18s ease both" }}
                  >

                    {/* Average scores grid */}
                    <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-4">
                      Average Scores
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                      {EVAL_CATEGORIES.map((cat) => (
                        <div key={cat.key} className="border border-gray-100 bg-gray-50 px-3 py-3 text-center">
                          <p className="syne text-lg font-extrabold text-gray-900">
                            {entry.avgs[cat.key].toFixed(1)}
                            <span className="mono text-xs text-gray-400 font-normal">/{cat.max}</span>
                          </p>
                          <p className="mono text-xs text-gray-500 mt-1 leading-4">{cat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Individual judge scores */}
                    {entry.count > 1 && (
                      <>
                        <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-3">
                          Individual Judge Scores
                        </p>
                        <div className="space-y-2">
                          {rows
                            .filter((r) => r.teams?.id === entry.team.id)
                            .map((r, ji) => {
                              const judgeTotal = EVAL_CATEGORIES.reduce(
                                (s, c) => s + Number(r[c.key] || 0),
                                0
                              );
                              return (
                                <div
                                  key={r.id}
                                  className="border border-gray-100 px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2"
                                >
                                  <span className="syne text-xs font-bold text-gray-700 w-28 truncate">
                                    {r.judges?.display_name ?? "—"}
                                  </span>
                                  {EVAL_CATEGORIES.map((cat) => (
                                    <span key={cat.key} className="mono text-xs text-gray-500">
                                      {Number(r[cat.key] || 0).toFixed(1)}
                                    </span>
                                  ))}
                                  <span className="mono text-xs font-bold text-gray-900 ml-auto">
                                    {judgeTotal.toFixed(1)}/{TOTAL_MAX}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </>
                    )}

                    {/* Remarks */}
                    {entry.remarks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                        <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-2">
                          Remarks
                        </p>
                        {entry.remarks.map((rem, ri) => (
                          <div key={ri} className="bg-gray-50 border border-gray-100 px-4 py-3">
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
