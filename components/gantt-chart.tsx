"use client";

import { useState, useEffect } from "react";

export default function GanttChart({ opportunityId }: { opportunityId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "", category: "mvp" });

  useEffect(() => { fetchTasks(); }, [opportunityId]);

  async function fetchTasks() {
    const res = await fetch(`/api/opportunities/${opportunityId}/gantt`);
    if (res.ok) setTasks(await res.json());
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/opportunities/${opportunityId}/gantt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        category: form.category,
      }),
    });
    setForm({ name: "", startDate: "", endDate: "", category: "mvp" });
    await fetchTasks();
  }

  async function toggleComplete(id: string, completed: boolean) {
    await fetch(`/api/opportunities/${opportunityId}/gantt/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed, progress: !completed ? 100 : 0 }),
    });
    await fetchTasks();
  }

  // Simple Gantt bars
  const minDate = tasks.length > 0 ? new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime()))) : new Date();
  const maxDate = tasks.length > 0 ? new Date(Math.max(...tasks.map(t => new Date(t.endDate).getTime()))) : new Date();
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const categories: Record<string, string> = {
    mvp: "bg-blue-500",
    gtm: "bg-green-500",
    research: "bg-yellow-500",
    development: "bg-purple-500",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Zeitplan (Gantt)</h2>
      <form onSubmit={createTask} className="rounded-lg border bg-card p-4 grid grid-cols-4 gap-2">
        <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Task Name" className="rounded-md border px-3 py-2 text-sm" />
        <input required type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="rounded-md border px-3 py-2 text-sm" />
        <input required type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="rounded-md border px-3 py-2 text-sm" />
        <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="rounded-md border px-3 py-2 text-sm">
          <option value="mvp">MVP</option>
          <option value="gtm">GTM</option>
          <option value="research">Research</option>
          <option value="development">Development</option>
        </select>
        <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground col-span-4">Hinzufügen</button>
      </form>
      <div className="space-y-2">
        {tasks.map(t => {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          const offset = ((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100;
          const width = ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) / totalDays * 100;
          return (
            <div key={t.id} className="flex items-center gap-2">
              <div className="w-32 text-xs truncate">{t.name}</div>
              <div className="flex-1 h-6 bg-muted rounded relative">
                <div 
                  className={`absolute h-full rounded ${categories[t.category] || "bg-gray-400"} ${t.completed ? "opacity-50" : ""}`}
                  style={{ left: `${offset}%`, width: `${Math.max(2, width)}%` }}
                />
              </div>
              <input type="checkbox" checked={t.completed} onChange={() => toggleComplete(t.id, t.completed)} className="h-4 w-4" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
