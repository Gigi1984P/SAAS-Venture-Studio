"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    default: "Ein unerwarteter Fehler ist aufgetreten.",
    Configuration: "Es besteht ein Problem mit der Server-Konfiguration.",
    AccessDenied: "Zugriff verweigert.",
    Verification: "Der Bestätigungslink ist abgelaufen oder ungültig.",
    OAuthSignin: "Fehler bei der Anmeldung.",
    OAuthCallback: "Fehler bei der Anmeldung.",
    OAuthCreateAccount: "Fehler bei der Anmeldung.",
    EmailCreateAccount: "Fehler beim Erstellen des Accounts.",
    Callback: "Fehler bei der Anmeldung.",
    OAuthAccountNotLinked: "Dieser Account ist noch nicht verknüpft.",
    SessionRequired: "Diese Seite erfordert eine Anmeldung.",
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold">Authentifizierungsfehler</h1>
        <p className="text-sm text-muted-foreground">
          {errorMessages[error || "default"] || errorMessages.default}
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Zurück zum Login
        </Link>
      </div>
    </div>
  );
}
