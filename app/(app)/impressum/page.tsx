export default function ImpressumPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6 space-y-8">
      <h1 className="text-3xl font-bold">Impressum</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Angaben gemäß § 5 TMG</h2>
        <p className="text-sm text-muted-foreground">
          SAAS Venture Studio GmbH
          <br />
          Musterstraße 1
          <br />
          80331 München
          <br />
          Deutschland
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Vertreten durch</h2>
        <p className="text-sm text-muted-foreground">
          Geschäftsführer: Max Mustermann
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Kontakt</h2>
        <p className="text-sm text-muted-foreground">
          Telefon: +49 (0) 89 12345678
          <br />
          E-Mail: info@saasventurestudio.de
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Registereintrag</h2>
        <p className="text-sm text-muted-foreground">
          Handelsregister: Amtsgericht München
          <br />
          Registernummer: HRB 123456
          <br />
          USt-IdNr.: DE123456789
        </p>
      </section>
    </div>
  );
}
