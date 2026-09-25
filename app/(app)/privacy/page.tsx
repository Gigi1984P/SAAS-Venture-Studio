export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>
      
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Verantwortlicher</h2>
        <p className="text-sm text-muted-foreground">
          SAAS Venture Studio GmbH
          <br />
          Musterstraße 1, 80331 München
          <br />
          E-Mail: privacy@saasventurestudio.de
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
        <p className="text-sm text-muted-foreground">
          Wir erheben personenbezogene Daten nur, wenn Sie diese freiwillig zur Verfügung stellen 
          (z. B. bei Registrierung, Kontaktaufnahme). Die Datenverarbeitung erfolgt gemäß Art. 6 DSGVO 
          auf Basis Ihrer Einwilligung oder zur Erfüllung eines Vertrags.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Cookies und Tracking</h2>
        <p className="text-sm text-muted-foreground">
          Wir verwenden essenzielle Cookies für den Betrieb der Website. 
          Mit Ihrer Einwilligung nutzen wir auch Analyse-Cookies. Sie können Ihre 
          Einwilligung jederzeit widerrufen.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Ihre Rechte</h2>
        <p className="text-sm text-muted-foreground">
          Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, 
          Datenübertragbarkeit, Widerspruch gemäß Art. 15–22 DSGVO.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">5. Auftragsverarbeitung</h2>
        <p className="text-sm text-muted-foreground">
          Wir setzen Dienstleister (Hosting, E-Mail) ein. Alle Auftragsverarbeiter 
          sind durch AVV-Verträge abgedeckt.
        </p>
      </section>
    </div>
  );
}
