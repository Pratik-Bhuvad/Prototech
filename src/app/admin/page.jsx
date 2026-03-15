'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getAdminSession, setupAuthListener } from "@/lib/db";
import LoginForm from "./(components)/LoginForm";
import Dashboard from "./(components)/Dashboard";

// ═══════════════════════════════════════════════════════════════
// ROOT EXPORT — login guard
// ═══════════════════════════════════════════════════════════════
export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if session already exists
    getAdminSession().then(({ session }) => {
      if (session) setLoggedIn(true);
      setChecking(false);
    });

    // Listen for auth changes
    const subscription = setupAuthListener((session) => {
      setLoggedIn(!!session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (checking) return null;

  return (
    <>
      {loggedIn ? (
        <Dashboard onLogout={() => setLoggedIn(false)} />
      ) : (
        <LoginForm onLogin={() => setLoggedIn(true)} />
      )}
    </>
  );
}