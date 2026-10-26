# Ordnet jede Übung (pool.json) Muskel-Regionen des 3D-Modells zu (Haupt- + Nebenmuskeln). Regeln nach Name, Rest nach muscle.
import json,re
pool=json.load(open('pool.json'));names=json.load(open('names_de.json'))
BASE={
 'chest':['pec_major_upper','pec_major_lower'],
 'shoulders':['anterior_delt','lateral_delt'],
 'quadriceps':['vastus_group','rectus_femoris'],
 'abdominals':['rectus_abdominis'],
 'triceps':['triceps_long','triceps_lateral','triceps_medial'],
 'biceps':['biceps','brachialis'],
 'hamstrings':['lateral_hamstrings','medial_hamstrings'],
 'lats':['upper_lats','lower_lats'],
 'forearms':['forearm_flexors','forearm_extensors','brachioradialis'],
 'glutes':['glute_max'],
 'middle back':['rhomboids','mid_traps','teres_major'],
 'lower back':['erector_spinae'],
 'traps':['upper_traps'],
 'calves':['gastrocnemius','soleus'],
 'abductors':['glute_med'],
 'adductors':['adductors'],
 'neck':['neck_flexors','neck_extensors'],
}
SEC={ # grobe Standardregel für Nebenmuskeln
 'chest':['triceps_long','anterior_delt'],'shoulders':['triceps_long','upper_traps'],'triceps':['anterior_delt'],
 'biceps':['brachioradialis'],'lats':['biceps','teres_major','rhomboids'],'middle back':['biceps','posterior_delt'],
 'quadriceps':['glute_max'],'hamstrings':['glute_max','gastrocnemius'],'glutes':['lateral_hamstrings','medial_hamstrings'],
 'lower back':['glute_max'],'abdominals':['transverse_abdominis'],'traps':['rhomboids'],'calves':[],'forearms':[],'abductors':[],'adductors':[],'neck':[],
}
def has(n,*ws): return any(re.search(w,n) for w in ws)
out={};flag=[]
for e in pool:
    n=e['name'].lower();m=e['muscle'];p=list(BASE[m]);why='Regel nach Muskelgruppe'
    if m=='chest':
        if has(n,'incline'): p=['pec_major_upper'];why='Incline → oberer Brustmuskel'
        elif has(n,'decline','dip'): p=['pec_major_lower'];why='Decline/Dip → unterer Brustmuskel'
        elif has(n,'fly','flye','crossover','pec deck','cable cross'): why='Fly → ganze Brust'
    if m=='shoulders':
        if has(n,'lateral','side raise','upright'): p=['lateral_delt'];why='Seitheben → seitliche Schulter'
        elif has(n,'front raise','front plate'): p=['anterior_delt'];why='Frontheben → vordere Schulter'
        elif has(n,'rear','back fl','reverse fly','reverse flye','face pull','bent over','bent-over','pull apart','pull-apart'): p=['posterior_delt'];why='Rear/Face Pull → hintere Schulter'
        elif has(n,'external rotation','internal rotation','rotator','cuban'): p=['rotator_cuff'];why='Rotation → Rotatorenmanschette'
        elif has(n,'press','push'): p=['anterior_delt','lateral_delt'];why='Pressen → vordere + seitliche Schulter'
        elif has(n,'shrug'): p=['upper_traps'];why='Shrug → Trapez'
    if m=='abdominals':
        if has(n,'oblique','twist','side bend','woodchop','wood chop','windmill','russian','side plank','side jackknife'): p=['obliques'];why='seitlich/Rotation → schräge Bauchmuskeln'
        elif has(n,'plank','hollow','dead bug','vacuum'): p=['rectus_abdominis','transverse_abdominis'];why='Stütz/Core → gerader + querer Bauchmuskel'
        elif has(n,'leg raise','knee raise','hanging','reverse crunch','leg pull'): p=['rectus_abdominis','hip_flexors'];why='Beinheben → Bauch + Hüftbeuger'
    if m=='triceps' and has(n,'overhead','skull','french','lying'): p=['triceps_long','triceps_lateral','triceps_medial'];why='Trizeps (Overhead betont langen Kopf)'
    if m=='biceps' and has(n,'hammer'): p=['brachialis','brachioradialis','biceps'];why='Hammer → Brachialis/Brachioradialis'
    if m=='lats' and has(n,'pull-up','pullup','pull up','chin','lat pulldown','pulldown'): p=['upper_lats','lower_lats'];why='Klimmzug/Latzug → breiter Rücken'
    if m=='lats' and has(n,'pullover','straight-arm'): p=['upper_lats','teres_major'];why='Pullover → oberer Lat + Teres'
    if m=='glutes' and has(n,'hip thrust','bridge','kickback','kick back'): p=['glute_max'];why='Hüftstrecken → Gesäß'
    if m=='quadriceps' and has(n,'lunge','split squat','step-up','step up'): p=['vastus_group','rectus_femoris','glute_max'];why='Ausfallschritt → Quadrizeps + Gesäß'
    if m=='quadriceps' and has(n,'sissy','leg extension'): p=['vastus_group','rectus_femoris'];why='Extension → Quadrizeps'
    if m=='calves' and has(n,'seated'): p=['soleus'];why='Sitzend → Schollenmuskel'
    if m=='calves' and has(n,'standing','donkey'): p=['gastrocnemius'];why='Stehend → Zwillingswadenmuskel'
    s=[x for x in SEC[m] if x not in p]
    out[e['name']]={'de':names.get(e['name'],''),'muscle':m,'primary':p,'secondary':s,'why':why}
json.dump(out,open('muscle-map.json','w'),ensure_ascii=False,indent=1)
# Prüf-Liste nach Gruppe
by={}
for k,v in out.items(): by.setdefault(v['muscle'],[]).append((k,v))
L=['# Muskel-Zuordnung Übungen → 3D-Modell (zum Prüfen)\n','Haupt = leuchtet stark, Neben = grobe Regel pro Muskelgruppe (nicht pro Übung geprüft).\n']
for m,items in sorted(by.items(),key=lambda x:-len(x[1])):
    L.append(f'\n## {m} ({len(items)})\n')
    for k,v in sorted(items): L.append(f"- {v['de'] or k} ({k}): **{', '.join(v['primary'])}**" + (f" · Neben: {', '.join(v['secondary'])}" if v['secondary'] else '') + (f" — {v['why']}" if not v['why'].startswith('Regel') else ''))
open('muscle-map-pruefliste.md','w').write('\n'.join(L))
spec=sum(1 for v in out.values() if not v['why'].startswith('Regel'));print(len(out),'Übungen,',spec,'mit Spezialregel')
