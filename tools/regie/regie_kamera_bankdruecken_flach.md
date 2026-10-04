# Regie+Kamera Bankdrücken flach (Agent-Bericht 04.10. 00:55, Kurzfassung der Vorgaben)
Start: Stange senkrecht über Schultergelenken, Ellbogen ca. 170°, Griff ca. 1,5x Schulterbreite, Unterarme senkrecht, Schulterblätter fixiert, leichte Brücke, Füße flach.
Ende: Stange berührt Brust (Brustwarzenhöhe), Ellbogen 80-90°, Oberarm 45-60° vom Rumpf (kein T), Unterarme senkrecht.
Bewegt sich nur: Stange, Ellbogen, Oberarme, Unterarme/Hände. Bleibt gleich: Kamera, Bank, Raum, Licht, Rumpf, Kopf, Beine, Kleidung, Griffbreite.
Kamera A: hinter Kopfende ca. 1,5 m, 30° über Brusthöhe, symmetrisch. Kamera B: seitlich 3/4, 40° zur Körperachse Richtung Kopfende, Brusthöhe, 2 m.
Endfoto: Edit-Prompt "Bearbeite das ERSTE Bild dieses Chats ... verändere NUR ... alles andere PIXELGLEICH".
QA: 1 Sichtbarkeit beide Schultern/Arme, 2 Pose Start, 3 Pose Ende, 4 Körperhaltung, 5 Pixelgleichheit Start/Ende, 6 Szene/Anatomie (5 Finger, Scheiben symmetrisch), 7 Format 3:4.

## Korrektur 04.10. 01:20 (Regisseur-Bericht Mann vs Frau)
- Befund: Mann = Kamera Fußseite leicht seitlich, Kopf rechts im Bild. Frau = Bild gespiegelt, Kopf links, andere Szene (rote Wand, Rack). Ursache: "40° Richtung Kopfende versetzt" ist mehrdeutig (Körperseite und Bildseite des Kopfes nicht festgelegt), getrennte Generierungen ohne gemeinsamen Anker.
- Eindeutiger Kamera-Satz (Standard für alle Bankübungen im Liegen): "Kamera steht rechts neben der Bank, Brusthöhe, 2 m, 40° zur Körperachse, Blick von der Seite. Der Kopf des Sportlers liegt IMMER auf der RECHTEN Bildseite, die Füße auf der LINKEN. Kein Spiegeln."
- QA-Punkt 8: Kopf auf der festgelegten Bildseite (rechts) und gleicher Blickwinkel/Szene wie das freigegebene Referenzbild; bei Mann/Frau-Paaren nebeneinander prüfen. Abweichung = nicht bestanden.

## QA-Punkt 9 (Alex 04.10. 02:21) – Bankwinkel prüfen
- Flach = Rückenlehne waagerecht auf Höhe der Sitzfläche, Kopf nicht höher als Hüfte. Schräg ca. 40–45°, Decline fällt zum Kopf ab.
- QA vergleicht den Bankwinkel jedes Bildes mit der Vorgabe und mit dem Referenz-GIF. Abweichung = Fehlversuch (zählt zu max. 3).
- Fehlfall 04.10.: Frau Close-Grip „flach" kam mit angehobener Rückenlehne (Start+Ende) → verworfen, nicht ins GIF.
