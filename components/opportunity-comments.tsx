"use client";

import { useState, useEffect } from "react";

export default function OpportunityComments({ opportunityId }: { opportunityId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [opportunityId]);

  async function fetchComments() {
    const res = await fetch(`/api/opportunities/${opportunityId}/comments`);
    if (res.ok) setComments(await res.json());
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    await fetch(`/api/opportunities/${opportunityId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    setNewComment("");
    fetchComments();
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">💬 Kommentare ({comments.length})</h3>
      
      <form onSubmit={submitComment} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Kommentar hinzufügen..."
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
        />
        <button type="submit" disabled={loading} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {loading ? "..." : "Senden"}
        </button>
      </form>

      <div className="space-y-3">
        {comments.map((c: any) => (
          <div key={c.id} className="rounded-md bg-muted p-3 text-sm">
            <p>{c.content}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(c.createdAt).toLocaleString("de-DE")}
            </p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Noch keine Kommentare</p>}
      </div>
    </div>
  );
}
