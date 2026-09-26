"use client";

import { useState, useEffect } from "react";

export default function FileUploader({ opportunityId, entityType }: { opportunityId: string; entityType: string }) {
  const [uploads, setUploads] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchUploads(); }, [opportunityId]);

  async function fetchUploads() {
    const res = await fetch(`/api/uploads?opportunityId=${opportunityId}`);
    if (res.ok) setUploads(await res.json());
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("opportunityId", opportunityId);
    formData.append("entityType", entityType);
    
    await fetch("/api/uploads", { method: "POST", body: formData });
    setUploading(false);
    await fetchUploads();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input type="file" onChange={handleUpload} disabled={uploading} className="text-sm" />
        {uploading && <span className="text-xs text-muted-foreground">Lade hoch...</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {uploads.map(u => (
          <div key={u.id} className="rounded-lg border bg-card p-2">
            <div className="text-xs font-medium truncate">{u.fileName}</div>
            <div className="text-xs text-muted-foreground">{(u.fileSize / 1024).toFixed(1)} KB</div>
            <a href={u.fileUrl} target="_blank" className="text-xs text-blue-600 hover:underline">Ansehen</a>
          </div>
        ))}
      </div>
    </div>
  );
}
