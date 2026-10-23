# Home Force – Bildstil für neue/neu gemachte Übungsbilder (Stand 18.10.2026, mit Alex besprochen)

## Szenen (gleiche Szene für Mann + Frau pro Übung, Szene wechselt zwischen Übungen, bleibt pro Übung fest)
1 Dunkle Ziegelwand + senkrechter grüner LED-Streifen
2 Stadt-Skyline durchs große Fenster, grüne Lichtakzente
3 Rack/Käfig mit grünen Neonlinien
4 Kabelturm vor schwarzer Holzwand, grüner LED-Rand
5 Matte + Neonring an der Wand (Bodenübungen)
6 Betonwand, grüner Boden-Glow
7 Spiegelwand mit grünem LED-Band
8 Helle Holzdielen + grüne LED-Leiste (Variante für Bodenübungen)
Zuordnung: Szene = stabiler Hash des Übungsnamens (nie ändern).

## Licht / Sichtbarkeit (iPhone!)
- Hell, gleichmäßig ausgeleuchtet („bright even studio light"), Körper klar vom Hintergrund getrennt, Hintergrund mittel-dunkel statt schwarz.
- Grüner LED-Look bleibt (Markenstil).

## Kleidung (modern, hochwertig, keine Logos – Alex: „nicht billig aussehen")
- Mann: eng geschnittenes Performance-Shirt (Anthrazit/Weiß/Graugrün) oder Tank, Tapered Jogger oder Training-Shorts in Mattfarben, saubere moderne Sneaker.
- Frau: Sport-Top/Bra-Top + High-Waist-Leggings oder Biker-Shorts (Salbei/Weiß/Anthrazit), moderne Sneaker, Haare zum Zopf.
- Beide: keine Logos, keine Billig-Optik, passende Töne zur Szene.

## Positionen
- Pro Übung vorher Start- und Endposition + typischer Fehler festlegen (z. B. Bankdrücken: Stange an der Brust → Arme gestreckt über der Brust).
- Bild-GIF zeigt Start → Ende → Start; bei der Prüfung gegen diese Vorgabe checken.

## Prompt-Bausteine, die funktioniert haben (18.10. 16:20, Alex: "passt zu 90%")
- Szene-Satz: "PROMINENT glowing neon-green LED light strips clearly visible: <Streifen am Fenster/Wandsockel/senkrecht am Wandrand> … Bright even exposure on the man and the floor, mid-dark background (not black)."
- Pose-Satz: "PURE SIDE PROFILE (shoulders and hips perpendicular to the camera, NO torso rotation toward the camera)", Start und Ende im selben Chat; Endbild ausdrücklich deutlich tiefer/weiter beschreiben.
- GIF: tools/makegif.py start end out.gif --blend --sharp 2 --frames 8 --ms 70 --hold 600 (nicht Flow, keine Zwischenposen).
- Probe-Szenen: RDL Fensterfront+LED-Rahmen, Face Pull Holzlamellen+LED-Kante, Kniebeuge Beton+LED-Streifen; Bank/Schulterdrücken alte 3/4-Bilder behalten (schon LED).

## Bewegungslogik-Check (18.10. 16:31, Alex-Regel)
- Vor dem Senden JEDES Bild-Paar auf unlogische Bewegung/Geräte prüfen: Was bewegt sich wirklich? Seil/Kabel gespannt? Zugrichtung korrekt?
- Face Pull: Zugturm auf Augenhöhe, Seil waagerecht gespannt, weit weg vom Turm; Start Arme gestreckt, Ende Seil am Gesicht, Ellbogen hoch/außen. NICHT nur Hände hochheben.
- Zugübungen: Kabel immer straff, Zugrichtung entlang des Kabels.

## Face-Pull-Rezept, das passt (18.10. 16:33, Alex: "passt sehr gut")
- Gleiche Szene/Kamera/Seitenprofil wie Start. Zugturm-Rolle exakt auf AUGENHÖHE des Mannes → Seil verläuft waagerecht und gespannt.
- Start-Prompt: "cable pulley carriage at exactly EYE HEIGHT, cable perfectly HORIZONTAL and taut, arms fully extended forward, hands at eye level on the cable line".
- Ende-Prompt (Create a NEW image, same scene): "PULLED the rope straight back along the horizontal cable: rope ends beside his ears, hands next to face at eye level, elbows flared high and wide at shoulder height, shoulders squeezed back, torso upright with very slight lean back, cable still taut and horizontal, pure side profile".
- GIF: ./mk.sh start end out.gif (Blend, nur Start+Ende).
- Allgemein für Zugübungen: Rollenhöhe = Bewegungslinie der Hände; Kabel nie durchhängend; Bewegung = Hände entlang des Kabels zum Körper.

## Hintergrund-Regel (18.10. 16:37, Alex)
- KEINE Studio-Hintergründe mit anderen Leuten/Betrieb (z. B. Spiegel/Durchblick mit Personen beim Face Pull). Nur eine leere Szene, nur der Trainierende.
- Szene im grünen-LED-Stil beibehalten (Wand/Boden/Kante mit LED-Streifen), sonst nichts im Hintergrund.
- Prompt-Baustein: "completely empty room, no other people, no mirrors showing people, no gym floor activity in the background, only the glowing green LED strips".
- Face Pull v3 hat im Spiegel rechts Personen → bei Neuerzeugung (Limit erst wieder frei) ersetzen.

## Face Pull v4 (23.10. – Freitag 22:00 Limit frei, leere Szene)
- Ohne Referenzbild (Upload in Gemini per Chrome-Tool blockiert) rein per Text erzeugt: Start-Prompt aus dem Rezept + "Completely empty room, no other people, no mirrors, no gym activity..." → Szene leer, Kabel waagerecht auf Augenhöhe, Seilzug straff.
- Ende im selben Chat mit "Create a NEW image, exactly the same scene…END POSITION…" → Gemini zeigt A/B, Option mit Ellbogen hoch/weit + Seil am Gesicht wählen (B).
- Aufnahme: Maus per hover aus dem Bild bewegen, DANN `zoom` + save_to_disk (sonst Mauszeiger/Teilen-Symbole im Bild). Zwei Screenshots können ~23 px Versatz haben → vor mk.sh auf gleiche Höhe zuschneiden (Landmarke: oberer LED-Streifen/Schuhe).
- Probe-Check Bewegungslogik: RDL, Bankdrücken, Schulterdrücken ok; Kniebeuge: Arme wechseln (Start Hände vor Brust, unten Arme gestreckt) → bei Go ggf. beide Frames mit gleicher Armhaltung.
