"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function ActivatePage() {
  return (
    <Suspense>
      <ActivatePageContent />
    </Suspense>
  );
}

function ActivatePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activated && countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (activated && countdown === 0) {
      window.close();
    }
    return () => clearTimeout(timer);
  }, [activated, countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage("You are now verified! You can now log in and enjoy trekking.");
      setActivated(true);
    } else {
      setError(data.error || "Activation failed.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="w-full max-w-md bg-[#181818] bg-opacity-95 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-white mb-6">Activate Your Account</h1>
        {message ? (
          <>
            <div className="text-green-400 text-center mb-4 text-lg font-semibold">{message}</div>
            <div className="text-center text-gray-400 text-sm mt-4">
              This page will automatically close in <span className="font-bold text-white">{countdown}</span> second{countdown !== 1 ? "s" : ""}.
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-400 text-center">{error}</div>}
            <button
              type="submit"
              className="w-full bg-green-400 text-black font-bold py-2 rounded hover:bg-green-300 transition"
              disabled={loading}
            >
              {loading ? "Activating..." : "Activate Account"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 