import { Metadata } from "next";
import SignalClient from "./signal-client";

export const metadata: Metadata = {
  title: "📡 Signal Discovery — Echte Pain Points",
  description: "Reddit, Hacker News, IndieHackers — echte User-Pain-Points",
};

export default function SignalPage() {
  return <SignalClient />;
}
