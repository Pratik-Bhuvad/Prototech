'use client';

import { useState, useEffect } from "react";
import { fetchEvaluationNotifications } from "@/lib/db";

export default function NotificationsTab() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTeam, setFilterTeam] = useState("all"); // all | team | judge

    useEffect(() => {
        (async () => {
            const { data, error } = await fetchEvaluationNotifications();
            if (error) {
                console.error("Failed to load notifications:", error);
                setLoading(false);
                return;
            }
            
            setNotifications(data || []);
            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        let filtered = notifications;

        // Filter by search term (team name or judge name)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(n => 
                n.teams?.name?.toLowerCase().includes(term) ||
                n.judges?.display_name?.toLowerCase().includes(term)
            );
        }

        setFilteredNotifications(filtered);
    }, [notifications, searchTerm]);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const timeAgo = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return formatDate(dateString);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 gap-3">
                <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                <p className="mono text-xs text-gray-400 tracking-widest uppercase">
                    Loading notifications...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6" style={{ animation: "fadeUp 0.4s ease both" }}>
            {/* Header with stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="syne text-lg font-bold text-gray-900 mb-1">
                        Evaluation Notifications
                    </h2>
                    <p className="mono text-xs text-gray-500">
                        {notifications.length} total evaluation{notifications.length !== 1 ? "s" : ""} submitted
                    </p>
                </div>
            </div>

            {/* Search */}
            <div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by team name or judge name..."
                    className="w-full px-4 py-2 border border-gray-200 bg-white focus:border-gray-900 focus:outline-none text-sm text-gray-700 mono transition-colors"
                />
            </div>

            {/* Empty state */}
            {notifications.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 py-16 flex flex-col items-center gap-2">
                    <p className="mono text-xs text-gray-300 tracking-widest uppercase">
                        No evaluations submitted yet
                    </p>
                    <p className="mono text-xs text-gray-300">
                        Notifications will appear here when judges submit their evaluations
                    </p>
                </div>
            ) : filteredNotifications.length === 0 ? (
                <div className="border-2 border-dashed border-gray-200 py-12 flex flex-col items-center gap-2">
                    <p className="mono text-xs text-gray-300 tracking-widest uppercase">
                        No matching results
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredNotifications.map((n, idx) => (
                        <div
                            key={n.id}
                            className="border border-emerald-200 bg-emerald-50/50 px-4 py-3 flex items-start gap-3 hover:shadow-sm transition-shadow"
                            style={{ animation: `fadeUp 0.25s ease ${idx * 0.05}s both` }}
                        >
                            {/* Icon */}
                            <div className="text-emerald-600 mt-0.5 shrink-0">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 mb-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="syne text-sm font-bold text-gray-900 truncate">
                                            {n.teams?.name || "Unknown Team"}
                                        </span>
                                        {n.teams?.email && (
                                            <span className="mono text-xs text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                                Email sent
                                            </span>
                                        )}
                                    </div>
                                    <span className="mono text-xs text-gray-400 shrink-0">
                                        {formatDate(n.created_at)}
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <span className="mono text-gray-600">
                                        Judge: <strong>{n.judges?.display_name || "Unknown"}</strong>
                                    </span>
                                    <span className="mono text-gray-400">·</span>
                                    <span className="mono text-gray-600">
                                        Batch: <strong>{n.batches?.name || "—"}</strong>
                                    </span>
                                    <span className="mono text-gray-400">·</span>
                                    <span className="mono text-emerald-600 font-medium">
                                        {timeAgo(n.created_at)}
                                    </span>
                                </div>

                                {n.teams?.domain && (
                                    <p className="mono text-xs text-gray-400 mt-1.5">
                                        Domain: {n.teams.domain}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
