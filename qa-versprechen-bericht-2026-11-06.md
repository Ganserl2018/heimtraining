# QA Versprechen = Funktion – 06.11.2026 (Stand e878f54)

Test: Playwright, 402x874, ZOOM 118, ET 59/EB 34, NEWTAB=1, Port 8795. Keine JS-Fehler.

## Funde

| # | Fund | Stelle | Text/Versprechen | Realität | Schwere |
|---|------|--------|------------------|----------|---------|
| 1 | Notizen nicht eingebbar | script.js:2329 (Confirm „Neu mischen“), :676 + :721 (Verlauf zeigt `r.note`), Handler :2575–2582 | „Gewichte und **Notizen** dieses Trainings gehen verloren“, Verlauf hat Notiz-Karte | Es gibt nirgends ein Feld `wExNote`/`wSessionNote` (Test: 0 Felder). Notizen können nie entstehen, Handler sind tot | B |
| 2 | Ergebnisliste nur Sätze einzeln | script.js:1061 (Hinweis), :1078 (Zeile) | „Jede Übung lässt sich auch einzeln einstellen.“ (neben Übungen/Sätze/Wdh) | Pro Übung nur Sätze ± und ⇄. Kein Wdh, kein kg, keine Einheit, kein Entfernen, keine Reihenfolge (alles in wtrain :1700–1715 vorhanden). Wdh-Versprechen gilt also nur halb | B |
| 3 | Hinweis „einzeln“ bei versteckter Liste | script.js:1061/:1077 (gen), :1751/:1810 (wtrain) | „…auch einzeln einstellen“ | Solange „Anpassen“ offen ist, ist die Übungsliste ausgeblendet (Test: 0 Zeilen). Hinweis sagt nicht, dass man „Anpassen“ erst schließen muss | C |
| 4 | „Sätze ändern“ wirft aus dem Workout | script.js:1457, :2242, :2279 | „⚙ Sätze ändern“ im Player | Springt nach wtrain (Zeile offen, ok), aber „‹ Zurück“ führt in die Woche, nicht zurück in den Player. Satzanzahl im Player selbst nicht änderbar; `playAddSet` (:2243) existiert, hat keinen Knopf | B |
| 5 | Player: Wdh bei kg-Übungen nicht erfassbar | script.js:1453, :1421 | Ziel „ZIEL 10 ×“ wird angezeigt | Eingabefeld nur für kg; geschaffte Wdh lassen sich nicht eintragen | C |
| 6 | Player „🗑 Löschen“ mehrdeutig | script.js:1457, :2228–2233 | „🗑 Löschen“ neben „Sätze ändern“ unter einer Übung | Löscht das GANZE Training (Confirm nennt es, Button nicht) | C |
| 7 | Übungsdetail: nur 1 Training pro Wochentag | script.js:1989–1990 | „Zu Training hinzufügen“ mit Mo–So | Bei 2 Trainings am Montag nur das erste wählbar (Test: Test B nicht erreichbar, nur „Ohne Tag“-Trainings werden extra gelistet) | B |
| 8 | Sprache EN schaltet nur Übungsnamen | script.js:1903, :169 | Umschalter „DE / EN“ im Profil | Nur `dn()` (Übungsnamen) wechselt; Tabs, Überschriften, Buttons bleiben deutsch (Test bestätigt) | B |
| 9 | Wisch-Rechts auf Trainings-Karten tut nichts | script.js:2680, :2706, Hintergrund :1555/:1851 (`span.a` leer) | Kommentar „rechts = Archiv“; Karte fliegt animiert raus | Archiv entfernt, Archiv-Tab fehlt (:1859 nur Aktiv/Favoriten). Karte fliegt raus und kommt zurück, ohne Wirkung/Text | C |
| 10 | wtrain: Wischen ohne Hinweis | script.js:1710 (`tx-sw`), :2714–2731 | – (Ergebnisliste hat Wisch-Hinweis :1079) | In wtrain funktioniert Wischen (★ / neue Übung) genauso, aber kein Hinweis → unentdeckbar | C |
| 11 | Sätze einzeln (pro Satz kg/Wdh) unerreichbar | script.js:1704–1705, :2259 | „Sätze angleichen“ erscheint nur bei abweichenden Sätzen | Kein Knopf `wSplit` → Nutzer kann Sätze nie einzeln planen; Pills nur, wenn Daten zufällig abweichen | C |
| 12 | Trainings-Level nicht einstellbar | script.js:2334 (`wLevel`), :2535 | Desktop-Seitenleiste zeigt „Level“ je Training | Kein Knopf `wLevel` gerendert; Level nur global im Profil | C |
| 13 | Verlauf-Eintrag nicht korrigierbar | script.js:687–723 | – | Nur „Eintrag löschen“; Sätze/kg nachträglich nicht änderbar (wtrain/Player können es) | C |

