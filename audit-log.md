# Audit-Log: Änderungen ohne ausdrückliche Anweisung (Auditor-Agent pflegt)
Einstufung: A angewiesen · B abgeleitet/im Rahmen · C eigenmächtig. Zuletzt geprüft: 27.10.2026 01:50 (Auditor, bis b4570c3).

| Datum | Hash | Stufe | Was | Wirkung für Alex | Status |
|---|---|---|---|---|---|
| 26.10. | ce6ac83 | C | Start-Tab leitete direkt in den Wizard um, Übersichtsseite entfiel (Missverständnis "Start-Seite") | Startbutton-Seite war weg, Alex: "das geilste" entfernt | zurückgebaut 7d270b6 |
| 27.10. | 6305571 | B | Tab-Klick beendet Dash-Modus (Fehlerbehebung für hängende Balken-Seite) | Start-Tab zeigt wieder Startbutton | von Alex nicht beanstandet |
| 27.10. | 33b0b6b | A→C | HOME-FORCE-Schrift als Button: Optik veränderte sich (Zeilenhöhe) | Schrift saß anders | korrigiert d368a82, Nebenwirkungs-Regel in qa-checkliste |
| 27.10. | 0eb4f50 | B | Tipp-Blasen auf 2 gekürzt, Kopf "TIPP" (Alex hatte Überarbeitung "B" freigegeben, Details von Claude) | weniger Tipps | offen, abnehmen |
| 27.10. | d9602ac | B | Uhrzeit-Feld beschriftet (Alex: "frag sowas kleines nicht, mach's einfach") | Kasten hat Beschriftung | offen |
| 27.10. | a3b60c5 | A | Neu mischen/Einplanen/Anpassen nach oben (Alex: "nach oben bitte") | wie gewünscht | abgenommen |
| 26./27.10. | diverse | B | `?v=`-Hochzählen bei jeder UI-Änderung | keine | Standard |
| 27.10. | 38c813b..34ba504, e567f5f | A | Chat-Archiv, Neuer-Chat-Warnung, ctx-check, Messung (alle mit Alex-Zitat) | nur Regeln/Tools, UI unverändert | abgenommen |
| 27.10. | 0dae907 | A | Ergebnisseite: Namen/Chips nicht abgeschnitten ("Da schneidest noch was ab") | wie gewünscht | Zitat nicht im Archiv auffindbar (vor Kompression), plausibel |
| 27.10. | 2efae96, b761658 | A | Screenshot-Regeln in CLAUDE.md | keine UI | abgenommen |
| 27.10. | ff7ddb4, 5f20adf, 158e369, 0a099a5 | A | Wischen-Zeile eine Zeile, Symbole größer/heller, Neu-mischen-Symbol größer/mittig/2px | wie verlangt | abgenommen |
| 27.10. | fbc897e | B | Aktionszeile: Emoji durch einheitliche SVG-Symbole ersetzt (Alex: "mach mal die Zeile schön und gleichmäßig") | Symbole sehen anders aus (Ersetzung, nicht wörtlich verlangt) | offen, abnehmen; Rückbau fbc897e |
| 27.10. | a090ae8, 89ec3b5, 3a07e04, b601164 | A | Ergebnis-Hero wie Trainingsseite, Kasten weg, Breite (Zitate je im Archiv) | Hero-Kacheln mit Zahlen statt Textzeile | offen, Alex-Feedback laufend |
| 27.10. | 200246b, 500d248, fa57172, b4570c3, f56ed6a | B | plan.md/ctx-log/qa-checkliste-Pflege (eigenständig bzw. "Speichern") | keine UI | Standard |

Prüfung 27.10. 01:50: 0 C-Funde. Alle Commits tragen Auftrag-Zeile. Lieblingselemente vorhanden: Startbutton + Halten-Füllen (.home-btn.hold in style.css), Sonar-Ringe. Hinweis: style.css-Kopfkommentar sagt "statt Neon" (Altlast, Look in qa-checkliste als Neon geführt, nicht verändert).

Regel ab jetzt: jeder Commit-Body enthält `Auftrag: "<Alex-Zitat>"` oder `Auftrag: eigenständig`.

