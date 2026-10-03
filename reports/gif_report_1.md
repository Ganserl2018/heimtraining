# GIF-Test Bericht 1 (tools/makegif.py)

## Setup
6 Paare (896x1200 -> 360x480), 24 Zwischenbilder, 50 Frames Loop A->B->A, 128 Farben, Dither an, gifsicle lossy=60.
Ausgabe: /tmp/gif_tests/<paar>.gif (vorher, sharp=1), /tmp/gif_tests/v2/<paar>.gif (nachher, sharp=3).
Contact-Sheets: /tmp/gif_tests/ALL_sheet.png, ghost.png, v2_flyes.png; Diffs: ALL_diff.png.

## Dateigroessen (MB)
| Paar | vorher | nachher |
|---|---|---|
| incline_dumbbell_press-m | 1.17 | 1.03 |
| incline_dumbbell_press-w | 0.97 | 0.73 |
| triceps_pushdown-m | 1.15 | 1.02 |
| incline_dumbbell_flyes-m | 1.01 | 0.96 |
| seated_triceps_press-m | 0.78 | 0.65 |
| speed_band_overhead_triceps-w | 0.76 | 0.72 |
Alle weit unter 2 MB -> kein Anpassen von Dither/Lossy/Frames/Farben noetig.

## Befunde
- Hintergrund/Person: Start/Ende pro Paar konsistent (Diff-Bilder: nur der bewegte Bereich leuchtet, Rest ~Rauschen; mittlere Diff 4-7.5 Grauwerte, nur 3-6 % der Pixel > 25). Kein Kamera-/Hintergrundwechsel -> kein Cross-Fade-Fallback noetig. Leichte Rand-Differenz oben bei seated_triceps_press/speed_band (Lichtleiste, Diff 7-10) - unauffaellig, "static"-Maske haelt Hintergrund pixelgleich.
- Flow-Auswahl: alle 6 -> FLOW (Restfehler-Quotient 0.61-0.77 < 0.8). Fallback greift nicht, ist aber vorhanden.
- Verzerrungen: keine sichtbaren Warp-Artefakte (kein Zerreissen, Gesicht/Torso stabil, Bank/Beine ruhig).
- Ghosting: bei grosser Bewegung (Flyes: Arme von oben nach aussen; Press: Arme/Hanteln; Band: Arme) bleibt der Flow stellenweise unvollstaendig, dort sind in den Mittelframes kurz zwei Arm-Positionen halbtransparent sichtbar (Frames ca. 7-13 bei sharp=1, ueber ~8 Frames). Schlimmster Fall: incline_dumbbell_flyes-m und incline_dumbbell_press-m. Pushdown/Seated Triceps deutlich besser (kleine Bewegung).
- Loop: A->B->A (gespiegelt) fluessig, Naht A/B mit Hold 600 ms, keine Spruenge; Hintergrund flackerfrei (gemeinsame Palette).

## Aenderung an makegif.py
Nur 1 Zeile: Default `--sharp` 1.0 -> 3.0. Das verkuerzt die Doppelbild-Phase auf ca. 2-3 Frames (Kreuzblende nur noch in der Mitte), Dateien dabei ~5-25 % kleiner. Optik im Neutest (v2_flyes.png): Ghosting nur noch in 1-2 Frames sichtbar, Rest sauber. Restghosting ist mit reinem Flow bei diesen grossen Bewegungen nicht ganz wegzubekommen; akzeptabel bei 70 ms/Frame.
Bei Bedarf pro Uebung: `--sharp 4` (noch haerter) oder `--frames 30`.
Nichts committet/gepusht (tools/makegif.py im Working Tree geaendert).
