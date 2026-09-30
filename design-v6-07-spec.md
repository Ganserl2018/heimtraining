# V6-07 — Design-Spec Übersichtsseite

## a) Farbpalette

Thema: "Gummiboden/Kraftraum-Werkstatt" statt generischem Fitness-Neon.

- `--bg:#14171a` — Anthrazit mit leichtem Grünstich (wie gegossener Gummiboden), kein reines Schwarz.
- `--panel:#1d2124` / `--panel-2:#242829` / `--bg-raise:#1c2023` — abgestufte Flächen, alle sehr nah beieinander (kein harter Kontrastsprung Card/Hintergrund).
- `--border:#33383a` / `--border-soft:#2a2e30` — Trennlinien statt Schatten.
- `--text:#eeece5` — warmes Off-White (kein #fff), `--text-dim`/`--text-faint` für Hierarchie.
- `--chalk:#d9c98f` — Magnesia-Kreide-Ton als EINZIGER Akzent (Fortschrittsbalken, Buttons, "heute offen"-Status, Ringe). Bewusst kein Blau/Violett/Neon-Grün — die Assoziation ist Kreide an den Händen vor dem Satz, nicht "App-Branding".
- `--ok:#7fae6a`, `--warn:#c98a4b`, `--bad:#b85c4f` — gedämpfte, nicht grelle Ampelfarben für den Statuskalender, jeweils mit Text/Label kombiniert, nie Farbe allein.

Begründung: Referenzbild nutzt Schwarz+Neongelb-Grün — das ist die "generische Fitness-App"-Formel. Eigenständige Variante: derselbe Energie-Charakter (ein warmer heller Akzent auf dunklem Grund), aber über Material (Kreide/Gummiboden) hergeleitet statt über App-Branding-Neon, und deutlich gedämpfter/reifer.

## b) Neue Features/Interaktionen — TODO für den Bau-Agenten

Diese Elemente existieren NUR im Mockup, noch nicht im echten CSS/JS:

1. **Fortschritts-Ringe bei "Letzte Trainings"** (`.history-ring`, conic-gradient auf `--pct`) statt der bisherigen linearen `history-bar`/`history-fill`. Braucht pro Eintrag einen berechneten Prozentwert (setsDone/setsPlanned), im Inline-Style als `--pct:XX` gesetzt.
2. **Wochentages-Marker mit Haken/Strich** in der "Diese Woche"-Karte (`.wd-mark`, ✓ bei erledigt, – bei offen) — bisher war das nur Hintergrundfarbe ohne Symbol.
3. **Kalender-Legende** unter dem Statuskalender (`.cal-legend`) — erklärt die 4 Punktfarben in Klartext. Bisher gab es keine Legende, nur die Punkte selbst.
4. **Ziel-Karte als "Anpassen"-Textlink statt Button** (`.goal-edit-link`) — reduziert visuelles Gewicht, da es eine sekundäre Aktion ist. Wenn das zu klein zum Antippen ist (Touch-Target-Check machen, min. 44px Hit-Area per Padding sicherstellen, nicht nur sichtbare Textgröße).
5. **Ghost-Button-Variante** (`.ov-btn-ghost`) für sekundäre Aktionen ("Ganzer Verlauf") — neue CSS-Klasse, bisher gab es nur einen Button-Stil.
6. **Subtile Radial-Textur in der Quick-Start-Karte** (`::after` mit `border-radius:50%`, angedeutete Hantelscheibe) — reines CSS, kein Bild-Asset nötig, aber neu.
7. **Schnellzugriff als 2×2-Grid** (`.ov-quick` als CSS-Grid statt flex-wrap) mit größeren Touch-Targets (min-height 52px) und linksbündigem Text statt zentriertem Button-Text.

**Nicht übernommen aus dem Referenzbild:** das Bild-Karussell-Prinzip (3 überlappende Fotos) wurde bewusst NICHT in die Übersicht übernommen — es passt strukturell nicht zu den 7 funktionalen Blöcken hier (kein Onboarding-Screen) und würde echte Trainings-/Personenfotos brauchen, die die App nicht hat. Falls gewünscht, wäre das ein eigenständiges Feature für einen anderen Screen, kein Teil dieses Mockups.

## c) Anti-Slop-Check — was bewusst vermieden wurde

- Kein Standard-Dunkelblau/Violett-Akzent, kein Icon-Tile über jeder Kachel-Überschrift, keine ALL-CAPS-Eyebrow-Labels (Titel sind sentence case, `.ov-card-title` nutzt kleine Buchstaben mit dezentem Letter-Spacing statt Versalien).
- Keine verschachtelten Karten-in-Karten-Strukturen; alle Kacheln nutzen denselben Radius (16px) und dieselbe Bordertechnik (Hairline statt Schatten) — kein "SaaS-Kit"-Mix aus unterschiedlichen Card-Stilen.
- Fortschrittsringe und die Textur-Kontur sind zweckgebunden (zeigen echten Prozentwert bzw. brechen die Fläche der wichtigsten Karte auf), nicht dekorativ hinzugefügt.
- Einziger Akzentton (Kreide) statt mehrerer Marken-/Statusfarben, die um Aufmerksamkeit konkurrieren.
