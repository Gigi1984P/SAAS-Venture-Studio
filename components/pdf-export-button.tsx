"use client";

export default function PdfExportButton(props: { opportunityId: string; type: "pitch" | "memo" }) {
  const { opportunityId, type } = props;

  async function exportPdf() {
    const endpoint = type === "pitch" 
      ? `/api/opportunities/${opportunityId}/pitch-deck`
      : `/api/opportunities/${opportunityId}/budget/check`;
    
    const res = await fetch(endpoint);
    const data = await res.json();
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    let content = "";
    if (type === "pitch") {
      const slides = data as Array<{ title: string; content: string }>;
      content = slides.map(function(s) {
        return "<h2>" + s.title + "</h2><p>" + s.content + "</p>";
      }).join("<hr>");
    } else {
      content = "<h1>Investment Memo</h1><pre>" + JSON.stringify(data, null, 2) + "</pre>";
    }
    
    printWindow.document.write(
      "<html><head><title>Export</title><style>body{font-family:Arial;padding:40px;}</style></head><body>" + content + "</body></html>"
    );
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <button
      onClick={exportPdf}
      className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
    >
      PDF Export
    </button>
  );
}
