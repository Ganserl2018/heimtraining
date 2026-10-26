# QA Logik-Bericht Home Force, 2026-10-26 (Stand main, ?v=20261026k)

Methode: Harness `tools/qa-iphone-harness.js` (Kopie mit angepasstem Playwright-Pfad im Scratchpad, Repo unveraendert), Env `ZOOM=118 VH=874 ET=59 EB=34 NEWTAB=1`, Viewport 402x874, Server Port 8793. Frischer Browser (leere App) und danach ein per Wizard gebautes Training. JS-Fehler: keine (pageerror-Liste in allen Laeufen leer). Persistenz nach Reload: Training bleibt (Trainings-Tab, Woche-Tab), OK.
Screenshots: /home/claude/heimtraining/qa-shots-2026-10-26/ (Dateinamen unten je Punkt). Hinweis: u-*.png haben nach Reload keinen Anton-Font (Harness-Artefakt, "SCHULTE" abgeschnitten ist KEIN App-Fehler).
Nicht geprueft: 1300px-Desktop (Auftrag nur iPhone), Player/Workout-Lauf, Verlauf mit echten Daten (leer), Sheets (Tage waehlen).

## KRITISCH

### K1 START-Button: kurzes Tippen tut nichts, kein Hinweis
- Screen: Start (Home, grosser START-Kreis). Schritt: einmal tippen.
- Erwartung: Wizard oeffnet oder klarer Hinweis. Ist: nichts passiert (Test "TAP stays home: true", Screenshot r-home-after-tap.png). Man muss 0,9 s halten; der Code sucht dafuer ein Element `.home-hint` zum Aufblitzen, das `renderHome()` aber nie rendert (script.js Zeile ~2412 Click-Capture, renderHome ~456). Auf der Seite steht auch kein Text "Gedrueckt halten".
- Fix: in `renderHome()` unter dem Button `<div class="home-hint">Halten zum Starten</div>` ergaenzen (CSS `.home-hint` existiert schon, style.css ~1948). Besser: Tipp startet direkt, Halten nur als Nice-to-have (Alex-Entscheidung).

### K2 Drei Buttons fuehren auf einen "Einstellungen"-Screen statt in die Planung
- Wege: Trainings-Tab "JETZT TRAINIEREN", Verlauf-Leer-Zustand "ERSTES TRAINING BAUEN", (Classic) "Weitere Einstellungen".
- Erwartung: Planungs-Wizard "Wie lange?". Ist: Screen "EINSTELLUNGEN / Genau auswaehlen, was trainiert wird" mit nur der Liste "Spezielle Muskeln hinzufuegen" und FERTIG (Screenshot v-jetzt-trainieren.png). Ohne Dauer, ohne Geraete, ohne Erklaerung. FERTIG fuehrt dann in den Wizard bei Schritt 1 (Test: "after FERTIG: Wie lange?"). Der Nutzer wird also erst in eine Sackgasse-aehnliche Zwischenseite geschickt.
- Ursache: `case 'genOpen'` (script.js ~2062) setzt `view = 'gen'`; `renderGen()` (~983) zeigt ohne `genRes` nur den Spots-Block + `genBack`.
- Fix: Buttons in Trainings/Verlauf auf `data-act="goto" data-view="start"` umstellen (das setzt auch den Wizard-Reset) und `genOpen` nur noch fuer "Alle Optionen" verwenden oder entfernen. Titel "Einstellungen" vs "Planung" vereinheitlichen.

### K3 Wizard Schritt 3: Widerspruch "Nichts gewaehlt = alle Geraete" vs. Sperrmeldung
- Schritt: Dauer waehlen, bei Geraeten nichts waehlen, WEITER, Muskelkachel antippen, die kein Push/Pull-Konflikt hat.
- Erwartung: geht (Schritt 2 sagt "Nichts gewaehlt = alle Geraete", Chip oben zeigt "alle Geraete"). Ist laut Code: `case 'genGrp'` (script.js ~2079) bricht mit "Waehl zuerst Geraete (Schritt 2)" ab, sobald `genCfg.gear.length === 0`. Die Kacheln sind dabei nicht grau (`none` ist bei leerem gear false). Nicht per Klick getestet, aus Code abgeleitet (Zeile `if (!genCfg.gear.length || !gcn[m]) { plMsg = ... }`).
- Fix: Bedingung auf `genCfg.gear.length && !gcn[m]` aendern. Entfaellt ohnehin mit der Neuordnung (siehe Abschnitt Wizard-Reihenfolge).

