# Pose-Kontrolle Nano Banana / Gemini (Recherche 2026-10-04)

Legende: [Q] = direkt aus Quelle belegt. [Ableitung] = meine Schlussfolgerung, NICHT in einer Quelle belegt, erst testen.
Wichtig: Fuer Decline Bench / Hip Thrust / Russian Twist etc. wurde KEINE Quelle gefunden, die genau das loest. Alles unten ist generische Pose-Technik.

## Techniken

1. Skelett-/OpenPose-Bild + Personenbild (2 Bilder) [Q]
   Prompt: "I have uploaded two images. Image 1 is the pose reference (stick figure / OpenPose skeleton), image 2 is the person. Generate the person from image 2 performing exactly the pose of the skeleton in image 1. Keep identity, outfit, background."
   Quelle: https://atlassc.net/2025/12/13/generate-image-with-pose-and-character-references (Skelett via https://openposeai.com, Quelle nennt das Tool; Prompt dort laenger, Kern sinngemaess)

2. Strichmaennchen selbst zeichnen [Q]
   Prompt: "Let the person in Figure 2 perform the action of the stick figure in Figure 1. Keep outfit and identity."
   Tipps aus Quelle: Gliedmassen mit klaren Richtungslinien, Haende/Fuesse andeuten, Kamerawinkel und Massstab von Strichmaennchen und Foto angleichen.
   Quellen: https://nanoprompts.org/use-cases/character-creative-transformation/action-transformation und https://www.glbgpt.com/hub/how-to-change-a-persons-pose-with-stick-figure-sketches-using-nano-banana/

3. Pose-Referenzfoto + Subjekt-Referenz (Pose von echtem Foto uebernehmen) [Q]
   Prompt: "Image 2 is the character reference, image 1 is the pose reference. Create an image of the content as shown in image 2, but with the main character posed in the same way as image 1."
   Hinweis: Quelle nutzt Nano Banana Pro (Gemini 3) in Weavy, nicht 2.5 Flash; Pose-Ref kann auch Skizze/3D-Blockout sein. "Rule of Three": 3-4x generieren, erste Ergebnisse haben oft Anatomiefehler.
   Quelle: https://chasejarvis.com/blog/change-the-pose-of-any-photo-with-nano-banana-weavy/

4. Pose konkret in Koerperteilen beschreiben [Q]
   Prompt: "Pose her with her arms crossed over her chest" / "close-up from the side with her left arm raised" (Beispiele der Quelle). Fuer uns: "Her left arm is extended straight up, right hand on hip, torso bent 40 degrees to the right."
   Quelle: https://help.scenario.com/en/articles/nanobanana

5. Hyper-spezifisch + Kameraangabe [Q]
   Google-Doku: "The more detail you provide, the more control you have"; Kamera/Perspektive explizit benennen (z.B. "45-degree angle", "85mm portrait lens").
   Prompt: "Photo from the side at hip height, 35mm lens: the man lies on his back, head lower than his hips ..."
   Quelle: https://mindpal.space/blog/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results-a1b2c3 (Spiegel des Google-Developers-Blogposts; Original-URL nicht abrufbar gewesen, dort der Titel "How to prompt Gemini 2.5 Flash Image Generation for the best results") und https://ai.google.dev/gemini-api/docs/image-generation

6. Semantische Negation = Gegenteil positiv beschreiben [Q]
   Statt "no cars" -> "an empty, deserted street with no signs of traffic". Fuer uns: statt "not sitting" -> "lying flat on his back, shoulder blades on the bench, hips lifted off the ground, torso and thighs in one line".
   Quelle: https://mindpal.space/blog/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results-a1b2c3
   Zusatz: auch https://exploreaitogether.com/nano-banana/ rät zu konstruktiver statt negativer Formulierung.

7. Kleine, additive Edit-Schritte (Zwischenposen) [Q + Ableitung]
   Quelle: "Nano Banana handles additive edits better than complex first prompts"; Google: "make small changes" per Dialog.
   Prompt Schritt 1: "Rotate the torso 30 degrees to the left, keep everything else identical." Schritt 2: "Now rotate another 30 degrees, keep ..."
   (Dass Zwischenschritte Pose-Ignorieren loesen, ist Ableitung.)
   Quellen: https://exploreaitogether.com/nano-banana/ , https://mindpal.space/blog/how-to-prompt-gemini-2-5-flash-image-generation-for-the-best-results-a1b2c3

8. "Keep everything else identical" / Nicht-Aenderungen explizit nennen [Q]
   Google-Doku: "Update this infographic ... Do not change any other elements." Prompt: "Change only the pose of the person, keep face, outfit, bench, room, lighting and camera identical."
   Quellen: https://ai.google.dev/gemini-api/docs/image-generation , https://exploreaitogether.com/nano-banana/ ("Change only the sofa color..., keep everything else identical")

