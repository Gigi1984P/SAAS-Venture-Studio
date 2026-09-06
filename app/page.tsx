export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
        SAAS Venture Studio
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
        Venture-Studio-Plattform für SaaS-Produkte. 
        Verwalte Startups, Ventures und Teams an einem Ort.
      </p>
      <div className="flex gap-4">
        <a
          href="/auth/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Anmelden
        </a>
        <a
          href="#"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Mehr erfahren
        </a>
      </div>
    </div>
  );
}
