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
| V6-04 | Ziel-Leiste v2 – nach Live-Test | ⚪ wait | V6-03 |
| V6-05 | Status-Erkennung & -Anzeige (verpasst/unvollständig/erledigt) | 🟢 done | V6-01 |
| V6-06 | Kalenderstreifen + Verlauf-Vorschau prominenter | 🟢 done | V6-05 |
| V6-07 | Design-Entwurf (Phase 3, eigener Design-Agent) | ⚪ wait | V6-01…06 |

V6-07 Auftrag (30.09. geklärt): eigener Design-Agent bekommt die Referenz-Screenshots
(Dashboard mit KPI-Kacheln/Kalorien-Balken/Plan-Card, Onboarding-Screen mit Bild-Karussell)
als Stil-Vorgabe — übernimmt Kachel-Form, Seitenaufbau und einzelne Features (z.B. das
Bild-Karussell vom Onboarding-Screen), baut daraus aber ein eigenständiges Design, keine
1:1-Kopie der Vorlage. Läuft erst NACH V6-01 bis V6-06 (Struktur/Logik zuerst, 4-Phasen-Schema).

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
