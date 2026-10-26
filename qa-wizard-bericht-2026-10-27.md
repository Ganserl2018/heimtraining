# QA Planungs-Wizard, v=20261027f, HEAD a7b4094 (27.10.2026)
Setup: Harness ZOOM=118 VH=874 ET=59 EB=34 NEWTAB=1 (402x874), Desktop 1300x800, WebGL swiftshader. Kein Code geaendert, nicht committet. Screenshots: qa-shots-2026-10-27/.

## Fehler (nach Prioritaet)

### F1 HOCH: Aufbauen: Pflicht-Kachel (.ga-n) ueberlappt Optional-Pills (.ga-o), bei mehr Geraeten auch die Uebungen/Saetze/Wdh-Reihen und TRAINING BAUEN
Schritt: Brust -> WEITER (Aufbauen). Erwartung: Kachel und Pills untereinander. Ist (gemessen, Shots 05/06/08):
- 1 Geraet, 1 Gruppe: Grid 69px hoch, Kachel 92px, Kachel-Unterkante 356 vs ga-o-Oberkante 347 = 10px Ueberlappung ("OPTIONAL DAZU" verdeckt).
- 1 Geraet, 4 Gruppen: Titelzeile 2-zeilig, Grid nur 43px, Ueberlappung 36px.
- 3 Geraete: 70px (1 Gruppe) / 97px (4 Gruppen). 5 Geraete: 130/157px und Kacheln laufen in .qk-rows (52/79px). 8 Geraete: Kacheln liegen ueber Saetze/Wdh und unter TRAINING BAUEN (155-181px, Shot 08), ga-o fehlt dann.
- Ursache: style.css 2356 `.pl-fig .pl-grid.g2{flex:1; min-height:0; grid-auto-rows:1fr}` + 2357 `.ga-n{height:100%; overflow:hidden}`: Grid schrumpft per flex unter Kachelinhalt, Zeilen (1fr) werden aber nicht kleiner als Inhalt (~92px) -> laeuft raus. Kein Scrollen, kein Umbruch.
- Fix: Grid darf nicht unter Inhalt schrumpfen und Inhalt muss kompakter werden: `.pl-fig .pl-grid.g2{flex:0 1 auto; min-height:min-content; align-content:start; grid-auto-rows:auto}` und `.ga-n{height:auto; min-height:64px; padding:.5rem .3rem}`; Kachel kompakter (Name + "n Ueb." in 1 Zeile, Muskelpunkte rechts, ca. 56px). Bei >4 Geraeten Kacheln auf 3 Spalten (.g3) oder aufs `.ga-o`-Pill-Format (Pflicht = gefuellte Pills) umstellen. Alternativ .pl-step[data-s=2] overflow-y:auto (Alex will kein Scrollen, daher eher kompakt). `.ga-h` bei 4 Gruppen auf 1 Zeile (Punkte-only) kuerzen.
- Auch: Haken ::after (right .6rem) kollidiert mit "Langhantel" (Shot 08), Titel `padding-inline:1.4rem`.

### F2 HOCH: Desktop 1300px: Wizard kaputt
- Schritt 2 (Muskeln, Shot 13): `.fg-cv` ist 2px breit, Canvas 0px -> Figur unsichtbar (Gruppen-Spalte klebt rechts in der Mitte, WEITER nur 114px breit).
- Aufbau (Shot 14): eine Kachel 570x465px riesig (grid-auto-rows:1fr + flex:1).
- Fix: `@media (min-width:900px){.fg{...}}`: .fg als Grid `grid-template-columns:220px minmax(280px,420px)`, .fg-cv `flex:1; min-width:280px; min-height:480px`; WEITER `width:100%; max-width:420px`; .ga-n `height:auto; min-height:80px`, `.pl-grid.g2{grid-template-columns:repeat(4,1fr)}`. Pruefen, ob fgMount() erst nach Layout misst (clientWidth=0 -> setSize wird uebersprungen, nach resize nicht neu gemessen: `window.addEventListener('resize', fgMount)`/ResizeObserver auf .fg-cv).

### F3 HOCH: Keine Zurueck-Navigation im Wizard (Schritt 2 und 3)
- Ursache: script.js 1228 `${plStep ? '' : plRail()}` -> Rail (plBack, plChips) wird nur auf Schritt 0 gerendert, dort sind aber `plStep>0`-Buttons nie sichtbar. Schritt 1/2: kein `.pl-back`, kein `.pl-chip` (DOM geprueft). `plClassic`-Link auf Fig-Seiten display:none (style.css 2286).
- Folge: Wer auf Aufbauen merkt "Muskel fehlt", muss ueber Tab Start neu beginnen (Reset!). Alle Auswahl weg.
- Fix: kleiner Button "‹" oben links in Schritt 1/2 (data-act=plBack, 44x44) oder Titel-Zeile antippbar; plBack existiert bereits (script.js 2219).

### F4 MITTEL: 2. Durchlauf: Uebungen/Saetze/Wdh bleiben haengen
- Schritt: Wizard -> Bauch -> Uebungen 6, Saetze 5, Wdh 15 -> bauen -> Speichern -> Home -> Wizard -> Bauch -> WEITER.
- Erwartung: Auto/Auto/Auto. Ist: genCfg.count=6, minSets=5, minReps=15 noch gesetzt (Segmente "on" 6/5/15), Ergebnis 8 Uebungen x 5 Saetze. Auch genCfg.goal/lv bleiben.
- Ursache: script.js 2060 (goto start) setzt nur plStep, plAuto, plClassic, gear, groups zurueck; genSave setzt nichts zurueck. Dagegen genOpen (2217) macht `genCfg=newGenCfg()` -> Inkonsistenz: Zeit bleibt beim Home-Weg erhalten (dur 60 vorgewaehlt), beim Trainings-Weg auf 30 zurueck.
- Fix: in beiden Pfaden `const d=genCfg.dur; genCfg=newGenCfg(); genCfg.dur=d; genCfg.gear=[]; genCfg.groups=[]; genRes=null;` (oder genCfg.dur bewusst behalten). Ebenso in genSave nach Speichern. Auch genRes beim goto start nullen.

