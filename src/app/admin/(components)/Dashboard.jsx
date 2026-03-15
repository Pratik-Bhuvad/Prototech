'use client';

import { useState } from "react";
import { TABS } from "@/lib/constants";
import TeamsTab from "./TeamsTab";
import JudgesTab from "./JudgesTab";
import BatchTab from "./BatchTab";
import ResultsTab from "./ResultsTab";

export default function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("teams");
  const [judges, setJudges] = useState([]);
  const [teams, setTeams] = useState([]);

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% 0%,rgba(210,210,255,.12) 0%,transparent 60%),linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)",
        backgroundSize: "100% 100%,44px 44px,44px 44px",
      }}
    >
      <main className="pt-4 pb-16 px-4 sm:px-6 max-w-6xl mx-auto">

        {/* Tab bar */}
        <div
          className="flex flex-col md:flex-row lg:items-center border-b border-gray-200 mb-7"
          style={{ animation: "fadeUp 0.4s ease 0.1s both" }}
        >
          <div className="flex">
            {TABS.filter((t) => !t.right).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`cursor-pointer mono text-xs tracking-widest uppercase px-5 py-3 border-b-2 transition-all ${
                  activeTab === t.key
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex flex-1" />
          <div className="flex md:flex-row flex-col gap-0 lg:gap-0 mt-3 lg:mt-0 border-t lg:border-t-0 border-gray-200">
            {TABS.filter((t) => t.right).map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`cursor-pointer mono text-xs tracking-widest uppercase px-5 py-3 border-b-2 transition-all ${
                  activeTab === t.key
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div key={activeTab} style={{ animation: "fadeUp 0.3s ease both" }}>
          {activeTab === "teams" && <TeamsTab teams={teams} setTeams={setTeams} />}
          {activeTab === "judges" && <JudgesTab judges={judges} setJudges={setJudges} />}
          {activeTab === "batch" && <BatchTab judges={judges} />}
          {activeTab === "results" && <ResultsTab />}
        </div>
      </main>
    </div>
  );
}
