# QA iPhone-Nachprüfung 2026-10-13 (Harness 402x815, Safe-Area oben 14 / unten 34, Tabbar 117px hoch)

Getestet: Commit 457e557 (HEAD). App-Code unverändert. Skripte: /tmp/qa/chk.js, chk2-7.js, open2.js. Screenshots: /tmp/qa/chk-*.png (Viewport + "-end" = bis ganz unten gescrollt), Desktop: /tmp/qa/chk-desk-*.png.
Methode: pro Zustand Tabbar-Oberkante (698px), Scroll-Ende (unterstes Element) und elementFromPoint auf jedem Tab gemessen (z-index), Screenshot gelesen.

## Gesamturteil
Keine harten Blocker. Der Kernfehler (Inhalt unter Tab-Leiste) ist behoben: bei JEDER Seite liegt das letzte Element am Scroll-Ende über der Tab-Leiste (kleinster Abstand 5px, Start-Seite). Alle 5 Tabs sind in jedem Zustand antippbar (keine Überdeckung), außer erwartet unter Sheets/Backdrop. 0 JS-Fehler (pageerror). Einziger Konsolenfehler: ERR_TUNNEL_CONNECTION_FAILED (externe Ressource, Sandbox-Proxy, nicht App; 404 "undefined" kam nur von meinen Testdaten ohne gif).

## Passt ohne Scrollen? (Soll-Seiten)
| Seite | Inhalt-Ende | Tabbar-Top | Ergebnis |
| Übersicht leer | Wochentage-Leiste endet ~648 | 698 | PASST (50px Luft) |
| Übersicht mit 3 Trainings/Streak | letztes Element 640 | 698 | PASST (58px) |
| Wochenplan leer | 647 | 698 | PASST (51px) |
| Auto-Training Formular | 634 | 698 | PASST (64px) |
| Alle Übungen Landing | 604 | 698 | PASST (94px) |
| Profil | ~674 (Text "Trainingshinweise zurücksetzen") | 698 | PASST (~24px, knappste Seite) |
Scrollende Seiten (ok, Ende erreichbar): Start 807 (Ende 5px über Tabbar), Wochenplan mit Trainings 811, Gen-Ergebnis 1105 (28px), Drill-down 3019 ("Mehr laden" 28px), Verlauf, Preview (11px), Tagestraining (22px).

## Befunde

### HOCH
Keine.

### MITTEL
M1. Trainings-Detail (wtrain) mit Trainingshelper: Übungsliste nur 276px (138 CSS-px) hoch
- Seite: Wochenplan > eigenes Training öffnen (Screenshots chk-20-wtrain.png, chk-33-wtrain8-end.png, chk-31-wtrain-days.png)
- Messwert: .tx-rows scrollHeight 556 / clientHeight 276; Titel + Umbenennen + Helper-Karte (~95px) oben und fixe Leiste "Tage wählen / Speichern / Starten" (top 569, ~116px) unten fressen ~70% der Höhe. Man sieht ~2,3 Übungen, "+ Übung hinzufügen" ist im Ruhezustand halb unter der Leiste verdeckt (erst nach Scrollen innerhalb der Liste voll sichtbar, dann OK: addBot 559 < Leiste 569). Wirkt wie "abgeschnitten".
- Fix: Helper-Karte kompakter (eine Zeile, "Verstanden" als X) oder in die Liste scrollen lassen statt fix oben; "Umbenennen" neben den Titel statt eigene Zeile (spart ~40px); Leiste: "Tage wählen" einklappen auf 44px Höhe und Speichern/Starten in dieselbe Zeile. Ziel: Liste >= 380px.
- Zusatz: Button "Tage wählen · Anfänger" hat keinen linken/rechten Innenabstand (Text klebt am Rand bei x=16, Pfeil ▲ am rechten Rand) -> padding 0 14px.

