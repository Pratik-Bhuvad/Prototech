'use client';

import { useState } from "react";
import Link from "next/link";
import { ADMIN_ID } from "@/lib/supabase";
import { validateLoginForm } from "@/lib/validation";
import { loginAdmin } from "@/lib/db";
import { ArrowLeftIcon, ShieldIcon } from "./Icons";

export default function LoginForm({ onLogin }) {
  const [form, setForm] = useState({ id: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loginErr, setLoginErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validateLoginForm(form, ADMIN_ID);
    
    if (Object.keys(ve).length) {
      setErrors(ve);
      return;
    }

    setLoading(true);
    setLoginErr("");

    const { error } = await loginAdmin(form.password);
    console.log("Supabase login error:", error);

    if (error) {
      setLoginErr("Invalid credentials. Please try again.");
    } else {
      onLogin();
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
          <h1 className="syne text-3xl font-extrabold text-gray-900 tracking-tight">Admin Access</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Admin ID */}
          <div>
            <label className="mono block text-xs text-gray-500 tracking-widest uppercase mb-1.5">
              Admin ID
            </label>
            <input
              type="text"
              value={form.id}
              autoComplete="username"
              onChange={(e) => {
                setForm((p) => ({ ...p, id: e.target.value }));
                setErrors((p) => ({ ...p, id: "" }));
                setLoginErr("");
              }}
              placeholder="e.g. admin001"
              className={`w-full px-4 py-3 border text-sm text-gray-900 placeholder-gray-300 outline-none transition-all mono ${
                errors.id
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white"
              }`}
            />
            {errors.id && <p className="mono text-xs text-red-500 mt-1.5">✕ {errors.id}</p>}
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
