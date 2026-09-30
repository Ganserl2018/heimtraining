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

## V5 – Ideenspeicher / Warteliste
| ID | Titel | Status | Deps |
|---|---|---|---|
| V5-01 | Ernährungs-Tab | ⚪ open | — |
| V5-02 | Fortschritt/Ziele-Tab | ⚪ open | — |

Live verifiziert (Playwright, Desktop-Breite 1100px): Sidebar "Alle Übungen" klappt
Push/Pull/Legs/Core auf, Klick auf Übung öffnet "Tauschen"-Picker, TV-Icon öffnet
TV-Ansicht, "Zurück" führt zur vorherigen Ansicht zurück. Kein Console-Error außer
fehlendem favicon.ico (unkritisch, bereits vorher so).

V3/V4 gebaut von Claude selbst (kein separater Checker-Agent eingesetzt – Umfang war
klein genug für Live-Verifikation per Browser-Automation). V5 bleibt liegen, bis
Logik dahinter feststeht.
