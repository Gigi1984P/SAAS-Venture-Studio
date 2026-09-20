"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from "lucide-react";

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = false,
  searchKeys,
  pageSize = 10,
  emptyMessage,
  rowClassName,
  onRowClick,
}: {
  data: T[];
  columns: {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    sortable?: boolean;
    width?: string;
  }[];
  searchable?: boolean;
  searchKeys?: string[];
  pageSize?: number;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  const t = useTranslations("DataTable");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  let filtered = [...data];

  if (searchable && search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter((row) =>
      (searchKeys || columns.map((c) => c.key)).some((key) => {
        const val = row[key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }

  if (sortCol) {
    filtered.sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (av == null) return sortDir === "asc" ? 1 : -1;
      if (bv == null) return sortDir === "asc" ? -1 : 1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const s = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? s : -s;
    });
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageData = filtered.slice(start, start + pageSize);

  function toggleSort(key: string) {
    if (sortCol === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("search")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap ${
                    col.sortable ? "cursor-pointer select-none" : ""
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <ArrowUpDown className={`w-3 h-3 ${sortCol === col.key ? "text-primary" : "text-muted-foreground/50"}`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage || t("noResults")}
                </td>
              </tr>
            )}
            {pageData.map((row, idx) => (
              <tr
                key={idx}
                className={`${rowClassName?.(row) || ""} ${onRowClick ? "cursor-pointer hover:bg-muted/50" : "hover:bg-muted/30"} transition-colors`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {t("page")} {currentPage} {t("of")} {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> {t("previous")}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-30"
            >
              {t("next")} <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
