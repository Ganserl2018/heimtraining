#!/usr/bin/env python3
# Erzeugt szenen-plan.md + anleitungen_de.json aus pool/gearfix/names_de (regelbasiert, lokal, kostenlos)
import json, hashlib, re
P=json.load(open('pool.json')); G=json.load(open('gearfix.json')); N=json.load(open('names_de.json'))
SC={1:'Ziegelwand+senkrechter LED',2:'Skyline-Fenster+LED',3:'Rack/Käfig+Neonlinien',4:'Kabelturm+Holzwand+LED-Rand',
    5:'Matte+Neonring',6:'Betonwand+Boden-Glow',7:'Spiegelwand+LED-Band',8:'Holzdielen+LED-Leiste'}
def scene(n,g):
    h=int(hashlib.md5(n.encode()).hexdigest(),16)
    if 'cable' in g: return 4
    if 'rig' in g or ('barbell' in g and 'bench' not in g and h%2): return 3
    if g==['body'] or 'band' in g and len(g)==1:
        return [5,8,6,1][h%4]
    return [1,2,3,6,7][h%5]
# (regex, Start, Ende, Hinweis Bewegungslogik, Anleitung-Schritte, Perspektive)
R=[
 (r'face pull','Arme gestreckt, Hände auf Augenhöhe am gespannten Seil','Seil neben den Ohren, Ellbogen hoch/außen, Schulterblätter zusammen','Rolle auf Augenhöhe, Seil waagerecht+straff, weit weg vom Turm','Seilzug auf Augenhöhe stellen und weit genug zurücktreten, dass das Seil straff ist.|Seil ziehen, bis die Hände neben den Ohren sind; Ellbogen hoch und nach außen.|Schulterblätter zusammenziehen, kurz halten, kontrolliert zurück.','Seitenprofil'),
 (r'romanian|stiff|good morning','Aufrecht, Stange vor den Oberschenkeln','Oberkörper tief vorgebeugt, Rücken gerade, Stange knapp unter den Knien','Stange wird gehalten, nicht gehoben; Hüfte schiebt nach hinten, Knie fast gestreckt','Aufrecht stehen, Stange/Gewicht vor den Oberschenkeln halten.|Hüfte weit nach hinten schieben, Rücken gerade lassen, Gewicht nah am Körper nach unten führen.|Beim Dehnen der Beinrückseite stoppen, Hüfte nach vorne treiben und aufrichten.','Seitenprofil'),
 (r'deadlift','Gewicht am Boden, Rücken gerade, Hüfte tief','Aufrecht mit gestreckter Hüfte, Gewicht an den Oberschenkeln','Gewicht startet am Boden, Weg dicht am Körper','Gewicht über den Fußmitten greifen, Rücken gerade, Brust raus.|Mit den Beinen drücken und Hüfte strecken; Gewicht bleibt nah am Körper.|Oben aufrecht stehen, kontrolliert wieder absetzen.','Seitenprofil'),
 (r'bench press|chest press|floor press','Gewicht über der Brust mit gestreckten Armen (Stange: an der Brust abgelegt)','Gewicht an der Brust, Ellbogen ca. 45° zum Körper','Stangenweg senkrecht über Schultern, Schulterblätter fest auf der Bank','Schulterblätter zusammen, Füße fest am Boden, Gewicht über der Brust halten.|Kontrolliert zur Brust senken, Ellbogen ca. 45°.|Kraftvoll nach oben drücken, bis die Arme gestreckt sind.','3/4-Seite'),
 (r'shoulder press|overhead press|military|arnold','Gewichte auf Schulterhöhe, Ellbogen unter den Händen','Arme über dem Kopf gestreckt','Druckweg senkrecht, Rumpf nicht ins Hohlkreuz','Gewichte auf Schulterhöhe, Bauch und Gesäß fest.|Senkrecht über den Kopf drücken.|Oben kurz halten, kontrolliert zurück auf Schulterhöhe.','Frontal/3/4'),
 (r'squat|lunge|split','Aufrecht, Gewicht stabil (Stange auf dem oberen Rücken)','Oberschenkel mindestens parallel zum Boden, Knie über den Füßen, Rücken gerade','Knie folgen den Zehen, Fersen am Boden, Rücken gerade','Schulterbreit stehen, Brust raus, Bauch fest.|Hüfte nach hinten-unten schieben, Knie in Richtung der Zehen.|Aus den Fersen kräftig hochdrücken.','Seitenprofil'),
 (r'curl','Arme hängen gestreckt, Ellbogen am Körper','Gewicht an den Schultern, Ellbogen unverändert am Körper','Nur der Unterarm bewegt sich, Oberarm bleibt fix','Ellbogen fest an den Körper, Oberkörper still.|Gewicht in einem Bogen zu den Schultern curlen.|Oben kurz anspannen, langsam ablassen.','Seitenprofil'),
 (r'pulldown|pull-up|pullup|chin','Arme oben gestreckt (Hang/an der Stange)','Brust/Kinn auf Stangenhöhe, Ellbogen nach unten-hinten','Zug zu den Ellbogen, nicht mit dem Nacken','Stange etwas mehr als schulterbreit greifen, Schulterblätter nach unten.|Ellbogen zu den Hüften ziehen, Brust zur Stange.|Oben kurz halten, kontrolliert strecken.','Frontal/3/4'),
 (r'row','Oberkörper vorgebeugt, Arme gestreckt, Gewicht hängt','Gewicht am Bauch/Brustkorb, Ellbogen hinten, Schulterblätter zusammen','Rücken gerade, Zug entlang des Körpers, kein Schwung','Hüfte beugen, Rücken gerade, Gewicht hängt mit gestreckten Armen.|Ellbogen nach hinten ziehen, bis das Gewicht den Bauch erreicht.|Schulterblätter zusammen, kontrolliert absenken.','Seitenprofil'),
 (r'raise|fly|flye','Arme neben bzw. vor dem Körper, leicht gebeugt','Arme auf Schulterhöhe (Seitheben) bzw. weit geöffnet (Fly)','Ellbogen leicht gebeugt, Hände nie höher als Ellbogen','Leichte Ellbogenbeugung beibehalten.|Gewichte in einem Bogen bis auf Schulterhöhe führen.|Kurz halten, langsam ablassen.','Frontal'),
 (r'extension|pushdown|kickback|skull|triceps|dip','Oberarm fix, Unterarm gebeugt','Arm voll gestreckt','Nur der Unterarm bewegt sich, Oberarm bleibt fix','Oberarm/Ellbogen fixieren.|Arm bis zur vollen Streckung führen.|Kurz anspannen, kontrolliert zurück.','Seitenprofil'),
 (r'crunch|sit-up|situp|leg raise|knee|twist|plank|bridge','Ausgangsposition auf der Matte, Bauch angespannt','Oberkörper bzw. Beine kontrolliert angehoben, Bauch fest','Bewegung aus dem Bauch, nicht aus dem Nacken','Rücken fest am Boden, Bauch anspannen.|Oberkörper bzw. Beine kontrolliert bewegen, Nacken lang.|Oben anspannen, langsam zurück.','Seitenprofil'),
 (r'push-up|pushup|press-up','Hochstütz, Arme gestreckt, Körper gerade','Brust knapp über dem Boden, Ellbogen ca. 45°','Körper bleibt eine gerade Linie','Hände unter den Schultern, Körper gerade.|Brust kontrolliert zum Boden senken.|Kraftvoll hochdrücken.','Seitenprofil'),
 (r'calf','Fersen tief, Fußballen auf Stütze','Auf den Zehenspitzen, Waden maximal angespannt','Volle Bewegungsweite, kein Wippen','Fußballen aufsetzen, Beine fast gestreckt.|Hoch auf die Zehenspitzen drücken.|Oben halten, tief dehnen.','Seitenprofil'),
 (r'pallof','Seitlich zum Seilzug (Brusthöhe), Griff vor der Brust','Arme vor der Brust gestreckt, Rumpf gegen den Zug stabil','Seil straff, Rumpf dreht nicht mit','Seitlich zum Seilzug stehen, Griff vor der Brust.|Arme gerade nach vorne drücken, Rumpf gegen den Zug stabil halten.|Kurz halten, zurück zur Brust.','Frontal'),
 (r'woodchop|wood chop|cable lift|side bend|judo','Seilzug unten/oben, Griff seitlich am Körper','Diagonal über den Körper gezogen, Rumpf dreht kontrolliert','Seil straff, Zug diagonal, Hüfte stabil','Seitlich zum Seilzug, Griff mit beiden Händen.|Diagonal über den Körper ziehen, Rumpf dreht mit.|Kontrolliert zurück.','Frontal'),
 (r'crossover|cross over|iron cross','Arme seitlich gestreckt, Seile straff','Hände vor der Brust zusammen, Ellbogen leicht gebeugt','Seile straff, Zug im Bogen zur Mitte','Leicht vorgelehnt, Arme seitlich offen.|Hände im Bogen vor der Brust zusammenführen.|Kurz anspannen, kontrolliert öffnen.','Frontal'),
 (r'pullover','Auf der Bank, Gewicht über der Brust, Arme gestreckt','Gewicht hinter dem Kopf, Arme gestreckt, Brust gedehnt','Armweg im Halbkreis, Ellbogen leicht gebeugt','Gewicht über der Brust halten.|Arme im Bogen hinter den Kopf führen.|Zurück über die Brust ziehen.','Seitenprofil'),
 (r'incline|decline','Gewichte über der Brust auf der schrägen Bank','Gewichte an der Brust, Ellbogen ca. 45°','Bank-Winkel sichtbar, Druckweg senkrecht über Schultern','Bank einstellen, Schulterblätter zusammen.|Gewichte kontrolliert zur Brust senken.|Nach oben drücken.','3/4-Seite'),
 (r'isometric|squeeze|wiper','Hände/Arme vor der Brust zusammen','Hände halten Druck, Brust angespannt','Statisch, Druck aus Brust sichtbar','Hände vor der Brust gegeneinander drücken.|Spannung 5–10 Sek. halten.|Lösen und wiederholen.','Frontal'),
 (r'hip thrust|hip lift|glute bridge|pull through|pull-through','Rücken an Bank/Boden, Hüfte tief','Hüfte oben gestreckt, Schultern-Hüfte-Knie eine Linie','Hüfte streckt, Gewicht wird nicht gehoben vom Rücken','Oberer Rücken aufgelegt, Füße fest.|Hüfte nach oben strecken, Gesäß anspannen.|Kontrolliert absenken.','Seitenprofil'),
 (r'jack|jump|bound|sprint|walk|crawl|inchworm|groiner|circle|rotation|touch','Aufrechte/Grundposition, Körper aktiviert','Endphase der Bewegung klar sichtbar (Spannweite)','Dynamische Übung: 2 klare Extrempositionen wählen','Aufrechte Grundposition.|Bewegung schwungvoll, aber kontrolliert ausführen.|Zur Ausgangsposition zurück.','Frontal'),
 (r'leg|kick|scissor|flutter|pike|cocoon|dead bug|vacuum|butt-up|bottoms|spell','Rückenlage/Hang, Bauch angespannt','Beine bzw. Rumpf in Endposition, Bauch fest','Unterer Rücken bleibt am Boden bzw. Rumpf stabil','Position einnehmen, Bauch fest.|Beine/Rumpf kontrolliert bewegen.|Langsam zurück.','Seitenprofil'),
 (r'neck|wrist','Neutrale Haltung, Gelenk locker','Endposition der Bewegung','Kleine Bewegung, kein Ruck','Neutrale Haltung.|Langsam die Bewegung ausführen.|Zurück zur Mitte.','Frontal'),
 (r'stretch|90/90','Entspannte Dehnposition','Maximale Dehnung ohne Schmerz','Statisch, 20–30 Sek.','Bequeme Ausgangsposition.|Langsam in die Dehnung gehen.|Ruhig atmen, halten.','Seitenprofil'),
]
DEF=('Ausgangsposition stabil, Gewicht kontrolliert','Endposition mit voller Bewegungsweite','Bewegungsweg und Gerät pro Übung manuell prüfen','Stabile Ausgangsposition einnehmen.|Bewegung kontrolliert über den vollen Weg ausführen.|Endposition kurz halten, langsam zurück.','Seitenprofil')
def rule(n):
    for r in R:
        if re.search(r[0],n.lower()): return r[1:]
    return DEF
