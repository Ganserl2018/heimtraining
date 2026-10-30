# START-HIER – Übergabe für den nächsten Chat (Stand 27.10.2026 01:50)

Alex will NICHTS erklären müssen. Alles hier lesen, dann direkt weiterbauen. Antworten deutsch, sehr kurz (CLAUDE.md).

## Zuerst (ohne Rückfrage, still)
1. Mac-Ordner `/Users/user/Claude` verbinden (Remote-Devices-Bridge: `mcp__remote-devices__*`; Vault liegt unter `~/mnt/Claude/Obsidian-Vault/Projects/Privat/Heimtraining/`). Wenn Bridge fehlt: nur melden, mit Cloud-Teil weiterarbeiten.
2. Repo: `/home/claude/heimtraining` (falls fehlt: Repo per add_repo holen). Push auf `main` → https://heimtraining.pages.dev. Aktuell `?v=20261029j`.
3. Lesen: `CLAUDE.md`, `plan.md` (letzter Block), `qa-checkliste.md`, `audit-log.md`, letzter Nachtrag in `session-uebergabe-2026-10-04.md` (Vault).
4. Straße (immer mit url republishen): https://claude.ai/artifact/33Pz2wW3JRTVER4UhY8wWT, Quelle `strasse.html` im Scratchpad (falls weg: per Artifact read holen).
5. Memory: `/projects/01a0def4-e132-726b-8e41-b13f0f0e0473/areas/heimtraining-app.md` (Alex-Aussagen chronologisch).

## Werkzeuge / Verbindungen
- Tests: `python3 -m http.server 8794` + Playwright 402x874, Schrift 118% (`document.documentElement.style.fontSize='118%'`); Wizard-Schritte per `view='start'; plJump(n)`, Ergebnis per Klick `[data-act=genDo]`. Server danach killen (PID-Datei, kein `pkill -f http.server`).
- Harness: `tools/qa-iphone-harness.js` (`ZOOM=118 VH=874 ET=59 EB=34 NEWTAB=1`).
- Chat-Archiv: `python3 tools/chat-archiv.py <jsonl> <out.md>` → SendUserFile → device_commit_files nach Vault `Chat-Archiv-Heimtraining-<Datum>.md`.
- Kontext messen: `python3 tools/ctx-check.py` → Zeile in `ctx-log.md`.
- Agenten: routine (Haiku, Fleißarbeit/Speichern, hat KEINE Mac-Bridge/Memory → Vault+Memory macht der Hauptagent), auditor (Sonnet), checker, designer; Opus/Fable für Verzwicktes.
- `?v=` nur Ziffern + Kleinbuchstaben; `wc -c index.html` = 3699 nach sed; `node --check script.js`.

## Stand
- Fertig heute: neue Optik, Startbutton (Halten-und-Füllen, NIE entfernen), Wizard Zeit → Figur/Muskeln → Geräte → TRAINING BAUEN → Ergebnis, Ergebnis-Hero = Trainingsseite (Kacheln), Aktionszeile mit SVG-Symbolen, Kosmetik-Liste, Auditor + Chat-Archiv + Haiku-Routine.
- Alex-Regel neu: „genauso wie Seite X“ → erst beide per Playwright (computed style) messen, nicht raten.

## Nächste 3 Schritte (nur nach Alex' Go, nichts vorpreschen)
1. Andere Heros mit Zahlen an die Trainingsseite angleichen („alle Heros mit Zahlen so“).
2. Profil-Fußzeile (Hinweise zurücksetzen / Neu laden / falsche Bilder kopieren) auf iPhone-Maß messen.
3. Alex fragen, welcher Block als Nächstes: Geräte-Chips im Training-Detail aus gewählten Geräten · Übungssuche-Wizardseite · UI Deutsch/English · bewegte Muskel-Figur (billig: GIF + rot markierte Muskeln, oder voller Rig – Alex hat nicht gewählt) · Checker-Lauf mit neuer qa-checkliste.

## Termine / Entscheidungen
- Token V10-03 (Health-Sync-Token öffentlich): Fr 30.10. 21:00, Erinnerung gesetzt; Alex muss iOS-Kurzbefehl anpassen.
- Wochenlimit-Reset jeden Freitag 21:00 Berlin (Alex 30.10.: jetzt 21:00 statt 22:00; Sammler liest ihn live). Auditor wöchentlich So 20:17 (Cloud-Task).
- Stangengewicht 6 kg (entschieden). 184 Duplikat-Bilder: Alex entscheidet später. Bilder später.
- Neuer Chat: Alex sagt nur „start“ o. ä.; Claude liest diese Datei, holt Zugriffe still, nennt Stand + nächsten Schritt in 2 Sätzen.
