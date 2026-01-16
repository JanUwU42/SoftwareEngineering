# ONBOARDING-DOKUMENT - SMARTBUILDERS PORTAL

Willkommen im Entwicklerteam von SmartBuilders! Dieses Dokument hilft dir,
die Projektarchitektur zu verstehen und schnell produktiv zu werden.

---

## 1. Systemarchitektur

### 1.1 Überblick

Das SmartBuilders Portal ist eine Webanwendung zur Verwaltung von Bauprojekten.
Es ermöglicht Kunden den Projektfortschritt zu verfolgen und Mitarbeitern die
Projekte zu verwalten.

**Technologie-Stack:**

| Bereich | Technologie |
|---------|-------------|
| Frontend | Svelte |
| Styling | TailwindCSS |
| Backend | SvelteKit + Node.js |
| Datenbank | PostgreSQL |
| ORM | Prisma |
| Deployment | Vercel |
| Codeverwaltung & Projektmanagement | GitHub |

### 1.2 Architekturdiagramm

![Datenbank-Diagramm](prisma/database-diagram.drawio.png)

### 1.3 Angrenzende Systeme

- **Vercel:** Hosting und Deployment-Plattform

### 1.4 Benutzerrollen

Das System unterstützt drei Rollen:

| Rolle | Beschreibung |
|-------|--------------|
| **ADMIN** | Vollzugriff auf alle Funktionen inkl. Benutzerverwaltung |
| **INNENDIENST** | Projektverwaltung und Freigabe von Handwerker-Updates |
| **HANDWERKER** | Statusupdates, Foto-Uploads und Materialanforderungen |

Zusätzlich gibt es einen Kunden-Zugang über Auftragsnummer + Kundenname.

![Anwendungsfalldiagramm](AnwendungsfallDiagramm.png)

---

## 2. Architektur- und Entwurfsmuster

### 2.1 SvelteKit Routing-Konventionen

Das Projekt folgt der SvelteKit File-Based Routing Struktur:

```
src/routes/
├── +page.svelte           # UI-Komponente
├── +page.server.ts        # Server-seitige Load-Funktion + Form Actions
├── +layout.svelte         # Shared Layout
├── /admin/neu             # Route
└── /projekt/[id]/         # Dynamische Routen mit Parametern
```

> **Konvention:** Server-Only Code gehört in `+page.server.ts` oder `$lib/server/`

### 2.2 Datenfluss-Muster

1. **Load-Funktion (+page.server.ts):**
   - Lädt Daten serverseitig
   - Gibt typisierte Props an die Page-Komponente

2. **Form Actions:**
   - POST-Requests werden über SvelteKit Actions verarbeitet
   - Validierung erfolgt serverseitig
   - Rückgabe via `fail()` oder `redirect()`

**Beispiel:**

```typescript
// +page.server.ts
export const load = async ({ locals }) => {
  const projekte = await prisma.projekt.findMany();
  return { projekte };
};

export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    // Validierung & DB-Operation
  }
};
```

### 2.3 Session-basierte Authentifizierung

- Sessions werden in der Datenbank gespeichert (Session-Tabelle)
- Cookie-basierte Session-ID (httpOnly, secure)
- Server-Hooks (`hooks.server.ts`) laden Session bei jedem Request
- Zugriff auf Session-Daten via `event.locals.user` oder `event.locals.projekt`

### 2.4 Komponentenstruktur

```
src/lib/
├── components/     # Wiederverwendbare Svelte-Komponenten
│   ├── ProjectMetadataCard.svelte
│   └── ProjectTimeline.svelte
├── server/         # Nur Server-seitiger Code
│   ├── prisma.ts   # Datenbankverbindung
│   ├── auth.ts     # Session-Funktionen
│   └── email.ts    # E-Mail-Service (Aktuell noch nicht in Betrieb)
└── types/          # TypeScript Type-Definitionen
```

---

## 3. Einrichtung der Entwicklungsumgebung

### 3.1 Voraussetzungen

- Node.js >= 22.x
- pnpm (Package Manager)
- PostgreSQL >= 14
- Git

### 3.2 Projekt klonen und Dependencies installieren

```bash
git clone git@github.com:JanUwU42/SoftwareEngineering.git
cd SoftwareEngineering
pnpm install
```

### 3.3 Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Projektroot:

```env
# Datenbankverbindung (eine der folgenden)
DATABASE_URL="postgresql://user:password@localhost:5432/smartbuilders"
# ODER für Vercel Postgres:
# POSTGRES_URL="..."
# POSTGRES_URL_NON_POOLING="..."

# Optional: SMTP für E-Mail-Versand
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="secret"
SMTP_FROM="noreply@smartbuilders.de"
```

> **Hinweis:** Ohne SMTP-Konfiguration werden E-Mails in der Konsole ausgegeben.

### 3.4 Datenbank einrichten

