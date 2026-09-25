"use client";

import { useState, useEffect } from "react";

type Todo = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-yellow-100 text-yellow-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function VentureTodos({ ventureId }: { ventureId: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", priority: "medium", dueDate: "" });

  useEffect(() => {
    fetchTodos();
  }, [ventureId]);

  async function fetchTodos() {
    try {
      const res = await fetch(`/api/ventures/${ventureId}/todos`);
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (err) {
      console.error("Failed to fetch todos:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`/api/ventures/${ventureId}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ title: "", description: "", priority: "medium", dueDate: "" });
        setShowForm(false);
        await fetchTodos();
      }
    } catch (err) {
      console.error("Failed to create todo:", err);
    }
  }

  async function updateStatus(todoId: string, status: string) {
    try {
      const res = await fetch(`/api/ventures/${ventureId}/todos/${todoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchTodos();
    } catch (err) {
      console.error("Failed to update todo:", err);
    }
  }

  async function deleteTodo(todoId: string) {
    if (!confirm("Löschen?")) return;
    try {
      const res = await fetch(`/api/ventures/${ventureId}/todos/${todoId}`, { method: "DELETE" });
      if (res.ok) await fetchTodos();
    } catch (err) {
      console.error("Failed to delete todo:", err);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Lade ToDos...</div>;

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ToDos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
        >
          {showForm ? "Schließen" : "+ ToDo"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-md border bg-muted/30 p-3">
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Titel"
            className="block w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Beschreibung (optional)"
            className="block w-full rounded-md border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            >
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
              <option value="urgent">Dringend</option>
            </select>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="flex-1 rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">Speichern</button>
        </form>
      )}

      {todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine ToDos.</p>
      ) : (
        <div className="space-y-2">
          {todos.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-md border bg-background p-3">
              <input
                type="checkbox"
                checked={t.status === "done"}
                onChange={() => updateStatus(t.id, t.status === "done" ? "todo" : "done")}
                className="h-4 w-4 rounded border"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</span>
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityColors[t.priority] || "bg-gray-100 text-gray-600"}`}>
                    {t.priority}
                  </span>
                </div>
                {t.description && <p className="text-xs text-muted-foreground truncate">{t.description}</p>}
                {t.dueDate && <span className="text-[10px] text-muted-foreground">Bis: {new Date(t.dueDate).toLocaleDateString("de-DE")}</span>}
              </div>
              <button onClick={() => deleteTodo(t.id)} className="text-xs text-red-600 hover:text-red-800">Löschen</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
