import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n/config";

const SESSION_ABSOLUTE_TIMEOUT = 24 * 60 * 60 * 1000;
const SESSION_CREATED_AT_COOKIE = "session-created-at";
const CSRF_COOKIE_NAME = "csrf-token";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/ventures",
  "/settings",
  "/opportunities",
  "/validation",
  "/intelligence",
  "/agents",
  "/radar",
];

function anonymizeIp(ip: string): string {
  if (!ip) return "";
  const trimmed = ip.trim();
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
    return trimmed.replace(/\.\d{1,3}$/, ".0");
  }
  if (trimmed.includes(":")) {
    const segments = trimmed.split(":").filter((s) => s !== "");
    if (segments.length >= 4) {
      segments.pop();
      return segments.join(":") + ":0";
    }
    return trimmed;
  }
  return trimmed;
}

function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const localePrefix = pathname.split("/")[1];
  const isLocalePath = locales.includes(localePrefix as any);

  // Strip locale prefix for route matching
  const cleanPath = isLocalePath ? pathname.replace(/^\/[a-z]{2}/, "") : pathname;

  // HTTPS Redirect (Production)
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = "https";
    return NextResponse.redirect(httpsUrl, 308);
  }

  // Auth Guard: Geschützte Routen erfordern Session
  const sessionToken =
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value ||
    "";
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => cleanPath === route || cleanPath.startsWith(route + "/")
  );
  const isAuthPage = cleanPath.startsWith("/auth/");

  if (isProtectedRoute && !sessionToken && !isAuthPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `${isLocalePath ? "/" + localePrefix : ""}/auth/login`;
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Run i18n middleware (handles locale detection/redirect)
  const response = intlMiddleware(request);
  const now = Date.now();

  // IP-Anonymisierung (DSGVO)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const anonymizedIps = forwardedFor
      .split(",")
      .map((ip) => anonymizeIp(ip.trim()))
      .join(", ");
    response.headers.set("X-Forwarded-For-Anonymized", anonymizedIps);
  }
  response.headers.set("X-Privacy-Notice", "IPs are anonymized per GDPR");

  // Session Timeout
  if (sessionToken) {
    const sessionCreatedAt = parseInt(
      request.cookies.get(SESSION_CREATED_AT_COOKIE)?.value || "0",
      10
    );
    if (!isAuthPage) {
      const absoluteExpired =
        sessionCreatedAt > 0 && now - sessionCreatedAt > SESSION_ABSOLUTE_TIMEOUT;
      if (absoluteExpired) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `${isLocalePath ? "/" + localePrefix : ""}/auth/login`;
        loginUrl.searchParams.set("error", "SessionExpired");
        const redirect = NextResponse.redirect(loginUrl);
        redirect.cookies.delete(SESSION_CREATED_AT_COOKIE);
        return redirect;
      }
    }
    if (!sessionCreatedAt) {
      response.cookies.set(SESSION_CREATED_AT_COOKIE, String(now), {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_ABSOLUTE_TIMEOUT / 1000,
        httpOnly: true,
      });
    }
  } else {
    response.cookies.delete(SESSION_CREATED_AT_COOKIE);
  }

  // CSRF Token
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!existingToken && !pathname.startsWith("/api/auth/")) {
    const newToken = generateCsrfToken();
    response.cookies.set(CSRF_COOKIE_NAME, newToken, {
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_ABSOLUTE_TIMEOUT / 1000,
      httpOnly: false,
    });
  }

  // Security Headers
  if (pathname.startsWith("/api/")) {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
  }

  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "https"
  ) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
