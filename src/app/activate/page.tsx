'use client';
import Head from 'next/head';
import React, { useEffect, useState } from "react";
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

  const [captchaSvg, setCaptchaSvg] = useState<string>("");
  const [captchaId, setCaptchaId] = useState<string>("");
  const [captchaText, setCaptchaText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch captcha on mount or refresh
  const fetchCaptcha = async () => {
    setCaptchaText("");
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/captcha");
    const data = await res.json();
    setCaptchaSvg(data.svg);
    setCaptchaId(data.captchaId);
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const res = await fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, captchaText, captchaId }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage(data.message || "Account activated successfully!");
    } else {
      setError(data.error || "Activation failed.");
      fetchCaptcha(); // Refresh captcha on error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Head>
        <title>Activate Account | Trek Hub India</title>
        <meta name="description" content="Activate your Trek Hub India account to start booking treks and adventures." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="w-full max-w-md bg-[#181818] rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-white mb-6">Activate Your Account</h1>
        {message ? (
          <div className="text-green-400 text-center mb-4">{message}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center">
              <div
                className="mb-2"
                dangerouslySetInnerHTML={{ __html: captchaSvg }}
              />
              <button
                type="button"
                className="text-xs text-gray-400 underline mb-2"
                onClick={fetchCaptcha}
                disabled={loading}
              >
                Refresh Captcha
              </button>
              <input
                type="text"
                className="w-full px-4 py-2 rounded bg-[#222] text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Enter the text above"
                value={captchaText}
                onChange={e => setCaptchaText(e.target.value)}
                required
                disabled={loading}
              />
            </div>
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