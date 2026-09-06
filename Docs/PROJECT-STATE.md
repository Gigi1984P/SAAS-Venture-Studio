# SAAS Venture Studio — PROJECT-STATE.md

## Projektprofil
| Attribut | Wert |
|----------|------|
| **Name** | SAAS Venture Studio |
| **Slug** | saas-venture-studio-2 |
| **Pfad** | `/opt/data/projects/saas-venture-studio` |
| **Git-Branch** | master (initial) |
| **Erstellt** | 2026-09-06 |
| **Status** | Initialisierung |
| **Vorbild** | `/opt/data/projects/wowendo` |

## Zweck
Venture-Studio-Plattform für SaaS-Produkte.

## Tech-Stack (übernommen aus Wowendo)

### Framework
| Paket | Version | Zweck |
|-------|---------|-------|
| `next` | 14.1.0 | Next.js App Router |
| `react` | 18.2.0 | UI Framework |
| `react-dom` | 18.2.0 | React DOM |
| `typescript` | 5.9.3 | Typisierung |

### Styling
| Paket | Version | Zweck |
|-------|---------|-------|
| `tailwindcss` | 3.4.19 | Utility-first CSS |
| `tailwindcss-animate` | 1.0.7 | Animationen |
| `tailwind-merge` | 2.2.0 | Tailwind-Klassen-Merge |
| `clsx` | 2.1.1 | Conditional Klassen |
| `postcss` | 8.4.35 | CSS Postprocessing |
| `autoprefixer` | 10.4.17 | Vendor-Prefixes |

### Auth & Security
| Paket | Version | Zweck |
|-------|---------|-------|
| `next-auth` | 4.24.5 | Authentifizierung |
| `bcryptjs` | 2.4.3 | Passwort-Hashing |
| `speakeasy` | 2.0.0 | 2FA / TOTP |

### Database & ORM
| Paket | Version | Zweck |
|-------|---------|-------|
| `prisma` | 5.10.0 | ORM & Migrationen |
| `@prisma/client` | 5.10.0 | Prisma Client |
| `pg` | 8.23.0 | PostgreSQL Treiber |

### E-Mail
| Paket | Version | Zweck |
|-------|---------|-------|
| `resend` | 6.25.0 | Transaktions-E-Mail |
| `nodemailer` | 7.0.13 | SMTP Client |

### UI & Charts
| Paket | Version | Zweck |
|-------|---------|-------|
| `lucide-react` | 0.344.0 | Icons |
| `recharts` | 2.12.0 | React Charts |
| `chart.js` | 4.5.1 | Chart.js Core |
| `react-chartjs-2` | 5.3.1 | Chart.js React Wrapper |
| `canvas-confetti` | 1.9.4 | Konfetti-Effekte |

### Rich Text Editor
| Paket | Version | Zweck |
|-------|---------|-------|
| `@tiptap/react` | 3.31.3 | Tiptap React |
| `@tiptap/starter-kit` | 3.31.3 | Basis-Erweiterungen |
| `@tiptap/extension-image` | 3.31.3 | Bilder |
| `@tiptap/extension-link` | 3.31.3 | Links |
| `@tiptap/extension-placeholder` | 3.31.3 | Placeholder |
| `@tiptap/extension-table` | 3.31.3 | Tabellen |
| `@tiptap/extension-table-cell` | 3.31.3 | Tabellenzellen |
| `@tiptap/extension-table-header` | 3.31.3 | Tabellen-Header |
| `@tiptap/extension-table-row` | 3.31.3 | Tabellen-Zeilen |

### Payment
| Paket | Version | Zweck |
|-------|---------|-------|
| `stripe` | 22.6.0 | Stripe API |

### Monitoring & Logging
| Paket | Version | Zweck |
|-------|---------|-------|
| `@sentry/nextjs` | 10.73.0 | Error Tracking |
| `@sentry/node` | 10.73.0 | Server-Side Sentry |
| `winston` | 3.19.0 | Logging |
| `@opentelemetry/api` | 1.9.1 | Observability API |
| `@opentelemetry/auto-instrumentations-node` | 0.80.0 | Auto-Instrumentation |
| `@opentelemetry/sdk-node` | 0.222.0 | OpenTelemetry SDK |

### Testing
| Paket | Version | Zweck |
|-------|---------|-------|
| `jest` | 30.5.1 | Test Framework |
| `jest-environment-jsdom` | 30.5.1 | JSDOM Environment |
| `ts-jest` | 29.4.12 | TypeScript für Jest |
| `@testing-library/jest-dom` | 7.0.1 | Jest DOM Matchers |
| `@testing-library/react` | 16.3.3 | React Testing |
| `@testing-library/user-event` | 14.6.7 | User Events |
| `identity-obj-proxy` | 3.0.0 | CSS Mock |

### Utilities
| Paket | Version | Zweck |
|-------|---------|-------|
| `zod` | 3.22.4 | Schema Validation |
| `qrcode` | 1.5.4 | QR-Code Generierung |

