'use client';

import { useState, useEffect, useRef } from "react";
import { fetchTeams, deleteTeam, importTeams, fetchTeamsWithBatch } from "@/lib/db";
import { parseCSV, validateCSVFile } from "@/lib/validation";
import { TrashIcon, UploadIcon } from "./Icons";

export default function TeamsTab({ teams, setTeams }) {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success
  const [imported, setImported] = useState(false);
  const fileRef = useRef();

  // Fetch teams on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await fetchTeams();
      setLoading(false);
      if (error) {
        console.error(error);
        return;
      }
      if (data?.length) {
        setTeams(data);
        setImported(true);
      }
    })();
  }, []);

  const processFile = (file) => {
    setError("");

    const fileValidation = validateCSVFile(file);
    if (fileValidation.error) {
      setError(fileValidation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const parsed = parseCSV(e.target.result);
      if (!parsed.length) {
        setError("CSV is empty or format is incorrect.");
        return;
      }

      setStatus("loading");
      try {
        const { error: importErr } = await importTeams(parsed);
        if (importErr) throw importErr;

        setTeams(parsed);
        setImported(true);
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2500);
      } catch (err) {
        setError("Upload failed: " + err.message);
        setStatus("idle");
      }
    };
    reader.readAsText(file);
  };

  const removeTeam = async (id) => {
    await deleteTeam(id);
    setTeams((p) => p.filter((t) => t.id !== id));
  };

  const reset = async () => {
    await importTeams([]);
    setTeams([]);
    setImported(false);
    setError("");
    setStatus("idle");
    if (fileRef.current) fileRef.current.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            <p className="mono text-xs text-gray-400 tracking-widest uppercase">Fetching teams...</p>
          </div>
        </div>
      ) : !imported ? (
        <div className="mb-6">
          <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-4">
            Import Teams via CSV
          </p>
          <div
            onClick={() => status !== "loading" && fileRef.current.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 py-16 transition-all select-none
              ${status === "loading"
                ? "border-gray-200 bg-gray-50 pointer-events-none"
                : dragOver
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-400 hover:bg-gray-50/60"
              }`}
          >
            {status === "loading" ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                <p className="mono text-xs text-gray-400 tracking-widest uppercase">
                  Uploading to Supabase...
                </p>
              </>
            ) : (
              <>
                <span className={dragOver ? "text-gray-900" : "text-gray-300"}>
                  <UploadIcon />
                </span>
                <div className="text-center">
                  <p className="syne text-sm font-bold text-gray-700">Drop your CSV here</p>
                  <p className="mono text-xs text-gray-400 mt-1">or click to browse files</p>
                </div>
                <span className="mono text-xs text-gray-300 tracking-widest uppercase border border-gray-200 px-3 py-1">
                  .csv only
                </span>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={(e) => processFile(e.target.files[0])}
            className="hidden"
          />
          {error && <p className="mono text-xs text-red-500 mt-3">✕ {error}</p>}
          <div className="mt-4 border border-gray-100 bg-gray-50 px-5 py-4">
            <p className="mono text-xs text-gray-400 tracking-widest uppercase mb-2.5">
              Expected CSV format
            </p>
            <code className="mono text-xs text-gray-500 block leading-6 whitespace-pre">{`id,name,domain,project title, email\nT-001,ByteForge,AI / ML,Project Title 1,leader@example.com\nT-002,NovaSpark,Web3 / DeFi,Project Title 2,nova@example.com`}</code>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <p className="mono text-xs text-gray-400 tracking-widest uppercase">
              {teams.length} Teams in Supabase
            </p>
            {status === "success" && <span className="mono text-xs text-emerald-600">✓ Synced</span>}
          </div>
          <button
            onClick={reset}
            className="mono text-xs text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-1.5 tracking-widest uppercase transition-colors"
          >
            ↺ Re-import
          </button>
        </div>
      )}

      {teams.length > 0 && (
        <div className="border border-gray-200 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Team ID", "Name", "Domain", "Project Title", "Email", "Batch", "Remove"].map((h, i) => (
                  <th key={h} className={`mono text-xs text-gray-400 tracking-widest uppercase px-5 py-3 font-medium ${i === 6 ? "text-right" : "text-left"} ${i === 2 || i === 3 || i === 4 || i === 5 ? "hidden sm:table-cell" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => (
                <tr
                  key={t.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  style={{ animation: `fadeUp 0.2s ease ${i * 0.025}s both` }}
                >
                  <td className="mono text-xs text-gray-400 px-5 py-3.5">{t.id}</td>
                  <td className="px-5 py-3.5 syne text-sm font-semibold text-gray-900">{t.name}</td>
                  <td className="mono text-xs text-gray-500 px-5 py-3.5 hidden sm:table-cell">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs">{t.domain}</span>
                  </td>
                  <td className="mono text-xs text-gray-500 px-5 py-3.5 hidden sm:table-cell">
                    {t.projectTitle
                      ? <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs">{t.projectTitle}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="mono text-xs text-gray-500 px-5 py-3.5 hidden sm:table-cell">
                    {t.email
                      ? <a href={`mailto:${t.email}`} className="hover:text-gray-900 transition-colors">{t.email}</a>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="mono text-xs text-gray-500 px-5 py-3.5 hidden sm:table-cell">
                    {t.batch_id
                      ? <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs">{t.batch_id}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => removeTeam(t.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><TrashIcon /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
