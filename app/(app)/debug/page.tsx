import { Metadata } from "next";
import DebugLogClient from "./debug-log-client";

export const metadata: Metadata = {
  title: "Debug Logs — SAAS Venture Studio",
  description: "Live API-Fehlerprotokollierung",
};

export default function DebugLogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DebugLogClient />
    </div>
  );
}
