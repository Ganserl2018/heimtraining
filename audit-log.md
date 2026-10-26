# Audit-Log: Änderungen ohne ausdrückliche Anweisung (Auditor-Agent pflegt)
Einstufung: A angewiesen · B abgeleitet/im Rahmen · C eigenmächtig. Zuletzt geprüft: 27.10.2026 00:35 (Erstbefüllung durch Claude selbst, der Auditor prüft nach).

| Datum | Hash | Stufe | Was | Wirkung für Alex | Status |
|---|---|---|---|---|---|
| 26.10. | ce6ac83 | C | Start-Tab leitete direkt in den Wizard um, Übersichtsseite entfiel (Missverständnis "Start-Seite") | Startbutton-Seite war weg, Alex: "das geilste" entfernt | zurückgebaut 7d270b6 |
| 27.10. | 6305571 | B | Tab-Klick beendet Dash-Modus (Fehlerbehebung für hängende Balken-Seite) | Start-Tab zeigt wieder Startbutton | von Alex nicht beanstandet |
| 27.10. | 33b0b6b | A→C | HOME-FORCE-Schrift als Button: Optik veränderte sich (Zeilenhöhe) | Schrift saß anders | korrigiert d368a82, Nebenwirkungs-Regel in qa-checkliste |
| 27.10. | 0eb4f50 | B | Tipp-Blasen auf 2 gekürzt, Kopf "TIPP" (Alex hatte Überarbeitung "B" freigegeben, Details von Claude) | weniger Tipps | offen, abnehmen |
| 27.10. | d9602ac | B | Uhrzeit-Feld beschriftet (Alex: "frag sowas kleines nicht, mach's einfach") | Kasten hat Beschriftung | offen |
| 27.10. | a3b60c5 | A | Neu mischen/Einplanen/Anpassen nach oben (Alex: "nach oben bitte") | wie gewünscht | abgenommen |
| 26./27.10. | diverse | B | `?v=`-Hochzählen bei jeder UI-Änderung | keine | Standard |

Regel ab jetzt: jeder Commit-Body enthält `Auftrag: "<Alex-Zitat>"` oder `Auftrag: eigenständig`.
