# QA-Bericht: SaaS Venture Studio
## Vollständiger Systemtest — 07.10.2026

---

## Zusammenfassung

| Kategorie | Anzahl | Status |
|-----------|--------|--------|
| 🔴 Kritisch | 3 | Sofort beheben |
| 🟡 Hoch | 5 | Nächster Sprint |
| 🟢 Mittel | 4 | Backlog |
| 🔵 Niedrig | 3 | Optional |

**Gesamtergebnis: 15 Probleme gefunden, 55% API-Erreichbarkeit**

---

## 🔴 KRITISCHE PROBLEME (P0)

### 1. /ideas Seite zeigt KEINE Ideen (leeres Array)

**Beschreibung:**
Die `/ideas` Seite und ihre API (`/api/ideas`) liefern ein leeres Array, obwohl 216 Ideen in der Datenbank existieren.

**Reproduktion:**
1. App öffnen → Sidebar → "Ideen" klicken
2. Seite zeigt "Keine Ideen" oder leere Liste
3. API-Call: `GET /api/ideas` → `[]`

**Erwartetes Verhalten:**
`/api/ideas` sollte alle 216 Ideen zurückgeben (oder paginiert)

**Tatsächliches Verhalten:**
- Dashboard Stats: 216 Ideen
- Ideenscout API: 20 Ideen (erste Seite)
- Ideas API: **0 Ideen**

**Ursache:**
`app/api/ideas/route.ts` ist entweder leer oder gibt falsches Format zurück. Möglicherweise fehlt die Implementierung oder es gibt einen Prisma-Fehler.

**Lösung:**
- `/api/ideas` umstellen auf `prisma.businessIdea.findMany()` mit gleichem Format wie Ideenscout
- ODER: `/ideas` Seite direkt auf `/api/ideenscout` umleiten

**Priorität:** 🔴 Kritisch — Nutzer kann keine Ideen sehen

---

### 2. Ideen-Zählung inkonsistent (3 verschiedene Zahlen)

**Beschreibung:**
Verschiedene APIs zeigen unterschiedliche Ideen-Zahlen, was Verwirrung beim Nutzer erzeugt.

**Reproduktion:**
1. Dashboard öffnen → zeigt "216 Ideen"
2. IdeenScout öffnen → zeigt nur 20 Ideen (erste Seite)
3. Ideen-Seite öffnen → zeigt 0 Ideen

**Erwartetes Verhalten:**
Alle Stellen zeigen dieselbe Anzahl (oder logische Unterschiede wie "216 gesamt, 20 auf dieser Seite")

**Tatsächliches Verhalten:**
| Quelle | Anzahl |
|--------|--------|
| Dashboard Stats | 216 |
| Ideenscout API | 20 (nur Seite 1) |
| Ideas API | 0 |

**Ursache:**
- Dashboard: `prisma.businessIdea.count()` → 216
- Ideenscout: `findMany({ take: 20 })` → 20
- Ideas API: `findMany()` mit falschem Filter oder leeres Array

**Lösung:**
1. Ideenscout zeigt "216 Ideen (20 auf dieser Seite)"
2. Ideas API korrigieren
3. Einheitliche Zählung über alle Frontends

**Priorität:** 🔴 Kritisch — Verwirrend für Nutzer

---

### 3. Opportunities Liste zeigt falsche Gate-/Assumption-Zahlen

**Beschreibung:**
Die Opportunity-Liste zeigt 0 Gates, 0 Assumptions, 0 Experiments — obwohl die Detail-Seite 4 Gates, 4 Assumptions, 3 Experiments anzeigt.

**Reproduktion:**
1. `/opportunities` öffnen
2. Erste Opportunity anschauen → zeigt "Gates: 0"
3. Auf die Opportunity klicken → Detail zeigt "Gates: 4"

**Erwartetes Verhalten:**
Liste und Detail zeigen identische Werte

**Tatsächliches Verhalten:**
| Ansicht | Gates | Assumptions | Experiments |
|---------|-------|-------------|-------------|
| Liste | 0 | 0 | 0 |
| Detail | 4 | 4 | 3 |

**Ursache:**
- Liste (`/api/opportunities`): Keine `include: { gates, assumptions }` im Prisma Query
- Detail (`/api/opportunities/[id]`): Hat `include: { gates, assumptions, experiments }`

**Lösung:**
Liste erweitern um `include: { gates: true, assumptions: true, experiments: true }` — aber Performance beachten (lazy loading)

**Priorität:** 🔴 Kritisch — Vertrauensverlust beim Nutzer

---

## 🟡 HOHE PROBLEME (P1)

