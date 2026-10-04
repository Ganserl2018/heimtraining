# Heimtraining – Plan (Quelle der Wahrheit)

Stand: 2026-09-30

## V3 – Sidebar-Umbau
| ID | Titel | Status | Deps |
|---|---|---|---|
| V3-01 | Reiter "Alle Übungen" anlegen | 🟢 done | — |
| V3-02 | Push/Pull/Legs/Core aus Sidebar-Wurzel entfernen | 🟢 done | V3-01 |
| V3-03 | Direktzugriff/Tauschen aus altem Verhalten übernehmen | 🟢 done | V3-01 |

## V4 – TV-Icon statt TV-Tab
| ID | Titel | Status | Deps |
|---|---|---|---|
| V4-01 | TV-Tab aus Sidebar entfernen | 🟢 done | — |
| V4-02 | TV-Icon oben rechts (global) | 🟢 done | V4-01 |
| V4-03 | TV-View an neuen Einstieg anpassen | 🟢 done | V4-02 |

## V6 – Übersichtsseite 2.0 (Struktur/Logik 🟢 fertig, Design V6-07 offen)
| ID | Titel | Status | Deps |
|---|---|---|---|
| V6-01 | Feste Wochentage + Uhrzeit pro Wochenplan-Training | 🟢 done | — |
| V6-02 | Quick-Start-Button (kombiniert: offen > heute fällig) | 🟢 done | V6-01 |
| V6-03 | Ziel-Leiste v1 – Zahl + Zeitraum | 🟢 done | — |
| V6-04 | Ziel-Leiste v2 – nach Design + Live-Test | ⚪ wait | V6-03, V6-07 |
| V6-05 | Status-Erkennung & -Anzeige (verpasst/unvollständig/erledigt) | 🟢 done | V6-01 |
| V6-06 | Kalenderstreifen + Verlauf-Vorschau prominenter | 🟢 done | V6-05 |
| V6-07 | Design-Entwurf Übersichtsseite (Phase 3, eigener Design-Agent) | ⚪ open | V6-01…06 |
| V6-08 | Redesign Verlauf + TV (Wochenplan/Profil später) | ✅ done 02.10. | V6-07 |

V6-07/08 Ablauf (30.09. final geklärt):
1. Design-Agent bekommt Referenz-Screenshots (Dashboard mit KPI-Kacheln/Kalorien-Balken/
   Plan-Card, Onboarding mit Bild-Karussell) als Stil-Vorgabe — Kachel-Form, Seitenaufbau,
   Features wie das Karussell, DARF auch die Farbpalette anfassen. Baut ein eigenständiges
   Design, keine 1:1-Kopie.
2. Claude selbst (nicht der Design-Agent) baut die vom Design-Agent verlangten Features
   tatsächlich in HTML/CSS/JS um (Rollentrennung: Design-Agent = Vision/Spec, Claude = Bau).
3. Direkt deployen (kein Zwischenschritt über Screenshot) — Alex schaut live auf dem
   iPhone, das ist schneller als ein Screenshot-Umweg.
4. Erst Übersichtsseite (V6-07) fertig+freigegeben, DANACH der Rest der App (V6-08) im
   selben Stil. V6-04 (Ziel-Leiste v2) wartet auf V6-07, weil Platz/Form der Ziel-Leiste
   vom fertigen Design abhängt.

V6-01 Detail: Uhrzeit ist informativ (Erinnerung), kein harter Cutoff — es zählt nur
der Kalendertag.

V6-05 Detail (30.09. geklärt): drei Status statt einer binären Wertung, bewusst neutral
formuliert (keine "negativ"-Sprache):
- **Verpasst**: zugeordneter Wochentag ist vorbei, kein "Training starten" gedrückt.
- **Unvollständig**: Training gestartet, aber nicht abgeschlossen.
- **Erledigt**: Training abgeschlossen (Eintrag in `heimtraining.history` vorhanden).
Datenbasis: rein aus App-eigenen Daten (Verlauf), kein Wearable/Health-Zugriff nötig.
Exakte Anzeige-Mechanik (Kalenderstreifen-Färbung etc.) bleibt iterativ/live.

## V7 – Profil-Seite (🟢 fertig)
| ID | Titel | Status | Deps |
|---|---|---|---|
| V7-01 | Profil-Formular (Gewicht, Alter, Größe, Geschlecht) | 🟢 done | — |

## V8 – Kalorien & Verlauf-Detailseite (🟢 fertig)
| ID | Titel | Status | Deps |
|---|---|---|---|
| V8-01 | MET-Tabelle pro Übung (aus Free-Exercise-DB-Attributen) | 🟢 done | — |
| V8-02 | "Training starten"-Button + Start-Zeitpunkt | 🟢 done | — |
| V8-03 | Kalorien-Berechnung pro Training | 🟢 done | V7-01, V8-01, V8-02 |
| V8-04 | Verlauf-Detailseite | 🟢 done | V8-03 |

V8-01 Hinweis: 519 Übungen mit individuellem MET-Wert (2.5-8.0), Heuristik in
`met-heuristik.md`. Ein Ausreißer ("Isometric Chest Squeezes", Quell-DB fälschlich als
Plyometrie/explosiv kategorisiert) wurde beim Checker-Review am 30.09. gefunden und
manuell auf 3.0 korrigiert.

