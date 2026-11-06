# QA Logik-Bericht Home Force, 2026-11-06 (Stand 3752a0b, ?v=20261106c)

Methode: Code gelesen (script.js, sw.js, index.html, style.css V44), JSON-Abgleich per Python, Playwright (Chromium, Port 8793) mit direkten Funktionsaufrufen und Klickwegen. Testskripte: `/tmp/claude-0/-home-claude/e0dac1ab-39bf-52a3-b4df-26ff79a98855/scratchpad/qa/t1.js … t13.js`. Nichts im Repo geändert, kein Commit. `node --check` ok, keine pageerror in allen Läufen.
Nicht doppelt: Funde aus qa-logik-bericht-2026-10-26.md (meist UI/Wizard) nicht wiederholt.

## A – kaputt

### A1 Nach jedem Tipp auf „Start“ funktionieren Tauschen, Übungsanzahl und „Neu mischen“ in gespeicherten Trainings nicht mehr
- Datei: script.js:1254-1258 `resetPlan()` schreibt `heimtraining.gear2 = '[]'` (aufgerufen bei Tab Start/overview, script.js:2640, und `goto start`, :2184). `loadGear()` (:798) liefert dann `[]` (leeres Array gilt als gültig, kein Fallback auf alle Geräte).
- Betroffen: `wSwapEx` (:929), `wtSetCount` (:1757), `wtMix` (:2330, über `newGenCfg()` → `gear: loadGear()`). `genBase()` verlangt `gearOf(e).every(k => gear.includes(k))` → mit `[]` passt keine Übung.
- Szenario: Tab „Start“ tippen → Wizard → Training speichern → im Training-Detail Übung wischen „Neue Übung ↻“ / Anpassen „Übungen 8“ / „Neu mischen“ (nach Bestätigung) → nichts passiert, kein Hinweis.
- Beleg (t7.js): `gearLS "[]"`, `swapChanged false`, `countFrom 3 → countTo 3`, `mixResult 0`.
- Nur Haupt-Übungen; Warmup/Balance-Tausch läuft über `warmAlt` und geht.

## B – falsches Verhalten

### B1 Streak-Rekord geht beim ersten verpassten Training verloren
- script.js:598-600: `gzBest` = längste Folge von Kalendertagen (alte Logik), danach `max(gzBest, streak)`. Kein gespeicherter Rekord.
- Szenario: Plan Mo/Mi/Fr, 13 geplante Trainings erledigt → „Rekord 13“. Letztes geplantes verpasst → Streak 0, Rekord fällt auf „1 Training“.
- Beleg (t2.js): `allDone {streak 13, rec "Rekord 13 Trainings"}`, `lastMissed {streak 0, rec "Rekord 1 Training"}`.

### B2 Streak zählt alte Trainings vor dem Plan über beliebig lange Pausen mit
- script.js:477-482: Schleife läuft bis zum ersten Verlaufseintrag; Tage vor `since` sind `'vorher'` und brechen nie.
- Szenario: Plan täglich seit 3 Tagen, alle 3 erledigt, dazu 2 Trainings vor 200 Tagen → Streak 5 (erwartet 3).
- Beleg (t13.js): `preplanGap_expected3: 5`.

### B3 Zweites geplantes Training am selben Tag kann verpasst werden, ohne dass die Streak bricht
- script.js:479: `if (per[cur]) { n += per[cur]; continue; }` prüft den Plan nur an Tagen ohne jedes Training.
- Szenario: Trainings C und D täglich geplant, nur C gemacht → Streak läuft weiter (5), D nie gemacht.
- Beleg (t13.js): `secondPlannedMissed_expected0: 5`. Widerspricht Regel „ein verpasstes geplantes Training bricht“ (Kommentar :469).

### B4 „Ziel diese Woche“ auf der Woche-Seite zählt Trainings der Vorwoche
- script.js:1519 `goalStripHtml()`: rollierend `Date.now() - date 12:00 <= 7 Tage`, Label aber „diese Woche“. Ziele-Seite (:521) rechnet ab Montag.
- Szenario: heute Fr 06.11., Trainings Sa 31.10. + So 01.11. → Woche-Seite „2/3 Trainings · diese Woche“, Ziele-Seite „0/3“, Verlauf „0 Trainings“.
- Beleg (t6.js): `weekplanStrip ["2","3","Trainings · diese Woche"]`, `dashGoal "0/3"`.