### K4 Primaerbutton "TRAINING BAUEN" in Schritt 3 liegt unter dem Falz
- Schritt: Wizard bis Schritt 3. Ist: Inhalt 1012-1040 px hoch bei 699 px Sichtflaeche; der Button sitzt ganz unten (Screenshot r-wiz3-nogear.png zeigt ihn nicht). Spezielle Muskeln sind durch die Vorwahl "Bizeps" automatisch aufgeklappt (`plSpots || groups.some(m:)`), das macht die Seite zusaetzlich lang. Der Test "Kein Scrollen auf Uebersicht/Profil/Wochenplan" betrifft Wizard nicht, aber Alex sieht seine Hauptaktion nicht.
- Fix: `.pl-foot` sticky am unteren Rand (ueber der Tab-Leiste, `--tabh`) machen; Bizeps/Trizeps nicht als "Spezielle Muskeln" zaehlen bzw. Spots nur nach Tipp aufklappen (`renderStart`, Zeile mit `plSpots ||`).

## WICHTIG

### W1 "Alle Optionen auf einer Seite" ist Einbahnstrasse
- Schritt: im Wizard auf den Link tippen. Ist: Classic-Ansicht (Screenshot r-classic.png). Es gibt dort keinen Link zurueck zum Wizard (Test: `[data-act=plClassic]` nicht gefunden). Zurueck nur ueber Tab Start + 0,9 s Halten. Classic ist ausserdem 743 px hoch (lastBottom 781 > tabTop 777, "Weitere Einstellungen" knapp unter der Tab-Leiste) und zeigt "Bizeps" nur als Anhang "+Bizeps" im Link, waehrend dort "ARME" steht (Wizard hat Bizeps/Trizeps einzeln, Classic Arme).
- Fix: in `renderStartClassic()` (script.js ~1081) Link "‹ Schritt fuer Schritt" mit `data-act="plClassic"` ergaenzen. Oder Classic ganz streichen (zwei Wege fuer dieselbe Sache, Alex ist Pragmatiker).

### W2 Wizard: kein sichtbares Zurueck
- Schritt 2/3: einziger Weg zurueck sind die Chips ("45 Min", "Hanteln + Seilzug +5") oben rechts, `data-act="plTo"`. Sie sehen aus wie Tags, nicht wie Buttons, 40 px hoch (Screenshot wiz3-muskeln.png). Die Punkte (plRail) sind nicht antippbar. Schritt 1 hat kein Abbrechen ausser Tab-Wechsel. Schritt 1 springt nach 420 ms automatisch weiter (kein WEITER), Schritt 2/3 haben WEITER/BAUEN, inkonsistent.
- Fix: links neben den Punkten ein "‹" Pfeil (`plTo` mit `plStep-1`), Chips auf 44 px, Text "aendern" andeuten.

### W3 Detail-Screen: oberer Block klebt und frisst die halbe Hoehe
- Schritt: Trainings > Training oeffnen > scrollen. Ist: Titelleiste + "‹ Zurueck" + Name + Hinweiskarte ("Pro Uebung ... Verstanden") bleiben stehen; die Uebungsliste scrollt nur in einem ~280 px Fenster zwischen Hinweis und unterer Leiste (Screenshot u-detail-scrolled.png, im Test blieb die Seite 727/727 hoch, die Liste scrollt intern). Dazu: Name doppelt (Topbar "LOSER 1" und H2), und unten drei Dinge uebereinander: "Tage waehlen · Anfaenger", SPEICHERN, STARTEN.
- Fix: Hinweiskarte nach dem ersten "Verstanden" dauerhaft weg (Persistenz) oder nicht sticky; Topbar-Titel im Detail ausblenden. Betroffen: Renderer um script.js ~1494-1511 (`tx-head`, `tx-back`), CSS `.tx-head`/Hinweis-Block in style.css (Klassennamen im Code nachsehen).

