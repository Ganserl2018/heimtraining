# START-HIER – Übergabe für den nächsten Chat (Stand 31.10.2026 18:35)

Alex will NICHTS erklären müssen. Alles hier lesen, dann direkt weiterbauen. Antworten deutsch, sehr kurz (CLAUDE.md).

## Zuerst (ohne Rückfrage, still)
1. Mac-Ordner `/Users/user/Claude` verbinden (Remote-Devices-Bridge: `mcp__remote-devices__*`; Vault liegt unter `~/mnt/Claude/Obsidian-Vault/Projects/Privat/Heimtraining/`). Wenn Bridge fehlt: nur melden, mit Cloud-Teil weiterarbeiten.
2. Repo: `/home/claude/heimtraining` (falls fehlt: Repo per add_repo holen). Push auf `main` → https://heimtraining.pages.dev. Aktuell `?v=20261101f`.
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

## Neu 31.10. 13:35
- V29 Profile + V30 Status-Logik live (Rollback 5ed8eac). Training: Anpassen (Level+Löschen) und Einplanen (Tage/Uhrzeit) getrennt; Label "Level"; Level setzt kg auch ohne Profilgewicht (75 kg angenommen), keine Rückfrage.
- Offen: Alex' Startseiten-Frage (welcher Block weg?), iPhone-Test V30 + Trennung, Anti-Slop/designer über Profil-Overlay.

## Neu 31.10. 14:55
- Training-Panels wie Ergebnisseite, Verlauf-Hero = Trainingsseite, Ziele-Seite bereinigt + Ziel-Panel (Stepper/Chips). Seite für Seite weiter: Verlauf-Einträge/Detail, Beenden.

## Neu 31.10. 15:25
- Ziele-Seite B+ (Flamme/Wochenleiste/Stats), Tag-Chips weiß, Neu-Button weg (Generator mit vorbelegtem Tag), Umbenennen per ✓/Verlassen. Feedback zu B+ offen.

## Neu 15:58
- TIPP-Boxen entfernt; offen: lv-note-Hinweiszeilen (Wischen/Einzeln) ja/nein.

