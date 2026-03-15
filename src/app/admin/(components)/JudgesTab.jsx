'use client';

import { useState, useEffect } from "react";
import { fetchJudges, createJudge, deleteJudge } from "@/lib/db";
import { validateJudgeForm } from "@/lib/validation";
import { TrashIcon } from "./Icons";

export default function JudgesTab({ judges, setJudges }) {
  const [form, setForm] = useState({ displayName: "", username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load judges from Supabase on mount
  useEffect(() => {
    (async () => {
      const { data } = await fetchJudges();
      if (data?.length) {
        setJudges(data.map((j) => ({ ...j, displayName: j.display_name })));
      }
    })();
  }, []);

  const handleCreate = async () => {
    const e = validateJudgeForm(form, judges);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setSaving(true);
    const newJudge = {
      id: `J-${String(judges.length + 1).padStart(3, "0")}`,
      display_name: form.displayName.trim(),
      username: form.username.trim(),
      password: form.password,
    };

    const { error } = await createJudge(newJudge);
    if (error) {
      setErrors({ displayName: "Save failed: " + error.message });
      setSaving(false);
      return;
    }

    setJudges((p) => [...p, { ...newJudge, displayName: newJudge.display_name }]);
    setForm({ displayName: "", username: "", password: "" });
    setErrors({});
    setSaving(false);
  };

  const removeJudge = async (id) => {
    await deleteJudge(id);
    setJudges((p) => p.filter((j) => j.id !== id));
  };

  const ch = (f) => (ev) => {
    setForm((p) => ({ ...p, [f]: ev.target.value }));
    setErrors((p) => ({ ...p, [f]: "" }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT - Form */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="border border-gray-200 bg-white p-5 sticky top-24">
          <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-5">New Judge</p>
          <div className="space-y-4">
            {[
              {
                key: "displayName",
                label: "Display Name",
                placeholder: "Dr. Arya Mehta",
                type: "text",
              },
              { key: "username", label: "Username", placeholder: "arya_mehta", type: "text" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={ch(key)}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2.5 border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all mono
                    ${
                      errors[key]
                        ? "border-red-400 bg-red-50"
                        : "border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white"
                    }`}
                />
                {errors[key] && <p className="mono text-xs text-red-500 mt-1">✕ {errors[key]}</p>}
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={ch("password")}
                placeholder="••••••••"
                className={`w-full px-3 py-2.5 border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all mono
                  ${
                    errors.password
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white"
                  }`}
              />
              {errors.password && (
                <p className="mono text-xs text-red-500 mt-1">✕ {errors.password}</p>
              )}
            </div>

            <button
              onClick={handleCreate}
              disabled={saving}
              className="w-full py-2.5 bg-gray-900 text-white mono text-xs tracking-widest uppercase hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="inline-block w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Create Judge"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT - List */}
      <div className="flex-1 min-w-0">
        <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-4">
          {judges.length} Judge{judges.length !== 1 ? "s" : ""} in Supabase
        </p>
        {judges.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 py-16 flex flex-col items-center justify-center gap-2">
            <p className="mono text-xs text-gray-300 tracking-widest uppercase">No judges yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {judges.map((j, i) => (
              <div
                key={j.id}
                className="border border-gray-200 bg-white px-4 py-3.5 flex items-center justify-between hover:border-gray-300 transition-all"
                style={{ animation: `fadeUp 0.25s ease ${i * 0.05}s both` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="syne font-bold text-gray-500 text-sm">
                      {(j.displayName || j.display_name || "?").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="syne text-sm font-semibold text-gray-900 truncate">
                      {j.displayName || j.display_name}
                    </p>
                    <p className="mono text-xs text-gray-400 truncate">@{j.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <span className="mono text-xs text-gray-300 hidden sm:block">{j.id}</span>
                  <button
                    onClick={() => removeJudge(j.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
