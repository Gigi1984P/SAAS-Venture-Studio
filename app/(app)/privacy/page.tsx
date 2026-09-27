import PageContainer from "@/components/page-container";

export default function PrivacyPage() {
  return (
    <PageContainer title="Datenschutz">
      <div className="prose dark:prose-invert max-w-none">
        <p>Diese Anwendung speichert Daten nur für den internen Betrieb.</p>
        <p>Keine Weitergabe an Dritte.</p>
      </div>
    </PageContainer>
  );
}
