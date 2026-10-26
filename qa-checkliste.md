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
- [ ] Ergebnis: Anzahl Übungen = gewählte Anzahl (ohne Warmups), Hero-Zahlen stimmen, "Anpassen" mischt sofort neu.
- [ ] "Anpassen": gewählte Sätze/Wdh gelten exakt für alle Übungen (nicht nur als Mindestwert), Auto = Vorschlag; Übungen-Zahl ohne Warmups. (Regression 26.10. 22:00)
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
