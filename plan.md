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

## 04.10. 14:30 – Bildset-Produktion Stand (Speichern)
- Neu eingebunden seit 12:00 (m+w, GIF+JPG, index.json v21): reverse_grip_bent-over_rows, straight_bar_bench_mid_rows, wide-grip_lat_pulldown, cable_reverse_crunch, cable_seated_crunch, pallof_press, standing_cable_wood_chop, side_bridge, standing_cable_lift, reverse_crunch, barbell_shrug, bent-arm_dumbbell_pullover, decline_crunch. Im Repo ~93 Männer-GIFs. Letzter Commit 7e6acb7.
- Neue Regeln (Alex): (1) Bewegungsablauf vorher aus Trainerquellen holen → tools/regie/bewegung.json (20 Übungen, Quellen+Hinweise); (2) Checker-Agent ist für ALLE Qualitätsansprüche verantwortlich (Aufrichtungswinkel, Gesicht sichtbar, Licht gleich Start/Ende) – Einbau erst nach Checker; (3) Stil: dunkle Backsteinwand, grüne Neonleiste, Person hell; Mann/Frau gleicher Raum, im selben Gemini-Chat bleiben; (4) Wenn Ende nicht änderbar: Start an Ende-Look anpassen (mit Ende als Referenz hochladen) – hat bei decline_crunch Frau funktioniert; (5) „wenn es nicht besser geht, nimm es“.
- Neue Technik (Recherche tools/regie/prompt_tricks.md): Strichmännchen-Pose-Skizze (PIL) als Upload + „Pose-Skizze, gleiche Szene, gleiche Person“ → löst Decline (Gemini zeichnete sonst Schrägbank). Skizzen ref_decline_*.png in ~/Downloads. Noch offen testen: Hip Thrust, Russian Twist, Seitneigung, Hüftkreisen.
- Endbild-Trick: „Ende fast wie Start“ → Prompt „noch viel weiter … fast SENKRECHT (80°)“; zu wenig Winkel = Checker-FAIL.
- decline_crunch: eingebunden mit Abstrichen (Ende m/w nur ~45–50° aufgerichtet, Alex akzeptiert); Frau-Start an Ende-Look angepasst.
- Redo-Liste: ~/Downloads/_redo_list.txt (~28 Übungen); G2 weiter im Bildlimit, alles in G1. Queue: ~237 Slugs offen (tools/regie/queue.json minus img/<slug>-m.gif).
- Nächste: Hip Thrust (Skizze), Cable Chest Press, Close-Grip Lat Pulldown, Rest aus bewegung.json.

## 04.10. 21:30 – Bildproduktion Schnell-Modus (Speichern 10.10.)
- Eingebaut seit 14:30 (m+w): decline_dumbbell_flyes, close-grip_front_lat_pulldown, one_arm_lat_pulldown, seated_good_mornings, lower_back_curl, deadlift_with_chains, bent_over_one-arm_long_bar_row, t-bar_row_with_handle, around_the_worlds, kneeling_high_pulley_row, cable_crossover, cable_iron_cross, dumbbell_side_bend. Nur Mann: wind_sprints, shotgun_row (Frauen offen, tools/regie/women_pending.txt). Letzter Commit 85e8bdf, ~105 Männer-GIFs.
- Schnell-Modus (Alex 19:04): Mann-Paare zuerst, Frauen gebündelt später (tools/integ2.sh <slug> <nbase> m|w), 1 Checker-Lauf pro Übung, wenig Screenshots. "Knapp/kaum auffällig" = akzeptieren + Redo-Liste.
- Zurückgestellt (Gemini scheitert, Details in ~/Downloads/_redo_list.txt): cable_incline_pushdown, bodyweight_flyes, clock_push-up, stomach_vacuum, one-arm_high-pulley_cable_side_bends, gorilla_chin_crunch, incline_bench_pull, bench_dips, bent-arm_barbell_pullover, lying_cambered_barbell_row.
- Offen: ca. 210 Queue-Slugs; nächste: dumbbell_one-arm_triceps_extension (Mann), dann einfache Stehübungen. Duplikate (184) zuletzt, Alex entscheidet. Wochenlimit war am 04.10. leer.
- Kniffe: siehe Vault 06_Debugging/gemini-uebungsbilder-pose-erkenntnisse.md (Editor-Download, Seitenansicht Brust AUF Bank, "DEUTLICH"-Edit).

## 10.10. 12:45 – Bildproduktion (Speichern)
- 194 Männer-GIFs im Repo (Commit 1565a21), 86 Slugs warten auf Frauen (tools/regie/women_pending.txt), queue_done.txt 228.
- Heute neu nur Mann (28): dead_bug, 90_90_hamstring, hip_flexion_with_band, stomach_vacuum, lateral_bound, standing_hip_circles, bench_dips, gorilla_chin_crunch, lying_prone_quadriceps, seated_front_deltoid, pushups, all_fours_quad_stretch, plyo_push-up, push_up_to_side_plank, clean_shrug, single-arm_push-up, lying_dumbbell_tricep_extension, one_arm_floor_press, one_arm_dumbbell_bench_press, ez-bar_skullcrusher, wide-grip_barbell_bench_press, barbell_squat_to_a_bench, barbell_step_ups, hang_clean, front_squat__clean_grip_, bent_over_two-arm_long_bar_row, clean_pull, snatch_shrug.
- Schwach aber akzeptiert (Redo-Liste): plyo_push-up (Luftphase kaum sichtbar), stomach_vacuum/clean_shrug (kleiner Unterschied).
- Linkes Gemini im Bildlimit, nur rechtes nutzbar. Weiter: Rest Mann-Queue, dann Frauen (integ2.sh … w), Duplikate (184) zuletzt – Alex entscheidet.

