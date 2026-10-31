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
