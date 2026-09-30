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

## V6 – Übersichtsseite 2.0 (geplant 30.09., noch nicht gebaut)
| ID | Titel | Status | Deps |
|---|---|---|---|
| V6-01 | Feste Wochentage pro Wochenplan-Training | ⚪ open | — |
| V6-02 | Quick-Start-Button (kombiniert: offen > heute fällig) | ⚪ open | V6-01 |
| V6-03 | Ziel-Leiste v1 – Zahl + Zeitraum | ⚪ open | — |
| V6-04 | Ziel-Leiste v2 – nach Live-Test | ⚪ wait | V6-03 |
| V6-05 | Verpasst-Erkennung & -Anzeige (Mechanik iterativ) | ⚪ open | V6-01 |
| V6-06 | Kalenderstreifen + Verlauf-Vorschau prominenter | ⚪ wait | V6-05 |

## V7 – Profil-Seite
| ID | Titel | Status | Deps |
|---|---|---|---|
| V7-01 | Profil-Formular (Gewicht, Alter, Größe, Geschlecht) | ⚪ open | — |

## V8 – Kalorien & Verlauf-Detailseite
| ID | Titel | Status | Deps |
|---|---|---|---|
| V8-01 | MET-Tabelle pro Übung (aus Free-Exercise-DB-Attributen) | ⚪ open | — |
| V8-02 | "Training starten"-Button + Start-Zeitpunkt | ⚪ open | — |
| V8-03 | Kalorien-Berechnung pro Training | ⚪ wait | V7-01, V8-01, V8-02 |
| V8-04 | Verlauf-Detailseite | ⚪ wait | V8-03 |

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
