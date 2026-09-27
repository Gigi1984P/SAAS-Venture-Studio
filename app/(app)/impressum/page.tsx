import PageContainer from "@/components/page-container";

export default function ImpressumPage() {
  return (
    <PageContainer title="Impressum">
      <div className="prose dark:prose-invert max-w-none">
        <p>Angaben gemäß § 5 TMG:</p>
        <p>Gianluigi Plantone<br/>SAAS Venture Studio</p>
        <p>Kontakt: gianluigi.plantone@googlemail.com</p>
      </div>
    </PageContainer>
  );
}
