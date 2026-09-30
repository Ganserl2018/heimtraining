# MET-Heuristik pro Übung

Quelle der Übungsdaten: Free Exercise DB (MIT, github.com/yuhonas/free-exercise-db). Alle 519 App-Übungen (pool.json + exercises.json) wurden über den GIF-Dateinamen (= DB-id) bzw. normalisierten Namen gematcht, nicht gematcht: **keine**.

## Herleitung
Die Ankerwerte orientieren sich an den allgemein bekannten Größenordnungen des Compendium of Physical Activities für Krafttraining (leicht ca. 3.5, moderat ca. 5.0, kräftig ca. 6.0, sehr intensiv/explosiv ca. 8.0 MET). Das sind allgemeine Referenzwerte, **keine für diese App oder einzelne Übungen gemessenen Werte**. Basis je Kategorie: Kraft/Powerlifting compound 5.0, isolation 3.5; Plyometrie 8.0; Cardio 7.0; Olympisches Heben/Strongman 6.0; Stretching 2.5.

Anpassungen bei Kraftübungen (Logik: mehr aktive Muskelmasse und weniger externe Führung = höherer Energieumsatz): +0.5 wenn ein Primärmuskel eine große Gruppe ist (Quadrizeps, Hamstrings, Glutes, unterer/mittlerer Rücken, Lats, Brust); +0.5 bei ≥3 Sekundärmuskeln; +0.5 bei Langhantel/Kettlebell; −0.5 bei Maschine/Kabelzug; +0.5 bei Kategorie Powerlifting. Ergebnis gekappt auf 2.5–8.0, gerundet auf 0.5. Die Begründung pro Übung steht in `met.json` (`begründung_kurz`).

## Unsicherheiten
- Schätzung, keine Messung. Tatsächlicher Verbrauch hängt stark von Gewicht, Tempo, Satzpausen und Wiederholungszahl ab – das kann den Wert real um ±30–50 % verschieben.
- Die Zuschläge (+/−0.5) sind eine transparente Setzung, nicht empirisch kalibriert.
- DB-Felder (category, mechanic, equipment) sind teils grob oder fehlen (mechanic = null → wie isolation behandelt).
- Keine Unterscheidung innerhalb einer Übung nach Intensität (z.B. Körpergewicht vs. schwer beladen).
