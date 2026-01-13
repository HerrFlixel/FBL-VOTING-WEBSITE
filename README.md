# FBL Allstar Voting Website

Voting-Website für die 1. Floorball Bundesliga (Herren & Damen).

## Features

- **Allstar Team Voting**: Wähle dein Allstar-Team mit 3 Reihen
- **MVP Voting**: Wähle deine Top 10 MVP-Kandidaten
- **Trainer des Jahres**: Wähle den besten Trainer
- **Fair Play Award**: Wähle den Fair Play Gewinner
- **Schiedsrichter-Paar Voting**: Wähle das beste Schiedsrichter-Paar
- **Sonderpreis**: Freitext-Eingabe für Sonderpreis
- **Cross-League Voting**: Möglichkeit für beide Ligen zu voten
- **Admin-Bereich**: Vollständige Verwaltung von Spielern, Trainern, Teams und Ergebnissen

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Prisma ORM** mit SQLite
- **Tailwind CSS**
- **React**

## Lokale Entwicklung

### Voraussetzungen

- Node.js 18+ 
- npm oder yarn

### Installation

```bash
# Dependencies installieren
npm install

# Prisma Client generieren
npx prisma generate

# Datenbank initialisieren (optional - erstellt leere DB)
npx prisma db push

# Development Server starten
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000)

## Deployment auf Render

### Vorbereitung

1. Repository auf GitHub pushen
2. Auf [Render.com](https://render.com) einloggen
3. Neuen Web Service erstellen

### Render-Konfiguration

1. **Service Type**: Web Service
2. **Build Command**: `npm install && npx prisma generate && npm run build`
3. **Start Command**: `npm start`
4. **Environment**: Node
5. **Plan**: Starter (oder höher für mehr Ressourcen)

### Wichtige Hinweise für Render

- **Persistentes Dateisystem**: Render bietet persistentes Dateisystem für SQLite und Uploads
- **Database**: Die SQLite-Datei wird im Projektverzeichnis gespeichert
- **Uploads**: Bilder werden in `/public/uploads/players` gespeichert

### Environment Variables

Aktuell werden keine Environment Variables benötigt. Falls später benötigt, können diese in Render unter "Environment" hinzugefügt werden.

### Nach dem Deployment

1. Admin-Bereich aufrufen: `/admin`
2. Spieler importieren: "Import Herren" / "Import Damen" Tabs
3. Trainer hinzufügen: "Trainer" Tab
4. Schiedsrichter-Paare hinzufügen: "Schiedsrichter" Tab (falls vorhanden)
5. Teams für Formular hinzufügen: "Teams" Tab

## Projektstruktur

```
├── app/                    # Next.js App Router Seiten
│   ├── admin/              # Admin-Bereich
│   ├── allstar-voting/     # Allstar Team Voting
│   ├── mvp-voting/         # MVP Voting
│   ├── coach-voting/       # Trainer Voting
│   ├── fair-play-voting/   # Fair Play Voting
│   ├── referee-voting/     # Schiedsrichter Voting
│   ├── special-award/      # Sonderpreis
│   ├── user-form/          # Abschlussformular
│   └── api/                # API Routes
├── components/             # React Komponenten
│   └── admin/              # Admin Komponenten
├── lib/                    # Utilities
│   ├── prisma.ts           # Prisma Client
│   └── voter.ts            # Voter Utilities
├── prisma/                 # Prisma Schema
│   └── schema.prisma       # Datenbank Schema
└── public/                 # Statische Dateien
    ├── fonts/              # Schriftarten
    └── uploads/            # Hochgeladene Bilder
```

## Datenbank

Die App verwendet SQLite mit Prisma ORM. Die Datenbankdatei ist `prisma/dev.db`.

### Schema

- **Player**: Spieler mit Stats
- **Coach**: Trainer
- **RefereePair**: Schiedsrichter-Paare
- **Team**: Teams (für Formular)
- **User**: Finalisierte Voter
- **AllstarVote**: Allstar Team Votes
- **MVPVote**: MVP Votes
- **CoachVote**: Trainer Votes
- **FairPlayVote**: Fair Play Votes
- **RefereePairVote**: Schiedsrichter Votes
- **SpecialAwardVote**: Sonderpreis Votes

## Voting-Flow

1. Splitscreen (Herren/Damen wählen)
2. Allstar Team Voting
3. MVP Voting
4. Trainer des Jahres
5. Fair Play Award
6. Cross-League Abfrage (optional)
7. Schiedsrichter-Paar Voting
8. Sonderpreis
9. User-Form (Name, Team)
10. Thank-You Seite

## Admin-Bereich

- **Import**: Excel-Import für Spieler
- **Spieler**: Verwaltung aller Spieler
- **Trainer**: Verwaltung aller Trainer
- **Teams**: Verwaltung der Teams für das Formular
- **Ergebnisse**: Ergebnisse für alle Kategorien
- **Voter-Verwaltung**: Verwaltung aller Voter und deren Votes

## Lizenz

Privat