### 11.10. 13:50 – Bildproduktion (Speichern)
- 263 Männer-GIFs im Repo, women_pending.txt 156 Zeilen (Frauen offen), ~66 Mann-Slugs offen (Kabel/Band/Maschinen).
- Neu seit 10.10. 12:45: Olympic-/Block-Varianten, Bodyweight/Mobility, Ketten/Wade, band_*, cable_* (chest_press, russian_twists, judo_flip, incline_pushdown, flyes), one-arm_high-pulley side bends, bosu crunch, incline_bench_pull, lying_cambered_barbell_row, bent-arm_barbell_pullover, bodyweight_flyes, clock_push-up, rear_leg_raises.
- Akzeptiert mit Abstrichen (~/Downloads/_redo_list.txt): cable_incline_pushdown, bodyweight_flyes u.a.
- Beide Gemini-Apps wieder frei, laufen parallel. Nächste: cable_lying_triceps_extension, cable_one_arm_tricep_extension, cable_rope_overhead_triceps_extension, cable_deadlifts, cable_hip_adduction, one-legged_cable_kickback. Danach Frauen (integ2.sh … w), Duplikate (184) zuletzt.

## 12.10. 12:20 – Übungsbilder KOMPLETT (Mann + Frau)
- 329 Männer-GIFs + 329 Frauen-GIFs im Repo, women_pending.txt leer. Offen: 184 Duplikate (Alex entscheidet), Redo-Liste (~/Downloads/_redo_list.txt), Warteliste (Siri-Pausen-Timer, Welcome/Setup, V10-03 Token-Rotation). Alex muss echtes Stangengewicht eintragen.

## 13.10. Korrekturen-Liste (Alex) – Start erst bei "Go"
1. Übungen überall anklickbar → öffnet Übungs-Datenseite (Daten der Übung).
2. Übungs-Datenseite existiert, sieht schlecht aus → verschönern (Phase 3 Design).
3. "Zu Training hinzufügen" (Sheet in Alle Übungen): Wochentagbelegung statt Wochenplan-Streifen (Tage als Auswahl mit Belegung).
4. Hellere Grüntöne bei den Tagen, damit belegte stärker hervorstechen.
5. Übungsbilder etwas heller (CSS-brightness).
6. Tagestraining-Seite schöner/übersichtlicher, weniger Scrollen.
7. Bankdrücken-Leiste (Übersicht) ersetzen durch Rückwärts-Leiste: 156 Trainings in einem Jahr, zählt runter.
- 13.10. 02:30 V15-1..7 umgesetzt + gepusht: globale Übungs-Detailseite (Tipp auf Foto/Name in Tagestraining, Vorschau, Verlauf, Player, Alle Übungen), neues Sheet-Design, Wochentage mit Belegung + helle belegte Tage, Bilder +20% Helligkeit, Tagestraining-Zeilen einklappbar (Name = bearbeiten, Foto = Info), Countdown-Leiste 156/Jahr (neuer Key longgoal2). Test 390px ok; Alex prüft live.
- 13.10. 02:55 Nachträge V15 (alle gepusht, letzter Commit 32fd977): Auto-Training-Vorschau anklickbar; Wochenplan-Seite neu (Meine Trainings, Auto-Training-Karte, Vorlagen als Foto-Kacheln: Muskelgruppen oben, Split darunter, Namen ohne "Nur"); Auto-Training mit "Anzahl Übungen" (Auto/3-10); Detailseite: X sticky + Schließen-Button, doppelter Tag weg.
- OFFEN: Alex meinte "hier fehlt was?" auf der Detailseite – Antwort steht aus (Ausführungstext? Satz/Wdh-Empfehlung?). Alex prüft live auf iPhone.
- 13.10. 14:50 WARTELISTE (Alex): Schiebe-Lösch-Funktion (Swipe-to-delete) für Trainings.
- 13.10. 15:00 Speichern: Detailseite (Schließen), Vorlagen (alle Pool-Übungen, Anzahl/Einzelwahl, Foto-Kacheln), Wochenplan-Seite neu; Straße aufgeräumt (V14 komplett, Offene-Punkte-Block neu). Warteliste: Swipe-to-delete (V5-11). OFFEN: Detailseite "was fehlt?" (V16-5), V11-05 Status unklar. Als Nächstes: Straße komplett umbauen (Tabs Offen/In Arbeit/Fertig, eine Zeile pro Kachel).
- 13.10. V16-5 Detailseite kompakt ohne Scrollen, Schließen-Button entfernt (X bleibt)
- 13.10. Alle Übungen: Muskelgruppen-Fototiles als Einstieg (Drill-down, ‹ Muskelgruppen)
- 13.10. Alle Übungen: zweite Kachelreihe Push/Pull/Beine
- 13.10. Alle Übungen: zweite Reihe Warmup/Push/Pull
- Warteliste (13.10. 15:30): Übungs-Zähler – zeigt welche Übungen Alex wie oft macht (Verlauf/Fortschritt). Erst nach aktuellem Feature.