### W4 "SPEICHERN" im Detail eines schon gespeicherten Trainings
- Das Training wurde bereits mit "SPEICHERN" im Ergebnis gespeichert (landet in Trainings). Im Detail steht wieder SPEICHERN neben STARTEN. Unklar, was noch zu speichern ist (vermutlich Tage/Level). Fix: Button nur zeigen, wenn es Aenderungen gibt, sonst nur STARTEN; oder "Fertig" nennen.

### W5 Ergebnis-Screen ("Dein Training") hat kein Zurueck/Verwerfen
- Nach TRAINING BAUEN: Buttons nur SPEICHERN, SPEICHERN & STARTEN, Neu mischen (unter der Liste, 5+ Bildschirmhoehen weit unten, `renderGen` ~989). Kein "Plan aendern" zum Wizard. Fix: oben "‹ Aendern" (`genBack`-aehnlich, setzt `genRes = null` und `view='start'`), Hauptbuttons sticky.

### W6 Begriffe und doppelte Wege
- "Training" (gespeichert) vs. "Plan" (nextPlan/"NAECHSTES TRAINING") vs. Wizard "Planung": Tab heisst "Trainings", Wizard-Titel "PLANUNG", Woche-Tab "Deine Trainings", Trainings-Tab "Deine fertigen Trainings". Die Trainings stehen DOPPELT: Woche > "Meine Trainings" und Tab Trainings (und Favoriten zusaetzlich in Uebungen, `xr-ftr` "Training · n Uebungen"). Alex findet nicht, wo er "sein" Training hat.
- Fix-Vorschlag: Woche = nur Kalender (Tage belegen), Trainings = Bibliothek, Planung = nur Wizard. Aufschrift "Meine Trainings" in Woche in "Training einplanen" umbenennen (renderWeekplanBlock ~1264-1270) oder Liste ausblenden.
- "Neu" (leeres Training mit Namen, `wNewTraining`) und "JETZT TRAINIEREN" (Wizard) stehen nebeneinander; "+ NEU" oeffnet nur Namensfeld (Screenshot v-neu: Hinweis "Gib deinem Training einen Namen ..."). Ok, aber Label "+ NEU" -> "+ Leer anlegen".
- Auto-Name "Loser 1" (script.js ~1301 `loserName()`). Wirkt wie ein Platzhalter-Scherz; Alex-Entscheidung, sonst Name aus Inhalt ("Beine + Ruecken").
- Geraetenamen uneinheitlich: Wizard "Hanteln"/"Bank", Detail/Classic/Code "Kurzhanteln"/"Hantelbank" (`GEAR`, Zeile 738 mit Mapping in renderStart und plRail).

### W7 Gespeicherte Geraete werden bei jedem Start geloescht
- `case 'goto'` (script.js ~1906): beim Oeffnen der Planung `genCfg.gear = []` und `localStorage[GEARKEY] = '[]'`. Die Geraete-Auswahl (Besitz) ist damit nie dauerhaft, obwohl `loadGear()` Persistenz vorsieht. Fuer die Neuordnung wichtig (siehe unten).

