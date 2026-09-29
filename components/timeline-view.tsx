"use client";

import { useState, useEffect } from "react";

type TimelineEvent = {
  id: string;
  title: string;
  eventType: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  color?: string | null;
};

export default function TimelineView({ opportunityId }: { opportunityId?: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [newEvent, setNewEvent] = useState({ title: "", eventType: "milestone", startDate: "" });

  useEffect(() => {
    const url = opportunityId ? `/api/timeline-events?opportunityId=${opportunityId}` : "/api/timeline-events";
    fetch(url).then(r => r.json()).then(setEvents);
  }, [opportunityId]);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/timeline-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newEvent,
        opportunityId,
        startDate: newEvent.startDate,
      }),
    });
    setNewEvent({ title: "", eventType: "milestone", startDate: "" });
    const url = opportunityId ? `/api/timeline-events?opportunityId=${opportunityId}` : "/api/timeline-events";
    fetch(url).then(r => r.json()).then(setEvents);
  }

  const sortedEvents = [...events].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-4">
      <form onSubmit={addEvent} className="flex gap-2">
        <input
          placeholder="Event Titel"
          value={newEvent.title}
          onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
          required
        />
        <select
          value={newEvent.eventType}
          onChange={e => setNewEvent({ ...newEvent, eventType: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="milestone">Meilenstein</option>
          <option value="deadline">Deadline</option>
          <option value="launch">Launch</option>
          <option value="review">Review</option>
        </select>
        <input
          type="date"
          value={newEvent.startDate}
          onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          required
        />
        <button type="submit" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">+ Hinzufügen</button>
      </form>

      <div className="relative border-l-2 border-border pl-6 space-y-6">
        {sortedEvents.map((event, i) => (
          <div key={event.id} className="relative">
            <div className={`absolute -left-[29px] top-0 w-4 h-4 rounded-full border-2 border-background ${
              event.status === "completed" ? "bg-green-500" :
              event.status === "overdue" ? "bg-red-500" :
              event.status === "in_progress" ? "bg-blue-500" :
              "bg-muted-foreground"
            }`} />
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{event.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  event.status === "completed" ? "bg-green-100 text-green-700" :
                  event.status === "overdue" ? "bg-red-100 text-red-700" :
                  event.status === "in_progress" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {event.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(event.startDate).toLocaleDateString("de-DE")}
                {event.endDate && ` — ${new Date(event.endDate).toLocaleDateString("de-DE")}`}
              </p>
              <span className="text-xs text-muted-foreground">{event.eventType}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Events</p>}
      </div>
    </div>
  );
}