### NIEDRIG
N1. Übersicht mit Fortschritt (2/3): Gauge-Ring läuft durch das Wort "WOCHENTRAINING" (chk-41-overview-seeded.png, "W" überstrichen). Im leeren Zustand ist der Ring grösser/weiter außen. Fix: Label-Position oder Ringradius im gefüllten Zustand gleich halten (Ring-Zeichnung nicht mit smaller radius), Label 6-8px tiefer.
N2. TV-Button vs Profil-Kreis (Übersicht): kein Overlap, aber nur 7px Abstand (Badge/Kreis rechts 341, TV links 348; TV oben 44 statt 30 wie auf den anderen Seiten). Fix: gap auf >=10px (Kreis 4px nach links oder TV-Button 40px statt 44).
N3. Alle Übungen Drill-down: Chip "Bizeps · Unter…" kollidiert mit Typ-Chip "Körper" (chk-64-filter-applied.png: Chips überlappen ~8px). Fix: Muskel-Chip max-width: calc(100% - Typ-Chip-Breite - 8px) oder Typ-Chip bei langem Muskel weglassen.
N4. Auto-Training Formular: Button "✨ ZUSAMMENSTELLEN" bricht das Emoji in eigene Zeile über den Text (chk-07), daneben "Überrasch mich" umbricht ("Überrasch / mich"). Fix: Emoji inline (white-space:nowrap, kleinere Schrift 0.95rem) oder Buttons untereinander / 60:40.
N5. Auto-Training Ergebnis: nach "Zusammenstellen" bleibt das komplette Formular oben stehen, Ergebnis beginnt erst bei y~580; ohne Scroll sieht man nur 2 Übungen (der Auto-Scroll per scrollIntoView läuft smooth nach 60ms, im Screenshot nach 700ms Reset nicht beurteilbar). Fix (Wow): Formular nach Zusammenstellen zu einer Zeile einklappen ("Anfänger · Aufbau · 45 Min · Brust  Ändern").
N6. Alle Übungen Landing: Abstand zwischen Reihe 2 (Arme/Bauch/Beine) und Reihe 3 (Warmup/Push/Pull) ~38px grösser als zwischen Reihe 1 und 2 (~20px), wirkt ungleich. Fix: gleiches gap oder bewusst mit kleiner Überschrift "Split".
N7. Start-Seite: knappster Scroll-Ende-Abstand (5px) und beim Scroll-Anfang ist "Core & Bauch" erst nach Scrollen sichtbar (kein Problem, aber +16px padding-bottom am Seitenende würde atmen lassen). Gleiches Muster Wochenplan mit Trainings (5px).
N8. Desktop 1300px: nichts kaputt (Sidebar, keine Überläufe, kein JS-Fehler; 6 Seiten geprüft). Hinweis: Alle-Übungen-Landing-Kacheln werden riesig (~335x370px, Landing braucht 2 Scrolls) und Overview-TV-Button schwebt ausserhalb der Karte rechts oben; rein kosmetisch. Fix optional: .xr-landing max-width 900px oder aspect-ratio kleiner auf >=900px.

## Zustände ohne Befund (Screenshots gelesen)
- Vorlagen-Sheet (Preset-Sheet "Brust · 50 Übungen"): Leiste Abbrechen/Anlegen komplett sichtbar (Buttons y~657-701), Sheet liegt über der Tabbar, kein Tab durchscheinend klickbar (elementFromPoint = Sheet).
- Detail-Sheet Alle Übungen: Titel, Gewichtsklassen, Tage-Chips vollständig, letzte Zeile (Sonntag / Auto · Brust) y~703 < Sheetende 815, X-Button erreichbar.
- Filter-Sheet: komplett, Zurücksetzen/Fertig sichtbar; Filter "Kurzhantel" wirkt (101 Übungen, Chip mit ✕).
- Drill-down Brust/Push/Pull/Warmup: ok, Zurück-Pill + Count, Ende 28px über Tabbar. Landing-Tiles Push/Pull/Warmup (fSplit) funktionieren, Zähler 189/92/23.
- Suche "squat": funktioniert, Ergebnis scrollbar.
- Verlauf leer / mit 4 Einträgen: ok; Verlauf-Detail: ok, Ende erreichbar (Zurück-Button im Hero).
- Profil: Anfänger/Fortgeschritten/Profi-Umschalter funktioniert, persistiert (heimtraining.profile {level:1}).
- Preview (Vorlage/Training): "TRAINING STARTEN" fix über Tabbar (Ende 687 < 698), Liste scrollt.
- TV-Modus: Header + Zurück + Bild + Satzbuttons; Seite scrollt 53px (sh 750 / ch 697), Pfeil-Buttons erst am Ende sichtbar (Ende 680 < 698), passt nicht ohne Scroll. Niedrig: Bild verkleinern (max-height 38dvh), damit Pfeile ohne Scroll sichtbar sind.
- Player (Workout läuft): Vollbild ohne Tabbar/TV-Button, Satz-fertig-Button + Drawer sichtbar, Drawer-Griff unten 780 (Safe-Area ok), Drawer öffnet sich (pf-sheet open, top 348).
- Tagestraining (Push): Ende "+ Übung hinzufügen" 22px über Tabbar.
- Persistenz: Auto-Training speichern -> neue Seite im selben Browser-Kontext: "Auto · Rücken" und Profil-Level vorhanden. (Hinweis: 7 leere "Montagstraining..Sonntagstraining" werden bewusst als WEEKDAY_SEED angelegt und in der Liste ausgeblendet.)

## Harness-Hinweis (nicht App)
tools/qa-iphone-harness.js verliert nach page.reload()/zweitem goto die simulierten Safe-Areas und die Tabbar-Verbreiterung (body-Höhe 815 statt 767, Tabbar-Top 758). Für Persistenz-/Seed-Tests: Route auf Context-Ebene + addInitScript (siehe /tmp/qa/open2.js) und Style-Tag in die CSS-Antwort einbauen. Außerdem: Beispiel-Lauf selector `.wv-tile[data-act=fSplit]` existiert nur auf der Landing nach Zurück; `fit.lastBottom` ohne Scroll-Ende meldet "CUT" bei jeder scrollbaren Seite (False Positive, Skript sollte content.scrollTop=max setzen und dann messen).

## Empfehlung
Freigabe für den Deploy: der iPhone-Abschneide-Fehler ist behoben und keine Seite hat Blocker. Vor dem nächsten Feature noch M1 (Trainings-Detail kompakter, Liste >=380px) fixen; N1-N5 sind 5-Minuten-Politur. Danach ?v= hochzählen und pushen.
