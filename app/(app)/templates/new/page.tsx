"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/page-container";

export default function NewTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "saas",
    tags: "",
    repositoryUrl: "",
    demoUrl: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push("/templates");
        router.refresh();
      } else {
        alert("Fehler beim Erstellen");
      }
    } catch {
      alert("Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer title="Neues Template">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Beschreibung</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="saas">SaaS</option>
              <option value="marketplace">Marketplace</option>
              <option value="ai-tool">AI Tool</option>
              <option value="chrome-extension">Chrome Extension</option>
              <option value="mobile-app">Mobile App</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (komma-getrennt)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="react, node, postgres"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Repository URL</label>
            <input
              type="url"
              value={form.repositoryUrl}
              onChange={(e) => setForm({ ...form, repositoryUrl: e.target.value })}
              placeholder="https://github.com/..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Demo URL</label>
            <input
              type="url"
              value={form.demoUrl}
              onChange={(e) => setForm({ ...form, demoUrl: e.target.value })}
              placeholder="https://..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Erstelle..." : "Template erstellen"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/templates")}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            Abbrechen
          </button>
        </div>
      </form>
    </PageContainer>
  );
}