## KLEINIGKEITEN
- Touch-Ziele < 44 px: Wizard-Chips `plTo` 40 px; Trainings `trTab` 40; `trFav` 36x40, `trDel` 40x40; Detail `wBack` 368x36, `wDelete` 155x36, `wLevel` 41; Woche `wDayToggle` 44x34; Profil Textlink "Hinweise zuruecksetzen" 28 px, "Neu laden" Link; Uebungen "Filter" 76x40; Wizard-Kacheln `genGrp` 37-40 px (Sub-Spots 37 px). Gemessen mit getBoundingClientRect (Zoom 118 %).
- Trainings-Kopf: "TAGE GEPLANT" bricht in zwei Zeilen (Screenshot s-trainings.png), die drei Kennzahl-Kacheln haben dadurch ungleiche Inhaltshoehe.
- Uebungen: Gruppenkacheln 3er-Raster mit "Beine" allein in Zeile 3, danach Warmup/Push/Pull ohne Ueberschrift (nicht erkennbar, dass das Kategorien sind); Kachel "Favoriten 0" bei leerer Liste (dunkle Kachel ohne Bild) wirkt kaputt. 522 Uebungen, aber 7 Kacheln = Raster unaufgeraeumt (Screenshot s-allex.png). Seite scrollt 796/699.
- Woche (leer): alle Tage "+ / Ruhe", Montag gruen markiert ohne Erklaerung; Text "Starte ein Training auf Start und speichere es" nennt "Start", der Tab heisst aber "Start" und oeffnet den START-Kreis (zweiter Klick-Aufwand).
- Wizard Schritt 3 Untertitel "graue Kacheln tippen erklaert, warum" ist lang (zweizeilig) und gilt nur fuer graue Kacheln; Kachel "Beine" steht alleine in Zeile 3 (7 Kacheln, 3 Spalten), Vorwahl "noch nie" als Untertitel unter Rücken/Beine ist verstaendlich.
- Tab-Wechsel: Kopfzeile Start (Home) hat keine Titelzeile, andere Tabs haben grosse Anton-Titel + Untertitel, Detail-Screen hat kleinere Titelleiste: unterschiedliche Kopfhoehen (Titel 118-260 px) -> Inhalt springt beim Tab-Wechsel.
- Profil: Name-Feld hat Platzhalter "Dein Name" in Grau mit niedrigem Kontrast; "NEU DABEI" und "ANFAENGER" zwei Pills nebeneinander mit unterschiedlicher Optik (Outline vs gefuellt). Profil endet knapp ueber der Tab-Leiste (lastBottom 778 vs tabTop 777): Version-Link "Neu laden · 20261026k" liegt exakt am Rand, Gefahr des Abschneidens bei hoeherer Schrift.
- Tippen auf START-Kreis mit Sonar-Ring (Ring-Effekt bei jedem Pointerdown) vs. Hold-Fortschritt: zwei gleichzeitige Animationen am selben Element (script.js ~2436).
- Optik: Slate-Dunkel + Neon-Gruen durchgehend konsistent, Cards/Radien einheitlich; Ausreisser: Ergebnis-Screen nutzt Orange/Blau/Gelb je Muskelgruppe (gewollt, aber Detail "Superman" gruener Balken vs. Gruppenfarbe uneinheitlich), Aufwaerm-Uebungen immer orange.

## Planungs-Wizard: Reihenfolge Zeit > Figur/Muskeln > Aufbau (Geraete abgeleitet)
Bewertung: Logisch besser. Alex' Frage ist "Was will ich trainieren?", Geraete sind Randbedingung. Aktuell zwingt Schritt 2 eine Frage auf, die er selten aendert (Besitz), und Schritt 3 hat dadurch die verwirrendsten Elemente (graue Kacheln, Sperrmeldung, "Chip oben tippen").