## Prüfung 31.10.2026 abends (Auditor, bd09b90..c854ca9, Session 01Sttn3rWJAykZSyYgfakDNz)
| Datum | Hash | Stufe | Was | Wirkung für Alex | Status |
|---|---|---|---|---|---|
| 31.10. | d18ad3a, 81131c9 | A | Woche-Kacheln/Ruhe-Schrift heller, Dim-Schrift überall heller (Zitate im Commit) | wie verlangt | offen, abnehmen |
| 31.10. | e129f02 | B | Übungszeile neu (Sätze × Wdh · kg, Beschriftung). Zusätzlich: Auswahlmenü "Eintragen als" durch Segment Gewicht/Körper/Zeit ersetzt (Ersetzung, nicht wörtlich verlangt, aber im Rahmen von "Ja mach mal") | Art-Wahl ist jetzt Segment statt Dropdown | offen, abnehmen; Rückbau e129f02 |
| 31.10. | 084464b, aea017c | A | Touch-Ziele mind. 44 px ("Ja Go") | Tippflächen höher, Look gleich | offen |
| 31.10. | e3764f5 | A | Woche-Ziel › zur Ziele-Seite, Zurück landet in Woche | wie verlangt (✎ wurde zu ›) | offen |
| 31.10. | 0fdcc59 | A | Ziele-Seite kompakter, Link nicht mehr verdeckt | wie verlangt | offen |
| 31.10. | a8b7d15, 6b812b6, 6b19ca2, c854ca9 | B | Speichern: plan.md + START-HIER | keine UI | Standard |

Prüfung 31.10.: 0 C-Funde, alle 11 Commits mit Auftrag-Zeile. Startbutton/Halten-Füllen unberührt (kein Diff an .home-btn/hold, `.home-btn.hold` in style.css vorhanden). Neon-Look nicht angefasst.

## Prüfung 1.11.2026 (Auditor, 9204603..d2556d5, Session 01Sttn3rWJAykZSyYgfakDNz)
| Datum | Hash | Stufe | Was | Wirkung für Alex | Status |
|---|---|---|---|---|---|
| 31.10. | 03d09f8 | A | Ziel pro Zeitraum eigene Zahl, Countdown-Block raus ("Go") | Countdown im Ziel-Panel weg (so besprochen) | offen, abnehmen |
| 31.10. | 883f5b0, 8bb7b45, b618c85, bcc8dc5, 10428c5 | A | Ziele-Seite: Kacheln oben, Hero/Titel, "Ziel anpassen" als Glow-Button, Wochentage-Reihe entfernt (Zitate im Transkript verifiziert) | wie verlangt | offen, abnehmen |
| 31.10. | 5764c79, 94d10b1 | A | Buttons "falsche Bilder kopieren" und "Bild falsch" entfernt (ausdrücklich verlangt) | Beide Buttons weg | offen |
| 31.10. | 2cbc0f0, 0f3e942 | A/B | Player Neon-HUD Schritt 1 ("Ok mach 1.") + Designer-Nachbesserung (44px, Lesbarkeit, Sechseck-Proportionen) | Player grün getönt, Sechseck-Optik | offen, abnehmen |
| 31.10.-1.11. | f0c8f54, 8538c38, 88a04ff, d2556d5 | B | Speichern/Auto-Speicherung: plan.md + START-HIER | keine UI | Standard |

Prüfung 1.11.: 13 Commits, A=9 (Gruppen), B=4, C=0. Alle mit Auftrag-Zeile. Startbutton/Halten-Füllen unberührt (kein Diff an .home-btn/hold, `.home-btn.hold` in style.css vorhanden). Neon-Look nicht abgeschwächt, Player erhielt zusätzlich Neon-HUD. Hinweis: Ersetzungen 31.10. (e129f02 Segment statt Dropdown, fbc897e SVG-Symbole) weiter nicht abgenommen.

## Prüfung 1.11.2026 (zweiter Lauf, wöchentlich, 4b839f6)
Keine neuen Commits seit Prüfung 1.11. (nur der Audit-Commit 4b839f6 selbst, nur audit-log.md). A=0, B=0, C=0. Startbutton/Halten-Füllen vorhanden (`.home-btn.hold` in style.css). Offen weiterhin: Abnahme von e129f02 (Segment statt Dropdown) und fbc897e (SVG-Symbole).