```bash
# Prisma Client generieren
pnpm prisma generate

# Datenbankschema anwenden (Migrationen)
pnpm prisma migrate dev

# ODER für bestehende Datenbank ohne Migrationen:
pnpm prisma db push
```

### 3.5 Entwicklungsserver starten

```bash
pnpm run dev
```

Der Server startet auf http://localhost:5173

Alternative mit automatischem Browser-Öffnen:

```bash
pnpm run dev --open
```

### 3.6 Verfügbare NPM-Scripts

| Script | Beschreibung |
|--------|--------------|
| `pnpm dev` | Entwicklungsserver mit HMR |
| `pnpm build` | Produktions-Build erstellen |
| `pnpm preview` | Produktions-Build lokal testen |
| `pnpm check` | TypeScript Typ-Prüfung |
| `pnpm lint` | ESLint + Prettier Prüfung |
| `pnpm format` | Code automatisch formatieren |

---

## 4. Database Seeding (Testdaten)

### 4.1 Seed-Script ausführen

Das Projekt enthält ein umfangreiches Seed-Script unter `prisma/seed.ts`.

```bash
# Testdaten einspielen
pnpm tsx prisma/seed.ts

# ODER via Prisma CLI
pnpm prisma db seed
```

### 4.2 Was das Seed-Script erstellt

1. **Löscht alle bestehenden Daten** (für idempotentes Seeding)

2. **Erstellt Benutzer:**
   - Admin: `admin@smartbuilders.de` / `geheim123`
   - Handwerker: `bob@smartbuilders.de` / `geheim123`

3. **Erstellt Materialien mit Beständen:**
   - Wandfliesen Weiß 30x60 (100 m²)
   - Flexkleber (5 Sack)
   - Kupferrohr 15mm (0 m - leer)
   - Spax Schrauben 4x40 (50 Paket)

4. **Erstellt ein Test-Projekt:**
   - Auftragsnummer: `2025-SB-TEST`
   - Kundenname: `Testkunde GmbH`
   - Mit Adresse, Schritten und Materialzuweisungen

### 4.3 Datenbank zurücksetzen

```bash
# Alle Tabellen leeren und neu seeden
pnpm prisma migrate reset
```

> ⚠️ **Achtung:** Löscht ALLE Daten und führt Migrationen + Seed erneut aus!

---

## 5. Entwicklungsprozess und Workflow

### 5.1 Branching-Modell (GitHub Flow-basiert)

Wir arbeiten mit einem vereinfachten Git Flow:

```
main
  │
  ├── feature/XXX     # Neue Features
  │
  └── bug/YYY         # Parallele Bug-Entwicklung
```

**Branch-Namenskonventionen:**
- `feat/<ticket-nr>` (z.B. `feat/#42`)
- `bug/<ticket-nr>` (z.B. `bug/#90`)

### 5.2 Workflow für neue Features

1. **Aktuellen main-Branch pullen:**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Feature-Branch erstellen:**
   ```bash
   git checkout -b feat/#XY
   ```

3. **Änderungen implementieren mit regelmäßigen Commits:**
   ```bash
   git add .
   git commit -m "feat: Kurze Beschreibung der Änderung"
   ```

4. **Branch pushen und Pull Request erstellen:**
   ```bash
   git push -u origin feat/#XY
   ```

5. **Nach Code-Review:** Merge in main

### 5.3 Code-Review Prozess

Jeder Pull Request muss vor dem Merge reviewed werden:

1. **Pull Request erstellen:**
   - Aussagekräftiger Titel
   - Beschreibung: Was wurde geändert und warum?

2. **Automatische Checks:**
   - `pnpm lint` (ESLint + Prettier)
   - `pnpm check` (TypeScript)
   - Build muss erfolgreich sein

3. **Nach Approval:**
   - Merge
   - Feature-Branch nach Merge löschen

---

## Quick Reference

### Lokaler Start (Entwicklung)

```bash
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm tsx prisma/seed.ts
pnpm dev
```

### Test-Logins

| Rolle | Login | Passwort |
|-------|-------|----------|
| Admin | `admin@smartbuilders.de` | `geheim123` |
| Handwerker | `bob@smartbuilders.de` | `geheim123` |
| Kunde | Auftragsnummer: `2025-SB-TEST` | Kundenname: `Testkunde` |

### Wichtige Pfade

| Bereich | Pfad |
|---------|------|
| Routes | `src/routes/` |
| Server-Code | `src/lib/server/` |
| Komponenten | `src/lib/components/` |
| DB-Schema | `prisma/schema.prisma` |
| DB-Diagramm | `prisma/database-diagram.drawio` |

### Prisma-Befehle

```bash
pnpm prisma studio       # DB GUI öffnen
pnpm prisma migrate dev  # Neue Migration erstellen
pnpm prisma db push      # Schema ohne Migration anwenden
pnpm prisma generate     # Client neu generieren
```