Betroffen (alle im Code nachgesehen):
1. `renderStart()` (script.js ~1055): Schrittzweige plStep 1 (Geraete-Grid `genGear`) und plStep 2 (Muskeln) tauschen/ersetzen; `PL_N = 3` und `plRail()` (~1027) zeigen Chips: Chip-Index 1 ist "Geraete" (`ans`-Array), muss auf Muskelauswahl zeigen; `plTo`-Indizes und `plSeen`-Reset anpassen.
2. Geraetefilter: `groupCounts()` (~794) filtert nach `genCfg.gear`; in der neuen Reihenfolge ist gear zunaechst leer/Besitz-Liste. Wird nur noch zum Zaehlen "n Uebungen passen" gebraucht.
3. Graue Kacheln: `none = !sp && genCfg.gear.length && !gcn[m]` (renderStart Schritt 3) entfaellt, solange Muskeln vor Geraeten kommen (alle Muskeln waehlbar). Hinweis "graue Kacheln tippen erklaert warum" kuerzen auf Push/Pull-Hinweis.
4. `case 'genGrp'` (~2077): Geraete-Sperre (`!genCfg.gear.length || !gcn[m]` mit Text "Waehl zuerst Geraete") und Text "Geh zurueck (Chip oben) und waehl ein Geraet dazu" entfernen. Push/Pull-Sperre bleibt (unabhaengig von Geraeten).
5. `case 'genGear'` (~2083): filtert beim Geraetewechsel `genCfg.groups`; faellt weg oder wird im neuen Schritt 3 harmlos (Gruppen bleiben, nur Zaehler "n passen").
6. "Nichts gewaehlt = alle Geraete" (Schritt 2): neu "Aufbau" soll aus Muskeln abgeleitet werden. Offene Entscheidung: was heisst "alle Geraete" dann? Empfehlung: Geraete = Besitz aus Profil (einmalig setzen, persistent), nicht pro Training. `goto` (~1906) loescht dann nicht mehr GEARKEY/gear (siehe W7). `autoGear()` und `genDo` (~2089, fuellt gear mit allen, wenn leer) pruefen: `genCfg.autoAdded` zeigt schon, was automatisch dazukommt, das kann im Aufbau-Schritt als "Dafuer brauchst du: Langhantel, Bank" angezeigt und abwaehlbar gemacht werden.
7. Vorwahl (`nextPlan()`, `genCfg.plAuto`, `armPick()`): Vorwahl `np.groups.filter(... gcn[m])` greift auf gear zu; bei leerem gear unproblematisch. Muss aber VOR dem Wizard-Schritt ohne Geraete laufen (jetzt erst in Schritt 3 beim ersten Rendern).
8. Classic-Ansicht (`renderStartClassic` mit `builderHtml(false)`, ~1010-1022) zeigt Geraete-Pills oberhalb der Muskeln: bei neuer Logik inkonsistent, besser Classic streichen (W1).
9. Ergebnis-/Fehlertext in `renderGen`: "Mit diesen Geraeten und diesem Fokus finde ich keine Uebungen" bleibt sinnvoll, falls Besitz-Geraete + Muskeln nichts ergeben.
Risiko: Muskel ohne passende Geraete (z.B. Brust nur mit Bank + Hanteln). Dann statt Sperre ein positiver Weg im Aufbau-Schritt ("Dafuer fehlt Bank: mit Bändern/Körper trainieren?").

## Priorisierte Reihenfolge fuer die Umsetzung
1. K1 (Hint/Tipp), K2 (3 Buttons in den Wizard), K3 (eine Zeile Bedingung, oder wegen Neuordnung gleich weg).
2. K4 + W2 (sticky CTA, sichtbares Zurueck) zusammen mit der Wizard-Neuordnung.
3. W1 Classic streichen oder Rueckweg; W3-W5 Detail/Ergebnis-Screens; W6 Begriffe; W7 mit Geraete-Besitz im Profil.
4. Kleinigkeiten (Touch-Ziele auf 44 px, Uebungen-Raster, Titelhoehen).

## Screenshot-Liste (alle in /home/claude/heimtraining/qa-shots-2026-10-26/)
tab-overview, tab-weeklist, tab-trainings, tab-allex, tab-history, tab-profile, r-home-after-tap, r-wiz1, r-wiz2-default, r-wiz3-nogear, r-wiz3-nogear-tapBrust, r-back-to-gear, r-wiz3-body, r-wiz3-body-beine, r-classic, s-result-top, s-after-save, s-trainings, s-detail-top, s-weeklist, s-allex, s-allex-brust, s-history, s-profile, v-jetzt-trainieren, v-neu, u-detail-scrolled, u-allex-scrolled (Rest sind Zwischenschritte; die ersten wiz*/tab-* Bilder sind teils mitten in der Einblend-Animation aufgenommen).
Hinweis: Im Repo liegt `qa-shots-2026-10-26/` neu (nur Screenshots), kein Code geaendert, kein Commit.