V8-03 Formel: gewichteter MET-Schnitt (nach erledigten Sätzen) × Körpergewicht (Profil)
× Trainingsdauer(Stunden). Ohne Profil-Gewicht oder ohne erfasste Dauer bewusst keine
Schätzung (null) statt Rateergebnis. Fallback-MET 5.0 für Übungen ohne met.json-Eintrag.

Bugfix nebenbei gefunden+behoben (30.09.): `mondayOf()` nutzte `.toISOString()` und
verschob in Europe/Berlin das Wochenstart-Datum um einen Tag zurück (betraf V6-06 UND
die bestehende "Diese Woche"-Anzeige). Sowie: Wochenplan-Listeneintrag reagierte auf
Mobile/iPhone gar nicht auf Klick (Handler filterte auf `<button>`, Card ist ein `<div>`).

## V5 – Ideenspeicher / Warteliste
| ID | Titel | Status | Deps |
|---|---|---|---|
| V5-01 | Ernährungs-Tab | ⚪ open | — |
| V5-02 | Fortschritt/Ziele-Tab (V6-Ziel-Leiste kann später hierauf aufbauen) | ⚪ open | — |
| V5-03 | Vollbild-Trainingsmodus je Übung | ⚪ open | — |

V5-03 Referenz (Screenshot 30.09.): großes Übungsbild/-video im Hintergrund, Timer/Countdown
mittig, Play/Pause, Zeit + Equipment/Muskeln als Chips unten, "Swipe up" für Anleitung.
Eigener Vollbild-Modus statt/ergänzend zur heutigen Listenansicht während des Trainings.

| V5-04 | Soll/Ist-System: Reps + Gewicht pro Satz | ⚪ open | — |

V5-04 Referenz (Screenshot 30.09., System nicht Design): beim Anlegen eines
Wochenplan-Trainings wird pro Übung Gewicht + Ziel-Reps festgelegt, Satz-Anzahl frei
wählbar (löst die feste "3 Sätze"-Annahme ab). Während des Trainings pro Satz nur EIN
Haken (Variante A/minimal): Klick = Soll-Reps/-Gewicht als Ist übernommen; bei Abweichung
tippt Alex die Zahl an und ändert sie manuell. Bei Bedarf mitten im Training über
Trainingseinstellungen nachjustierbar (z.B. Gewicht runter). Ziel-Reps legt Alex pro Übung
selbst fest, kein Standardwert.
Scope final geklärt (30.09.): Push/Pull/Legs/Core sind reine Filter/Tags (wie
"Seilzug"/"Langhantel"), keine eigene Trainingsart mit Ablauf — daher betrifft das
Soll/Ist-System NUR Wochenplan-Trainings. Filter bleiben unverändert ohne Gewicht/Reps-Logik.

Live verifiziert (Playwright, Desktop-Breite 1100px): Sidebar "Alle Übungen" klappt
Push/Pull/Legs/Core auf, Klick auf Übung öffnet "Tauschen"-Picker, TV-Icon öffnet
TV-Ansicht, "Zurück" führt zur vorherigen Ansicht zurück. Kein Console-Error außer
fehlendem favicon.ico (unkritisch, bereits vorher so).

V3/V4 gebaut von Claude selbst (kein separater Checker-Agent eingesetzt – Umfang war
klein genug für Live-Verifikation per Browser-Automation). V5 bleibt liegen, bis
Logik dahinter feststeht.

V6/V7/V8 (30.09., autonom während Alex-Pause): Struktur+Logik komplett gebaut, per
Playwright live verifiziert UND von einem unabhängigen Checker-Agenten geprüft (2
Review-Durchläufe, dabei 2 echte Bugs gefunden und behoben: mondayOf()-UTC-Bug,
falsch kategorisierter MET-Ausreißer). Offen bleiben nur: V6-04 (Ziel-Leiste v2,
braucht Live-Test mit Alex), V6-07 (Design, Phase 3 laut 4-Phasen-Schema erst nach
Struktur/Logik – kommt als eigener Design-Agent-Auftrag).


## V9 – Home Force Übersicht (01.10.)
V9-01…V9-18 done (Lab-Design nach Vorlagen, Mood grün/rot, statisches Layout, Icon-Tabbar, antippbare Tage, since-Logik, Ziel Tage–Jahre, Einheit je Übung). Letzter Commit d491389.

## V10 – QA-Nacharbeit (Original: Obsidian Projects/Privat/Heimtraining/QA-Bericht-2026-10-01.md)
| ID | Titel | Status |
|---|---|---|
| V10-01 | BLOCKER: Neues Training stürzt ab | 🟢 done |
| V10-02 | BLOCKER: Leere Trainings/Ruhetag-Tap färben App rot | 🟢 done |
| V10-03 | BLOCKER: Health-Sync-Token öffentlich (script.js ~651) | ⏸ wartet (Alex) |
| V10-04 | Startzeit in UTC | 🟢 done |
| V10-05 | Verlauf-Detail ungestylt | 🟢 done |
| V10-06 | Picker-Suchfeld weiß | 🟢 done |
| V10-07 | Ziel-Formular von Tabbar verdeckt | 🟢 done |
| V10-08 | Tap-Targets <44px | 🟢 done |
| V10-09 | TV-Ansicht ignoriert Wochenplan | 🟢 done |
| V10-10 | START WORKOUT fällt auf Legacy-Push | 🟢 done |
| V10-11 | Beenden ohne Satz zählt als Workout | 🟢 done |
| V10-12 | Kein Löschen | 🟢 done |
| V10-13 | Backup/Export, PWA, Offline | 🟢 done |
| V10-14 | Refresh über Mitternacht | 🟢 done |
| V10-15 | Verpasst nicht heilbar | 🟢 done |
| V10-16 | Ring vs. Wochenstreifen Fenster | 🟢 done |
| V10-17 | Dauer/Kalorien nur nach manuellem Start | 🟢 done |
| V10-18 | Wochenplan-Liste/Seitentitel | 🟢 done |
| V10-19 | Lange Übungsnamen bei 360px | 🟢 done |
| V10-20 | Legacy-Day-View gequetscht | 🟢 done |
| V10-21 | Verlauf-Datum roh, "push" lowercase | 🟢 done |
| V10-22 | Kontrast Rot-Modus + kleine Schrift | 🟢 done |
| V10-23 | Desktop-Übersicht nicht zentriert | 🟢 done |
| V10-24 | Profilfelder ungenutzt, Kalorien überhöht | 🟢 done |
| V10-25 | Toter Code/CSS + öffentliche interne Dateien | 🟢 done |

