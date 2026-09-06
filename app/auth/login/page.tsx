import { Suspense } from "react";
import LoginForm from "../../../components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Suspense fallback={<div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="h-8 w-32 mx-auto bg-muted rounded animate-pulse"></div>
          <div className="h-4 w-48 mx-auto bg-muted rounded animate-pulse"></div>
        </div>
      </div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