## Pro Bildschirm: was ist einstellbar

| Bildschirm | Sätze | Wdh | kg | Einheit | Reihenf. | Entfernen | Tauschen | Favorit | Notiz | Sonst |
|---|---|---|---|---|---|---|---|---|---|---|
| Wizard-Ergebnis | ✓ pro Übung + global | nur global | – | – | – | – | ✓ ⇄ + Wischen | ✓ Wischen | – | Einplanen, Neu mischen |
| Training-Detail (wtrain) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ Wischen (ohne Hinweis) | ✓ Training + Wischen | – | Tage/Zeit, in anderes Training, Umbenennen |
| Player | – (nur via Absprung) | – | ✓ Ist-Wert | – | – | – (nur ganzes Training) | – | – | – | Satz zurücknehmen, Pause +15 s |
| Übungen-Katalog/Detail | – | – | – | – | – | – | – | ✓ | – | Zu Training hinzufügen (1 pro Tag) |
| Wochenplan | – | – | – | – | – | ✓ Wischen links | – | – | – | Tage-Chips, Tag aus Plan ×, Umbenennen |
| Trainings | – | – | – | – | – | ✓ 🗑 + Wischen | – | ✓ | – | Start |
| Verlauf | – | – | – | – | – | ✓ Eintrag | – | – | – (nur Anzeige) | – |
| Profil | – | – | – | – | – | – | – | – | – | Gewicht, Größe, Stange, Pause, Level, Mann/Frau, DE/EN, Profilwechsel |

## Geprüft, ohne Befund
- Ergebnisliste Sätze ± (e878f54): wirkt, 2→3, Anzeige aktualisiert.
- Wisch-Hinweis Ergebnisliste („→ ★ Favorit · ← zufällig · ⇄ wählen“) passt zu Handlern :2711–2731 und Knopf ⇄.
- „Gewicht im Profil = kg-Vorschläge“: Profilgewicht wird für kg-Vorschläge genutzt (:1660).
- Player „Sätze ändern“ klappt die richtige Übung in wtrain auf (txOpen = Index).
- Profil: Stange (:1663), Pause (:1394), Mann/Frau (Bilder :639) wirken; Profilwechsel ⇄ öffnet Overlay (:2784).
- Leerzustände: Woche („Starte ein Training … speichere es“), Trainings-Favoriten („Tippe ☆ bei Übung/Training“ – beide ☆ vorhanden), Verlauf („Erstes Training bauen“ → genOpen), Katalog („Filter/Suche anpassen“) – alle Wege existieren.
- Ziel-Streifen „›“ (aria „Ziele & Streak öffnen“) → Ziele-Seite mit „Ziel anpassen“ → Formular.
- Wochenplan Tag „+“ → Sheet „was trainierst du?“ mit Zuweisen + „Neu planen“.
- Einplanen-Panels (Wizard + wtrain): Tage + Uhrzeit, Button deaktiviert bis Tag gewählt („Tage antippen“).
- Vorlagen-Sheet „Wie viele? / Oder einzeln wählen“: beides funktioniert (:755–762).
- Hinweise-System `hint()` ist komplett aus (:1510), daher keine TIPP-Texte sichtbar.
- Hinweis: `renderPreview` (:1489) ist unerreichbar (`stStart`/`stPreset` werden nirgends gerendert) – toter Code, kein Nutzerfund.
