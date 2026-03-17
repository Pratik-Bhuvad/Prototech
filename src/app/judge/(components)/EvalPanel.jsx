'use client';
import { useState, useEffect } from "react";
import { EVAL_CATEGORIES, TOTAL_MAX } from "@/lib/constants";
import { submitEvaluation, fetchExistingEvaluation, sendEvaluationEmail } from "@/lib/judgeAuth";

// ── Chevron icon ──
const ChevronIcon = ({ open }) => (
    <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        className={`transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// ── Sub-criterion row: clickable score chips ──
function SubRow({ sub, value, onChange, disabled }) {
    const options = Array.from({ length: sub.max + 1 }, (_, i) => i);

    return (
        <div className="py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-start justify-between gap-4 mb-2">
                <p className={`mono text-xs leading-5 flex-1 ${disabled ? "text-gray-300" : "text-gray-600"}`}>{sub.label}</p>
                <span className="mono text-xs text-gray-400 shrink-0 mt-0.5">
                    {value === null ? "—" : value} / {sub.max}
                </span>
            </div>
            {/* Score chips */}
            <div className="flex gap-1.5 flex-wrap">
                {options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        disabled={disabled}
                        className={`w-8 h-8 mono text-xs font-bold border transition-all
              ${value === opt
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-500 hover:text-gray-900"
                            } ${disabled ? "opacity-50 cursor-not-allowed hover:border-gray-200 hover:text-gray-500" : ""}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Category accordion block ──
function CategoryBlock({ cat, subScores, onSubChange, isOpen, onToggle, error, disabled }) {
    // Sum of selected sub-scores (null = unselected)
    const filled = subScores.filter(v => v !== null);
    const subtotal = filled.reduce((s, v) => s + v, 0);
    const allDone = filled.length === cat.subcriteria.length;
    const pct = Math.round((subtotal / cat.max) * 100);

    return (
        <div className={`border transition-colors ${error ? "border-red-300" : "border-gray-200"} ${disabled ? "bg-gray-50" : ""}`}>
            {/* Header — click to expand */}
            <button
                type="button"
                onClick={onToggle}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-5 py-4 transition-colors text-left ${disabled ? "cursor-not-allowed" : "hover:bg-gray-50"}`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <ChevronIcon open={isOpen} />
                    <div>
                        <p className={`syne text-sm font-bold ${disabled ? "text-gray-400" : "text-gray-900"}`}>{cat.label}</p>
                        <p className={`mono text-xs mt-0.5 ${disabled ? "text-gray-300" : "text-gray-400"}`}>{cat.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                    {/* Mini progress bar */}
                    {allDone && (
                        <div className="w-16 h-1 bg-gray-100 overflow-hidden hidden sm:block">
                            <div
                                className="h-full transition-all"
                                style={{
                                    width: `${pct}%`,
                                    background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#374151"
                                }}
                            />
                        </div>
                    )}
                    <span className={`mono text-sm font-bold ${disabled ? "text-gray-300" : allDone ? "text-gray-900" : "text-gray-300"}`}>
                        {allDone ? subtotal : "—"}
                    </span>
                    <span className={`mono text-xs ${disabled ? "text-gray-300" : "text-gray-400"}`}>/ {cat.max}</span>
                </div>
            </button>

            {/* Sub-criteria list */}
            {isOpen && (
                <div className="px-5 pb-2 border-t border-gray-100" style={{ animation: "fadeUp 0.15s ease both" }}>
                    {cat.subcriteria.map((sub, si) => (
                        <SubRow
                            key={si}
                            sub={sub}
                            value={subScores[si]}
                            onChange={v => onSubChange(si, v)}
                            disabled={disabled}
                        />
                    ))}

                    {/* Subtotal row */}
                    <div className="flex items-center justify-between py-3 border-t border-gray-200 mt-1">
                        <span className={`mono text-xs tracking-widest uppercase ${disabled ? "text-gray-300" : "text-gray-400"}`}>
                            Category Subtotal
                        </span>
                        <span className={`syne text-sm font-extrabold ${disabled ? "text-gray-400" : "text-gray-900"}`}>
                            {allDone ? subtotal : "—"} / {cat.max}
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <p className="mono text-xs text-red-500 px-5 pb-3">✕ {error}</p>
            )}
        </div>
    );
}

// ── Main EvalPanel ──
export default function EvalPanel({ team, judge, onClose, onSaved, isEdit }) {
    // subScores: { [categoryKey]: [null, null, ...] } — one slot per sub-criterion
    const initSubScores = () =>
        Object.fromEntries(
            EVAL_CATEGORIES.map(cat => [
                cat.key,
                cat.subcriteria.map(() => null),
            ])
        );

    const [subScores, setSubScores] = useState(initSubScores);
    const [openCat, setOpenCat] = useState(EVAL_CATEGORIES[0].key);
    const [remarks, setRemarks] = useState("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");
    const [catErrors, setCatErrors] = useState({});
    const [loadingExisting, setLoadingExisting] = useState(isEdit);

    // Load existing scores if editing
    useEffect(() => {
        if (!isEdit) return;
        (async () => {
            const existing = await fetchExistingEvaluation(judge.id, team.id);
            if (!existing) { setLoadingExisting(false); return; }

            // Rebuild subScores from category totals
            // We stored only category totals — prefill first sub-criterion with total,
            // rest as 0, so judge can re-adjust. Mark all as "touched" so validation passes.
            const rebuilt = Object.fromEntries(
                EVAL_CATEGORIES.map(cat => {
                    const savedTotal = Number(existing[cat.key] || 0);
                    // Distribute: fill sub-criteria proportionally (best effort)
                    // so subtotal matches saved total
                    const subs = cat.subcriteria.map((sub, i) => {
                        if (i === 0) return Math.min(sub.max, savedTotal);
                        return 0;
                    });
                    // Adjust last sub to make total match if possible
                    const sumSoFar = subs.reduce((a, b) => a + b, 0);
                    const remaining = savedTotal - sumSoFar;
                    if (remaining > 0 && subs.length > 1) {
                        subs[subs.length - 1] = Math.min(
                            cat.subcriteria[cat.subcriteria.length - 1].max,
                            remaining
                        );
                    }
                    return [cat.key, subs];
                })
            );

            setSubScores(rebuilt);
            if (existing.remarks) setRemarks(existing.remarks);
            setLoadingExisting(false);
        })();
    }, []);

    // Compute category total from sub-scores (null = 0 if partially filled)
    const getCatTotal = (key) => {
        const subs = subScores[key];
        return subs.reduce((s, v) => s + (v ?? 0), 0);
    };

    const isCatComplete = (key) =>
        subScores[key].every(v => v !== null);

    const grandTotal = EVAL_CATEGORIES.reduce((s, cat) => s + getCatTotal(cat.key), 0);
    const completedCats = EVAL_CATEGORIES.filter(cat => isCatComplete(cat.key)).length;
    const allComplete = completedCats === EVAL_CATEGORIES.length;
    const pct = Math.round((grandTotal / TOTAL_MAX) * 100);

    const handleSubChange = (catKey, subIdx, val) => {
        // Prevent changes if already submitted
        if (isEdit) return;
        
        setSubScores(p => ({
            ...p,
            [catKey]: p[catKey].map((v, i) => i === subIdx ? val : v),
        }));
        // Clear category error when judge starts scoring
        setCatErrors(p => ({ ...p, [catKey]: "" }));
    };

    const validate = () => {
        const e = {};
        EVAL_CATEGORIES.forEach(cat => {
            if (!isCatComplete(cat.key)) {
                e[cat.key] = "All sub-criteria must be scored";
            }
        });
        return e;
    };

    const handleSubmit = async () => {
        const ve = validate();
        if (Object.keys(ve).length) {
            setCatErrors(ve);
            // Auto-open first incomplete category
            const firstErr = EVAL_CATEGORIES.find(cat => ve[cat.key]);
            if (firstErr) setOpenCat(firstErr.key);
            setErr("Please complete all categories before submitting.");
            return;
        }

        setSaving(true);
        setErr("");

        const categoryTotals = Object.fromEntries(
            EVAL_CATEGORIES.map(cat => [cat.key, getCatTotal(cat.key)])
        );

        const payload = {
            judge_id: judge.id,
            team_id: team.id,
            batch_id: team.batch_id,
            remarks: remarks.trim() || null,
            ...categoryTotals,
        };

        const { error } = await submitEvaluation(payload);
        if (error) { setErr(error); setSaving(false); return; }

        console.log("🎯 Calling sendEvaluationEmail for team:", team.name, "email:", team.email);
        const emailResult = await sendEvaluationEmail({
            teamName: team.name,
            teamEmail: team.email || null,
        });
        console.log("📧 Email result:", emailResult);

        onSaved(team.id);
        onClose();
    };

    return (
        <div className="border border-gray-200 bg-white" style={{ animation: "fadeUp 0.2s ease both" }}>

            {/* Loading existing scores */}
            {loadingExisting && (
                <div className="flex items-center justify-center py-16 gap-3">
                    <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    <p className="mono text-xs text-gray-400 tracking-widest uppercase">Loading previous scores...</p>
                </div>
            )}

            {!loadingExisting && <>

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="syne text-base font-extrabold text-gray-900">{team.name}</p>
                        <p className="mono text-xs text-gray-400 mt-0.5">{team.id} · {team.batchName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-gray-900 text-2xl leading-none transition-colors"
                    >
                        ×
                    </button>
                </div>

                {/* ── Score summary bar ── */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <p className="mono text-xs text-gray-400 tracking-widest uppercase">Total Score</p>
                            <span className="mono text-xs text-gray-400">
                                {completedCats}/{EVAL_CATEGORIES.length} categories done
                            </span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span
                                className="syne text-2xl font-extrabold transition-colors"
                                style={{ color: allComplete ? (pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#111") : "#9ca3af" }}
                            >
                                {grandTotal.toFixed(0)}
                            </span>
                            <span className="mono text-sm text-gray-400">/ {TOTAL_MAX}</span>
                        </div>
                    </div>
                    {/* Grand total progress bar */}
                    <div className="h-1.5 bg-gray-200 overflow-hidden">
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${(grandTotal / TOTAL_MAX) * 100}%`,
                                background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#2563eb" : "#374151"
                            }}
                        />
                    </div>
                </div>

                {/* ── Category accordions ── */}
                <div className="divide-y divide-gray-100">
                    {EVAL_CATEGORIES.map(cat => (
                        <CategoryBlock
                            key={cat.key}
                            cat={cat}
                            subScores={subScores[cat.key]}
                            onSubChange={(si, v) => handleSubChange(cat.key, si, v)}
                            isOpen={openCat === cat.key}
                            onToggle={() => setOpenCat(prev => prev === cat.key ? null : cat.key)}
                            error={catErrors[cat.key]}
                            disabled={isEdit}
                        />
                    ))}
                </div>

                {/* ── Remarks ── */}
                <div className="px-6 py-4 border-t border-gray-200">
                    <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-2">
                        Remarks <span className="normal-case text-gray-300">(optional)</span>
                    </label>
                    <textarea
                        value={remarks}
                        onChange={e => {
                            if (!isEdit) setRemarks(e.target.value);
                        }}
                        disabled={isEdit}
                        placeholder={isEdit ? "Your evaluation has been submitted and locked." : "Notes about this team's presentation, strengths, areas to improve..."}
                        rows={3}
                        className={`w-full px-3 py-2.5 border border-gray-200 outline-none text-sm mono resize-none transition-all ${
                            isEdit
                                ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-100"
                                : "bg-gray-50 focus:border-gray-900 focus:bg-white text-gray-700"
                        }`}
                    />
                </div>

                {/* ── Error ── */}
                {err && (
                    <div className="px-6 py-3 border-t border-gray-100 mono text-xs text-red-500">
                        ✕ {err}
                    </div>
                )}

                {/* ── Actions ── */}
                {isEdit ? (
                    <div className="px-6 py-4 border-t border-gray-200 bg-blue-50 border-t-blue-100">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 mt-1 shrink-0 text-lg">✓</div>
                            <div>
                                <p className="mono text-xs text-blue-800 tracking-widest uppercase font-semibold mb-1">Evaluation Submitted</p>
                                <p className="mono text-xs text-blue-700 leading-5">
                                    Your evaluation for <strong>{team.name}</strong> has been locked and cannot be modified. 
                                    The team has been notified of their evaluation completion via email.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-3 w-full px-5 py-2 border border-blue-300 text-blue-700 mono text-xs tracking-widest uppercase hover:bg-blue-100 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="px-6 py-4 border-t border-gray-200 flex gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex-1 py-3 bg-gray-900 text-white mono text-xs tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving
                                ? <><span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Submitting...</>
                                : `Submit Scores → ${grandTotal}/${TOTAL_MAX}`
                            }
                        </button>
                        <button
                            onClick={onClose}
                            className="px-5 py-3 border border-gray-200 mono text-xs text-gray-500 tracking-widest uppercase hover:border-gray-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </>}
        </div>
    );
}