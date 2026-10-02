import { Metadata } from "next";
import IdeenScoutClient from "./ideenscout-client";

export const metadata: Metadata = {
  title: "IdeenScout — Autonomer SaaS-Ideen-Finder",
  description: "Lass den IdeenScout automatisch neue SaaS-Geschäftsideen finden",
};

export default function IdeenScoutPage() {
  return <IdeenScoutClient />;
}
