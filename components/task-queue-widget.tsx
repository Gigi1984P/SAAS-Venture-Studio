"use client";

import { useState, useEffect } from "react";

type Task = {
  id: string;
  type: string;
  agent: string;
  status: string;
  priority: number;
  attempts: number;
  result: any;
  error: string | null;
  reviewNotes: string | null;
  createdAt: string;
};

export default function TaskQueueWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [reviewForm, setReviewForm] = useState({ taskId: "", notes: "", decision: "" });

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) setTasks(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function reviewTask(taskId: string, status: string) {
    try {
      await fetch(`/api/tasks/${taskId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: reviewForm.notes }),
      });
      setReviewForm({ taskId: "", notes: "", decision: "" });
      await fetchTasks();
    } catch (err) {
      console.error(err);
    }
  }

  async function retryTask(taskId: string) {
    try {
      await fetch(`/api/tasks/${taskId}/retry`, { method: "POST" });
      await fetchTasks();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const statusColors: Record<string, string> = {
    queued: "bg-gray-100 text-gray-600",
    running: "bg-blue-100 text-blue-700 animate-pulse",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
    review: "bg-yellow-100 text-yellow-700",
    accepted: "bg-emerald-100 text-emerald-700",
    human_review: "bg-purple-100 text-purple-700",
  };

  if (loading) return <div className="text-sm text-muted-foreground">Lade Tasks...</div>;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Task Queue</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 rounded-md border px-2 text-xs"
        >
          <option value="all">Alle</option>
          <option value="queued">Queued</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="review">Review</option>
          <option value="human_review">Human Review</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Tasks.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-md border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[t.status] || "bg-gray-100"}`}>
                    {t.status}
                  </span>
                  <span className="text-sm font-medium">{t.type}</span>
                  <span className="text-xs text-muted-foreground">P{t.priority}</span>
                </div>
                <div className="flex items-center gap-1">
                  {t.status === "failed" && (
                    <button onClick={() => retryTask(t.id)} className="text-xs text-blue-600 hover:underline">Retry</button>
                  )}
                  {t.status === "completed" && (
                    <button onClick={() => setReviewForm({ taskId: t.id, notes: "", decision: "" })} className="text-xs text-yellow-600 hover:underline">Review</button>
                  )}
                </div>
              </div>

              {t.error && <p className="text-xs text-red-600 truncate">{t.error}</p>}
              {t.reviewNotes && <p className="text-xs text-muted-foreground">Review: {t.reviewNotes}</p>}

              {reviewForm.taskId === t.id && (
                <div className="flex gap-2 mt-2">
                  <input
                    value={reviewForm.notes}
                    onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                    placeholder="Review Notes"
                    className="flex-1 rounded-md border px-2 py-1 text-xs"
                  />
                  <button onClick={() => reviewTask(t.id, "accepted")} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Accept</button>
                  <button onClick={() => reviewTask(t.id, "human_review")} className="text-xs bg-purple-600 text-white px-2 py-1 rounded">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
