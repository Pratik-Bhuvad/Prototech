'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import { restoreJudgeSession } from "@/lib/judgeAuth";

const JudgeLoginForm = dynamic(() => import("./(components)/LoginForm"), { ssr: false });
const TeamList       = dynamic(() => import("./(components)/TeamList"),       { ssr: false });

export default function JudgePage() {
    const router                    = useRouter();
    const searchParams              = useSearchParams();
    const [judge, setJudge]         = useState(null);
    const [checking, setChecking]   = useState(true);
    const [targetTeam, setTargetTeam] = useState(null); // team_id from QR scan

    // Read ?team= param from URL
    useEffect(() => {
        const t = searchParams.get("team");
        if (t) setTargetTeam(t);
    }, [searchParams]);

    // Restore session
    useEffect(() => {
        restoreJudgeSession().then(j => {
            if (j) setJudge(j);
            setChecking(false);
        });
    }, []);

    const handleLogin = (j) => {
        setJudge(j);
        // Keep ?team= param in URL after login
    };

    const handleLogout = () => {
        setJudge(null);
        setTargetTeam(null);
        router.replace("/judge");
    };

    if (checking) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
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
                @keyframes growBar { from { width: 0 !important; } }
            `}</style>
            <Navbar />
            {judge
                ? <TeamList judge={judge} onLogout={handleLogout} autoOpenTeamId={targetTeam} />
                : <JudgeLoginForm onLogin={handleLogin} pendingTeamId={targetTeam} />
            }
        </>
    );
}