V10-13/15/25 Hinweise: Umgesetzt: Backup erzeugen/wiederherstellen im Profil, Manifest, apple-touch-icon, Apple-Metas, Service Worker (Netzwerk zuerst), Sync-Warteschlange mit Retry. | Umgesetzt: "Als Ruhetag werten" je verpasstem Tag. Nachholen mit Datumswahl bewusst nicht gebaut. | Toter Code/CSS entfernt, .overview-lab-Overrides konsolidiert. NICHT erledigt: interne Dateien (plan.md, design-v6-07-*, met-heuristik.md, exercise-gif-experiments/) liegen weiter öffentlich auf pages.dev (Pages hat kein Ausschluss-Feature, bräuchte Verschieben in anderes Repo).

## V11 – Workout-Flow (Start 01.10. nachmittags)
| ID | Aufgabe | Status |
|---|---|---|
| V11-01 | START → Trainingsauswahl (Meine Trainings, Vorlagen, Neu) | ✅ live |
| V11-02 | Workout-Player (Vollbild nach Alex-Referenz, Foto-BG, Riesen-Timer, Swipe-Sheet, Pause 90 s per Tipp) | ✅ live (Siri/Kurzbefehl offen) |
| V11-03 | Beenden auch unvollständig → Verlauf "fertig, unvollständig" + Zusammenfassung + Health-Sync | ✅ live, getestet 02.10. (Playwright: Satz → Beenden → Zusammenfassung → Verlauf-Badge) |
| V11-04 | Design Workout-Ansicht | ✅ live (iPhone-Swipes/Anton-Font unbestätigt) |
| V11-05 | Schutz (Offline, Limits) | ⏳ |
Weitere erledigt heute: Wochenplan-Redesign, Hantel-Logik, Alle-Übungen-Galerie (BTILE 128), deutsche Suche. Details: Vault `Projects/Privat/Heimtraining/session-uebergabe-2026-10-01.md`.

## Warteliste (neu 01.10. abends)
- W-01 Level-Vorlagen beim Satz-Einstellen (Anfänger / Fortgeschritten / Profi → Sätze, Wdh, Gewichts-Vorschlag je Übung)
- W-02 Auto-Trainingsgenerator nach Level (Zufalls-Zusammenstellung: Ziel, Dauer, Muskelgruppen → fertiges Training)

## Entscheidungen W-01/W-02 (02.10.)
- Level (Anfänger/Fortgeschritten/Profi) abhängig von Körpergröße + Gewicht (Profil); Start-kg realistisch (kein 50 kg Bankdrücken bei 50 kg Körpergewicht).
- System lernt mit Fortschritt (aus Verlauf).
- Generator: Eingaben Level, Dauer, Muskelgruppen + Überrasch-mich-Knopf; Ergebnis = normales speicherbares Training; Einstieg bei "Training wählen".
- Taskforce eingerichtet (TASKFORCE.md, .claude/agents/).

## V12 – Training bauen & Übungen (01.-02.10. abends, alles live)
- V12-1 Neues-Training nummeriert (Name = Schritt 1), Speichern & zur Schnellauswahl, Löschen neben Umbenennen.
- V12-2 Kompakte Übungskarte, Einheit-Dropdown (kg·Wdh / Wdh / Sek), Haken entfernt.
- V12-3 Auto-Einheit (Gerätewörter → kg) + Schnellwahl-Chips kg/Wdh.
- V12-4 Training-wählen-Redesign (Foto-Kacheln), Paket-Karte-Overflow behoben.
- V12-5 Alle Übungen Galerie-Redesign (Design-Agent), auch Picker.
- V12-6 Seilzug statt Kabel; Zweitmuskel-Badge per Namens-Heuristik (`secondaries(e)`).
- V12-7 Gewichtsklassen Leicht/Moderat/Schwer im Detail-Sheet (`WCLASS`, `wclassHtml`).
- V12-8 Taskforce (scout, strategist, designer, coach, checker).
## V13 – Level-Vorlagen + Generator ✅ komplett live (02.10.): V13-1 Coach-Regeln ✅, V13-2 Level-Vorlagen ✅, V13-3 Auto-Generator ✅, V13-4 Progression + Level-Vorschlag + Checker (6 Funde behoben) ✅.