**Straße-Adresse (immer per url republishen, nie ohne): https://claude.ai/artifact/33Pz2wW3JRTVER4UhY8wWT**
- 13.10. Wochenplan kompakter: Vorlagen-Kacheln flacher, passt ohne Scrollen (leer)
- 13.10. Vorlagen-Auswahl-Sheet kompakt (10 Zeilen sichtbar), eigene Trainings als schmale Zeilen
- 13.10. 19:xx QA-Checker Gesamtlauf: Bericht reports/qa-2026-10-13-gesamt.md. Behoben: Warmup-Chip-Bug (Operator-Priorität), Mann/Frau-Umschalter 2 Spalten. Offen (Warteliste/nächste): TV-Button-Position Übersicht, Auto-Training ohne Scroll + Hinweis, Vorlagen-Sheet toter Bereich, Muskelnamen deutsch überall, Tagesseite Mobil, Touch-Targets <44px, Übersicht passt auf echtem iPhone nicht (Wochentage-Streifen unter Tab-Leiste, vom Checker verpasst), "Diese Woche -" leer (verpasst).
- 13.10. 21:00 QA-Fixes Runde 1 (nach Checker-Lauf): ROOT CAUSE für "schneidet immer ab": body war 100dvh hoch trotz html-Safe-Area-Padding → Inhalt ragte ~93px unter den Bildschirm. Fix: body-Höhe = 100dvh − Safe-Areas. Dazu: Tab-Leiste z-index über Kacheln, TV-Button in Übersicht auf Höhe Kopfzeile, Übersicht passt auf iPhone, Wochenplan flacher/ohne Scroll, Auto-Training auf einer Seite + Hinweis Muskelgruppe, Start-Seite leere Paketkachel schmal, Alle-Übungen-Landing, Muskelnamen deutsch (TV/Verlauf), Kurzhantel-Erkennung (Around The Worlds). Offen: Touch-Targets <44px, Tagesseite Mobil, Vorlagen-Sheet Desktop.
- 2026-10-13 20:10 QA-Runde 1: M1 Trainings-Detail kompakt (Liste 383px, Helfer-Karte mit ✕, Umbenennen neben Titel) – Commit a18d726, ?v=20261013k. Offen: N1–N8 Optik-Politur, Touch-Ziele <44px, Tagesseite mobil, leeres "Diese Woche –" auf Übersicht.
- 2026-10-13 23:20 Fertig: Übersicht-Leiste "Dieser Monat" (wie Ring, 96161ec), Schrift heller (90d593f), V5-11 Wischen auf eigenen Trainings: rechts Archiv (+Zurückholen, Store heimtraining.archive), links Löschen (e6d5ab7, ?v=20261013o). Offen: N1–N8, Touch-Ziele, Tagesseite mobil.
- 2026-10-18 12:40 NEUE LOGIK V17 "Jetzt trainieren" (Alex-Go): spontan, Zeit+Körperstelle+Geräte heute+Mindestumfang (z.B. 3x10 unterer Rücken, 30 Min, Extension-Stuhl). Phasen: V17-1 Skelett (Auto-Training umbauen, Geräte-Haken, Mindestumfang) → V17-2 Körperstellen-Listen (inkl. Entlastung) → V17-3 fehlende Übungen anlegen (Hyperextension Römischer Stuhl, Bird Dog, Cat-Cow, Kindhaltung, Superman-Hold, Single-Leg-RDL, Plank) → V17-4 Bilder (Gemini, genau!) → V17-5 Selbst-Anlegen mit Hintergrund-Bildgenerierung → V17-6 bestehende Bilder prüfen → V17-7 Jetzt-Training speichern → V17-8 Optik/Absichern. Gerätepark laut Memory: Langhantel 150cm+45kg Scheiben, 2 KH, Klimmzug-Gerüst+Dips, verstellbare Bank (Decline), Seilzug oben, Hyperextension-Stuhl, Türanker-Bänder, Matten.
- 2026-10-18 13:10 Warteliste V5-14 Studio-Modus (McFit München-Schwabing, Maria-Probst-Str. 17): Schalter Zuhause/Studio, erweiterte Geräteliste; Quelle Urban Sports Club (keine genaue Geräteliste; Foto der Geräteübersicht vor Ort möglich). Erst nach V17. Außerdem: Geräte-Zuordnung aller 514 Übungen prüfen + "Kann ich nicht"-Markierung (Alex-Go offen). Seilzug nur von oben (Regel nach Namen, 0bbdf16).