9. Edit wird ignoriert -> explizitere Direktive, neuer Chat, Reroll [Q]
   HN-Thread: Modell gibt bei kniffligen Edits oft dasselbe Bild zurueck; Workaround "far more explicit directives ... no guarantee", neue Chat-Session starten.
   Prompt: "The new image MUST show a clearly different body position: the head is now at the lowest point. The old pose is wrong."
   Quelle: https://brianlovin.com/hn/45215869

10. Identitaet neu verankern durch Referenz-Re-Upload [Q]
   "re-upload original photo, add 'same person as reference photo'"; Charakter-Drift erfordert gelegentlich Re-Upload der Referenz.
   Quellen: https://exploreaitogether.com/nano-banana/ , https://christytuckerlearning.com/nano-banana-gemini-character-image-experiments/

11. Szene/Person-Konsistenz: Start- und Endbild als 2 Referenzen, nur Pose variieren [Ableitung aus Q]
   Cascading: jedes neue Bild referenziert das vorige, nur Kamera/Pose aendern, Kleidung/Haare nie anfassen.
   Prompt: "Use image 1 as the base. Same person, same room, same camera. Only change the body pose to: ..."
   Quelle (Cascading-Prinzip): https://www.atlabs.ai/blog/how-to-create-consistent-ai-characters-cinematic-camera-angles

12. Kamera-/Perspektivwechsel nur begrenzt verlaesslich [Q, Warnung]
   Tests: echte Top-Down-Ansicht und andere Kamerachsen werden nur lose umgesetzt; im Multi-Charakter-Test scheiterten Perspektivwechsel ausser Zoom-out. -> Kamera NICHT als Haupthebel nutzen, besser Pose-Referenzbild (1-3).
   Quellen: https://blog.segmind.com/camera-angle-generation-test-seedream-5-lite-vs-nano-banana-pro-across-6-shot-types/ (Nano Banana Pro) , https://christytuckerlearning.com/nano-banana-gemini-character-image-experiments/

13. Bild drehen als Hilfsbild (Gegenteil-Trick) [Ableitung, KEINE Quelle]
   Idee fuer Decline: Gespiegelte/gedrehte Variante einer Schrägbank-Pose als Pose-Referenz verwenden bzw. Skizze mit Kopf unten selbst zeichnen (Technik 2). Rein experimentell.

## Empfehlung pro Problemfall

1. Decline Bench (Kopf unten): Technik 2 (Strichmaennchen mit klar schraeg abfallendem Oberkoerper, Beine-Fixierung als Polster-Block einzeichnen, Kamera = Seitenansicht wie im Foto) + 6 (positiv: "head is the lowest point of the body, hips higher than head, feet hooked under padded rollers"). Reserve: 13.
2. Hip Thrust: Technik 3 (echtes Hip-Thrust-Foto oder Skelett als Pose-Ref) + 6 ("only the upper back rests on the bench edge, hips lifted, thighs horizontal, shins vertical, glutes NOT on the bench"). Alternativ 7 (erst "liegen", dann "Huefte anheben").
3. Rumpfrotation/Seitneigung/Huefte: Technik 1 oder 2 (Skelett zeigt Rotation/Neigung zuverlaessiger als Text) + 4 (Winkel in Grad pro Koerperteil: "shoulders rotated 60 degrees right, hips facing forward"); Zwischenschritte (7) fuer starke Rotation. Hueftkreisen ist ein Bewegungsablauf: als 2-3 Einzelposen (vorn/rechts/hinten) mit je eigenem Skelett erzeugen.
4. Endbild ~ Startbild: Technik 9 (explizit: "MUST be clearly different") + 1/2 (Pose-Ref erzwingt Unterschied) + neuer Chat/Reroll (Rule of Three, Technik 3).
5. Konsistenz Start/Ende: Technik 8 + 10 + 11 (Startbild als Basis hochladen, nur Pose aendern; bei Drift Referenz erneut hochladen).

## Qualitaetsvermerke
- Direkt zu 2.5 Flash Image (Gratis-Web-App): Google-Doku, exploreaitogether, scenario, fal, tomsguide; Chase Jarvis und Segmind-Test betreffen Nano Banana Pro/Gemini 3.
- selfielabstudio.com (Pose-Sheet, "Consistency Slider") NICHT uebernommen: Slider existiert in der Gratis-Gemini-App nicht, Quelle wirkt unzuverlaessig.
- Nicht gefunden: Foren-Beleg speziell fuer liegende/umgekehrte Fitness-Posen. Reddit-Suche lieferte nichts Abrufbares.