## V13-1 Coach-Bericht (02.10.) gesichert
Unverkürzt im Vault: `Projects/Privat/Heimtraining/Coach-Regeln-V13-Bericht-2026-10-02.md`. Bau-Reihenfolge: Start-Gewichte + Schemata (W-01) → Generator (W-02) → Lernlogik/Banner. Offene Frage an Alex: welche Hantelscheiben (45 kg nur? 45 lb?).

- W-01 Level-Vorlagen: ✅ live 02.10. (Sätze-Seite: Anfänger/Fortgeschritten/Profi füllt Sätze, Wdh, kg aus Profil-Gewicht; Profil: Größe + Stangengewicht, Scheiben gesamt 45 kg). Offen: Level aus Verlauf vorschlagen, Progression, Generator (W-02).
- W-02 Auto-Trainingsgenerator ✅ live 02.10. (Training wählen → AUTO-TRAINING: Level, Ziel Aufbau/Kraft/Definition, Dauer 30-90, Muskelgruppen, Überrasch mich, Neu mischen, speichern/starten; Verbund vor Isolation, keine Wiederholung der letzten Auswahl). V13 Progression: Start-kg aus Verlauf (2 komplette Einheiten gleiches Gewicht → +2/2,5 kg), Level-Vorschlag im Profil (Banner, Übernehmen).
- Checker-Bericht 02.10. (Generator/Level/Progression): Funktion grün; 6 Funde (Anfänger-Übungen, Bänder-kg, DB-Erkennung, Stretch/Jump, Pullover/Pushdown, Scroll) alle behoben, Re-Test 800 Übungen ohne Treffer. Bericht unverkürzt im Vault.

## Stand 02.10. 02:05 – nächster Vorschlag: Welcome/Setup beim ersten Start (Gewicht, Größe, Stange, Level). Agenten-Dashboard pausiert bis Stil-Beispiel von Alex (Vault 02_Agenten).

## 02.10. mittags: Beenden-Button zeigt 'X von Y Sätzen offen'; Übungen im Training per ▲▼ umsortierbar; Standard-Pause im Profil einstellbar (Feld rest). Welcome/Setup beim ersten Start bewusst GANZ ZUM SCHLUSS (Alex: sonst Fragenkatalog beim Testen). Nächstes: V6-08 Verlauf/TV-Redesign (Designer-Konzept zuerst).

## V6-08 Verlauf + TV Redesign (02.10.2026) – Checker-Bericht (a50998d07b8804d23, Commit 5890866)
Fehler 1 (gefixt): langer Notiz-Text/langes Wort sprengt Verlauf-Detail bei 390px (.hd Grid-Spalte 1fr -> minmax(0,1fr), overflow-wrap, .hd-title clamp/line-clamp).
Mangel 2 (gefixt): totalSetsPlanned=0 zeigte "komplett" -> full nur bei planned>0.
Mangel 3 (gefixt): Mobile TV Pfeile unter Tabbar -> Gif 30vh, Buttons kleiner bei <=600px.
Mangel 4 (Warteliste V5-11): TV im Querformat auf iPhone (844x390) – Name/Gif abgeschnitten, Sätze nicht sichtbar.
Ok: leerer Verlauf, nicht klickbare Einträge ohne trainingId, fehlende Dauer/kcal, weights leer, unbekannte Übung (Initiale), Escaping, Wochenzahlen/Streak, Gruppen, Löschen/Zurück, TV aus Tag und wtrain, Satz toggeln, Wrap, Touch-Wischen, kein horizontaler Scroll, keine pageerrors.
Nicht getestet: echte iOS-Safari-Wischgeste, >1000 Einträge.

## Stand 02.10. 13:45 – V6-08 live (Commit b5e76c1, script v=20261002r). Nächstes: Siri/Kurzbefehl Pausen-Timer. Warteliste neu: TV im iPhone-Querformat (V5-11). Welcome/Setup weiter GANZ ZUM SCHLUSS.

## 02.10. nachmittags – V6-04 Leisten (Commit folgt): unter dem Ring Wochen-Leiste (erledigt/geplant) + Langzeit-Leiste (antippen = bearbeiten). Langzeit wählbar: Trainings pro Jahr/Monat ODER Kraft-Ziel einer Übung (von→auf kg, Ist = Höchstgewicht aus Verlauf). Key heimtraining.longgoal. Playwright 390/1300 grün, kein Checker-Lauf.

## 02.10. Profil-Redesign "Spieler-Karte" – Checker-Bericht (aa024296dc3736b5d, Commit f15e06a)
Fehler 1 (gefixt): Desktop, Gewicht 123.5 rechts abgeschnitten (.pp-tile input 3.4rem bei 245px Kachel) -> clamp(2rem,3.4vw,3rem).
Fehler 2 (gefixt): 390x667 mit Level-Banner: .pp-acts 18px unter der Tabbar -> max-height:700px weiter verdichtet.
Klein (gefixt): Number-Spinner verschob Zahl; "3 Trainings in 1 Woche" brach um.
Ok: kein Scrollen bei 390x844, 390x667, 1300x900, 1300x600, 2000x1000; Persistenz aller Felder; Level-Segmente + Banner Übernehmen; Anpassen; Hinweise zurücksetzen; Backup-Textarea als Sheet; mood-bad rot; reduced-motion; keine pageerrors.
Nicht geprüft: echtes iPhone-Safari (@property Ring ab Safari 16.4, sonst statisch), Tastatur-Verdeckung beim Tippen, Reload nach Backup-Laden.