## Neu 16:30
- PIN raus. Health-Button-Idee (shortcuts://-Link mit Profil-Code): wartet auf Kurzbefehl-Name + Platz.

## Neu 18:00
- Kurzbefehl-Umbau mit Alex läuft (siehe plan.md letzter Block): Dauer/Kalorien aus durationMin/calories, Strecke leeren, URL mit Code. Danach Health-Button.

## Nächste 3 Schritte (nur nach Alex' Go, nichts vorpreschen)
1. Andere Heros mit Zahlen an die Trainingsseite angleichen („alle Heros mit Zahlen so“).
2. Profil-Fußzeile (Hinweise zurücksetzen / Neu laden / falsche Bilder kopieren) auf iPhone-Maß messen.
3. Alex fragen, welcher Block als Nächstes: Geräte-Chips im Training-Detail aus gewählten Geräten · Übungssuche-Wizardseite · UI Deutsch/English · bewegte Muskel-Figur (billig: GIF + rot markierte Muskeln, oder voller Rig – Alex hat nicht gewählt) · Checker-Lauf mit neuer qa-checkliste.

## Termine / Entscheidungen
- Token V10-03 (Health-Sync-Token öffentlich): Fr 30.10. 21:00, Erinnerung gesetzt; Alex muss iOS-Kurzbefehl anpassen.
- Wochenlimit-Reset jeden Freitag 21:00 Berlin (Alex 30.10.: jetzt 21:00 statt 22:00; Sammler liest ihn live). Auditor wöchentlich So 20:17 (Cloud-Task).
- Stangengewicht 6 kg (entschieden). 184 Duplikat-Bilder: Alex entscheidet später. Bilder später.
- Neuer Chat: Alex sagt nur „start“ o. ä.; Claude liest diese Datei, holt Zugriffe still, nennt Stand + nächsten Schritt in 2 Sätzen.

- Stand 31.10. 02:10: Archiv-Code + 9 tote Funktionen raus; Security-Header + interne Dateien 404 (808f3a5). Offen: Token rotieren (Alex, Mac-Einzeiler), Worker-Schreibschutz (Warteliste), 'Zu Training hinzufügen' (Alex 1 Satz), Seite-für-Seite-Logik-Durchgang mit Alex.

- Stand 31.10. 12:15 (Details: Nachtrag in plan.md): Woche-Uhrzeit (Auswahl 00/15/30/45, nur Anzeige), Archiv raus, Figur dreht sich, Geräte-Kachel + Aktionszeile + Gruppen auf Ergebnis- UND Trainingsseite, Seitenwechsel = Standardzustand + nach oben. Live ?v=20261031v. NÄCHSTES: Seite-für-Seite-Logik Punkt 2 (Woche/Status/Beenden); Uhrzeit-Logik wartet auf Alex-Go. Regel Alex: nur tun was er sagt, nichts dazudichten.

- Stand 31.10. 12:50: V29 Profile live (?v=20261031x, c9bb92a + Folgecommits): lokale Profile (LS-Shim, 'main' = alte Schlüssel), "Wer trainiert?" ab 2 Profilen, ⇄ im Profil (neu/PIN/löschen/Sync-Adresse kopieren). Health-Sync je Profil per eigenem 32-Zeichen-Code (Worker /session/<code>, Bearer weg) = nur Übergang; im App Store HealthKit direkt, Kurzbefehl entfällt (Alex). Sohn ist 30 → keine Kinder-Regeln. Uhrzeit bleibt nur Anzeige (erledigt). OFFEN: Anti-Slop-Check + Designer über Profil-Auswahl-Overlay; Woche/Status + Beenden-Logik (wartet auf Alex-Go); Puls+Füll-Effekt START besser (Warteliste V5-21); App-Store-Pfad V5-22 (Capacitor, HealthKit).

- Stand 31.10. 13:25: V30 Status-Logik live (?v=20261031y, 96dd7e8; Rücksprung 5ed8eac): Erledigt/Unvollständig (zählt)/Läuft/Verpasst, Auto-Beenden über Mitternacht, Woche-Kachel ✓ ½ ▶ ⚠ (x/y bei mehreren), Start-Hinweis "Training läuft · Weiter". Alex testet am iPhone. OFFEN: iPhone-Fit Woche, Trainings-Seite prüfen; Label "Vorlage nach Level" → "Level" (Alex-Frage 13:17, wartet auf Go); Anti-Slop-Check Profil-Overlay; Beenden/Verlauf-Seite der Status-Runde noch nicht besprochen.


## Stand 31.10. 22:15
- Live v=20261031zp. Heute: Training Anpassen/Einplanen, Verlauf-Hero, Ziele-Seite B+, weiße Tage-Chips, Neu/Tipps/PIN raus, Woche-Kacheln + Dim-Schrift heller.
- Kurzbefehl 'Heimtraining Sync' läuft (Test ok). Health-Button wartet auf Alex' Go (kein iCloud-Link).
- Wartet auf Go: Touch-Ziele 44 px, Mini-Schrift, Glow/Dashed/Bounce. Ziele-Seite Feedback später.
- Regel: nichts bauen ohne Alex' Go (außer Schrift/Farbe/Text).


## Stand 31.10. 21:50
- Live v=20261031zs. Neu seit 22:15: Übungszeile (Sätze × Wdh · kg, Segment Gewicht/Körper/Zeit), Touch-Ziele ≥44 px.
- Wartet auf Go: Mini-Schrift, Glow/Dashed/Bounce, Health-Button.


## Stand 31.10. 22:20
- Live v=20261031zt. Neu: Woche-Ziel-Block → Ziele-Seite (›), Zurück nach Woche.
- Wartet auf Go: Mini-Schrift, Glow/Dashed/Bounce, Health-Button.


## Stand 31.10. 22:50 (Speichern)
- Live v=20261031zu (0fdcc59). Ziele-Seite kompakt (Link war verdeckt). Straße V31 aktuell.
- Frage an Alex: Ziel pro Zeitraum eigene Zahl? Wartet auf Go: Health-Button, Mini-Schrift, Glow/Dashed/Bounce.
- Test-Hinweis: Fit-Messung immer ALLE Elemente inkl. Link prüfen (lastBottom aller Buttons), Tab-Leiste real ~769 px.

## Neu 31.10. 23:55
- Ziel pro Zeitraum eigene Zahl (3/12/156), Countdown-Block aus Ziel-Panel raus (03d09f8). Offen (wartet auf Go): Health-Button (Kurzbefehl "Heimtraining Sync"), Mini-Schrift, Glow/Dashed/Bounce auf Ziele-Seite; Übungszeile-Segment Gewicht/Körper/Zeit braucht Alex' Abnahme.

## Neu 1.11. 00:25
- Ziele-Seite Kacheln oben; Bild-falsch-Knöpfe entfernt; Player Neon-HUD Schritt 1 live (2cbc0f0). Nächstes (Go nötig): Player Schritt 2 (Eck-Panels, Graph, Detail-Panel, Satz-fertig-Effekt). Designer-Ergebnis zu V38 abwarten/prüfen.

## Neu 1.11. 00:55
- Ziele-Seite: Hero wie alle Seiten + Glow-Button 'Ziel anpassen' (v=20261101e). Player HUD Schritt 1 nachgebessert. Offen (Go): Player Schritt 2, Health-Button, Mini-Schrift, Glow/Dashed/Bounce.

## Neu 1.11. 00:25 (Speichern)
- Ziele-Seite ohne Wochentage (10428c5, v=20261101f). Alex-Wunsch Streak-Zahl statt Flamme (Chrom/grüne Flüssigkeit): wartet auf Wahl KI-Bilder 0-9 (Empfehlung) vs Code-Look. Offen (Go): Player Schritt 2, Health-Button, Mini-Schrift, Glow/Dashed/Bounce. Straße V32-L…P aktuell.

## Bestand: drehender 3D-Körper (3.11.)
Wizard-Schritt "Figur" = Three.js (`vendor/three.min.js`, `OrbitControls.js`, `GLTFLoader.js`, `muscle-model.glb`; Code `fgInit` in script.js). Nicht neu erfinden, wiederverwenden. Streak-Zahl wird als drehende 3D-Ziffern gebaut (Alex-Go 3.11. 01:18, Datei `streak3d.js`).

## Stand 3.11. 02:00: Streak 3D-Ziffern live (v=20261103d)
`streak3d.js` + `vendor/streak-glyphs.js` (Anton-Ziffern via fontTools/shapely, Wand 0.04): Three.js-Canvas im `.gz-digits` (Ziele-Seite), Metallrahmen + Glas + Flüssigkeit (Shader, Level = Streak/Rekord, Wellen, Tropfen), OrbitControls autoRotate 6.5 wie die Figur. Ohne WebGL bleiben die Bilder `img/streak/d1-8.webp`. Offen: Alex-Urteil zur Optik; Füll-Logik (Streak/Rekord) unbestätigt; Designer-Check nicht gelaufen; Startseite-Variante offen.

## 3.11. 01:50: Ziffern-Feinschliff (v=20261103e)
Wand dünn (0.024), Rahmenfarbe dunkles Metall (0x8d9692, roughness .27), Füllstand = Streak/10 (1 = 10 %, ab 10 voll; vorher Streak/Rekord). Alex hat die 3D-Zahl abgenommen ("sehr gut gemacht").

## 3.11. 02:10: Streak-Logik = Trainings in Folge nach Plan (v=20261103f)
`computeStreak`: Ruhetage ohne Plan brechen nicht, verpasstes geplantes Training bricht, jedes beendete Training +1 (auch spontan, auch mehrere pro Tag); ohne Plan-Wochentage alte Tage-Logik. Labels: "Trainings in Folge", "Rekord N Trainings", Verlauf-Kachel "In Folge". Unit-Test /tmp/qa/sk.js (6 Fälle ok). Gespeicherter Rekord stammt noch aus der Tage-Logik.
