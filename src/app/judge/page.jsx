// pages/judge.js
'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { restoreJudgeSession } from "@/lib/judgeAuth";

// Dynamically imported to avoid SSR issues with localStorage
const JudgeLoginForm = dynamic(() => import("./(components)/LoginForm"), { ssr: false });
const TeamList       = dynamic(() => import("./(components)/TeamList"),       { ssr: false });

export default function JudgePage() {
  const [judge,    setJudge]    = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    restoreJudgeSession().then(j => {
      if (j) setJudge(j);
      setChecking(false);
    });
  }, []);

  if (checking) return (
    <div className="min-h-screen bg-white flex items-center justify-center gap-3">
      <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .syne { font-family: 'Syne', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {judge
        ? <TeamList       judge={judge}  onLogout={() => setJudge(null)} />
        : <JudgeLoginForm onLogin={setJudge} />
      }
    </>
  );
}