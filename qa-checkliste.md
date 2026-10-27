# QA-Checkliste für den Prüfer (checker) – regelmäßig laufen lassen

Wann: nach jeder UI-/Wizard-Änderung und mind. 1× pro Session. Test: `tools/qa-iphone-harness.js`
mit `NEWTAB=1 ZOOM=118 VH=874 ET=59 EB=34` (Port 8793). Jeden Punkt abhaken, Fehler mit Screenshot melden.
Neue Alex-Beschwerde, die schon mal da war → hier als Punkt ergänzen.

## Wizard (Start → Zeit → Figur → Geräte → Ergebnis)
- [ ] **Alles eingeklappt:** Beim Betreten von Schritt 1 (Figur) ist keine Gruppe aufgeklappt – nach Start-Tab, nach ‹ von Geräte-Seite, nach Speichern, nach Tab-Wechsel und zurück. (Regression 26.10. 21:50: Arme blieb offen)
- [ ] Start-Tab/Start-Button setzt alles zurück (Gruppen, Geräte, Zeit bleibt, fgOpen=null, Figur vorne).
- [ ] Offene Untergruppe: Liste scrollt hoch, Auswahl komplett sichtbar, nichts abgeschnitten.
- [ ] Figur dreht automatisch zur Muskelseite (Rücken → hinten).
- [ ] Geräte-Seite: 1, 2 und 4 Muskelgruppen – nichts überlappt, Titel + Chips sichtbar, Geräteliste scrollt, Name jeder Zeile einzeilig, TRAINING BAUEN sichtbar über Tab-Leiste.
- [ ] Geräte: Vorschlag vorgewählt nachvollziehbar, Antippen schaltet um, Zähler (Üb.) plausibel (mehr Geräte → nie weniger Übungen).
- [ ] **Geräte prüfen:** zu jeder Kombi (Muskeln × Geräte) enthält das Ergebnis nur Übungen mit gewählten Geräten (Warmups = Körper ausgenommen); Geräte-Chips im Training-Detail = gewählte Geräte. Test: Skript t27 (Playwright, generate() + gearOf je Übung). (Alex 26.10. 22:29)
- [ ] Ergebnis: Anzahl Übungen = gewählte Anzahl (ohne Warmups), Hero-Zahlen stimmen, "Anpassen" mischt sofort neu.
- [ ] "Anpassen": gewählte Sätze/Wdh gelten exakt für alle Übungen (nicht nur als Mindestwert), Auto = Vorschlag; Übungen-Zahl ohne Warmups. (Regression 26.10. 22:00)
- [ ] Ergebnisseite kompakt: Hero-Streifen mit ‹, Gruppen "Aufwärmen"/"Training", Zeilen-Karten einzeilig, ⇄ rund und mittig, Nummern-Badge nicht abgeschnitten, Aktionsbereich ohne langes Scrollen sichtbar.
- [ ] "Fest einplanen" (Ergebnis): Tage wählen → Training erscheint in Woche an diesen Tagen, Planung zurückgesetzt, Button ohne Tag deaktiviert.
- [ ] Speichern → Training erscheint in Trainings; Planung danach wieder im Ursprung.

## Layout iPhone (402x874, Zoom 118 %)
- [ ] Übersicht/Profil/Woche: kein Scrollen, nichts unter der Tab-Leiste.
- [ ] Tab "Übungen" ohne Umbruch.
- [ ] Touch-Ziele ≥ 44 px; kein halb abgeschnittener Kreis/Button.
- [ ] Kein Text-Umbruch in Titeln/Gerätenamen.

## Daten/Logik
- [ ] Gerätenamen: Nur Körper, Langhantel-Set, Kurzhanteln, Seilzug oben, Türanker-Bänder, Klimmzug-Gerüst, Hyperextension-Bank, Hantelbank.
- [ ] `?v=` in index.html nur Ziffern + Kleinbuchstaben; `node --check script.js` ok; Konsole ohne neue Fehler.
- [ ] Deploy live: https://heimtraining.pages.dev lädt die neue `?v=`-Version.

## Regression durch Nebenwirkungen (Alex 27.10., nach "Optik verändert")
- Wird ein Element nur klickbar gemacht oder sein Tag getauscht (div → button/a): Screenshot VORHER/NACHHER vergleichen, Optik muss pixelgleich bleiben. Typische Fallen: `font:inherit` setzt line-height zurück, Button-Default-Padding/Breite/letter-spacing, Specificity (`button.x` schlägt `.x`).
- Startseite: HOME/FORCE-Schrift, Abstand zum START-Button, Sonar-Puls, Halten-und-Füllen (ca. 1 s halten → Wizard). Start-Tab zeigt IMMER diese Seite (nie die Ziele-&-Streak-Seite hängen lassen: Tab-Klick beendet dashMode).
- HOME FORCE tippen → Woche-Seite (ohne Wizard).
- Alex' Lieblingselemente nie entfernen oder ersetzen, auch nicht "zum Aufräumen" (Start-Button, Halten-Füllen, Neon-Look).
- Vor "Entfernen/Abschaffen": nur bauen, wenn Alex es ausdrücklich so gesagt hat; bei Unklarheit nachfragen, was GENAU gemeint ist (Seite vs. Button).

## Vergleich mit Referenz-Seite (Alex 27.10.)
- [ ] Sagt Alex "genauso wie Seite X": ZUERST beide Elemente per Playwright vergleichen (computed style: Breite, Höhe, Padding, Border, Schriftgröße), bevor geändert wird. Gilt z. B. für Heros mit Zahlen (Kacheln Übungen/Sätze/Minuten wie Trainingsseite).