## Prüfung 6.11.2026 (Auditor bei "Speichern", 4b839f6..93de2e0, Session 01Sttn3rWJAykZSyYgfakDNz)
| Datum | Hash | Stufe | Was | Wirkung für Alex | Status |
|---|---|---|---|---|---|
| 6.11. | 59cf877 | C | DE/EN-Umschalter im Profil entfernt (ersatzlos, Alex nicht gefragt; Commit nennt nur "bring das in ordnung") | Profil hat keine Sprachwahl mehr; Seite nur Deutsch | offen; Rückbau: `git revert`-Teil in 59cf877 (profLang-Zeile in script.js) |
| 6.11. | 59cf877 | C (leicht) | Player: Button "⚙ Sätze ändern" entfernt (ersetzt durch Sätze direkt im Player, "Löschen" jetzt "Training löschen") | Player-Leiste anders; Weg in den Trainings-Editor fehlt (playEdit-Case in e878f54 entfernt) | offen; prüfen ob Alex den Editor-Zugang braucht |
| 6.11. | 489e285 | B/C (leicht) | Hinweis bei fehlender Muskelgruppe (genNote), gn-wh Abstand, sticky Aktionsleiste, Hero-Zahlen vereinheitlicht (Prüfer-Funde, "bring das in ordnung auf gutaussehende weise") | genNote und Gruppenabstand eigenständig; Hero-Zahlen/sticky Leiste optisch geändert | offen, abnehmen |
| 6.11. | e878f54 | A | Sätze pro Übung in Ergebnisliste ("alles hören"), Prüfer-Regel | wie verlangt | offen |
| 6.11. | a1568ac | A | Balance-Reiter, 8 Übungen, 1-2 im Aufwärmblock (Bilder offen) | wie verlangt | offen |
| 6.11. | f3e0c50 | A | Überschrift Gleichgewicht zwischen Aufwärmen/Training | wie verlangt | offen |
| 6.11. | 5bb8f39 | A | Desktop >=900px: Rahmen 1120px, Startseite mit Menü, 7 Kacheln/Reihe. Entfernt: 2-Spalten-Liste ab 1500px (Begründung: kaputtes Layout) | nur PC-Ansicht; Handy unverändert | offen, abnehmen |
| 6.11. | 3752a0b | A | og-image + OG-Tags | Logo in Link-Vorschau | offen |
| 6.11. | 30e8838, e31a5e6, 93de2e0 | A/B | Prüfberichte, Speichern | keine UI | Standard |
| 3.11. | 1a5e73b, de6e197, 134d81c, 422d442, 9543047 | A | Streak: Flamme -> 3D-Ziffern/Glas (Zitate im Commit; Flamme ersetzt, aber auf Wunsch) | Streak sieht neu aus; 0/9 anfangs Text | offen, abnehmen (bisher nie geprüft) |
| 3.11. | f05d1ae, 828e041 | A | Streak = Trainings in Folge; Code-Kopie-Tool | wie verlangt | offen |

Prüfung 6.11.: 18 Commits (inkl. nicht zuvor geprüfter 3.11.). A=14, B=3, C=2 (+1 leicht). Alle mit Auftrag-Zeile. Startbutton/Halten-Füllen vorhanden (7x `.home-btn.hold`-Treffer in style.css, kein Diff). Neon-Look nicht abgeschwächt. Weiter nicht abgenommen: e129f02, fbc897e.

## Prüfung 8.11.2026 (Auditor, 93de2e0..8fef944, Session 01Sttn3sPKGRtJTq6qmUCuDx)
| Datum | Hash | Stufe | Was | Wirkung für Alex | Status |
|---|---|---|---|---|---|
| 6.11. | 6370ea9 | B | DE/EN-Umschalter im Profil wieder eingebaut (Rückbau C-Fund 59cf877), Warteliste UI-Übersetzung. Zitat "Englisch wird interessant wenn die App in den Store geht" verlangt nicht ausdrücklich den Wiedereinbau | Sprachwahl wieder da; EN ändert nur Übungsnamen (Originalnamen) | C-Fund 59cf877 zurückgebaut; Abnahme offen |
| 6.11. | dd7cc8b | B | Player: "Bearbeiten"-Button wieder da (Rückbau C-Fund 59cf877). Zitat "Wie meinst das genau" ist dünn, Rückbau war aber Auditor-Empfehlung | Editor-Zugang im Player wie vorher | C-Fund zurückgebaut; Abnahme offen |
| 6.11. | f835613, 62c56dd | A | Ergebnisliste: Kreuz weg, Entfernen per langem Links-Wischen (Zitate: "das x ... kann weg", "wieder auf das bewährte wischsystem") | Kein Kreuz; Wischen links kurz = zufällig, lang = löschen | offen, abnehmen |
| 6.11. | 196acb0 | A | Sätze/Wdh nebeneinander in eigener Zeile ("Beheben") | Kompaktere Zeilen | offen |
| 6.11. | 2bc35d9 | A | Profil: "Neu laden" ohne Versionsnummer, als Button mit Icon | Versionsnummer im Profil nicht mehr sichtbar (verlangt) | offen |
| 6.11. | b772209, c046719 | A | Figur: Muskelfarben kräftiger, Brust/Bauch/Rücken eigene 3D-Farben | 3D-Figur farbintensiver, Restfigur dunkler | offen, abnehmen |
| 7.11. | 8220ece | A | Desktop: Trainingsliste sichtbar (Bugfix) | Liste am PC wieder da | offen |
| 6./7.11. | 167590a, 8fef944 | B | Audit-Eintrag; Warteliste Geräte-Sync ("merk es dir") | keine UI | Standard |

Prüfung 8.11.: 11 Commits, A=7, B=4, C=0. Alle mit Auftrag-Zeile (Zitate nicht gegen Chat-Archiv geprüft). Startbutton/Halten-Füllen vorhanden (7x `.home-btn.hold` in style.css, kein Diff), Neon-Look unberührt. Weiter nicht abgenommen: e129f02, fbc897e.