### Dev Dependencies
| Paket | Version | Zweck |
|-------|---------|-------|
| `@types/bcryptjs` | 2.4.6 | bcryptjs Typen |
| `@types/canvas-confetti` | 1.9.0 | confetti Typen |
| `@types/node` | 20.11.0 | Node.js Typen |
| `@types/nodemailer` | 8.0.1 | nodemailer Typen |
| `@types/react` | 18.2.0 | React Typen |
| `@types/react-dom` | 18.2.0 | React DOM Typen |
| `@types/jest` | 30.0.0 | Jest Typen |
| `@types/pg` | 8.23.1 | pg Typen |
| `@types/qrcode` | 1.5.6 | qrcode Typen |
| `@types/speakeasy` | 2.0.10 | speakeasy Typen |

## Architektur-Patterns (aus Wowendo übernommen)

### Auth & Middleware
- **Server-side Auth Guard** in `middleware.ts` — KEINE client-side Exposure geschützter UI
- NextAuth mit JWT-Strategy
- Session Timeout: 24h absolut + 8h Inaktivität
- CSRF-Tokens (custom, nicht NextAuth-eigen)
- HTTPS Redirect in Production (308)
- IP-Anonymisierung: letztes Oktett entfernt (DSGVO)

### Security Headers (via Middleware)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HSTS, 63.7 Mio Sek.)
- `Referrer-Policy: strict-origin-when-cross-origin`

### Database
- PostgreSQL mit Prisma ORM
- Multi-Tenant: `Organization`-Modell als Tenant-Root
- Role-Based Access Control (RBAC) mit `Role`, `Permission`, `RolePermission`
- Stripe-Billing-Integration: `Subscription`, `Invoice`, `Entitlement`

### Projektstruktur
```
saas-venture-studio/
├── Docs/
│   ├── PROJECT-STATE.md   ← Diese Datei
│   └── TODOS.md          ← Offene Aufgaben
├── app/                  ← Next.js App Router
│   ├── api/              ← API Routes
│   ├── auth/             ← Login/Register/Callback
│   ├── dashboard/        ← Geschützte Bereiche
│   ├── layout.tsx        ← Root Layout
│   ├── page.tsx          ← Landing Page
│   └── globals.css       ← Globale Styles
├── components/           ← Reusable React Components
│   └── ui/               ← Primitive UI-Komponenten
├── lib/                  ← Utilities, Prisma Client, Auth
│   ├── prisma.ts         ← Prisma Singleton
│   └── auth.ts           ← NextAuth Config
├── prisma/
│   └── schema.prisma     ← Datenbank-Schema
├── public/               ← Statische Assets
├── __tests__/            ← Jest Tests
├── .env.example          ← Umgebungsvariablen-Template
├── next.config.js        ← Next.js Config (Sentry)
├── tailwind.config.js    ← Tailwind Config
├── tsconfig.json         ← TypeScript Config
├── jest.config.js        ← Jest Config
├── middleware.ts         ← Next.js Middleware (Auth, Security)
└── package.json          ← Dependencies & Scripts
```

## Umgebungsvariablen (aus Wowendo)
```
DATABASE_URL="postgresql://USER:***@HOST:PORT/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="GENERIERE_EINEN_GEHEIMEN_SCHLUESSEL_64_ZEICHEN"
RESEND_API_KEY="DEIN_RESEND_API_KEY"
EMAIL_FROM="noreply@domain.com"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_TELEMETRY_DISABLED="1"
```

## DSGVO/GDPR-Checkliste
- [ ] Cookie-Consent-Banner (client-seitig + server-seitig)
- [ ] Consent-gated Tracking (nur nach Zustimmung)
- [ ] AVVs bei SaaS-Partnern
- [ ] Datenschutzerklärung (Impressum + Privacy Policy)
- [ ] Recht auf Löschung (Right to Erasure)
- [ ] Datenportabilität (Export-Funktion)
- [ ] Cookie-Einstellungen (granular, nicht nur On/Off)
- [ ] IP-Anonymisierung (Middleware, letztes Oktett entfernt)

## Nächste Schritte
Siehe `TODOS.md`

## GitHub Push
- **Remote:** `git@github.com:Gigi1984P/SAAS-Venture-Studio.git`
- **SSH Key:** `~/.ssh/saas-venture-studio` (ED25519)
- **Public Key Fingerprint:** SHA256:JLulzj6SY3RdNAwT3xlmsqZX5Y2nMqQzJVtHAAjVLvg
- **Push Command:** `GIT_SSH_COMMAND="ssh -i ~/.ssh/saas-venture-studio -o IdentitiesOnly=yes" git push`

## Notizen
- Tech-Stack 1:1 aus Wowendo übernommen — bewährt, produktionsreif
- Sentry statt OpenTelemetry gewählt — mehr direkter Kundennutzen für monolithisches Next.js
- Auth-Gates komplett serverseitig in Middleware — kein client-seitiges Flashing geschützter Inhalte
