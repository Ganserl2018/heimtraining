# Home-Force-Taskforce (Claude orchestriert, Alex entscheidet nur)

Agenten liegen in `.claude/agents/`: scout, strategist, designer, coach, checker.

Standardablauf bei einer Idee oder neuen Phase:
1. scout (Trends/Features) -> strategist (Passung, Phase, Warteliste)
2. Bei Optik: designer (Konzept + Wow-Effekt). Bei Sätzen/Gewichten/Pläne: coach (Regeln).
3. Claude baut in Phasen (Skelett, Logik, Design, Schutz).
4. checker prüft unabhängig (Playwright 390/1300), Claude behebt, dann push.
5. Reports unverkürzt in plan.md/Vault sichern.

Alex bekommt: eine kurze Entscheidungsvorlage (max. 3 Optionen) statt Fragenkatalog.
Erweiterung: neue Agenten als `.claude/agents/<name>.md` anlegen.