## 02.10. 17:15 – Training bauen Redesign live (Commits 70c5e51, Cache-Fix SW hf-v3 + _headers no-cache). Liste scrollt intern, Steuerung rechts (Desktop) / Sheet unten (Mobil). Alex: "passt erstmal". Nicht per Checker geprüft (nur Playwright-Screens 390x844, 1300). Offen: Trainingshelper-Kasten nimmt am Desktop Platz. V6-04 Leisten + Header-Logo + Profil Spieler-Karte live. Nächstes: Siri/Kurzbefehl Pausen-Timer.

## ABSCHLUSS-PRÜFUNG (Alex 02.10. 17:19): iPhone-Test abgehakt. Sobald Alex "fertig" sagt, lässt Claude (ohne Rückfrage) laufen: (1) Checker/Prüf-Agent: ALLE Funktionen durchklicken – wie geht es, was passiert bei jedem Button, Randfälle, 390 + 1300 px; (2) Designer-Agent: nur Proportionen, Abstände, Ausrichtung, Konsistenz. Taskforce delegieren, Berichte unverkürzt in plan.md/Vault sichern.

## 02.10. 20:50 – Scout-Bericht (a621bcf4ae6066ce3): Übungsbilder im Hochformat generieren (~460, Budget max 10 €)
Ziel (Alex): ALLE Übungsbilder im Hochformat, zeigen welche Übung gerade ausgeübt wird.
Preise USD pro Bild, aus Drittseiten (Original-Preisseiten gesperrt, Unsicherheit):
- Gemini 2.5 Flash Image ("Nano Banana"): Batch 0,0195 / Standard 0,039 -> 460 Bilder ca. 9 / 18. Stärke: Referenzbild-Edit (für unseren Fall unbelegt). Risiko: Batch-Wartezeit, wenig Luft für Wiederholungen.
- Nano Banana 2 (Gemini 3.1 Flash Image): ab 0,045 (0,5K) bis 0,151 (4K), Batch ca. halb; 1K-Preis nicht belegt.
- Nano Banana 2 Lite: 0,0336 / Batch 0,0168 -> ca. 15,5 / 7,7. Ratios inkl. 3:4, 2:3, 9:16 belegt. "Nicht für Hero-Assets", Referenzbild-Eingabe nicht belegt.
- gpt-image-2 (1024x1536): low 0,005 / medium 0,041 / high 0,165 + Input-Tokens für Referenzen (8 $/Mio). low -> ca. 2,3 + Referenzen; medium ca. 19. Edit mit mehreren Referenzen + input_fidelity. Preise widersprüchlich. Low vermutlich weich.
- gpt-image-1-mini: deprecated, nicht empfohlen.
- FLUX Kontext Dev/Pro/Max: 0,01 / 0,04 / 0,08 -> ca. 4,6 / 18 / 37. Dev: Anbieter/Lizenz ungeklärt.
- Ideogram/Recraft: nicht recherchiert.
- Ohne KI (Crop 3:4 + unscharfer, getönter Hintergrund): ca. 0 €; echte Fotos, Pose perfekt; Quellfotos vermutlich klein (ungeprüft).
Free Exercise DB: MIT (laut met-heuristik.md). 2 Fotos/Übung als Eingabe lösen das Perspektivproblem am ehesten.
Empfehlung: (1) Image-Edit mit beiden Referenzfotos, Ziel 3:4, zuerst Nano Banana (2.5/2) testen; (2) Gegenkandidat gpt-image-2 low + input_fidelity; (3) Fallback ohne KI; (4) mit Wiederholungen rechnen, nur Batch passt ins 10-€-Budget (ca. 11 $, Kurs ungeprüft) bei <1,3 Versuchen/Bild.
Plan 3 Probebilder: Bankdrücken (Seitenansicht-Falle), Klimmzüge, Face Pull; je beide Referenzfotos, 3:4, Prompt "Kamera frontal von oberhalb des Kopfes, gleiche Pose wie Referenz, einheitlicher Studio-Look"; je Nano Banana, gpt-image-2 low, Kontext Dev = 9 Bilder < 1 $. Kriterien: Perspektive, Pose, einheitlicher Look. Gewinner -> 20 Bilder Batch -> erst dann alle 460.

