# Diagnose: FBL Allstar Voting – Zuverlässigkeit & Datenbank

**Stand:** März 2025

## 1. Build & Lint

| Check | Status |
|-------|--------|
| `npm run build` | ✅ Erfolgreich (Next.js + Prisma) |
| `npx prisma validate` | ✅ Schema gültig |
| `npm run lint` | ⚠️ ESLint interaktiv (noch nicht konfiguriert) – optional `next lint` mit gewählter Config ausführen |

**Fazit:** Projekt baut sauber, Prisma-Schema ist konsistent.

---

## 2. Datenbank

- **Provider:** SQLite (`prisma/schema.prisma`, `DATABASE_URL` in `.env`)
- **Pfad:** Wird über `lib/paths.ts` / `lib/prisma.ts` gesetzt; falls `DATABASE_URL` fehlt, wird eine lokale Datei verwendet.

### Vote-Modelle und Eindeutigkeit

Alle relevanten Vote-Tabellen haben **Unique-Constraints**, sodass pro Voter pro Kategorie keine doppelten Einträge entstehen:

| Modell | Unique-Constraint | Zweck |
|--------|-------------------|--------|
| MVPVote | `@@unique([voterId, league, rank, userId])` | Ein Vote pro Rang pro Liga |
| CoachVote | `@@unique([voterId, league, userId])` | Ein Trainer-Vote pro Liga |
| FairPlayVote | `@@unique([voterId, league, userId])` | Ein Fair-Play-Vote pro Liga |
| RookieVote | `@@unique([voterId, league, userId])` | Ein Rookie-Vote pro Liga |
| RefereePairVote | `@@unique([voterId, userId])` | Ein Schiri-Vote gesamt |
| SpecialAwardVote | `@@unique([voterId, userId])` | Ein Sonderpreis-Vote |
| AllstarVote | `@@unique([voterId, league, line, position, userId])` | Ein Vote pro Position/Zeile/Liga |

**Speicherlogik:**

- Votes werden zunächst mit `userId: null` gespeichert (nur `voterId` + `voterIp`).
- Beim Abschluss des Formulars (`/api/users/finalize`) wird ein `User` angelegt und alle bisherigen Votes dieser `voterId` mit `userId` verknüpft.
- In der Admin-Ansicht und in allen **Ergebnis-APIs** wird nur gezählt, wo `userId: { not: null }` (nur finalisierte Votes).

**Fazit:** Datenmodell ist stimmig, Doppel-Votes werden durch die DB verhindert, Ergebnisse basieren konsistent auf finalisierten Votes.

---

## 3. Vote-Speicherung (APIs)

### voterId und Header

- **Server:** `lib/voter.ts` – `getVoterInfo()` liest `x-voter-id` aus den Request-Headern. Fehlt der Header, wird `voterId = ip + userAgent` verwendet.
- **Client:** `components/client-voter.ts` – `getClientVoterId()` legt eine stabile ID in `sessionStorage`, `fetchWithVoterId()` setzt den Header `x-voter-id` bei allen Vote- und Finalize-Requests.

Alle Voting-Seiten (Allstar, MVP, Coach, Fair Play, Rookie, Schiri, Sonderpreis) und das Abschlussformular nutzen **`fetchWithVoterId`** für die relevanten API-Aufrufe. Die Votes werden damit dem gleichen Voter zugeordnet.

### clear-session (Sicherheit)

- **Problem:** Wenn `voterId` fehlt, wurde bisher mit `{ userId: null }` gefiltert – das würde **alle** nicht finalisierten Votes löschen.
- **Anpassung:** Es wird nur noch gelöscht, wenn eine gültige `voterId` (nicht leer) vorhanden ist. Sonst: sofortiger Erfolg ohne Löschung. So ist ein versehentliches Massenlöschen ausgeschlossen.

---

## 4. Admin-Übersicht & Ergebnis-APIs

Die Admin-Seite ruft für jede Kategorie die passenden Result-Routen auf:

| Tab | API | Filter |
|-----|-----|--------|
| Allstar Herren/Damen | `GET /api/allstar-votes/results?league=` | `userId: { not: null }` |
| MVP Herren/Damen | `GET /api/mvp-votes/results?league=` | `userId: { not: null }` |
| Trainer Herren/Damen | `GET /api/coach-votes/results?league=` | `userId: { not: null }` |
| Fair Play Herren/Damen | `GET /api/fairplay-votes/results?league=` | `userId: { not: null }` |
| Rookie Herren/Damen | `GET /api/rookie-votes/results?league=` | `userId: { not: null }` |
| Schiedsrichter | `GET /api/referee-votes/results` | `userId: { not: null }` |
| Sonderpreis | `GET /api/special-award-votes/results` | `userId: { not: null }` |

Alle Ergebnis-Routen lesen nur finalisierte Votes (`userId` gesetzt). Die Anzeige in der Admin-Übersicht entspricht damit den gespeicherten, abgegebenen Stimmen.

---

## 5. Gleichzeitige Voter (Concurrency)

- **SQLite:** Erlaubt nur **einen Schreibvorgang** zur gleichen Zeit. Bei vielen parallelen Requests können `SQLITE_BUSY` / „database is locked“ auftreten.
- **Finalize:** `/api/users/finalize` nutzt bereits:
  - **Retry** mit exponentiellem Backoff (bis zu 3 Versuche bei Lock),
  - **Transaktion** (alle User-Erstellung + Vote-Updates atomar),
  - **Doppel-Check** (keine doppelte Finalisierung pro voterId),
  - **Timeout** (10 s) für die Transaktion.

**Alle Vote-POST-Routen** (Allstar, MVP, Coach, Fair Play, Rookie, Schiri, Sonderpreis) nutzen inzwischen die gemeinsame **Retry-Logik** aus `lib/db-retry.ts` (withDbRetry) für das Schreiben. Bei SQLite-Lock wird bis zu 3× mit exponentiellem Backoff wiederholt.

**Langfristig:** Für sehr hohe gleichzeitige Last ggf. PostgreSQL o. Ä. erwägen (bessere Schreib-Concurrency als SQLite).

---

## 6. Kurz-Checkliste

| Thema | Status |
|-------|--------|
| Build & Prisma | ✅ OK |
| Schema & Unique-Constraints | ✅ OK |
| voterId-Header überall bei Votes | ✅ OK (fetchWithVoterId) |
| Nur finalisierte Votes in Ergebnissen | ✅ OK (überall userId: { not: null }) |
| clear-session ohne Massenlöschen | ✅ Behoben (nur mit voterId) |
| Finalize atomar + Retry | ✅ OK |
| Retry bei Vote-Schreibzugriffen | ✅ withDbRetry in allen Vote-POST-Routen |

**Fazit:** Die Website speichert Votes zuverlässig, ordnet sie korrekt dem Voter zu und zeigt in der Admin-Übersicht nur finalisierte Stimmen an. Bei sehr vielen gleichzeitigen Votern kann SQLite Limits haben; die kritische Finalisierung ist bereits abgesichert.