GEAR={'body':'Körpergewicht','barbell':'Langhantel','dumbbell':'Kurzhantel','bench':'Bank','cable':'Seilzug','band':'Band (Türanker)','rig':'Klimmzug-Gerüst'}
out=['# Szenen-Plan (regelbasiert, 18.10.2026) – Prüfung vor Bildproduktion\n','Spalte "Regel" = automatisch erkannt (✓) oder Standard (⚠ manuell prüfen).\n',
 '| # | Übung | Deutsch | Gerät | Szene | Start | Ende | Logik-Check | Regel |','|---|---|---|---|---|---|---|---|---|']
AN={};k=0;dflt=0
for x in P:
    n=x['name'];g=G.get(n,{})
    if g.get('s')!='ok': continue
    k+=1;gg=g.get('g',[]);s,e,l,steps,pers=rule(n);d=(s,e,l,steps,pers)==DEF or rule(n)[3]==DEF[3]
    dflt+=d
    out.append(f"| {k} | {n} | {N.get(n,'')} | {', '.join(GEAR.get(i,i) for i in gg)} | {scene(n,gg)} {SC[scene(n,gg)]} | {s} | {e} | {l} | {'⚠' if d else '✓'} |")
    if not d: AN[n]={'de':N.get(n,n),'schritte':steps.split('|'),'auto':True}
open('szenen-plan.md','w').write('\n'.join(out)+'\n')
json.dump(AN,open('anleitungen_de.json','w'),ensure_ascii=False,indent=0)
print(k,'Übungen,',dflt,'Standard (⚠)')