### 4. /portfolio Seite existiert nicht (404 im Menü)

**Beschreibung:**
"Portfolio" ist im Sidebar-Menü verlinkt, aber die Seite existiert nicht.

**Reproduktion:**
1. Sidebar öffnen
2. Auf "Portfolio" klicken
3. 404 Fehlerseite

**Erwartetes Verhalten:**
Portfolio-Seite zeigt bestehende Ventures/MRR

**Tatsächliches Verhalten:**
HTTP 404 — Seite nicht gefunden

**Lösung:**
- Entweder Portfolio-Seite erstellen (`app/(app)/portfolio/page.tsx`)
- ODER aus Sidebar entfernen

**Priorität:** 🟡 Hoch — Menü-Eintrag ohne Funktion

---

### 5. /admin Seite möglicherweise nicht vorhanden

**Beschreibung:**
"Admin" ist im Sidebar-Menü, aber die Seite existiert möglicherweise nicht.

**Reproduktion:**
1. Sidebar → "Admin" klicken
2. Prüfen ob Seite lädt

**Status:** HTTP 307 (Redirect zu Login) — nicht eindeutig ob Seite existiert

**Lösung:**
Prüfen ob `app/(app)/admin/page.tsx` existiert. Falls nicht: Erstellen oder entfernen.

**Priorität:** 🟡 Hoch

---

### 6. Deutsche Übersetzung unvollständig (nur ~30%)

**Beschreibung:**
Nur ein Teil der Ideen ist auf Deutsch. Viele Titel bleiben auf Englisch.

**Reproduktion:**
1. IdeenScout öffnen
2. Titel der Ideen prüfen
3. Einige sind Deutsch, andere Englisch

**Beispiel:**
- 🇩🇪 "Wie funktionieren JavaScript-Verschlüsse?"
- 🇬🇧 "How to remove a property from a JavaScript object..."
- 🇬🇧 "var functionName = function() {} vs function functionName()..."

**Ursache:**
- MyMemory API hat Limit von 500 Zeichen pro Request
- Bei Überschreitung kommt "QUERY LENGTH LIMIT EXCEEDED"
- Fallback zu Offline-Keyword-Übersetzung (grammatikalisch falsch)

**Lösung:**
1. Chunking für lange Texte verbessern (bereits implementiert)
2. Timeout erhöhen für Übersetzung
3. Fallback verbessern

**Priorität:** 🟡 Hoch — Nutzer erwartet durchgängig Deutsch

---

### 7. Scrape-Real API timed out (60s+)

**Beschreibung:**
Der Scraper braucht über 60 Sekunden für 20 Ideen — Vercel hat 60s Timeout.

**Reproduktion:**
1. `POST /api/ideenscout/scrape-real` mit `{"maxIdeas": 20}`
2. Request läuft in Timeout

**Erwartetes Verhalten:**
Schnelle Antwort (< 10s) oder asynchrone Verarbeitung

**Tatsächliches Verhalten:**
- 887 Signale scrapen + übersetzen + speichern → 60s+

**Lösung:**
1. Asynchrone Verarbeitung (Queue)
2. ODER: Scraper auf 5-10 Ideen limitieren
3. ODER: Nur neue Quellen scrapen, nicht alle

**Priorität:** 🟡 Hoch — Cron-Jobs funktionieren, aber manuelles Triggern schwierig

---

### 8. Notifications API liefert 0 Alerts

**Beschreibung:**
Die Notifications API zeigt keine Alerts, obwohl Pipeline läuft und Opportunities scored werden.

**Reproduktion:**
1. `GET /api/dashboard/notifications`
2. Antwort: `[]`

**Erwartetes Verhalten:**
Alerts für Pipeline-Aktionen, neue Opportunities, etc.

**Tatsächliches Verhalten:**
Leeres Array

**Ursache:**
AutomationLogs werden möglicherweise nicht korrekt geschrieben oder abgefragt.

**Lösung:**
Prüfen ob `automationLogs` in Pipeline korrekt erstellt werden

**Priorität:** 🟡 Hoch — Nutzer sieht keine Aktivität

---

## 🟢 MITTLERE PROBLEME (P2)

### 9. Deduplicate API Response unklar

**Beschreibung:**
Die Deduplicate-API gibt `stats` und `funnel` zurück, aber keinen eindeutigen Status.

**Reproduktion:**
1. `GET /api/opportunities/{id}/signals/deduplicate`
2. Response: `{ stats: {...}, funnel: {...} }`

**Frage:**
Ist das ein Stats-Endpunkt oder ein Action-Endpunkt? Naming ist verwirrend.

