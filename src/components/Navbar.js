'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { judgeLogout } from "@/lib/judgeAuth";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isJudge, setIsJudge] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check for judge session first
                const judgeToken = localStorage.getItem("judge_session_token");
                if (judgeToken) {
                    setUser({ id: judgeToken });
                    setIsJudge(true);
                    setLoading(false);
                    return;
                }

                // Check for admin/user Supabase session
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);
                setIsJudge(false);
            } catch (error) {
                console.error("Auth check failed:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Setup Supabase auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser(session.user);
                setIsJudge(false);
            }
        });

        // Listen for judge session changes
        const handleStorageChange = () => {
            const judgeToken = localStorage.getItem("judge_session_token");
            if (judgeToken) {
                setUser({ id: judgeToken });
                setIsJudge(true);
            } else {
                setUser(null);
                setIsJudge(false);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            subscription?.unsubscribe();
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            if (isJudge) {
                await judgeLogout();
                setUser(null);
                setIsJudge(false);
                setMenuOpen(false);
                router.push("/");
            } else {
                await supabase.auth.signOut();
                setUser(null);
                setMenuOpen(false);
                router.push("/");
            }
        } catch (error) {
            console.error("Logout failed:", error);
            setLoggingOut(false);
        }
    };

    return (
        <header className="w-screen fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-gray-100 shadow-md">
            <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between bg-white/90">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-0 font-bold text-shadow-black">
                    <span className="">PROTO</span>
                    <span className="text-purple-700">TECH</span>
                    <span className="logo-dot" />
                </Link>

                {/* Desktop Nav */}
                {!loading && !user &&
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/judge" className="nav-link">Judge</Link>
                        <Link href="/admin" className="nav-link">Admin</Link>
                    </nav>
                }

                {/* Desktop Logout Button */}
                {!loading && user && (
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className={`hidden md:block p-2 rounded-md transition-all duration-200 ${
                            loggingOut 
                                ? "opacity-75 cursor-not-allowed" 
                                : "hover:bg-red-100"
                        }`}
                        aria-label="Logout"
                        title={loggingOut ? "Logging out..." : "Logout"}
                    >
                        {loggingOut ? (
                            <svg className="w-5 h-5 text-red-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                                <path stroke="currentColor" strokeWidth="2" fill="none" d="M12 2a10 10 0 010 20" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        )}
                    </button>
                )}

                {/* Mobile: Hamburger or Logout Icon */}
                {!loading && !user && (
                    <button
                        className="md:hidden flex flex-col gap-1.5 p-1"
                        onClick={() => setMenuOpen((v) => !v)}
                        aria-label="Toggle menu"
                    >
                        <span
                            className={`block w-5 h-px bg-gray-900 transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
                        />
                        <span
                            className={`block w-5 h-px bg-gray-900 transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
                        />
                        <span
                            className={`block w-5 h-px bg-gray-900 transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
                        />
                    </button>
                )}

                {/* Mobile: Logout Icon when logged in */}
                {!loading && user && (
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className={`md:hidden p-2 rounded-md transition-all duration-200 ${
                            loggingOut 
                                ? "opacity-75 cursor-not-allowed" 
                                : "hover:bg-red-100"
                        }`}
                        aria-label="Logout"
                        title={loggingOut ? "Logging out..." : "Logout"}
                    >
                        {loggingOut ? (
                            <svg className="w-5 h-5 text-red-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                                <path stroke="currentColor" strokeWidth="2" fill="none" d="M12 2a10 10 0 010 20" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            {/* Mobile Menu */}
            {!user && menuOpen && (
                <div className="mobile-menu md:hidden px-6 py-5 flex flex-col gap-5 backdrop-blur-xs bg-white/5 border-t border-gray-100 shadow-lg">
                    <Link href="/judge/login" className="nav-link" onClick={() => setMenuOpen(false)}>Judge</Link>
                    <Link href="/admin/login" className="nav-link" onClick={() => setMenuOpen(false)}>Admin</Link>
                </div>
            )}
        </header>
    )
}