## 18.10. Gear-Durchgang (Alex entschieden)
- Olympische Übungen raus; Dips nur "Dips - Triceps Version"; Seilzug-von-unten + Pallof → Türanker-Band; GHR ja. Fest in gearfix.json (430 ok / 84 nicht machbar), gearOf() + generate() nutzen es. Offen: "Kann ich nicht"-Marker in der App, Studio-Schalter (V5-14).
- 18.10. V17 Wisch-Tausch in Auto-Ergebnisliste: Übung wischen (links/rechts) → raus, neue passende (gleiche Gruppe, Geräte ok, nicht doppelt) rückt nach. "Kann ich nicht"-Marker verworfen (Alex: "kompletter Käse").
- 18.10. Auto-Liste: rechts wischen = ★ Favorit (heimtraining.favs), links = neue Übung, ⇄-Button = Direktauswahl (Overlay mit Suche, gleiche Gruppe zuerst, Favoriten vor). Warteliste: Favoriten im Generator bevorzugen / Favoriten-Filter in Übungen.
- 18.10. Warteliste V17-9: Bilder für Band-Ersatz-Übungen (Seilzug unten/Brusthöhe → Türanker-Band, z. B. "Seated Cable Rows"): aktuelle Bilder zeigen Seilzug-Gerät, passende Band-Bilder später (Gemini, exakt). Anzeige "ca. kg" bei Band-Ersatz prüfen.
- 18.10. 13:50 Auto-Speicherung eingerichtet (alle 30 Min via send_later + nach jeder Kachel): STAND.md + Chat-Archiv im Vault, tools/save-chat.py. (Regel in CLAUDE.md: Eintrag wurde vom Auto-Modus blockiert, Alex muss freigeben.)
- 18.10. V17-2 gebaut: Fokus "Genau: Körperstelle" (Unt. Rücken, Latissimus, Mittl. Rücken, Trapez, Nacken, Gesäß, Beinbeuger, Quadrizeps, Waden, Bizeps, Trizeps, Unterarme, Abduktoren, Adduktoren); wählbar einzeln/kombiniert. Pool hat nur 11 Unterer-Rücken-Übungen (nur 2 ohne schwere Heber für Level 0) → Extension/Entlastung kommen mit V17-3.
- 18.10. Körperstelle ↔ Fokus gekoppelt: Körperstelle antippen schaltet ihre Fokus-Gruppe automatisch an (z. B. Unt. Rücken → Rücken), Gruppe antippen entfernt ihre Körperstellen. Fokus-Gruppe und ihre Stellen nie doppelt.
- 2026-10-18: Übungsnamen DE (names_de.json, dn()), Umschalter Profil (lang), Hantelbank-Bereinigung -34, Optik-Entwurf Design-Artefakt 8rG4HWfnffiuvERX42XnaL; v=20261018u
- 2026-10-18: Knopf 'Bild falsch' (Detailseite, localStorage heimtraining.badimg) + 'Liste kopieren' im Profil; Bildprüfung 396: 345 ok/51 unsicher (Vault Bildpruefung-2026-10-18.md); v=20261018v
- 2026-10-18: bild-stil.md angelegt (Szenen/Licht/Kleidung modern/Positionen). Offen: gilt nur für neue Bilder oder ganzes Set?

## 18.10. 15:57 – 5 Probe-Übungen neuer Stil + GIF-Übergänge
- 5 Probe-GIFs (Mann) via Gemini/Chrome erzeugt (Bankdrücken, RDL, Face Pull, KH-Schulterdrücken, Kniebeuge), Aufnahme ohne Download per Zoom+save_to_disk (Cursor per Inpaint entfernt, unterer 4,5%-Rand abgeschnitten).
- Alex: Helligkeit ok, Übergänge verschwommen (Doppelbild-Ghosting bei großer Bewegung). Fix v2 RDL: Zwischenbild von Gemini ("Not right… nur 20° Neigung") + tools/makegif_multi.py (Keyframes, N=6, SHARP=5). Test geschickt, Entscheidung zu den anderen 4 offen.
- Offen: Mittelbilder für Bench/FP/DP/Squat; dann Entscheid Alex: ganzen Bildsatz im neuen Stil neu (M+W gleiche Szene).

## 18.10. 16:15 – GIF-Übergänge: was die Lösung war (Alex: "jetzt passt es")
- Lösung = Methode vom 4.10.: `python3 tools/makegif.py start.png end.png out.gif --blend --sharp 2 --frames 8 --ms 70 --hold 600` (nur 2 Bilder, reines kurzes Überblenden, lange Standbilder). NICHT Flow (Auto wählt bei großer Bewegung FLOW → Doppelkopf/Wackeln), NICHT makegif_multi/Zwischenposen (Gemini setzt Hüfte/Stange pro Bild anders → Wackeln). makegif_multi.py bleibt im Repo, nicht benutzen.
- Bild-Regeln RDL (gelten für alle Probe-Übungen): Start UND Ende im gleichen Chat mit "PURE SIDE PROFILE, shoulders and hips perpendicular to camera, NO torso rotation toward the camera"; Endbild ausdrücklich tiefer ("Stange eine Handbreit über dem Boden", 60° Neigung); Startbild neu im selben Profil erzeugen, wenn das erste leicht gedreht ist (Alex: "dreht sich während der Übung").
- Aufnahme ohne Download: Chrome zoom+save_to_disk, unteren 4,5 % abschneiden (Gemini-Handle), Mauszeiger im Bild per cv2.inpaint entfernen.
- Offen: Bench/Face Pull/KH-Schulter/Kniebeuge mit demselben Verfahren (Profil-Endbild, --blend --sharp 2); dann Alex-Entscheid über ganzen Bildsatz.