### B5 Ergebnis-Seite und gespeichertes Training zeigen andere Zahlen für dasselbe Training
- `genHero()` script.js:1069-1072: Übungen = nur Haupt-Übungen, Geräte = gewählte Geräte, Minuten = gewählte Dauer. `wtHero()` :1780-1784: Übungen = alle inkl. Aufwärmen+Balance, Geräte = benutzte, Minuten = Sätze × 2,5.
- Szenario: 20 Min, Level 2, Brust+Beine → Ergebnis „4 Übungen · 7 Geräte · 18 Sätze · ~20 Min“, nach Speichern „7 Übungen · 5 Geräte · 18 Sätze · ~45 Min“.
- Beleg (t9.js): alle 8 Kombinationen weichen ab (z. B. 30 Min/Lv2: ~30 vs ~60 Min). Balance verschärft das (+2–4 Sätze, nicht in der Dauer eingeplant).

### B6 Balance-/Aufwärmübung manuell hinzugefügt: falsche Einheit, zählt als Muskelanteil, falsche Abschnitts-Reihenfolge
- script.js:2201 (`pick`), 2425 (`browseAddNew`): `unit: defaultUnit(name)` → „Tandem Stand“, „Single Leg Stand“ bekommen `wdh`, 3 Sätze (Haltezeit erwartet `sek`). Kein `warm`/`bal`-Flag.
- `muscleShare()` :1589 prüft nur `e.warm` (nicht `isWarmName`) → Balance zählt als „Beine“.
- `secOf()` :1021 erkennt sie per Pool-Kategorie, aber sie hängt hinten an → Überschriften „Aufwärmen, Gleichgewicht, Training, Gleichgewicht“. Gleiches beim Kopieren per „In Training kopieren“ (:2312, push ans Ende).
- Beleg (t12.js): `manualUnit "wdh / sets 3"`, `share [["Brust",45],["Beine",15],["Aufwärmen",40]]` für ein Brust-Training, `headers ["Aufwärmen","Gleichgewicht","Training","Gleichgewicht"]`.

### B7 Tablet-Breite 820–899 px: Startseite ohne Menü, 240 px leerer Streifen links
- style.css:1698 `body.is-home .tabbar{display:none}`; Rückgabe des Menüs (:2823) erst ab 900 px, Seitenleisten-Layout (Inhalt ab x=240) aber schon ab 820 px.
- Szenario: iPad Air hochkant (820 px) → Startseite: keine Navigation, Inhalt um 240 px nach rechts verschoben.
- Beleg (t5.js): `820x700 overview {"tb":[0,0,0,0],"content":[240,0,580],"tabDisp":"none"}` (gleich bei 860/899); ab 1024 `tabDisp flex`.
- 1024/1440/1920 und 402 px: kein horizontales Scrollen, keine unerreichbaren Buttons (t3.js, t4.js).

### B8 (vermutet) Auto-Update lädt mitten im Workout neu
- script.js:2759: bei `visibilitychange` wird ohne Prüfung von `view` neu geladen, sobald eine neue `?v=` live ist. Im Player gehen Pausen-Timer, aktuelle Übung und Ansicht verloren (abgehakte Sätze bleiben in WPKEY). Typisch: Handy während der Pause weglegen, nach Deploy zurück → Startseite statt Player. Nicht live provoziert (bräuchte zwei Deploys).

## C – Kleinkram

