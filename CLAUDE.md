# Home Force – feste Regeln (werden jede Session + nach Kompression automatisch geladen)

- Antworten: deutsch, sehr kurz, keine Begrüßung/Lob, bauen statt "Willst du…?".
- **Produktionsstraße: IMMER mit `url=https://claude.ai/artifact/33Pz2wW3JRTVER4UhY8wWT` republishen (Quelle: strasse.html im Scratchpad; ohne url entsteht ein Duplikat). Nach jeder fertigen Kachel republishen.**
- "Speichern" = Vault-Übergabe (`~/mnt/Claude/Obsidian-Vault/Projects/Privat/Heimtraining/session-uebergabe-2026-10-04.md`, Nachtrag per `cat >>`), plan.md, Straße (mit url!), Memory (`/projects/01a0def4-e132-726b-8e41-b13f0f0e0473/areas/heimtraining-app.md`).
- Deploy: Push auf `main` → Cloudflare Pages (https://heimtraining.pages.dev). Nach UI-Änderungen `?v=` in index.html (style.css/script.js) hochzählen.
- Commit-Trailer: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01PvyiLGJFyas6muFwwubScP`.
- Patches: nie `s.index()` auf generische End-Strings; exakte Strings, danach `node --check script.js`.
- Tests: `python3 -m http.server <port>` + Playwright 390px; kein `pkill -f http.server` (killt die eigene Shell).
- Nice-to-have-Ideen → Warteliste in Straße + plan.md, nicht sofort bauen.
- Alex entscheidet: 184 Duplikat-Bilder, Stangengewicht, Token V10-03.
- **QA-Höhe = echtes iPhone:** Der Standard-Test mit 390x844 liegt ~70px zu großzügig. Immer `tools/qa-iphone-harness.js` nutzen (Viewport 402x815, simulierte Safe-Areas oben 14/unten 34, breitere Tab-Leiste, Anton-Font via `npm i @fontsource/anton` in /tmp/qa-font). Es misst, ob Inhalt unter der Tab-Leiste endet (`fit`). Beispiel: `tools/qa-iphone-run.js` (Server auf Port 8793 nötig). Beim Checker-Agent immer mitgeben.
- body-Höhe = 100dvh minus Safe-Areas (sonst ragt der Inhalt unter die Tab-Leiste, "schneidet ab").
- **QA-Maße Alex-iPhone (18.10. aus Screenshot ermittelt):** Viewport 402x874, Safe-Area oben 59/unten 34, Text ~118% größer als Standard (Tab "Übungen" ohne Umbruch!). Test immer: `ZOOM=118 VH=874 ET=59 EB=34 node …` mit `tools/qa-iphone-harness.js` (Env VW/VH/ET/EB/ZOOM). Kein Scrollen auf Übersicht/Profil/Wochenplan; Tab-Leisten-Höhe wird per JS als `--tabh` gemessen.
- **Bild-Probleme (Übergänge, Pose, Seil, Helligkeit):** ZUERST `bild-stil.md` + Vault `06_Debugging/` lesen, dort stehen die funktionierenden Rezepte (GIF-Blend, LED-Prompt, Face-Pull). Erst danach raten/fragen. Vor dem Senden Bewegungslogik prüfen.
- **QA Neu-Optik (V18):** Harness mit `NEWTAB=1` starten (schwebende Tab-Leiste, kein Zusatz-Padding).
