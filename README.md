<div align="center">

# WebUntis Kalender Companion

Eine Expo/React-Native-App, die deinen persönlichen WebUntis-Stundenplan filtert, anzeigt und automatisch mit deinem Kalender synchronisiert.

</div>

## Highlights

- **Direkte WebUntis-Anbindung**: Authentifizierung via JSON-RPC, Abruf deiner eigenen Stunden anhand Element-ID/-Typ und optionaler Filter.
- **Flexible Darstellung**: Einzelstunden, Blockansicht oder Tageszusammenfassung mit automatisch erkannten Pausen.
- **Kalender-Synchronisation**: Wählbar zwischen Google Kalender (OAuth) oder Gerätekalender (iOS/Android). Eindeutige Event-IDs, wählbarer Zielkalender, Sync-Horizont in Tagen konfigurierbar.
- **Automatisiertes Update**: Hintergrundjob (Background Fetch + Task Manager) startet täglich zur gewünschten Zeit und berücksichtigt Pausen.
- **Sichere Speicherung**: WebUntis-Passwort & Google Refresh Token werden über `expo-secure-store` bzw. Fallback verschlüsselt gehalten.
- **Manueller Workflow**: GitHub Action erstellt auf Knopfdruck ein APK via lokalem EAS-Build und veröffentlicht es als GitHub Release.

## Voraussetzungen

1. **Node & npm** (empfohlen Node 20).
2. **Expo CLI** (optional global: `npm install -g expo-cli`).
3. **Kalender-Zugriff**: 
   - **Option 1 (Gerätekalender)**: Keine zusätzlichen Anforderungen - die App erstellt automatisch einen "WebUntis Stundenplan" Kalender auf deinem Gerät.
   - **Option 2 (Google Kalender)**: Google Cloud Projekt inkl. OAuth Client (Typ "Installed" oder "Web") mit Kalender-Scope `https://www.googleapis.com/auth/calendar` und Redirect `webuntisKal://oauthredirect`.
4. **WebUntis Zugangsdaten** + persönliche `elementId` & `elementType` (5=Schüler, 2=Lehrer, 1=Klasse).

## Schnellstart

```bash
npm install
npm run start        # startet Metro + Expo DevTools
npm run android      # lokaler Android-Build / Emulator
npm run web          # optionaler Web-Preview
```

> Hinweis: Beim ersten Start im Dashboard auf „Jetzt synchronisieren" tippen. Danach kann die automatische Aktualisierung über die Einstellungen aktiviert werden.

## Wichtige Einstellungen

### WebUntis Bereich
- **Basis URL**: z.B. `https://mese.webuntis.com` (ohne `/WebUntis`).
- **Schulkürzel**: laut WebUntis URL.
- **Element-ID / -Typ**: findest du im WebUntis Profil (Menü > "Meine Daten").

### Anzeige
- **Tage in die Zukunft**: legt fest, wie weit Ereignisse in den Kalender eingetragen werden.
- **Block-Lücke**: Grenze in Minuten, ab wann zwei Stunden zu separaten Blöcken werden.
- **Pausen berücksichtigen**: fügt explizite Pausen-Karten zwischen Stunden/Blöcken ein.

### Kalender-Anbieter
Die App unterstützt zwei Kalender-Anbieter:

#### Option 1: Gerätekalender (empfohlen für einfache Nutzung)
- Synchronisiert direkt mit dem nativen Kalender deines iOS- oder Android-Geräts
- Keine Cloud-Konfiguration erforderlich
- Erstellt automatisch einen "WebUntis Stundenplan" Kalender
- Funktioniert komplett offline nach dem ersten Sync
- Einfacher Setup-Button in den Einstellungen

#### Option 2: Google Kalender
- Synchronisiert mit Google Kalender über OAuth2
- Erfordert Google Cloud Projekt und OAuth Client ID
- Setup-Schritte:
1. OAuth Client ID hinterlegen.
2. „Mit Google verbinden" – es wird ein `refresh_token` gespeichert.
3. Kalender ID (`primary` oder eine freigegebene ID) setzen.

### Automatische Aktualisierung
- Schalter aktivieren + Zeit im Format `HH:MM` setzen.
- App registriert einen Background-Fetch-Task (Android/iOS). Dieser läuft einmal täglich nach der angegebenen Uhrzeit.

## Hintergrund-Sync Hinweise

- Funktioniert nur, wenn das Gerät Background Fetch unterstützt und der Nutzer die Berechtigung nicht deaktiviert hat.
- Die letzte erfolgreiche Ausführung wird im Dashboard angezeigt.
- Für iOS muss die App regelmäßig geöffnet werden, damit iOS den Task priorisiert.

## GitHub Workflow: APK & Release

Datei: `.github/workflows/build-apk-release.yml`

1. **Trigger**: `workflow_dispatch` mit `tag_name`, `release_name`, optional `release_notes`.
2. **Vorbereitung**: checkout, Node 20, npm install, optional `EXPO_TOKEN` Login.
3. **Build**: `npx eas build --profile preview --platform android --local` (Ausgabe in `dist/`).
4. **Artefakte**: Upload als Workflow-Artifact und Release-Asset (`WebUntisKalender-<tag>.apk`).

> **Secrets**: Lege `EXPO_TOKEN` an, falls dein EAS-Projekt geschützt ist. Für reine lokalen Builds ist es optional, kann aber für Abwärtskompatibilität bestehen bleiben.

## Architektur

- `src/api/webuntisClient.ts`: JSON-RPC mit Login/Logout-Zyklus und Normalisierung der Lektionen.
- `src/services/lessonTransformer.ts`: Sortierung, Blockbildung, Pausen-Erkennung, Tageszusammenfassung.
- `src/services/calendarService.ts`: Formt Daten zu kalenderkompatiblen Events.
- `src/services/syncService.ts`: Orchestriert WebUntis Fetch → Transformation → Kalender Sync (Google oder Gerät).
- `src/api/googleCalendar.ts`: OAuth-Authentifizierung und Google Calendar API Integration.
- `src/api/expoCalendar.ts`: Integration mit dem nativen Gerätekalender via Expo Calendar SDK.
- `src/state/settingsStore.ts`: Strikte Typisierung (Zustand via Zustand + Persist + SecureStore).
- `src/tasks/backgroundSync.ts`: Expo Background Fetch + Task Manager inkl. letztem Laufzeitstempel.
- `app/index.tsx`: Dashboard mit manueller Sync, Status & Listen.
- `app/settings.tsx`: Alle Konfigurationen + Kalender-Anbieter Auswahl + Setup-Buttons.

## Tests & Linting

- `npm run lint` – ESLint (React Native config + TS).
- `npm run test` – Jest + Testing Library (Platzhalter, aktuelle Screens nutzen Hooks → Tests folgen nach Setup realer APIs).

> In dieser Umgebung konnten noch keine Tests ausgeführt werden (Terminal-Zugriff gesperrt). Bitte lokal `npm install && npm run lint` durchführen.

## Weiterentwicklung

- WebUntis-Filter erweitern (z.B. nach Fach, Lehrer, Räume).
- Visualisierung der Pausen (Kalenderfarben, Widgets).
- Optional: ICS-Export + Nextcloud/Outlook-Integration.
- ~~Gerätekalender-Integration (iOS/Android) neben Google Kalender.~~ ✅ Implementiert

Viel Spaß beim Organisieren deines Stundenplans! ✨