**Lösung:**
- GET → Stats zurückgeben (wie jetzt)
- POST → Deduplizierung ausführen und Ergebnis zurückgeben

**Priorität:** 🟢 Mittel

---

### 10. Formular-Validierung unvollständig

**Beschreibung:**
Beim Hinzufügen einer Quelle ist URL optional — aber der Scraper braucht eine URL.

**Reproduktion:**
1. ScoutSourcesManager öffnen
2. Neue Quelle hinzufügen mit Name + Slug, aber OHNE URL
3. POST erfolgreich
4. Scraper kann Quelle nicht verarbeiten

**Erwartetes Verhalten:**
URL ist Pflichtfeld

**Tatsächliches Verhalten:**
POST ohne URL wird akzeptiert

**Lösung:**
URL als Pflichtfeld markieren und validieren

**Priorität:** 🟢 Mittel

---

### 11. 1 Opportunity nicht "scored"

**Beschreibung:**
Von 19 Opportunities ist eine im Status "build_approved" statt "scored".

**Reproduktion:**
1. `GET /api/opportunities`
2. Prüfe Status-Feld

**Erwartetes Verhalten:**
Alle Opportunities sollten "scored" sein (laut User-Wunsch)

**Tatsächliches Verhalten:**
18 × "scored", 1 × "build_approved"

**Lösung:**
Pipeline-Einstellung prüfen — auto-convert sollte alle durchführen

**Priorität:** 🟢 Mittel

---

### 12. Score-Trend nur 6 Snapshots

**Beschreibung:**
Nur 6 historische Snapshots vorhanden — Trend-Analyse ist daher wenig aussagekräftig.

**Erwartetes Verhalten:**
Mindestens 30 Tage Historie

**Tatsächliches Verhalten:**
Nur 6 Snapshots → Kurze Zeitspanne

**Lösung:**
Snapshot-Cron läuft täglich um 3 Uhr — einfach warten oder manuell weitere Snapshots erstellen

**Priorität:** 🟢 Mittel

---

## 🔵 NIEDRIGE PROBLEME (P3)

### 13. Auth-Redirect (307) auf allen Seiten

**Beschreibung:**
Alle Seiten ohne Auth redirecten zu Login. Das ist technisch korrekt, aber UX könnte verbessert werden.

**Lösung:**
- Public Landing Page erstellen
- ODER: Demo-Modus ohne Auth

**Priorität:** 🔵 Niedrig

---

### 14. Dashboard Stats API zeigt ventures=1

**Beschreibung:**
Nur 1 Venture im Dashboard, obwohl 19 Opportunities existieren. Keine davon wurde zu Ventures konvertiert.

**Lösung:**
Konvertierungs-Workflow prüfen — warum Opportunities → Ventures nicht funktioniert

**Priorität:** 🔵 Niedrig

---

### 15. Keine Competitors in Opportunities

**Beschreibung:**
Alle Opportunities zeigen 0 Competitors, obwohl Pipeline-Schritt "Competitors" existiert.

**Lösung:**
Prüfen ob Competitor-Research in Pipeline korrekt implementiert ist

**Priorität:** 🔵 Niedrig

---

## Empfohlene Priorisierung

| Priorität | Problem | Aufwand | Impact |
|-----------|---------|---------|--------|
| P0 | /ideas zeigt keine Ideen | 30min | 🔥🔥🔥 |
| P0 | Ideen-Zählung inkonsistent | 30min | 🔥🔥🔥 |
| P0 | Opp Liste/Detail inkonsistent | 45min | 🔥🔥🔥 |
| P1 | Portfolio-Seite fehlt | 1h | 🔥🔥 |
| P1 | Deutsche Übersetzung | 1h | 🔥🔥 |
| P1 | Scraper Timeout | 1h | 🔥🔥 |
| P1 | Notifications leer | 30min | 🔥🔥 |
| P2 | Deduplicate API unklar | 15min | 🔥 |
| P2 | Formular-Validierung | 15min | 🔥 |
| P2 | Opportunity Status | 15min | 🔥 |

---

## Empfehlung

**Sofort beheben (P0):**
1. `/api/ideas` reparieren oder auf `/api/ideenscout` umleiten
2. `Opportunities.findMany()` um `include` erweitern
3. Ideen-Zählung vereinheitlichen

**Nächster Sprint (P1):**
4. Portfolio-Seite erstellen oder aus Menü entfernen
5. Deutsche Übersetzung verbessern
6. Scraper Timeout fixen
7. Notifications aktivieren

Die App ist technisch stabil (Build sauber, APIs erreichbar), hat aber **UX-Probleme**, die den Nutzer verwirren können.
