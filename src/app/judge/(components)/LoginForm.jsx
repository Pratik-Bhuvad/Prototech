'use client';

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, ShieldIcon } from "./Icons";

export default function JudgeLoginForm({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loginErr, setLoginErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = "Username is required.";
    if (!form.password) e.password = "Password is required.";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length) {
      setErrors(ve);
      return;
    }

    setLoading(true);
    setLoginErr("");

    const { judgeLogin } = await import("@/lib/judgeAuth");
    const { judge, error } = await judgeLogin(form.username, form.password);

    if (error) {
      setLoginErr(error);
    } else {
      onLogin(judge);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-[calc(100vh-56px)] w-screen bg-white flex items-center justify-center px-4"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 50% at 50% 44%, rgba(210,210,255,0.15) 0%, transparent 70%), linear-gradient(rgba(0,0,0,0.045) 1px,transparent 1px), linear-gradient(90deg,rgba(0,0,0,0.045) 1px,transparent 1px)",
        backgroundSize: "100% 100%, 44px 44px, 44px 44px",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-12 flex justify-start">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeftIcon />
          </Link>
        </div>
        <div className="mb-9 text-center">
          <div className="flex justify-center mb-4">
            <ShieldIcon />
          </div>
          <h1 className="syne text-3xl font-extrabold text-gray-900 tracking-tight">Judge Access</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Username */}
          <div>
            <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={form.username}
              autoComplete="username"
              onChange={(e) => {
                setForm((p) => ({ ...p, username: e.target.value }));
                setErrors((p) => ({ ...p, username: "" }));
                setLoginErr("");
              }}
              placeholder="your_username"
              className={`w-full px-4 py-3 border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all mono ${
                errors.username
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white"
              }`}
            />
            {errors.username && <p className="mono text-xs text-red-500 mt-1.5">✕ {errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                autoComplete="current-password"
                onChange={(e) => {
                  setForm((p) => ({ ...p, password: e.target.value }));
                  setErrors((p) => ({ ...p, password: "" }));
                  setLoginErr("");
                }}
                placeholder="••••••••"
                className={`w-full px-4 py-3 pr-14 border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all mono ${
                  errors.password
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white"
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 mono text-xs text-gray-400 hover:text-gray-700 uppercase tracking-widest transition-colors"
              >
                {showPw ? "hide" : "show"}
              </button>
            </div>
            {errors.password && <p className="mono text-xs text-red-500 mt-1.5">✕ {errors.password}</p>}
          </div>

          {loginErr && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 mono text-xs text-red-600">
              ✕ {loginErr}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 py-3.5 bg-gray-900 text-white mono text-xs tracking-widest uppercase font-medium hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              "Sign In →"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}