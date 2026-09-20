"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function VerifyEmailPage() {
  const t = useTranslations("AuthFlows");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Ungültiger oder fehlender Token");
      return;
    }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(t("emailVerified"));
        } else {
          setStatus("error");
          setMessage(data.message || "Fehler");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Fehler");
      });
  }, [token, t]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <h1 className="text-2xl font-bold">{t("verifyEmailTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("verifyEmailDesc")}</p>

        {status === "loading" && (
          <div className="text-sm text-muted-foreground">{t("loading")}...</div>
        )}
        {status === "success" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </div>
            <Link
              href="/auth/login"
              className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Zum Login
            </Link>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-red-50 p-4 text-sm text-red-700">
              {message}
            </div>
            <Link
              href="/auth/login"
              className="inline-block rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Zum Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