- C1 Alle 8 Balance-Übungen (und 8 Warmups) haben kein Bild: `gifs/…gif` fehlt, kein Eintrag in `img/index.json`. Jedes neue Training enthält 1–2 davon → leere Kachel/leeres Player-Sechseck (onerror blendet aus, keine Fehler). Bekannt laut START-HIER („8 Bilder offen“).
- C2 Übungen-Startseite: Kachel „Beine“ zählt Balance (8) und Bein-Warmups mit (script.js:446 `MUSCLE_GROUPS[e.muscle] === g` ohne Kategorie-Filter); Balance steht damit doppelt (Beine + Balance).
- C3 Ohne Plan zählt die Streak Tage, mit Plan Trainings: zwei Trainings gestern + eins vorgestern → ohne Plan 2, mit Plan 3 (t2.js `twoSameDayNoPlan streak 2`). Label sagt immer „Trainings in Folge“. Plan löschen/Wochentage entfernen ändert die Streak rückwirkend.
- C4 `levelSuggestion()` script.js:1826 wertet `weights` aller Einheiten als Kraft: Sekunden/Wdh bei Balance/Warmups (z. B. 20 → 30 s) zählen als „+30 % Gewicht“ für den Level-Aufstieg.
- C5 Pause nach jedem Satz = Profil-Pause (Standard 90 s), auch nach Aufwärmen/Balance (script.js:2251).
- C6 Ergebnis-Seite: ⇄ auf Aufwärm-/Balance-Zeile bietet nur Hauptübungen an (`genPickHtml`), Ersatz landet im Aufwärmblock → Abschnitte „Aufwärmen, Training, Gleichgewicht, Training“, Übungszahl im Hero steigt.
- C7 `applyLevel()` (script.js:1686) würde auch Warmup/Balance auf 3 Sätze/20–30 s setzen, ist aber totes Code (kein Button `data-act="wLevel"` mehr).
- C8 sw.js:7 cached jede GET-Antwort ohne Prüfung auf `res.ok` und ohne Obergrenze (gifs+img ≈ 830 MB im Repo). 404-Antworten landen im Cache; (vermutet) Speicherdruck auf iOS.
- C9 Wizard: wenige Geräte (z. B. Bauch mit nur Extension+Kurzhantel) → weniger Hauptübungen als die Dauer vorgibt, ohne Hinweis (t8.js: 5 von 394 Läufen kürzer, z. B. 2 statt 6). Geräte-Treue ok: 0 Übungen mit nicht gewähltem Gerät, Level 0 ohne „hard“-Übungen, keine Duplikate.

## Geprüft ohne Befund
- Balance im Generator: Level-Filter korrekt (Lv0 nur Stufe 0, t1.js 45 Kombis), 1 Übung bei ≤4, 2 bei >4 Hauptübungen, Reihenfolge Aufwärmen → Gleichgewicht → Training, sek/wdh plausibel; nicht im Haupttraining, nicht in `genBase`/`groupCounts`/Presets/Tausch-Kandidaten; `bal`-Flag bleibt nach Speichern + Reload erhalten; `applyProgression` und `nextPlan` ignorieren Balance; Player läuft komplett durch, Verlauf speichert Balance-Sätze (t10.js).
- JSON: 530 Übungen, keine doppelten Namen; names_de, muscle-map vollständig (Muskel stimmt mit pool überein); anleitungen_de fehlt bei 150 (alt), gearfix/met fehlen bei den 8 neuen Warmups (Fallback `body`/MET 5.0 greift); alle PRESETS-/WARM-/BAL-Namen existieren.
- Cache-Buster: index.html 3× `20261106c`, Regex akzeptiert Ziffern+Buchstaben, sw.js network-first.
- Alle Ansichten (overview, dash, start, weeklist, trainings, allex, wtrain, history, histdetail, profile, gen, play) auf 402/1024/1440/1920: keine JS-Fehler, kein horizontales Scrollen, Navigation erreichbar (Player/Home ohne Leiste gewollt).

## Top 5
1. A1 Start-Tipp leert gear2 → Tauschen/Anzahl/Neu mischen in gespeicherten Trainings tot (script.js:1257, 929, 1757, 2330).
2. B1 Streak-Rekord fällt nach einem Fehltag auf die alte Tage-Logik zurück (13 → 1).
3. B4 Woche-Seite „diese Woche“ zählt Vorwochen-Trainings (2/3 vs 0/3).
4. B5 Ergebnis vs. gespeichertes Training: Übungen/Geräte/Minuten widersprechen sich (~20 vs ~45 Min).
5. B2/B3 Streak zählt Trainings vor dem Plan über 200 Tage Pause und ignoriert ein zweites verpasstes Training am selben Tag.