## 02.10. 22:00 – Übungsbilder (Gemini, Hochformat 3:4, Mann -m / Frau -w) – GESTOPPT, Gemini-Limit erreicht
Gespeichert: ~/Downloads (Alex' Mac) als <gif-slug>-m|w.jpeg (765x1024), 65+ Dateien: alle 19 App-Übungen + facepull (m/w) + Pool-Bauch bis cocoons-m. Queue: /tmp/queue.json (441 Pool-Übungen ohne Equipment-Ausschluss, Reihenfolge Bauch, Rücken, Brust, Beine, Schultern, Arme); nächster Eintrag: cocoons-w, dann cross-body_crunch ... Prompt-Muster: "Neues Bild, Hochformat 3:4, fotorealistisch, dunkles Heimstudio, neon-grüne Akzentbeleuchtung, einheitlicher Look. Person: athletischer Mann, ca. 30, kurze dunkle Haare, schwarzes Shirt, graue Shorts | athletische Frau, ca. 30, dunkelbraune Haare im Zopf, schwarzes Sport-Top, graue Leggings. Übung: <Name + Hinweis>, korrekte Ausführung, Kamera ..., Ganzkörper sichtbar." Technik: Gemini-App (Chrome-App) per Computer Use, Rechtsklick > Bild speichern unter. Gemini setzt Bildmodus/3:4 bei neuem Chat zurück (neu setzen: + > Bild erstellen, Seitenverhältnis 3:4). Computer-Use funktioniert nur, wenn Alex auf dem normalen Desktop bleibt (Vollbild-Claude-App blockiert Klicks). Alex: Klicks auf "drucken" stoppen (unklar welcher Klick). Endposen/GIF-Idee: erst nach Standbildern, Test mit 5 Übungen (Bankdrücken, Kniebeuge, Klimmzüge, Rudern, Curl) per "Bild als Endposition neu zeichnen" im selben Chat.

## 03.10. 12:55 – Übungsbilder (Gemini, 3:4, -m/-w) – Stand + Beschluss
- Fertig/gespeichert: 235 Fotos in Alex' Mac ~/Downloads, Queue-Index 0-97 (97-m = Startposition-Version). Offen: reverse_barbell_preacher_curls-w (nicht gespeichert).
- Startpositions-Prüfung aller 235 (Kontaktbögen + 3 Agenten): ca. 159 beanstandet (Mitte/Endposition, 13 mit Text/Glitch). Berichte unverkürzt: /tmp/startpos_report_1-3.md (Container, nicht im Repo). Zweifel-OK: arnold_dumbbell_press, cable_seated_crunch, cable_judo_flip, cable_reverse_crunch, cable_crunch-m, barbell_hip_thrust.
- Ab jetzt Prompt mit "STARTPOSITION der Übung <Name>: <exakte Ausgangshaltung>" (erstes Frame der späteren GIF-Schleife).
- Beschluss Alex 03.10.: weiter über Gemini-App, KEIN API-Key (kostet Geld, Gratis-Tier für Bildausgabe laut Preisseite "Not available"; ~0,045 $/0,5K-Bild, ungefähr).
- Nächste Schritte: (1) Redo ~80 Beanstandete, erst nach Prüfung überschreiben; (2) Queue ab Index 98 (reverse_cable_curl) bis 440; (3) Bilder ins Repo img/ (540x720 jpg), index.json, Test, Push; (4) Endpose-/GIF-Test mit 5 Übungen.
- Hinweise: neuer Chat alle ~3 Übungen; Gemini-Limit ca. 4 h Sperre; Grant für Gemini-Fenster läuft nach 30 min Inaktivität ab; Fenster muss auf sichtbarem Space liegen.

## 03.10. 14:35 – GIF-Tool + Stand
- tools/makegif.py neu: OpenCV-DIS-Optical-Flow, A→B→A Loop, 24 Zwischenframes/Richtung, Ghosting-Fallback auf Überblenden, 360x480, 128 Farben (--nodither/--colors 96 spart Größe). Aufruf: python3 tools/makegif.py start.jpg end.jpg out.gif
- Nur an Querformat-/Fremd-Paaren getestet (Bankdrücken 2,15 MB, Curl 1,8 MB); echte 3:4-Paare fehlen noch. Fallback-Schwelle 0,8 = Heuristik.
- Endpositions-Fotos existieren noch nicht (Test geplant: Bankdrücken, Kniebeuge, Klimmzüge, Rudern, Curl).
- Gemini-Generierung läuft weiter bei Index 137 flat_bench_cable_flyes (Queue bis 440, danach ~80 Redo aus Startpos-Audit).

## 03.10. 16:05 – 2 Accounts parallel + Warteliste
- Foto-Generierung läuft mit 2 Gemini-Accounts parallel (G1 von vorn ab Index 145, G2 von hinten ab 436). Je Übung 4 Fotos (m, m-end, w, w-end) für GIF-Agent.
- Redo: incline_cable_chest_press + ~80 aus Startpositions-Audit. Korrekte Ausführung muss sichtbar sein; Stil nicht driften lassen.
- Warteliste: Regisseur-Agent (Skript für Effekt/richtige Ausführung) + Kameramann-Agent (Kameraführung) – erst starten wenn Alex es sagt (Stilrisiko).

## 03.10. 16:45 – Stand Generierung + Helligkeit
- 4-Foto-Sets fertig: vorn bis isometric_wipers (151), hinten bis standing_dumbbell_triceps_extension (430). Restzeit ungefähr 20 h.
- Alex-Wunsch: Bilder heller, Hanteln/Seile/Kabel deutlich sichtbar (ab Index 152 vorn / 429 hinten in jedem Prompt; Start+Ende je Übung gleich hell).
- Redo: Low-Pulley-Frau (Kabel unsichtbar), ggf. Pushdown/Rope-Varianten, incline_cable_chest_press, ~80 aus Audit.

## 03.10. 23:15 – Wechsel-Workflow + Stand (Übungsfotos)
- Ziel: alles fertig Mo 05.10. 12:00, Push aufs Handy am Ende. Gestaffelter Gemini-Wechsel G1/G2, ≈ 28 Übungen/h.
- Fertig (4er-Set): vorn bis Index 173, hinten bis 403; in Arbeit 174 (vorn) / 402 (hinten). ≈ 227 Übungen mit Fotos, ≈ 70 komplett (ungefähr). End-Fotos für ≈ 157 frühe Übungen fehlen.
- Perspektivfehler: Kamera ändern (Start = Ende gleiche Kamera), Fehler sammeln und am Schluss korrigieren (~/Downloads/_redo_list.txt).
- Neue Redos: 403 m-end/w-end, 174 m-end/w.
- Regisseur + Kameramann: von Alex 23:14 gewünscht, Start steht aus (Pose-/Kamera-Vorgaben für 174–402 + Redo).

## 04.10. 01:10 – Neuer Foto-Prozess (Team) + Bankdrück-Test
- Beschluss Alex: Bulk-Queue gestoppt, frisch mit Team starten. Wichtigste Regel: korrekte Ausführung von Start bis Ende perfekt sichtbar, keine verdeckten Schultern/Gliedmaßen; nur die trainierten Körperteile ändern sich (auch Bein möglich), Kamera/Bank/Raum/Licht/Rumpf identisch.
- Team: Kameramann wählt je Übung Perspektive (Kandidaten testen), Regisseur schreibt Pose-Skript, QA-Checker prüft jedes Bild sofort (Pose, Start≠Ende, keine Verdeckung, Gerät sichtbar, gleiche Szene) und gibt konkretes Feedback an Regisseur → Kameramann; max. 3 Versuche, dann Redo-Liste. Auf Alex' "Go" warten vor großen Läufen.
- Prio Phase 1 (je 5 pro Kategorie): Langhantel-Bankdrücken flach/Schräg/Decline/(eng), Kurzhantel, Seilzug nur von oben, Aufwärmen im Stehen (neu erlaubt), Rücken (inkl. Extension), Brust/Trizeps am Gerüst, Beine, Core. Rest im Laufe der Woche. Duplikate (≈203, tools/regie/duplikate.md) zuletzt; Alex entscheidet (A raus, B gleiches Bild, C eigene Fotos).
- Dateien im Repo: tools/regie/regie.json (293 Pose-Einträge), kamera.json (273), duplikate.md, dup_slugs.json, regie_kamera_bankdruecken_flach.md (Spezifikation + QA-Checkliste 7 Punkte).
- Test Bankdrücken flach: A frontal (Gemini 2) Start+Ende identische Szene, GIF mit Ghosting in der Mitte; B Seite 3/4 (Gemini 2) Start+Ende identische Szene, ebenfalls Doppelstange in der Mitte (Tool fällt auf Blend zurück). Alex-Urteil: Seitenansicht zeigt die Übung am genauesten → Kamera für Bankdrücken flach = Seite 3/4.
- Gemini-1-Versuch für B verworfen (Kopf angehoben, andere Szene). Gemini-Edit-Prompts "Bearbeite/Korrigiere" werden ignoriert; funktioniert nur "Erzeuge ein NEUES Bild … exakt dieselbe Szene … Einziger Unterschied: ENDPOSITION …" im selben Chat von Gemini 2. Mittelfoto (Zwischenposition) kam fast identisch zum Endfoto zurück → noch offen.
- Offen: Doppelstange im GIF (Ideen: Mittelfoto mit klarerem Prompt, kürzere Strecke, Crossfade-only); Frauen-Fotos + Schräg/Decline/eng; Redo-Liste ~/Downloads/_redo_list.txt.

## 04.10. 02:15 – Bankdrück-Gruppe (Phase 1) Stand
- Regel: Prompts zurück zum Original-Muster (fester Stil-Block + kurzer variabler Teil), siehe tools/regie/prompt_vorlage.md; vor jeder Übung alte Referenz-GIFs in gifs/ ansehen; Start/Ende mit Feinangaben (Start Stange auf Brust, Ellbogen ≈85°; Ende Arme KOMPLETT gestreckt 180°).
- Kamera: flach = Seite 3/4; Schrägbank = reine Seitenansicht (90°); Decline + eng (Mann) = reine Seite. Frontal/3-4 bei Schrägbank verworfen (Ellbogen im Ende nicht sichtbar gestreckt).
- Fertig/abgenommen (Mann): flach, Schrägbank (GIF gut), Decline (passt, Hintergrund grau → neue Mann-Bilder mit „neon-grünem Hexagon-Licht an der Wand"). Frau: flach (anderer Raum), Schrägbank (Hexagon-Raum, gut).
- Eng (Close-Grip) Mann: Start/Ende + GIF erzeugt (Blend), QA durch Alex offen. Erste Version falsche Bank → mit verstellbarer Bank neu.
- Offen/Redo: Frau Decline (Gemini rendert Schrägbank/Sitzen, 3 Versuche → Redo-Liste), Frau eng. Frage an Alex: Mann/Frau im selben Raum (Hexagon)?
- Danach: Kurzhantel, Seilzug oben, Aufwärmen stehend, Rücken, Brust/Trizeps Gerüst, Beine, Core (je 5).

## 04.10. 02:35 – Referenzbild-Trick + QA 9/10
- Alex: Raum der Frau als Referenzbild an Gemini für den Mann anhängen → gleicher Raum. Funktioniert (Kurzhantel-Bankdrücken flach Mann: Start+Ende fertig, Raum gleich).
- QA-Punkt 9 (Bankwinkel) + 10 (Geräte-Realismus: nichts verbogen/dazugedichtet) in tools/regie/regie_kamera_bankdruecken_flach.md.
- Frau: Schrägbank Start2/Ende2 übernommen (Arme leicht lang, ok). Close-Grip Frau: 3 Versuche (Bank schräg, Kopf links/anderer Raum) → mit Referenzbild neu.
- Beide Geminis parallel: G1 Mann, G2 Frau.

## 04.10. 03:10 – Phase 1 Fortschritt (autonom, beide Geminis)
- Technik-Recherche: tools/regie/technik_1..3.md (Quellen + Winkel; Gradzahlen meist Richtwerte).
- Fertig (Start+Ende, Mann+Frau, Hexagon-Raum via Referenzbild, GIFs gebaut, in ~/Downloads): Bankdrücken flach/Schräg/Decline(Mann)/eng; KH-Bankdrücken flach (m,w), KH-Schrägbank (m,w), KH-Fliegende (m,w), Einarmiges KH-Rudern (m,w), KH-Schulterdrücken sitzend (m,w). Dateinamen: kh_<übung>_<kamera>-m/w(-end).jpeg.
- Offen Bankgruppe: Frau Decline (Gemini rendert nicht), Mann/Frau flach (Langhantel, Raum angleichen).
- Weiter: Seilzug oben (5), Aufwärmen (5), Rücken (5), Gerüst (5), Beine (5), Core (5).

## 04.10. 03:30 – Seilzug-Set (Phase 1)
- Fertig (Mann+Frau, Start+Ende, Downloads `sz_*`): Gerader-Arm-Pulldown (Beton R2), Trizepsdrücken Seil (Backstein R1), Face Pull (Holzlamellen R3, 3/4), Kniender Cable-Crunch (Akustik+Lichtring R5, Seite).
- Offen Seilzug: Pushdown gerade Stange (fast identisch zu Seil-Pushdown, Raum R4 Fensterfront).
- Danach: Aufwärmen (5), Rücken (5), Gerüst (5), Beine (5), Core (5).

## 04.10. 04:15 – Aufwärmen (Phase 1)
- Fertig (M+W, Start+Ende, `aw_*`): Hampelmann (Backstein, Front), Armkreisen (Holzlamellen; Ende = Arme senkrecht oben, Front-Vorwärts-Arme ging nicht), Beinschwingen (Akustik+Ring, Hand am Rack), Rumpfdrehen (Beton).
- Offen: Hüftkreisen – Gemini zeigt Beckenversatz nicht (nur Start-m); Redo-Liste. Idee: 3/4-Kamera/Seite.
- Hampelmann brauchte KEINE Zwischenbilder.
- Seilzug-Set komplett (siehe 03:30). Nächste: Rücken (5), Gerüst (5), Beine (5), Core (5).

## 04.10. 06:05 – Rücken, Gerüst, Beine, Core (Phase 1 fertig)
- Rücken ×5 (`rk_*`): Hyperextension, Klimmzug, Rudern, Kreuzheben, Reverse Fly. Gerüst ×5 (`gr_*`): Brust-Dips, Trizeps-Dips, Liegestütze erhöht, Inverted Row, Hanging Knee Raise. Beine ×4 (`bn_*`): Kniebeuge, Ausfall, RDL, Wadenheben. Core ×5 (`cr_*`): Plank (Start=Knie-Plank, Ende=voll), Crunch, Russian Twist (3 Versuche, Doppel-Hantel), Bicycle Crunch (Spiegelung entfernt), Beinheben liegend.
- Alle M+W, Start+Ende, GIFs (Blend) gebaut in /tmp/out (Cloud), Fotos in ~/Downloads.
- Redo-Liste: Hüftkreisen, Hip Thrust (m+w, Gemini zeigt Sitzen auf Bank), Trizeps-Dips (schwache Absenkung), Frau Decline.
- Nächste Schritte: Fotos auf 540x720 q82, GIFs neu bauen, in App einbinden (img/index.json + Version, Playwright 390/1300), dann restliche ~441 Übungen, Duplikate zuletzt (Alex entscheidet).

## 04.10. 10:10 – App-Einbindung Phase 1
- 26 Übungen (m+w) als GIF + Startfoto in img/ eingebunden (index.json v4, 500 Einträge): Kniebeuge→barbell_squat, Ausfall→dumbbell_lunges, RDL, Wade→standing_dumbbell_calf_raise, Plank, Crunch→crunches, Russian Twist, Bicycle→air_bike, Hyperext, Klimmzug→pullups, Rudern→bent_over_barbell_row, Kreuzheben→barbell_deadlift, Reverse Fly, Trizeps-Dips→dips_-_triceps_version, Liegestütze Füße erhöht, Knee Raise→hanging_leg_raise, KH flach/schräg/Fliegende/Rudern/Schulter, Seilzug ×5.
- Nicht zugeordnet (kein Pool-Slug oder Datei unklar): Brust-Dips, Inverted Row, Beinheben liegend (Matte), Aufwärmen ×4 (aw_*), Langhantel-Bankgruppe (Dateinamen schraeg_/close_/decline_ unklar).
- 10:15 Bankgruppe eingebunden (index v5): Langhantel flach, schräg, Decline (nur Mann), eng → barbell_bench_press_-_medium_grip, barbell_incline_bench_press_-_medium_grip, decline_barbell_bench_press, close-grip_barbell_bench_press. Weiter nicht zugeordnet: Brust-Dips, Inverted Row, Beinheben liegend, Aufwärmen ×4 (kein Pool-Slug).
- Weiter: restliche ~441 Pool-Übungen generieren (Queue Bauch, Rücken, Brust, Beine, Schultern, Arme), Gemini hat kein Limit.