### F5 MITTEL: Gewaehlte Uebungsanzahl wird im Ergebnis scheinbar nicht eingehalten
- Uebungen=5 -> Liste 7 (5 + 2 Aufwaermen), Hero "Uebungen" zeigt ex.length = 7 (script.js genHero: `ex.length`). Alex sieht "7" obwohl 5 gewaehlt. Count 3/4/6/8 -> 5/6/8/10 (immer +2). Hauptuebungen selbst stimmen (5/3/4/6/8). Kleine Reihen (nur m:calves + Body) liefert 0 -> Leerzustand (Wizard blockt vorher via uncovered(), ok).
- Fix: Hero `ex.filter(e=>!e.warm).length` und "+ 2 Aufwaermen" als Untertitel, oder Aufwaermen bei gesetzter Anzahl nicht mitzaehlen/klar labeln.

### F6 MITTEL: Muskel-Unterliste (Rücken/Beine offen) geschnitten
- Schritt 2, Rücken oder Beine antippen: .fg-gs scrollHeight 532 > 499, Letzter Chip (Waden bzw. Unterer) bei y=743 > Containerende 712, halb sichtbar (Shot 03), nur intern scrollbar (overflow auto) ohne Hinweis. Bei Rücken+Beine gewaehlt gilt das gleiche.
- Fix: Sub-Chips als 2-spaltiges Grid (.fg-sub{display:grid; grid-template-columns:1fr 1fr}) oder Chip-Hoehe 34->30px/Gap kleiner; Breite reicht (88px).

### F7 NIEDRIG: Touch-Ziele <44px (Selektor, Groesse)
Schritt 2: `.fg-c` 88x34 (Arme/Rücken/Beine-Chips), `.fg-views button` (Vorne/Hinten) 71x34 bzw. 67x32.
Schritt 3: `.ga-o button` (Optional-Pills, genGear) 83-127x36; `.qk-r .seg button` genCnt 38x30, genMinS 57x30, genMinR 45x30 (Hoehe 30!). Schritt 1 (.pl-opt) und .fg-g/.fg-next ok (>=44).
Fix: min-height:44px; bei Platznot Hit-Area per `::before{inset:-6px}` vergroessern; Seg-Reihen-Hoehe 30->40/44 (style.css 1756 min-height:30px).

### F8 NIEDRIG: 404 auf gifs/cat_cow.gif und gifs/scapular_push_up.gif (Aufwaermen im Ergebnis; Dateien fehlen in gifs/). Konsolenfehler, Bild leer.

## Was ok ist
- (a) Fit: Schritt 1 (Zeit) lastBottom 498, Schritt 2 729, Aufbauen 729, alle < Tab-Leiste 777. Ergebnis scrollt (1637 > 699, erwartet bei Liste, sinnvoll).
- (b) Logik: Leere Auswahl -> WEITER `.off`, Klick bleibt auf Schritt 2. Brust/Schultern/Bauch an/aus ok. Arme setzt armPick (m:biceps, Sub-Chips biceps/triceps/forearms), zweiter Tipp auf Arme/Rücken/Beine loescht Gruppe (Test: leer). Rücken->Teilauswahl wandelt "Rücken" in Teile, Rückwahl ok. Figur-Tipp waehlt: Brust, Schultern, Bauch, biceps/triceps/forearms (vorne), quadriceps, calves; hinten traps, lats, glutes, calves. Vorne/Hinten: Kamera (0,0,3.47)->(0,0,-3.47), y bleibt 0; vertikales Ziehen aendert nichts (kein Kippen).
- Geraete aus Muskeln abgeleitet (Brust->Körper, Rücken->Langhantel, Beine->Körper, Bizeps->Hanteln). Alle abwaehlen -> Warnung "Für Brustmuskeln passt kein gewähltes Gerät. Gerät dazuwählen." (Shot 07), TRAINING BAUEN `.off`, Klick wirkungslos. Optional-Pills hinzufuegen: nach Seilzug uncovered=[]. Seg-Reihen wirken (genCnt/MinS/MinR, Haupt-Uebungen exakt, Saetze/Wdh min.). 
- TRAINING BAUEN erzeugt Ergebnis; 'Zurück zur Auswahl' -> plStep 2, Gruppen, Geraete, Seg-Werte erhalten (Shot 10). Speichern -> view=trainings, wp +1. Speichern&Starten -> Player. genOpen von Trainings und Verlauf -> Wizard Schritt 0 (leer). Tab Start/Home -> Wizard Schritt 0, groups/gear leer, GEARKEY []. Reload mitten im Wizard -> Start (overview), gespeicherte Trainings bleiben.
- (c) Keine JS-Fehler (pageerror leer). Nur 404 (F8) und Google-Fonts (blockiert).
- Nicht geprueft: weeklist hat kein genOpen-Button (nur Trainings/Verlauf); Desktop Ergebnis-Shot geloescht (nur max. 12).

## Empfehlung
Vor Deploy F1+F3 (Pflicht), F2 (Desktop) und F4 beheben; F5/F6/F7 danach. F1-Fix zuerst, danach iPhone-Harness mit 1, 3 und 8 Geraeten (Skript: scratchpad t5.js) erneut laufen lassen.
