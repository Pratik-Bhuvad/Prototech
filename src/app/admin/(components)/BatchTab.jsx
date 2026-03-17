'use client';
import { supabase } from "@/lib/supabase";

import { useState, useEffect } from "react";
import {
    fetchBatches,
    fetchTeamsWithBatch,
    createBatch,
    assignBatchToTeams,
    updateTeamsBatch,
    assignJudgeToBatch,
    deleteBatch,
} from "@/lib/db";
import { validateBatchForm } from "@/lib/validation";
import { TrashIcon, PrintIcon, QrIcon } from "./Icons";
import QRModal, { BulkQRModal } from "./Qr";

export default function BatchTab({ judges }) {
    const [batches, setBatches] = useState([]);
    const [teams, setTeams] = useState([]);
    const [form, setForm] = useState({ name: "", mode: "serial", selectedTeams: [], serialFrom: "", serialTo: "" });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [qrTeam, setQrTeam] = useState(null);
    const [bulkBatch, setBulkBatch] = useState(null);

    // Load batches + teams on mount
    useEffect(() => {
        (async () => {
            const [{ data: bData }, { data: tData }] = await Promise.all([
                fetchBatches(),
                fetchTeamsWithBatch(),
            ]);
            if (bData) setBatches(bData);
            if (tData) setTeams(tData);
        })();
    }, []);

    const resolveTeamIds = () => {
        if (form.mode === "manual") return form.selectedTeams;
        const from = parseInt(form.serialFrom);
        const to = parseInt(form.serialTo);
        if (isNaN(from) || isNaN(to)) return [];
        return unassignedTeams
            .filter((_, idx) => { const pos = idx + 1; return pos >= from && pos <= to; })
            .map(t => t.id);
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Required";
        const resolved = resolveTeamIds();
        if (!resolved.length) {
            e.teams = form.mode === "serial"
                ? "No unassigned teams found in that range"
                : "Select at least one team";
        }
        return e;
    };

    const handleCreate = async () => {
        const teamIds = resolveTeamIds();
        const e = validate();
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);

        const newBatch = {
            id: `B-${String(batches.length + 1).padStart(3, "0")}`,
            name: form.name.trim(),
            judge_id: null,
        };

        const { error: bErr } = await createBatch(newBatch);
        if (bErr) {
            setErrors({ name: "Save failed: " + bErr.message });
            setSaving(false);
            return;
        }

        const { data: updated, error: tErr } = await updateTeamsBatch(teamIds, newBatch.id);
        if (tErr) {
            setErrors({ name: "Batch created but team assignment failed: " + tErr.message });
            setSaving(false);
            return;
        }

        console.log("Teams assigned to batch:", updated);

        // Refresh full teams list
        const { data: tData } = await fetchTeamsWithBatch();
        if (tData) setTeams(tData);

        setBatches(p => [...p, newBatch]);
        setForm({ name: "", mode: form.mode, selectedTeams: [], serialFrom: "", serialTo: "" });
        setErrors({});
        setSaving(false);
    };


    const assignJudge = async (batchId, judgeId) => {
        await assignJudgeToBatch(batchId, judgeId);
        setBatches((p) => p.map((b) => (b.id === batchId ? { ...b, judge_id: judgeId } : b)));
    };

    const removeBatch = async (id) => {
        await deleteBatch(id);
        setBatches((p) => p.filter((b) => b.id !== id));
        setTeams((p) => p.map((t) => (t.batch_id === id ? { ...t, batch_id: null } : t)));
    };

    const toggleTeam = (id) => {
        setForm((p) => ({
            ...p,
            selectedTeams: p.selectedTeams.includes(id)
                ? p.selectedTeams.filter((t) => t !== id)
                : [...p.selectedTeams, id],
        }));
        setErrors((p) => ({ ...p, teams: "" }));
    };

    // Teams not yet assigned to any batch
    const unassignedTeams = teams.filter((t) => !t.batch_id);

    const ch = (f) => (ev) => {
        setForm((p) => ({ ...p, [f]: ev.target.value }));
        setErrors((p) => ({ ...p, [f]: "" }));
    };



    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT - Form */}
            <div className="lg:w-80 flex-shrink-0">
                <div className="border border-gray-200 bg-white p-5 sticky top-24">
                    <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-5">New Batch</p>
                    <div className="space-y-4">

                        {/* Batch name */}
                        <div>
                            <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-1.5">Batch Name</label>
                            <input value={form.name} onChange={ch("name")} placeholder="Morning Slot"
                                className={`w-full px-3 py-2.5 border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all mono
                        ${errors.name ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white"}`} />
                            {errors.name && <p className="mono text-xs text-red-500 mt-1">✕ {errors.name}</p>}
                        </div>

                        {/* Mode toggle */}
                        <div>
                            <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-2">Selection Mode</label>
                            <div className="grid grid-cols-2 border border-gray-200">
                                <button type="button"
                                    onClick={() => { setForm(p => ({ ...p, mode: "serial", selectedTeams: [], serialFrom: "", serialTo: "" })); setErrors({}); }}
                                    className={`py-2 mono text-xs tracking-widest uppercase transition-colors ${form.mode === "serial" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-700"}`}>
                                    Serial
                                </button>
                                <button type="button"
                                    onClick={() => { setForm(p => ({ ...p, mode: "manual", selectedTeams: [], serialFrom: "", serialTo: "" })); setErrors({}); }}
                                    className={`py-2 mono text-xs tracking-widest uppercase transition-colors border-l border-gray-200 ${form.mode === "manual" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-700"}`}>
                                    Manual
                                </button>
                            </div>
                        </div>

                        {/* Serial mode — range inputs */}
                        {form.mode === "serial" && (
                            <div>
                                <label className="mono block text-xs text-gray-500 tracking-widests uppercase mb-2">
                                    Team Range
                                    <span className="ml-1 normal-case text-gray-300">({unassignedTeams.length} unassigned)</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number" min="1" value={form.serialFrom}
                                        onChange={e => { setForm(p => ({ ...p, serialFrom: e.target.value })); setErrors(p => ({ ...p, teams: "" })); }}
                                        placeholder="From"
                                        className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white outline-none mono text-sm text-gray-900 placeholder-gray-300 transition-all" />
                                    <span className="mono text-xs text-gray-400 flex-shrink-0">to</span>
                                    <input
                                        type="number" min="1" value={form.serialTo}
                                        onChange={e => { setForm(p => ({ ...p, serialTo: e.target.value })); setErrors(p => ({ ...p, teams: "" })); }}
                                        placeholder="To"
                                        className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white outline-none mono text-sm text-gray-900 placeholder-gray-300 transition-all" />
                                </div>
                                {/* Preview */}
                                {form.serialFrom && form.serialTo && (() => {
                                    const from = parseInt(form.serialFrom);
                                    const to = parseInt(form.serialTo);
                                    const preview = unassignedTeams.filter((_, idx) => {
                                        const pos = idx + 1;
                                        return pos >= from && pos <= to;
                                    });
                                    return preview.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {preview.map(t => (
                                                <span key={t.id} className="mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5">{t.id}</span>
                                            ))}
                                            <span className="mono text-xs text-gray-400">({preview.length} teams)</span>
                                        </div>
                                    ) : (
                                        <p className="mono text-xs text-gray-300 mt-2">No unassigned teams in that range</p>
                                    );
                                })()}
                                {errors.teams && <p className="mono text-xs text-red-500 mt-1">✕ {errors.teams}</p>}
                            </div>
                        )}

                        {/* Manual mode — checkbox list */}
                        {form.mode === "manual" && (
                            <div>
                                <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-2">
                                    Pick Teams
                                    <span className="ml-1 normal-case text-gray-300">(unassigned only)</span>
                                </label>
                                {unassignedTeams.length === 0 ? (
                                    <p className="mono text-xs text-gray-300 py-2">All teams already assigned</p>
                                ) : (
                                    <div className="border border-gray-200 max-h-52 overflow-y-auto">
                                        {unassignedTeams.map(t => (
                                            <label key={t.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                                                <input type="checkbox"
                                                    checked={form.selectedTeams.includes(t.id)}
                                                    onChange={() => toggleTeam(t.id)}
                                                    className="accent-gray-900" />
                                                <span className="mono text-xs text-gray-700 flex-shrink-0">{t.id}</span>
                                                <span className="mono text-xs text-gray-400 truncate">{t.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {form.selectedTeams.length > 0 && (
                                    <p className="mono text-xs text-gray-400 mt-2">{form.selectedTeams.length} team{form.selectedTeams.length !== 1 ? "s" : ""} selected</p>
                                )}
                                {errors.teams && <p className="mono text-xs text-red-500 mt-1">✕ {errors.teams}</p>}
                            </div>
                        )}

                        <button onClick={handleCreate} disabled={saving}
                            className="w-full py-2.5 bg-gray-900 text-white mono text-xs tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving ? <><span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : "Create Batch"}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT - List */}
            {/* RIGHT - List */}
            <div className="flex-1 min-w-0">
                <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-4">
                    {batches.length} Batch{batches.length !== 1 ? "es" : ""} in Supabase
                </p>

                {batches.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 py-16 flex flex-col items-center justify-center gap-2">
                        <p className="mono text-xs text-gray-300 tracking-widest uppercase">No batches yet</p>
                        <p className="mono text-xs text-gray-300">Fill the form and click Create Batch</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {batches.map((b, i) => {
                            const batchTeams = teams.filter(t => t.batch_id === b.id);
                            const assignedJudge = judges.find(j => j.id === b.judge_id);

                            return (
                                <div
                                    key={b.id}
                                    className="border border-gray-200 bg-white p-4 hover:border-gray-300 transition-all"
                                    style={{ animation: `fadeUp 0.25s ease ${i * 0.05}s both` }}
                                >
                                    {/* Batch header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="mono text-xs text-gray-300 mr-2">{b.id}</span>
                                            <span className="syne text-sm font-bold text-gray-900">{b.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {/* Bulk QR print button — only if teams exist */}
                                            {batchTeams.length > 0 && (
                                                <button
                                                    onClick={() => setBulkBatch({ batch: b, teams: batchTeams })}
                                                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                    title="Print all QR codes for this batch"
                                                >
                                                    <PrintIcon />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => removeBatch(b.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Team chips — each clickable for individual QR */}
                                    <div className="flex flex-wrap gap-1.5 mb-3 min-h-6">
                                        {batchTeams.length === 0 ? (
                                            <span className="mono text-xs text-gray-300">No teams assigned</span>
                                        ) : (
                                            batchTeams.map(t => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setQrTeam({ ...t, batch_id: b.id })}
                                                    className="mono text-xs bg-gray-100 hover:bg-gray-900 hover:text-white text-gray-600 px-2 py-0.5 transition-colors flex items-center gap-1"
                                                    title="Click to view QR code"
                                                >
                                                    <QrIcon /> {t.id} — {t.name} {t.projectTitle && `(${t.projectTitle})`}
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    {/* Judge assignment dropdown */}
                                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                                        <span className="mono text-xs text-gray-400 tracking-widest uppercase flex-shrink-0">Judge</span>
                                        <select
                                            value={b.judge_id || ""}
                                            onChange={e => assignJudge(b.id, e.target.value)}
                                            className="flex-1 mono text-xs text-gray-700 border border-gray-200 bg-gray-50 px-2.5 py-1.5 outline-none focus:border-gray-900 transition-colors"
                                        >
                                            <option value="">— Assign a judge —</option>
                                            {judges.length === 0
                                                ? <option disabled>No judges yet — create in Judges tab</option>
                                                : judges.map(j => (
                                                    <option key={j.id} value={j.id}>
                                                        {j.displayName || j.display_name} (@{j.username})
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        {assignedJudge && (
                                            <span className="mono text-xs text-emerald-600 flex-shrink-0">✓ Assigned</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Individual QR modal */}
            {qrTeam && (
                <QRModal
                    team={qrTeam}
                    batchName={batches.find(b => b.id === qrTeam.batch_id)?.name || "—"}
                    onClose={() => setQrTeam(null)}
                />
            )}

            {/* Bulk QR modal */}
            {bulkBatch && (
                <BulkQRModal
                    batch={bulkBatch.batch}
                    teams={bulkBatch.teams}
                    onClose={() => setBulkBatch(null)}
                />
            )}
        </div>
    );
}
