"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json();
        setError(data.message || "Fehler");
      }
    } catch {
      setError("Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Passwort vergessen</h1>
          <p className="text-sm text-muted-foreground mt-2">Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen.</p>
        </div>

        {sent ? (
          <div className="rounded-lg border bg-emerald-50 p-4 text-sm text-emerald-700">
            Link gesendet! Prüfe deine E-Mails.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">E-Mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Wird gesendet..." : "Link senden"}
            </button>
          </form>
        )}

        <div className="text-center text-sm">
          <Link href="/auth/login" className="text-primary hover:underline">
            Zurück zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}
