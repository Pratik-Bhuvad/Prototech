import { QRCodeCanvas as QRCode } from "qrcode.react";

export default function QRModal({ team, batchName, onClose }) {
    const url = typeof window !== "undefined"
        ? `${window.location.origin}/judge?team=${team.id}`
        : `/judge?team=${team.id}`;

    const handlePrint = () => {
        const win = window.open("", "_blank");
        win.document.write(`
            <html><head><title>QR - ${team.name}</title>
            <style>
                body { font-family: monospace; display: flex; flex-direction: column; align-items: center;
                       justify-content: center; min-height: 100vh; margin: 0; background: white; }
                h2   { font-size: 20px; margin-bottom: 4px; }
                p    { font-size: 13px; color: #888; margin: 0 0 20px; }
                small{ margin-top: 16px; font-size: 11px; color: #aaa; }
            </style></head>
            <body>
                <h2>${team.name}</h2>
                <p>${team.id} · ${batchName}</p>
                <div id="qr"></div>
                <small>${url}</small>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                <script>
                    new QRCode(document.getElementById("qr"), {
                        text: "${url}", width: 256, height: 256,
                        correctLevel: QRCode.CorrectLevel.H
                    });
                    setTimeout(() => window.print(), 800);
                </script>
            </body></html>
        `);
        win.document.close();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
        >
            <div
                className="bg-white border border-gray-200 shadow-2xl w-full max-w-xs"
                style={{ animation: "fadeUp 0.2s ease both" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <p className="syne text-sm font-extrabold text-gray-900">{team.name}</p>
                        <p className="mono text-xs text-gray-400">{team.id} · {batchName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-900 text-xl transition-colors">×</button>
                </div>

                {/* QR */}
                <div className="flex flex-col items-center px-5 py-6 gap-4">
                    <div className="border-4 border-gray-900 p-3">
                        <QRCode value={url} size={180} level="H" includeMargin={false} />
                    </div>
                    <div className="text-center">
                        <p className="mono text-xs text-gray-400 tracking-widest uppercase">Scan to Evaluate</p>
                        <p className="mono text-xs text-gray-300 mt-1 break-all">{url}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-5 pb-5 flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-2.5 bg-gray-900 text-white mono text-xs tracking-widest uppercase hover:bg-black transition-colors"
                    >
                        Print / Save
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 border border-gray-200 mono text-xs text-gray-500 tracking-widest uppercase hover:border-gray-400 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export function BulkQRModal({ batch, teams, onClose }) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const handlePrintAll = () => {
        const win = window.open("", "_blank");
        const cards = teams.map(t => {
            const url = `${origin}/judge?team=${t.id}`;
            return `
                <div class="card">
                    <div class="header">
                        <h2>${t.name}</h2>
                        <p>${t.id} · ${batch.name}</p>
                    </div>
                    <div id="qr-${t.id}" class="qr-wrap"></div>
                    <small>${url}</small>
                </div>
                <script>
                    new QRCode(document.getElementById("qr-${t.id}"), {
                        text: "${url}", width: 180, height: 180,
                        correctLevel: QRCode.CorrectLevel.H
                    });
                </script>
            `;
        }).join("");

        win.document.write(`
            <html>
            <head>
                <title>QR Codes — ${batch.name}</title>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body  { font-family: monospace; background: white; padding: 20px; }
                    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
                    .card { border: 1px solid #ddd; padding: 16px; text-align: center; break-inside: avoid; }
                    .header h2  { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
                    .header p   { font-size: 11px; color: #888; margin-bottom: 12px; }
                    .qr-wrap    { display: flex; justify-content: center; margin-bottom: 10px; }
                    small       { font-size: 9px; color: #bbb; word-break: break-all; }
                    .toolbar    { margin-bottom: 16px; display: flex; align-items: center; gap: 12px; }
                    .toolbar strong { font-size: 14px; }
                    .toolbar button { padding: 6px 16px; background: #111; color: #fff; border: none;
                                      cursor: pointer; font-family: monospace; font-size: 11px;
                                      text-transform: uppercase; letter-spacing: 0.1em; }
                    @media print { .toolbar { display: none; } }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <strong>${batch.name} — ${teams.length} QR Codes</strong>
                    <button onclick="window.print()">Print</button>
                </div>
                <div class="grid">${cards}</div>
            </body>
            </html>
        `);
        win.document.close();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
        >
            <div
                className="bg-white border border-gray-200 shadow-2xl w-full max-w-sm"
                style={{ animation: "fadeUp 0.2s ease both" }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div>
                        <p className="syne text-sm font-extrabold text-gray-900">Bulk QR Export</p>
                        <p className="mono text-xs text-gray-400">{batch.name} · {teams.length} teams</p>
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-900 text-xl transition-colors">×</button>
                </div>

                {/* Team preview list */}
                <div className="px-5 py-4 border-b border-gray-100 max-h-52 overflow-y-auto space-y-1">
                    {teams.map(t => (
                        <div key={t.id} className="flex items-center gap-2 py-1">
                            <span className="mono text-xs text-gray-400 flex-shrink-0">{t.id}</span>
                            <span className="mono text-xs text-gray-700 truncate">{t.name}</span>
                            <span className="ml-auto mono text-xs text-gray-300 flex-shrink-0 hidden sm:block">
                                ?team={t.id}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="px-5 py-4 flex gap-2">
                    <button
                        onClick={handlePrintAll}
                        className="flex-1 py-2.5 bg-gray-900 text-white mono text-xs tracking-widest uppercase hover:bg-black transition-colors"
                    >
                        Open Print Sheet
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 border border-gray-200 mono text-xs text-gray-500 tracking-widest uppercase hover:border-gray-400 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}