## 18.10. 16:25 – Probe-Übungen neuer Stil abgenommen (Alex: "viel besser, passt zu 90%")
- 5 Mann-GIFs (RDL, Face Pull, Kniebeuge neu mit starken LED-Streifen; Bank + KH-Schulterdrücken alte Bilder) in /home/claude/show5/final/. Prompt-Bausteine in bild-stil.md.
- Offen: Alex entscheidet, ob der ganze Bildsatz (M+W, ~400 Übungen) so neu gemacht wird; die 10% Rest-Kritik noch nicht benannt.
- 16:31 Face Pull v3 (Turm auf Augenhöhe, Seil zum Gesicht) gesendet; Regel Bewegungslogik-Check in bild-stil.md
- 16:33 Face Pull v3 von Alex abgenommen; Rezept in bild-stil.md
- 16:35 Wochenlimit Claude bei 92% → heute keine Bildproduktion mehr. Offen: 4 Probe-Übungen auf Bewegungslogik prüfen, Entscheidung Gesamtsatz, Optik-Go
- 16:37 Regel: keine Hintergrund-Personen, leere LED-Szene. Face Pull v3 neu machen sobald Limit frei
- 2026-10-18 16:50 Limit-Vorbereitung (ohne Bilder): tools/szenen-plan.py → szenen-plan.md (396 Übungen: Szene, Start, Ende, Logik-Check; 99 mit ⚠ Standard = manuell prüfen), anleitungen_de.json (regelbasierte dt. Anleitungen, Auto-Entwurf), neue_uebungen.json (7 neue: Hyperextension, Bird Dog, Cat-Cow, Kindhaltung, Superman, Single-Leg-RDL, Bulgarian Split Squat; Plank+Hip Thrust sind schon im Pool). Prompt-Generator (Punkt 2) bewusst weggelassen. Erinnerung Fr 23.10. 09:00: Bildproduktion automatisch weiter (trig_01VdexJ5gbLRXuboLja8rzMu).
- 16:47 Wochenlimit-Reset = jeden Freitag 22:00 Uhr (Berlin). Erinnerung 23.10. auf 22:00 (20:00Z) verschoben
- 16:52 szenen-plan.py verfeinert: nur noch 32 von 396 mit ⚠ (Shrugs, Step-Ups, Presses, Rack Pulls u. a.). Hinweis: Squat-Regel nennt 'Stange' auch bei Körpergewichts-Sprüngen → beim Prüfen am Freitag korrigieren.
- 16:58 V17: Detailseite zeigt Abschnitt 'Anleitung' (3 Schritte, aus anleitungen_de.json, nur für regelbasiert erkannte Übungen ~364; Standard-Fälle ohne Text). ?v=20261018x. iPhone-Test ok.
- 2026-10-18 17:15 V18 NEU-OPTIK live (Design-Entwurf 8rG4HWfnffiuvERX42XnaL): Blauschwarz #0b0f14, Mint #4ade80, Anton+DM Sans, runde Karten/Pills, schwebende Tab-Leiste, Anleitung-Abschnitt in Detailseite. Rot-Modus bleibt. ?v=20261018y. iPhone-Test (402x874, 118%): Übersicht/Plan/Verlauf/Jetzt ohne Scrollen/Abschneiden. Harness NEWTAB=1.
- 2026-10-18 17:05 V18 Neu-Optik (Mint/Blauschwarz) von Alex abgelehnt: 'neon grün mit dem Lichteinfall war viel cooler' → komplett zurückgenommen (?v=20261018z), Lime #a8f03a + Glow bleibt. Regel: Optik-Änderungen bauen auf Neongrün + Lichteinfall (Glow/Lichtkegel) auf, kein Farbwechsel; Anleitung-Abschnitt bleibt.
- 2026-10-18 17:10 V17 Ablauf-Logik (Alex: Muskeln zuerst, Geräte danach): Jetzt-trainieren-Reihenfolge Fokus → Körperstelle (offen) → Geräte heute (nur passend zum Fokus, mit Anzahl) → Zeit → Umfang; 'Geräte heute' von der Training-wählen-Seite entfernt. ?v=20261018A. Offen/Warteliste: Gerätewahl pro Körperstelle noch feiner, Ein-Tipp-Wiederholen letztes Training.
- 2026-10-18 17:25 BUG: ?v=20261018A (Großbuchstabe) → Auto-Update-Regex [0-9a-z] las nur '20261018' → Reload-Schleife, App hängt + springt zur Startseite. Fix: Regex [0-9A-Za-z], Version 20261018b, Regel in CLAUDE.md.
- 2026-10-18 17:30 Jetzt trainieren: Namensfeld gleich am Anfang (optional, Standard 'Auto · Fokus'); Umbenennen später im Training wie gehabt. ?v=20261018c
- 2026-10-18: Trainingsname überall anklickbar (Wochenplan-Karte, Archiv, Detail-Titel, Vorschau, Pack-Name) → Umbenennen; Player-Titel nicht. v=20261018d
- 2026-10-18: Stift-Symbol als grüner Kreis-Badge, Name nicht mehr abgeschnitten, Umbenennen-Button entfernt (v=20261018e)

