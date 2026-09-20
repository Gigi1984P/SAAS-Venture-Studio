"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AlertTriangle } from "lucide-react";

export default function AuthErrorPage() {
  const t = useTranslations("Auth");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    default: t("authErrorDefault"),
    Configuration: t("authErrorConfiguration"),
    AccessDenied: t("authErrorAccessDenied"),
    Verification: t("authErrorVerification"),
    OAuthSignin: t("authErrorOAuth"),
    OAuthCallback: t("authErrorOAuth"),
    OAuthCreateAccount: t("authErrorOAuth"),
    EmailCreateAccount: t("authErrorEmail"),
    Callback: t("authErrorCallback"),
    OAuthAccountNotLinked: t("authErrorAccountNotLinked"),
    SessionRequired: t("authErrorSessionRequired"),
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold">{t("authErrorTitle")}</h1>
        <p className="text-sm text-muted-foreground">
          {errorMessages[error || "default"] || errorMessages.default}
        </p>
        <Link
          href="/auth/login"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("signIn")}
        </Link>
      </div>
    </div>
  );
}
