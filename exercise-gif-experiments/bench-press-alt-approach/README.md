# Alternativer Ansatz: Echte Fotos statt KI-Illustration

Nachdem die FLUX/LTX-Video-KI-Illustration-Pipeline (RunPod/ComfyUI) beim
Bankdrücken nach 9 Versuchen an der Perspektive gescheitert ist (immer
Seitenansicht statt Frontalspiegelung, asymmetrische Färbung etc.), hier
ein komplett anderer Ansatz:

- 2 echte Trainingsfotos (Start-/Endposition der Übung) statt KI-generierter Illustration
- Daraus ein simples 2-Frame-Ping-Pong-GIF (PIL, kein RunPod/GPU nötig)
- Läuft in Dauerschleife (loop=0), lange Frame-Dauer (2,5s) für "sehr langsame Bewegung"

Vorteil: kein RunPod-Pod, keine Kosten, kein Perspektive-Kampf mit der KI.
Nachteil: kein einheitlicher Illustrations-Stil wie bei den anderen Übungen,
braucht 2 echte Fotos pro Übung (Urheberrecht/Lizenz beachten, falls nicht
selbst geschossen).

Status: erster Test (Bankdrücken), noch nicht final entschieden ob das der
Weg für alle ~19 Übungen wird oder nur ein Fallback für Übungen ist, bei
denen die KI-Illustration scheitert.
