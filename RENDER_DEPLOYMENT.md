# Deployment auf Render - Schritt für Schritt

## Voraussetzungen

✅ GitHub Repository ist eingerichtet und Code ist gepusht

## Schritt 1: Render Account erstellen

1. Gehe zu [render.com](https://render.com)
2. Erstelle einen Account (kostenlos mit GitHub-Login möglich)
3. Verbinde dein GitHub Account

## Schritt 2: Neuen Web Service erstellen

1. Klicke auf "New +" → "Web Service"
2. Wähle dein Repository: `HerrFlixel/FBL-VOTING-WEBSITE`
3. Klicke auf "Connect"

## Schritt 3: Service konfigurieren

### Basis-Einstellungen

- **Name**: `fbl-voting-website` (oder wie du möchtest)
- **Region**: Wähle die Region, die am nächsten zu deinen Nutzern ist (z.B. Frankfurt)
- **Branch**: `main` (oder dein Standard-Branch)
- **Root Directory**: (leer lassen, wenn Root)
- **Environment**: `Node`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`

### Plan auswählen

- **Starter Plan**: $7/Monat (empfohlen für den Start)
- **Free Plan**: Funktioniert auch, aber Service schläft nach 15 Min Inaktivität ein

### Environment Variables

Aktuell werden keine Environment Variables benötigt. Falls später benötigt, können diese hier hinzugefügt werden.

### Persistent Disk (WICHTIG!)

1. Scrolle nach unten zu "Persistent Disk"
2. Klicke auf "Add Persistent Disk"
3. **Name**: `fbl-voting-data`
4. **Mount Path**: `/opt/render/project/src`
5. **Size**: 1 GB (ausreichend für SQLite + Uploads)

⚠️ **WICHTIG**: Ohne Persistent Disk gehen alle Daten bei jedem Deployment verloren!

## Schritt 4: Service erstellen

1. Klicke auf "Create Web Service"
2. Render startet automatisch den Build-Prozess
3. Warte bis der Build erfolgreich ist (kann 5-10 Minuten dauern)

## Schritt 5: Datenbank initialisieren

Nach dem ersten erfolgreichen Deployment:

1. Öffne die Live-URL deines Services
2. Gehe zu `/admin`
3. Die Datenbank wird automatisch erstellt, wenn Prisma Client läuft
4. Falls Fehler auftreten, kannst du manuell initialisieren:
   - Öffne "Shell" in Render Dashboard
   - Führe aus: `npx prisma db push`

## Schritt 6: Erste Konfiguration

1. **Spieler importieren**: 
   - Admin → "Import Herren" / "Import Damen"
   - Excel-Dateien hochladen

2. **Trainer hinzufügen**:
   - Admin → "Trainer" Tab
   - Trainer manuell hinzufügen

3. **Schiedsrichter-Paare hinzufügen**:
   - Admin → "Schiedsrichter" Tab (falls vorhanden)
   - Paare hinzufügen

4. **Teams für Formular**:
   - Admin → "Teams" Tab
   - Teams hinzufügen, die im Abschlussformular erscheinen sollen

## Schritt 7: Custom Domain (Optional)

1. In Render Dashboard → Settings → Custom Domains
2. Domain hinzufügen
3. DNS-Einträge bei deinem Domain-Provider konfigurieren

## Troubleshooting

### Build schlägt fehl

- Prüfe die Build-Logs in Render
- Stelle sicher, dass alle Dependencies in `package.json` sind
- Prüfe, ob Node.js Version kompatibel ist (Render verwendet standardmäßig Node 18+)

### Datenbank-Fehler

- Stelle sicher, dass Persistent Disk korrekt gemountet ist
- Prüfe, ob `prisma generate` im Build Command enthalten ist
- Führe `npx prisma db push` in der Shell aus

### Uploads funktionieren nicht

- Stelle sicher, dass Persistent Disk gemountet ist
- Prüfe, ob `/public/uploads/` Verzeichnis existiert
- Prüfe Dateiberechtigungen

### Service schläft ein (Free Plan)

- Starter Plan verwenden ($7/Monat)
- Oder Service manuell aufwecken (kann 30-60 Sekunden dauern)

## Wartung

### Updates deployen

- Einfach neuen Code zu GitHub pushen
- Render deployt automatisch (wenn Auto-Deploy aktiviert ist)
- Oder manuell "Manual Deploy" im Dashboard

### Backups

- SQLite-Datenbank liegt auf Persistent Disk
- Regelmäßige Backups empfohlen (über Shell: `cp prisma/dev.db backup.db`)

### Logs

- Logs sind im Render Dashboard unter "Logs" einsehbar
- Nützlich für Debugging

## Kosten

- **Starter Plan**: $7/Monat (empfohlen)
- **Free Plan**: Kostenlos, aber Service schläft nach Inaktivität ein
- **Persistent Disk**: Inkludiert im Plan

## Support

Bei Problemen:
1. Render Logs prüfen
2. Render Shell für manuelle Befehle nutzen
3. Render Support kontaktieren

