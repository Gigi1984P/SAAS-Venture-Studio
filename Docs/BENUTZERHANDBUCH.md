# SAAS Venture Studio — Benutzerhandbuch

**Version:** 1.0  
**Datum:** September 2026  
**Autor:** Gianluigi Plantone

---

## Inhaltsverzeichnis

1. [Einleitung](#1-einleitung)
2. [Dashboard](#2-dashboard)
3. [Ideen-Katalog](#3-ideen-katalog)
4. [Opportunities](#4-opportunities)
5. [Ventures](#5-ventures)
6. [Templates & Galerie](#6-templates--galerie)
7. [Globale Funktionen](#7-globale-funktionen)
8. [Workflows & Best Practices](#8-workflows--best-practices)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Einleitung

### 1.1 Was ist das SAAS Venture Studio?

Das SAAS Venture Studio ist ein integriertes System zur systematischen Entwicklung, Validierung und Skalierung von SaaS-Ideen. Es deckt den gesamten Weg ab — von der ersten Idee über Marktvalidierung, Scoring, Experimente bis hin zum Investment Memo und Venture.

### 1.2 Kernphilosophie

- **Evidence-basiert:** Keine Entscheidungen auf Bauchgefühl, sondern auf Daten
- **Stage-Gating:** Nächste Stufe erst freigeschaltet, wenn die vorherige erfüllt ist
- **Solo-Operator optimiert:** Für Ein-Personen-Betrieb ohne Enterprise-Overhead

### 1.3 System-Architektur

```
Idee → Discovery → Validation → Scoring → Experiments → Venture
         ↓              ↓           ↓            ↓            ↓
     Pain Signals   7 Stufen   Score A/B   Assumptions   Investment
     Research       Gating      Auto-Calc   Auto-Loop     Memo
```

---

## 2. Dashboard

### 2.1 Übersicht

Das Dashboard ist deine Startseite nach dem Login. Es zeigt auf einen Blick den Zustand deines gesamten Portfolios.

### 2.2 Widgets

| Widget | Beschreibung |
|--------|-------------|
| **Pipeline Value** | Gesamter geschätzter MRR aller Opportunities in € |
| **Ø Score A** | Durchschnittlicher Opportunity-Quality-Score |
| **Velocity** | Wie viele Ideen pro Woche zu Opportunities konvertiert werden |
| **Validation Progress** | Prozentualer Fortschritt aller Validations-Stufen |
| **Evidence Funnel** | Wie viele Pain Signals → Opportunities → Ventures |
| **Opportunity Radar** | Tabelle aller Opportunities mit Score, Status, Confidence |

### 2.3 Schnellaktionen

- **CSV Import/Export:** Bulk-Daten importieren oder exportieren
- **Notification Center:** Unread-Badge für wichtige Ereignisse
- **Globale Suche:** `Strg+K` drücken für schnelle Suche

---

## 3. Ideen-Katalog

### 3.1 Zweck

Hier sammelst du alle SaaS-Ideen, bevor du sie zu Opportunities machst. Jede Idee durchläuft zunächst eine Grobvalidierung.

### 3.2 Felder

| Feld | Beschreibung |
|------|-------------|
| **Titel** | Kurzer, prägnanter Name |
| **Beschreibung** | Problem + Lösung in 2-3 Sätzen |
| **Status** | `draft` → `review` → `approved` → `rejected` → `converted` |
| **Score** | Vorläufige Bewertung (0-100) |
| **Quelle** | Woher kam die Idee? (z.B. "Kundengespräch", "Trend") |
| **Tags** | Für Filterung und Gruppierung |

### 3.3 Workflow

1. **Idee erfassen:** Titel + Beschreibung eintragen
2. **Grob-Scoring:** 0-100 Punkte vergeben
3. **Entscheidung:** `approved` oder `rejected`
4. **Konvertierung:** "→ Opportunity" klicken, um in Opportunity zu verwandeln

> **Tipp:** Bewahre auch schlechte Ideen auf! In 3 Monaten kann sich der Markt ändern.

---

## 4. Opportunities

Opportunities sind deine Hauptarbeitsfläche. Jede Opportunity hat **22 Tabs**, die den gesamten Validierungs- und Entwicklungsprozess abdecken.

### 4.1 Kopfzeile

- **Titel + Beschreibung:** Editable
- **Badges:** Status, Priorität, Typ, Confidence
- **Score A/B:** Große Zahlen mit Ampelfarben
- **Validation Required Box:** Gelbe Warnung, wenn Confidence < 0.5

### 4.2 Tab-Übersicht

#### A. Kern-Tabs (immer zuerst prüfen)

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Overview** | Zusammenfassung aller Daten | Gesamtbild prüfen |
| **Evidence** | Pain Signals + Belege | Verifiziert vs. Unverifiziert filtern |
| **Signals** | Automatisch gefundene Pain Signals | In Opportunity übernehmen |
| **Experiments** | A/B-Tests, Interviews, Pilots | Neues Experiment starten |
| **Claims** | Behauptungen + Belege | Claim erstellen + verifizieren |

#### B. Scoring & Bewertung

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Evaluate** | Manuelle Opportunity-Bewertung | Score vergeben |
| **Dedupe** | Duplikate finden | Ähnliche Opportunities mergen |
| **Score** | Detaillierte Score-Aufschlüsselung | Score A (10 Faktoren) + Score B (7 Faktoren) |
| **Auto Score** | Automatische Berechnung | "Neu berechnen" klicken |

#### C. Validation Engine

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Pipeline** | 13-Stufen State Machine | Aktuelle Stufe prüfen |
| **Validation** | 7-Stufen-Validierung | Stufe abschließen |
| **Stages** | Stage-Gating (N erst nach N-1) | Nächste Stufe freischalten |
| **Valid. Dim** | 5 Validations-Dimensionen | Problem, Buyer, Pricing, Distribution, Solution |

> **Stage-Gating:** Du kannst Stage 3 erst bearbeiten, wenn Stage 2 abgeschlossen UND Score ≥ Schwellenwert ist.

#### D. Agenten & Automatisierung

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Tasks** | Aufgaben-Queue | Task zuweisen + abschließen |
| **Agent Runs** | Agent-Ausführungen verfolgen | Status prüfen |
| **Auto Loop** | Experiment → Evidence → Score → Next | Automatischen Flow prüfen |

#### E. Markt & Wettbewerb

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Markt** | TAM/SAM/SOM | Marktgrößen eingeben |
| **Wettbewerb** | Competitor Matrix | Feature/Preis/UX-Vergleich |
| **GTM** | Go-to-Market Plan | Kanäle + Budget + Timeline |
| **Discovery** | Signal Discovery | Neue Pain Signals suchen |

#### F. Finanzen & Ökonomie

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Financials** | Finanzmodell | Revenue, Kosten, Profit, Break-Even |
| **Unit Econ** | Unit Economics | CAC, LTV, Payback |
| **Budget** | Budget Enforcement | Limits prüfen (Agent Runs, Evidence) |
| **Pricing** | Pricing A/B Tests | Varianten + Conversion Rates |

#### G. Produkt & Technik

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Solutions** | Lösungsvorschläge | Lösung auswählen |
| **MVP** | MVP-Checkliste | Tasks abhaken + Fortschritt |
| **Tech Rec** | Tech Stack Empfehlung | Layer + Alternativen |
| **Stack** | Tech Stack Konfiguration | Finale Auswahl treffen |

#### H. Kunden & Recherche

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Personas** | Persona Builder | ICP mit Pain Points, Goals, Quote |
| **Interview** | Interview Guide | Standard-Fragen nach Section |
| **Journey** | Customer Journey Map | 5 Phasen + Touchpoints |
| **Extern** | Externe Datenquellen | Crunchbase, G2, AppSumo, Trustpilot, ProductHunt |

#### I. Präsentation & Abschluss

| Tab | Zweck | Wichtigste Aktion |
|-----|-------|-------------------|
| **Pitch** | Pitch Deck Generator | 8 Slides editieren |
| **Memo** | Investment Memo | Handoff-Dokument |
| **Red Team** | Critic Review | Gegenargumente sammeln |
| **Metrics** | SaaS Metrics Dashboard | MRR, Churn, CAC, LTV, NPS |

#### J. Footer (immer sichtbar)

- **PDF Export Pitch Deck:** Druckdialog mit allen Slides
- **PDF Export Memo:** Druckdialog mit Investment Memo

---

## 5. Ventures

### 5.1 Übersicht

Ventures sind ausgereifte Opportunities, die den gesamten Validations-Prozess durchlaufen haben und nun als eigenständige SaaS-Produkte geführt werden.

### 5.2 Felder

| Feld | Beschreibung |
|------|-------------|
| **Name** | Venture-Name |
| **Status** | `ideation` → `validation` → `mvp` → `growth` → `scaled` |
| **MRR** | Aktueller monatlicher wiederkehrender Umsatz |
| **Churn** | Churn-Rate in % |
| **Team Size** | Aktuelle Teamgröße |

### 5.3 Unterseiten

- **Notes:** Freitext-Notizen zum Venture
- **ToDos:** Aufgabenliste mit Checkboxen
- **Investment Memo:** Zusammenfassung für Investoren

---

## 6. Templates & Galerie

### 6.1 Templates

Standard-Templates für wiederkehrende Aufgaben:
- Interview-Guide
- Pitch-Deck-Struktur
- Competitor-Research
- Validation-Plan

### 6.2 Template Galerie

Durchsuchbare Sammlung aller Templates mit:
- Kategorie-Filter
- Verwendungshistorie
- Tags

> **Tipp:** Erstelle eigene Templates für wiederkehrende Workflows.

---

## 7. Globale Funktionen

### 7.1 Globale Suche (`Strg+K`)

Suche über ALLE Entitäten hinweg:
- Opportunities (Titel, Beschreibung)
- Ideas (Titel, Beschreibung)
- Ventures (Name)
- Competitors (Name)

**Hotkey:** `Strg+K` (Windows/Linux) oder `Cmd+K` (Mac)

### 7.2 CSV Import/Export

**Export:**
1. Dashboard öffnen
2. CSV-Widget wählen
3. Typ wählen (Ideas, Opportunities)
4. "Exportieren" klicken

**Import:**
1. CSV-Datei vorbereiten (Header: `title,description,status,score`)
2. Datei auswählen
3. Typ wählen
4. "Importieren" klicken

> **Hinweis:** Import überspringt Duplikate nicht — vorher prüfen!

### 7.3 Mobile Navigation

Auf kleinen Screens (< 1024px):
- Tabs werden zu einem Dropdown-Menü
- Sidebar wird zu einem Hamburger-Menü
- Globale Suche bleibt über der Tabelle erreichbar

### 7.4 Notifications

Das Notification Center zeigt:
- Status-Änderungen
- Task-Reviews
- Budget-Alerts
- Validation-Completes

**Unread-Badge:** Orange Punkt neben der Glocke.

### 7.5 File Uploads

Jede Opportunity kann Dateien anhängen:
- Competitor-Logos
- Interview-Aufnahmen
- Pitch-Deck-Entwürfe

**Maximale Größe:** 10 MB pro Datei.

---

## 8. Workflows & Best Practices

### 8.1 Ideal-Weg: Von Idee zu Venture

```
Schritt 1: Idee im Ideen-Katalog erfassen (5 Min)
Schritt 2: Grob-Scoring (0-100) vergeben
Schritt 3: Wenn Score > 50: → Opportunity konvertieren
Schritt 4: Pain Signals im Evidence-Tab sammeln
Schritt 5: Marktgröße (TAM/SAM/SOM) eingeben
Schritt 6: Competitor Matrix ausfüllen
Schritt 7: Persona Builder: ICP definieren
Schritt 8: Interview Guide: 5+ Interviews führen
Schritt 9: Validation Stages: 1-7 durchlaufen
Schritt 10: Experiments: Paid Pilot oder A/B Test
Schritt 11: Auto-Score berechnen lassen
Schritt 12: Score A > 70 UND Score B > 60?
           ↓ JA
Schritt 13: Financial Model ausfüllen
Schritt 14: GTM Plan erstellen
Schritt 15: Tech Stack wählen
Schritt 16: MVP Checkliste erstellen
Schritt 17: Pitch Deck generieren
Schritt 18: Red Team Review durchführen
Schritt 19: → Venture konvertieren
```

### 8.2 Scoring-Richtlinien

**Score A (Opportunity Quality):**
- 0-40: Schwache Opportunity — mehr Research nötig
- 41-60: Mittlere Opportunity — validieren vor Weiterarbeit
- 61-80: Starke Opportunity — MVP entwickeln
- 81-100: Exzellente Opportunity — sofort Venture

**Score B (Venture Fit):**
- 0-40: Schlechter Fit — nicht für Venture geeignet
- 41-60: Moderater Fit — mit Vorsicht angehen
- 61-80: Guter Fit — Venture empfohlen
- 81-100: Perfekter Fit — sofort skalieren

### 8.3 Budget-Richtlinien

| Budget-Typ | Limit | Wofür |
|-----------|-------|-------|
| Quick Scan | 15 Min / 3 Runs / €100 | Erste Recherche |
| Deep Research | 120 Min / 12 Runs / €500 | Umfassende Analyse |

> **Warnung:** Wenn Budget erschöpft, wird die Action blockiert.

### 8.4 Naming Conventions

- **Ideas:** "Problem für Zielgruppe" (z.B. "Rechnungsverwaltung für Freelancer")
- **Opportunities:** Gleicher Name wie Idea + "Opportunity"-Suffix
- **Ventures:** Markenname (z.B. "InvoiceFlow")
- **Personas:** "Rolle + Name" (z.B. "Marketing Mike")

---

## 9. Troubleshooting

### 9.1 Build bricht

**Symptom:** `npm run build` zeigt Fehler.

**Lösungen:**
1. `npx prisma generate` ausführen (Client veraltet)
2. Auf JSX-Syntax prüfen (keine `+` in JSX-Blocks)
3. Node Modules löschen: `rm -rf node_modules && npm install`

### 9.2 DB-Verbindung fehlgeschlagen

**Symptom:** Prisma zeigt Connection Error.

**Lösung:**
- Port prüfen: `187.124.0.184:32845` (NICHT 32843)
- Password darf NICHT URL-encoded sein
- `.env.local` prüfen

### 9.3 Tabs überlappen auf Mobile

**Symptom:** Tab-Leiste ist abgeschnitten.

**Lösung:**
- `MobileTabNavigation` wird automatisch unter 1024px aktiviert
- Falls nicht: Seite neu laden

### 9.4 Score wird nicht berechnet

**Symptom:** Auto-Score zeigt 0.

**Lösung:**
- Pain Signals müssen existieren (mindestens 1)
- Assumptions müssen getestet sein
- Experiments müssen `completed` sein

### 9.5 CSV Import schlägt fehl

**Symptom:** "Unknown type" oder leere Ergebnisse.

**Lösung:**
- Header prüfen: `title,description,status,score`
- Keine leeren Zeilen
- Status-Werte: `draft`, `review`, `approved`, `rejected`, `converted`

### 9.6 File Upload funktioniert nicht

**Symptom:** Datei wird nicht gespeichert.

**Lösung:**
- Max 10 MB pro Datei
- `public/uploads/` muss existieren (wird automatisch erstellt)
- Nur Bilder und PDFs empfohlen

---

## Anhang A: Tastenkürzel

| Kürzel | Funktion |
|--------|----------|
| `Strg+K` | Globale Suche |
| `Strg+S` | Speichern (in Formularen) |
| `Esc` | Suche schließen / Dropdown schließen |
| `Tab` | Nächstes Feld |
| `Shift+Tab` | Vorheriges Feld |

## Anhang B: Status-Glossar

| Status | Bedeutung |
|--------|-----------|
| `draft` | Entwurf, noch nicht bearbeitet |
| `review` | In Prüfung |
| `approved` | Freigegeben |
| `rejected` | Abgelehnt |
| `converted` | Zu Opportunity/Venture umgewandelt |
| `untested` | Noch nicht validiert |
| `in_progress` | In Bearbeitung |
| `completed` | Abgeschlossen |

## Anhang C: Support

Bei Fragen oder Problemen:
1. Dieses Handbuch konsultieren
2. Skill `saas-venture-studio` laden
3. Git-History prüfen: `git log --oneline`

---

**Ende des Benutzerhandbuchs**