## Warteliste – Alex-Ideen 2026-10-18 23:03 (Optik-Umbau "mehr Wumms", einfacher/intuitiver) – NICHT bauen bis Go
- W1 Startseite: nur EIN großer runder Start-Button, sonst nichts.
- W2 Seite 2 = Planungsseite: alles sofort gut sichtbar + intuitiv einstellbar, Trainings werden hier gespeichert.
- W3 Übungsseite: Bilder GANZ groß (aktuell zu klein).
- W4 Selbst erstellte Trainings: Seite intuitiver + übersichtlicher.
- Hinweis: weitere Ideen folgen; Optik muss auf Neon-Grün + Lichteinfall aufbauen (V18 Mint abgelehnt).
- W1b Start-Button-Logo: neon-grüne Hantel oder 💪 im runden Button (23:27).
- 2026-10-23 22:05 Freitag-Reminder: Face Pull v4 ohne Hintergrund-Personen fertig (show5/fp3_led.gif, bisher NICHT ins Repo – wartet auf Alex' Ansicht). 4 Probe-Übungen geprüft: RDL/Bank/Schulterdrücken ok, Kniebeuge Arm-Wechsel. Nächster Schritt: Alex' Go für Gesamtsatz M+W.

## 2026-10-24 V20 Design-Umbau (Alex: "Design jetzt, Bilder später")
- Startseite = nur großer runder Neon-Lime Start-Button mit Hantel (Glow/Puls); alte Übersicht (Ziele/Streak) erreichbar über Verlauf → "Ziele & Streak".
- Tab "Übersicht" → "Start". Start-Button → Planungsseite (renderStart): SCHNELLSTART (Fokus + Zeit + TRAINING BAUEN), "Alle Einstellungen", WEITER-Banner bei offenem Training, Pakete + Vorlagen.
- Übungsliste: 1 Spalte, große Bilder ohne Filter; Detail-Sheet Bild 54dvh.
- Eigene Trainings (wtrain): Thumbs 76px, Namen umbrechen.
- `?v=20261024e`. Offen: Feinschliff nach Alex-Feedback am iPhone.
- V20b: Home ohne Topbar/TV, Wortmarke HOME/FORCE (Anton, skew, Glow) mittig, Button kleiner. `?v=20261024f`
- V20d: Trainingsnamen nur noch 'Loser 1–100' (kleinste freie Nummer, umbenennbar bleibt), Muskelanteile in % (nach Sätzen, Gruppen) in Wochenplan-Karte, Paket, Detail. Gen-Namensfeld entfernt. `?v=20261024j`
- 2026-10-24: Design-Skills (Impeccable, Taste, Emil Kowalski Motion) ins Repo .claude/skills + Pflichtregel in CLAUDE.md.
- 2026-10-24 V20e (Impeccable polish + Emil animate): FORCE ohne Gradient-Text, HOME als Outline (kein Kicker), SCHNELLSTART-Label weg, ✨→SVG, Puls-Glow-Animation weg, Eintritts-Motion nur bei Seitenwechsel (data-enter, 260ms ease-out, Stagger), Press-Feedback, Focus-Ringe, ::selection, reduced-motion. impeccable-Launcher (Binary-Download) vom Classifier blockiert → manuell nach craft-floor. `?v=20261024l`
- 2026-10-24 V20f: Planung reduziert (nach Taste app-screens): oben gespeicherte Trainings (Loser N, Muskel-%, ▶ = direkt ins Workout), darunter Fokus+Zeit+Bauen, Vorlagen/Pakete/Jetzt-trainieren-Karte entfernt (Vorlagen im Wochenplan), Panel flach. `?v=20261024n`
- 2026-10-24 V20g: Umfang (Übungen/Sätze/Wdh) inline in Planung unter Bauen-Button. `?v=20261024p`
- 2026-10-24 V20h: Geräteauswahl (8 Pills, 4x2) in Planung unter Umfang, kein Scrollen (sh=ch=707). `?v=20261024s`
- 2026-10-24 V20i: Bauen-Button ganz unten in Planung (Einstellungen oben). `?v=20261024t`
- 2026-10-24 V20j/k: Planung ein System (Sektionslabel FOKUS/GERÄTE, Segment-Regler Zeit/Übungen/Sätze/Wdh gleiche Höhe, Auswahl=Lime-Fläche, Gerätepills 4x2), FOKUS-WÄHLEN-Zustand, darunter Karte Level+Ziel (scrollt unter dem Fold). `?v=20261024y`
- V20k–m: Planung Reihenfolge Zeit→Geräte→Fokus→Übungen/Sätze/Wdh (3 Tipp-Felder), Bauen-Button, darunter Link 'Weitere Einstellungen ›' (genOpen); Level/Ziel-Karte entfernt. ?v=20261025b
- V20n–q: Planung Wumms (Anton, Glow, Hierarchie Fokus>Geräte), Hero 'PLANUNG' + Unterzeile, TV-Button auf Planung weg. ?v=20261025f
- V20r–s: Designer-Review umgesetzt (Geräte leise, Tap>=40-44, weniger Glow, CTA-disabled leise, Hero 2.2rem). ?v=20261025h. Offen: Review-Punkt 3/8 teilw., CSS-Blöcke V20j–s zusammenführen.
- V20t: Geräte gewählt = Lime-Fläche. ?v=20261025i
- V20u: Bauen-Button immer aktiv; ohne Fokus = Zufalls-Fokus (2–3 Gruppen), Label 'ÜBERRASCH MICH'. ?v=20261025j
- V20v: Wechselwirkung Geräte↔Fokus: gewählte Geräte graut nicht passende Muskelgruppen aus (groupCounts), Fokus graut Geräte aus (gearCounts). ?v=20261025k
- V20w: Labels Zeit/Geräte/Fokus entfernt, Geräte im Fokus-Stil (Anton, Lime+Glow). ?v=20261025m
- V20x: Gerät antippen aktiviert alle dazu passenden Muskelgruppen automatisch. ?v=20261025n
- V20y: alle Geräte abgewählt → Fokus leer. ?v=20261025o
- V20z: Gerät an=Gruppen dazu, ab=nur nicht mehr abgedeckte weg; manuell weggeklickte Gruppen bleiben weg. ?v=20261025p
- V20aa: Generator hält gewählte Übungsanzahl ein (Auffüllen reihum aus anderen Gruppen, wenn eine Gruppe mit den Geräten zu wenig hat). ?v=20261025q
- V20ab: Hyperextension (Rückenstrecker, Gerät Extension) in pool.json + names_de ergänzt, Bild offen (gifs/hyperextension.gif fehlt); isBack(): unterer Rücken zählt zu Rücken, wenn Übung Extension braucht. ?v=20261025r
- V20ac: Menüleiste auf Startseite wieder weg (Regel body.is-home .tabbar fehlte im CSS). ?v=20261025s
- V20ad: gespeicherte Geräte beim ersten Öffnen der Planung → passende Gruppen sofort aktiv (einmal pro Sitzung). ?v=20261025t
- V20ae: Planung öffnen = frisch: nichts gewählt außer Zeit (Geräte+Fokus leer, Geräte-Speicher geleert); V20ad entfernt; 'Überrasch mich' nutzt alle Geräte. ?v=20261025u
- V20af: Fokus antippen aktiviert passende Geräte (umgekehrte Richtung), abwählen nimmt sie zurück. ?v=20261025v
- V20ag: Gerät abwählen nimmt alle Gruppen raus, die es abdeckt (Spiegel zu 'an'). ?v=20261025w
- V20ah: Einstellungsseite (gen) im Planungs-System: gemeinsamer builderHtml(full) (Zeit, Geräte, Fokus, Körperstelle, Umfang, Level, Ziel), gleiche Logik, Hero 'EINSTELLUNGEN', Auswahl aus Planung bleibt erhalten. ?v=20261025x
- V20ai: Level/Ziel aus Einstellungsseite entfernt (Warteliste: später wieder). ?v=20261025y
- V20aj: Planung ohne Titel/Hero, Umfang wieder als Zahlenreihen (Übungen/Sätze/Wdh). ?v=20261026a
- V20ak: Planungs-Titel wieder da; 'Planung' im Zurück-Knopf der Einstellungsseite entfernt (nur ‹). Planung passt ohne gespeichertes Training. ?v=20261026c
- V20al: Zurück-Knopf auf Einstellungsseite komplett entfernt. ?v=20261026d
- V20am: Einstellungsseite nur noch Körperstelle (Planungsinhalte raus) + FERTIG zurück zur Planung; Ergebnis-Ansicht 'Dein Training'. ?v=20261026f
- V20an: Spezielle Muskeln = additiv zum Fokus (Gruppe bleibt, Muskel kommt dazu; Generator holt sie zuerst, keine Duplikate). ?v=20261026h
- V20ao: Planung zeigt gewählte spezielle Muskeln im Link 'Weitere Einstellungen · +Trizeps'. ?v=20261026i
- V20ap: Hauptgruppen bekommen den Löwenanteil, jeder spezielle Muskel genau 1 Übung; gearfix: Hammer Grip Incline DB Bench Press -> dumbbell+bench (war barbell). ?v=20261026k
- V20aq: gearfix.json: 9 Bizeps-Curls (Hammer, Konzentration, Zottman, Cross-Body, Inner-Biceps, Incline Hammer/Inner) von barbell auf dumbbell(+bench) korrigiert. Offen: restliche barbell-Zuordnungen ohne 'Barbell' im Namen prüfen (Floor Press, Lower Back Curl, Finger/Wrist Curls). ?v=20261026l
- V20ar: Gerät ab → Gruppen weg + Geräte ohne Bezug zum verbleibenden Fokus ebenfalls aus (kein 'aktiv ohne Fokus' mehr). ?v=20261026m
- V20as: Logik nach Alex-Reihenfolge Start → Zeit → Geräte → Muskeln → Rest, nur EINE Richtung: Geräte bestimmen, welche Muskeln wählbar sind (ohne Gerät alle gesperrt/gedimmt); Muskel-Klick ändert keine Geräte; Gerät ab nimmt nur nicht mehr abgedeckte Muskeln raus; Umfang gedimmt bis Muskel gewählt; Überrasch mich nimmt Muskeln nur aus dem, was die Geräte abdecken. ?v=20261026n
- V21 Profil: Ziel als Fortschrittsbalken (x/Ziel), Gruppen 'Deine Werte'/'Level', 4er-Werte-Reihe, Sprache DE/EN, Reset-Links klein; ?v=20261027a
- V21b Planung: Höhen in px, ~55px kürzer (Weitere Einstellungen schnitt ab); ?v=20261027b
- V21c Planung/Einstellungen: Scroll/Wippen gesperrt; ?v=20261027c
- V21d Hero-Titel (Anton, Glow, Untertitel) auf Wochenplan/Übungen/Verlauf/Profil, TV-Button global weg; ?v=20261027d
- V21e Wochenplan: Wochentage Anton groß, heute = Lime-Fill+Glow; ?v=20261027e
- V22 Neuer Reiter 'Trainings' (view trainings): Aktiv/Archiv-Umschalter, Karten mit Thumbs+Start-Button, + Neu / Jetzt trainieren; 6 Tabs gleich breit; ?v=20261027g
- Wochenplan umbenannt in 'Woche' (Tab+Titel); ?v=20261027h
- V22b Logik-Check: Trainings-Karten klickbar (Delegate-Selektor), Speichern -> Trainings-Seite, Tab-Highlight/Löschen-Rückweg per wFrom, Planung ohne Gespeichert-Liste, Woche ohne 'Meine Trainings' (nur Tage+Vorlagen); ?v=20261027j
- V22c Trainings-Karte: Beschreibung (Übungen + Muskelgruppen) + Tage Mo-So direkt zuweisen; ?v=20261027k
- V22d Wischen auf Trainings-Karten wieder da (rechts Archiv, links Löschen), Ergebnis-Tausch geprüft; ?v=20261027l
- V22e Wisch-Tausch auch im gespeicherten Training (links neue Übung gleiche Gruppe, rechts Favorit); ?v=20261027m
- V22f Übung in anderes Training kopieren/verschieben (Sheet, +Neues Training); ?v=20261027n
- V22g Übungs-Detail: 'Zu Training hinzufügen' in allen Ansichten + Chip 'Neues Training'; ?v=20261027o
- V22h Fix: Übungszeilen im Training waren gequetscht (Wisch-Wrapper), Muskel-Anteile mit Abstand; ?v=20261027p
- V22i kleinere Schrift Muskel-Anteile/Übungsnamen im Training; ?v=20261027q

## Bild-Lücken fürs nächste Gemini-Batch (24.10., aus Planung-Vorschau)
Kombinationen Muskelgruppe + einzelnes Gerät ohne Übung (App zeigt dann "kommt beim nächsten Bilder-Durchlauf"; Lücken landen auch in localStorage `heimtraining.gaps`):
- Beine + Seilzug (echte Lücke: Cable-Leg-Übungen fehlen/gefiltert)
- Brust/Schultern + Klimmzug-Stange, Brust/Schultern/Arme/Bauch + Extension, Beine + Klimmzug: fachlich sinnlos allein, nur mit Zusatzgerät relevant, kein Bild nötig
Alex-Regel: Übung ohne Treffer → beim nächsten Gemini-Bildact neu erstellen.

## Start-Button Sonar-Puls (24.10. 23:25)
BTN-05 aus Design-Bibliothek auf START-Button (Startseite): 3 Ringe versetzt (.9 s) + Tipp-Stoß (weiß). Reduced-Motion: statische Ringe. v=20261027t. Test: Harness mit CSS=/tmp/ht/style.css (sonst lädt er alte CSS!).

## Trainings löschen sichtbar (24.10. 23:50)
🗑-Knopf auf jeder Trainingskarte (Aktiv + Archiv), Zwei-Tipp: 1. Tipp rot mit „?“ (3 s), 2. Tipp löscht; kein confirm()-Dialog. Wischen bleibt. Verlauf bleibt erhalten. v=20261027y. Favoriten-Funktion (V22-E) weiter wartet auf Go.

## Hyperextension bereinigt (24.10. 23:58)
Doppelte "Hyperextension" (ohne Bild) aus pool.json/names_de/neue_uebungen entfernt; "Hyperextensions With No Hyperextension Bench" (Bild mit Bank, Gerät ext) heißt jetzt "Hyperextensions mit Bank". v=20261028a.

## Fix gequetschte Übungszeilen (25.10. 00:05)
Trainings-Detail: Zeilen schrumpften/überlappten (Bild+Name abgeschnitten). `.tx-rows{grid-auto-rows:max-content}`, Swipe-Wrapper (.tx-sw/.wp-sw/.gn-sw/.tr-sw) `flex:none; min-height:max-content`. v=20261028b.

## V22-E Favoriten Stufe 1 (25.10. 00:12)
★/☆ oben links auf jeder Trainingskarte (t.fav), Reiter Aktiv | ★ Favoriten | Archiv. Stufe 2 (Lieblingsübungen als eigene Liste) offen. v=20261028c.

## Warteliste neu (25.10. 00:15, Alex: "merk das mal vor")
- V5-16 Regelmäßiges Wiegen: Gewicht eintragen (Erinnerung/Rhythmus), Verlauf-Kurve, Basis für Fortschritt (V5-02).
- V5-17 Regelmäßige Ganzkörper-Fotos: Fortschrittsmessung am Bild (Foto-Rhythmus, Vorher/Nachher-Vergleich; Speicherung lokal, Datenschutz klären).
Erst nach den laufenden Features; Alex gibt das Go.

## Favoriten Stufe 2 – Lieblingsübungen (25.10. 00:40)
★ im Übungs-Detail (neben Name), ★ auf Kacheln, Kachel "★ Favoriten" auf Übungen-Startseite (Filter filterFav). Gleiche Liste (heimtraining.favs) wie Wisch-Favorit. v=20261028h. Noch offen: Favoriten im Generator bevorzugen (Warteliste).

## V23-D Aufwärmen (26.10.)
- 8 neue Warmup-Übungen (Armkreisen, Armschwingen, Scapular Push-Up, Katze-Kuh, Open Book, Schulterkreisen, Beinschwingen, Glute Bridge leicht) – **Bild-Lücke** (Gemini-Batch, bis dahin ohne Bild).
- Warmups sind aus Generator/Vorlagen-Füllung ausgeschlossen; `WARM` je Muskelgruppe, `warmupsFor()` setzt 2 passende vorne ins Training (Generator, Vorlagen, einmalige Migration bestehender Trainings `warmmig1`). Wisch-Tausch einer Warmup tauscht nur gegen Warmups.
- Profil kompakter (letzte Zeile hat ~55px Luft).

## V24-A Nächstes Training berechnen (26.10.)
- Button „➜ NÄCHSTES TRAINING“: Ganzkörper-Mix – 2 Hauptgruppen (Beine/Rücken/Brust/Schultern, am längsten nicht dran, nie nur Drücken) + 1 kleine (Arme/Bauch), mind. 2 Tage Pause; Vorschau mit Warmups; Gewicht = letztes, +2,5 kg (KH +2) erst wenn die Übung 2× hintereinander komplett mit demselben Gewicht geschafft wurde (↑).
- Offen/Warteliste: Wochenfrequenz/Erholungszeit (48 h) einrechnen, Favoriten bevorzugen, Ganzkörper-Variante bei 2×/Woche.
