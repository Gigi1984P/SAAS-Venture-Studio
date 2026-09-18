"use client";

import { useState } from "react";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  organization: string;
};

export default function SettingsClient({ user }: { user: UserProfile }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  async function handleSave() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Profil gespeichert!");
        setIsEditing(false);
      } else {
        setError(data.message || "Fehler beim Speichern");
      }
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setName(user.name || "");
    setEmail(user.email);
    setIsEditing(false);
    setError("");
    setMessage("");
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwMessage("");

    if (newPassword !== confirmPassword) {
      setPwError("Die Passwörter stimmen nicht überein");
      return;
    }

    if (newPassword.length < 8) {
      setPwError("Passwort muss mindestens 8 Zeichen haben");
      return;
    }

    setPwLoading(true);

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPwMessage("Passwort erfolgreich geändert");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwError(data.message || "Fehler beim Ändern des Passworts");
      }
    } catch {
      setPwError("Netzwerkfehler");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalte dein Profil und Passwort</p>
      </div>

      {/* Profil */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Profil</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-primary hover:underline"
            >
              Bearbeiten
            </button>
          )}
        </div>

        {message && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/50 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Name</label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{name || "(kein Name)"}</p>
            )}
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">E-Mail</label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{email}</p>
            )}
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Rolle</label>
            <p className="text-sm text-muted-foreground">{user.role}</p>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Organisation</label>
            <p className="text-sm text-muted-foreground">{user.organization}</p>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>

      {/* Passwort ändern */}
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Passwort ändern</h2>

        {pwMessage && (
          <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {pwMessage}
          </div>
        )}
        {pwError && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/50 px-4 py-3 text-sm text-destructive">
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="grid gap-1">
            <label className="text-sm font-medium">Aktuelles Passwort</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Mindestens 8 Zeichen</p>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium">Neues Passwort bestätigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={pwLoading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {pwLoading ? "Wird geändert..." : "Passwort ändern"}
          </button>
        </form>
      </div>
    </div>
  );
}
