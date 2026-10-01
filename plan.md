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
| V6-08 | Design-Entwurf restliche App (Wochenplan/Verlauf/Profil/TV) | ⚪ wait | V6-07 (erst wenn Übersicht passt) |

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
| V10-01 | BLOCKER: Neues Training stürzt ab | ⚪ open |
| V10-02 | BLOCKER: Leere Trainings/Ruhetag-Tap färben App rot | ⚪ open |
| V10-03 | BLOCKER: Health-Sync-Token öffentlich (script.js ~651) | ⚪ open |
| V10-04 | Startzeit in UTC | ⚪ open |
| V10-05 | Verlauf-Detail ungestylt | ⚪ open |
| V10-06 | Picker-Suchfeld weiß | ⚪ open |
| V10-07 | Ziel-Formular von Tabbar verdeckt | ⚪ open |
| V10-08 | Tap-Targets <44px | ⚪ open |
| V10-09 | TV-Ansicht ignoriert Wochenplan | ⚪ open |
| V10-10 | START WORKOUT fällt auf Legacy-Push | ⚪ open |
| V10-11 | Beenden ohne Satz zählt als Workout | ⚪ open |
| V10-12 | Kein Löschen | ⚪ open |
| V10-13 | Backup/Export, PWA, Offline | ⚪ open |
| V10-14 | Refresh über Mitternacht | ⚪ open |
| V10-15 | Verpasst nicht heilbar | ⚪ open |
| V10-16 | Ring vs. Wochenstreifen Fenster | ⚪ open |
| V10-17 | Dauer/Kalorien nur nach manuellem Start | ⚪ open |
| V10-18 | Wochenplan-Liste/Seitentitel | ⚪ open |
| V10-19 | Lange Übungsnamen bei 360px | ⚪ open |
| V10-20 | Legacy-Day-View gequetscht | ⚪ open |
| V10-21 | Verlauf-Datum roh, "push" lowercase | ⚪ open |
| V10-22 | Kontrast Rot-Modus + kleine Schrift | ⚪ open |
| V10-23 | Desktop-Übersicht nicht zentriert | ⚪ open |
| V10-24 | Profilfelder ungenutzt, Kalorien überhöht | ⚪ open |
| V10-25 | Toter Code/CSS + öffentliche interne Dateien | ⚪ open |
