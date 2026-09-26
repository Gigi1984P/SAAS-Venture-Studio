"use client";

import { useState, useEffect } from "react";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    } catch (err) {
      console.error(err);
    }
  }

  const unread = notifications.filter(n => !n.sent).length;

  return (
    <div className="relative">
      <button onClick={() => setShowPanel(!showPanel)} className="relative p-2 rounded-md hover:bg-muted">
        🔔
        {unread > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">{unread}</span>}
      </button>
      {showPanel && (
        <div className="absolute right-0 top-10 w-80 rounded-lg border bg-card shadow-lg p-3 z-50">
          <div className="text-sm font-semibold mb-2">Benachrichtigungen</div>
          <div className="space-y-2 max-h-64 overflow-auto">
            {notifications.length === 0 && <div className="text-sm text-muted-foreground">Keine Benachrichtigungen</div>}
            {notifications.map(n => (
              <div key={n.id} className={`text-sm p-2 rounded ${n.sent ? "bg-muted opacity-50" : "bg-blue-50"}`}>
                <div className="font-medium">{n.subject}</div>
                <div className="text-xs text-muted-foreground">{n.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
