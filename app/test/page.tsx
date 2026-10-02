import Link from "next/link";

export default function TestPage() {
  return (
    <div className="p-8">
      <h1>Testseite</h1>
      <p>Wenn du das siehst, funktioniert die Sidebar.</p>
      <Link href="/dashboard" className="text-blue-600">Zurück zum Dashboard</Link>
    </div>
  );
}
