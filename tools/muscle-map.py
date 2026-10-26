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
    if m=='lower back' and has(n,'deadlift') and not has(n,'romanian','stiff'): p=['erector_spinae','glute_max','lateral_hamstrings','medial_hamstrings'];why='Kreuzheben → Rücken + Gesäß + Beinbeuger'
    s=list(SEC[m]);sw=''
    TRI=['triceps_long','triceps_lateral','triceps_medial']
    def S(l,w): 
        global s,sw
        s=l;sw=w
    if m=='chest':
        if has(n,'fly','flye','crossover','pec deck','cable cross'): S(['anterior_delt'],'Fly')
        elif has(n,'pullover'): S(['upper_lats','triceps_long','serratus_anterior'],'Pullover')
        else: S(['anterior_delt']+TRI+(['serratus_anterior'] if has(n,'push-up','pushup','push up') else []),'Drücken: vordere Schulter + Trizeps')
    elif m=='shoulders':
        if has(n,'lateral','side raise'): S(['upper_traps','anterior_delt'],'Seitheben')
        elif has(n,'front raise'): S(['lateral_delt','upper_traps','pec_major_upper'],'Frontheben')
        elif p==['posterior_delt']: S(['rhomboids','mid_traps','rotator_cuff','triceps_long'],'Hintere Schulter')
        elif p==['rotator_cuff']: S(['posterior_delt'],'Rotation')
        elif has(n,'upright','shrug'): S(['upper_traps','biceps','forearm_flexors'],'Aufrechtes Rudern')
        else: S(TRI+['upper_traps','serratus_anterior'],'Schulterdrücken: Trizeps + Trapez')
    elif m=='triceps':
        if has(n,'close-grip','close grip','dip','bench dip','push-up','pushup','diamond'): S(['pec_major_lower','anterior_delt'],'Enge Pressen/Dips')
        elif has(n,'pushdown','press-down','pressdown','kickback','extension','skull','french'): S(['anconeus' if False else 'forearm_extensors'],'Strecken')
        else: S(['anterior_delt','pec_major_lower'],'Trizeps allgemein')
    elif m=='biceps':
        if has(n,'chin'): S(['upper_lats','lower_lats','rhomboids','forearm_flexors'],'Chin-Up')
        else: S(['brachioradialis','forearm_flexors'] if 'brachioradialis' not in p else ['forearm_flexors'],'Curl')
    elif m=='lats':
        if has(n,'pullover','straight-arm'): S(['triceps_long','pec_major_lower','serratus_anterior'],'Pullover')
        elif has(n,'row'): S(['biceps','brachialis','posterior_delt','rhomboids','mid_traps','forearm_flexors'],'Rudern')
        else: S(['biceps','brachialis','teres_major','rhomboids','posterior_delt','forearm_flexors'],'Ziehen von oben')
    elif m=='middle back':
        if has(n,'face pull','pull apart','pull-apart','reverse'): S(['posterior_delt','rotator_cuff','upper_traps'],'Face Pull / Reverse')
        elif has(n,'shrug'): S(['upper_traps','forearm_flexors'],'Shrug')
        else: S(['upper_lats','lower_lats','biceps','brachialis','posterior_delt','forearm_flexors']+(['erector_spinae'] if has(n,'bent','barbell','t-bar') else []),'Rudern')
    elif m=='traps':
        S(['rhomboids','forearm_flexors','lateral_delt'] if has(n,'upright') else ['rhomboids','mid_traps','forearm_flexors'],'Trapez / Shrug')
    elif m=='quadriceps':
        if has(n,'extension','sissy'): S([],'Streckung isoliert')
        elif has(n,'lunge','split squat','step-up','step up'): S(['glute_max','glute_med','adductors','medial_hamstrings','lateral_hamstrings'],'Ausfallschritt')
        elif has(n,'leg press','hack','machine'): S(['glute_max','adductors','gastrocnemius'],'Beinpresse')
        elif has(n,'squat','thruster'): S(['glute_max','adductors','erector_spinae','lateral_hamstrings','medial_hamstrings','rectus_abdominis'],'Kniebeuge')
        else: S(['glute_max','adductors'],'Beine allgemein')
    elif m=='hamstrings':
        if has(n,'curl'): S(['gastrocnemius','glute_max'],'Beinbeuger-Curl')
        else: S(['glute_max','adductors','erector_spinae','forearm_flexors','upper_traps'],'Kreuzheben/Hüftbeugung')
    elif m=='glutes':
        if has(n,'hip thrust','bridge'): S(['lateral_hamstrings','medial_hamstrings','adductors','erector_spinae'],'Hip Thrust')
        elif has(n,'kickback','kick back','abduction'): S(['glute_med','lateral_hamstrings','medial_hamstrings'],'Kickback')
        else: S(['lateral_hamstrings','medial_hamstrings','vastus_group','adductors'],'Gesäß allgemein')
    elif m=='lower back':
        S(['glute_max','lateral_hamstrings','medial_hamstrings','forearm_flexors'] if has(n,'deadlift','good morning') else ['glute_max','lateral_hamstrings','medial_hamstrings'],'Unterer Rücken')
    elif m=='abdominals':
        if p==['obliques']: S(['rectus_abdominis','transverse_abdominis','serratus_anterior'],'Seitlicher Bauch')
        elif has(n,'plank','hollow','dead bug','vacuum','roll','wheel'): S(['glute_max','anterior_delt','serratus_anterior','hip_flexors'],'Core-Stütz')
        elif has(n,'sit-up','sit up','situp','crunch') and not has(n,'reverse'): S(['hip_flexors','obliques'],'Crunch / Sit-Up')
        else: S(['transverse_abdominis','obliques'],'Bauch allgemein')
    elif m=='forearms': S([],'Unterarme')
    elif m=='calves': S([],'Waden')
    elif m in ('abductors','adductors'): S(['glute_max'] if m=='abductors' else ['glute_med'],'Hüfte')
    elif m=='neck': S(['upper_traps'],'Nacken')
    s=[x for x in s if x not in p]
    out[e['name']]={'de':names.get(e['name'],''),'muscle':m,'primary':p,'secondary':s,'why':why,'sec_why':sw}
json.dump(out,open('muscle-map.json','w'),ensure_ascii=False,indent=1)
# Prüf-Liste nach Gruppe
by={}
for k,v in out.items(): by.setdefault(v['muscle'],[]).append((k,v))
L=['# Muskel-Zuordnung Übungen → 3D-Modell (zum Prüfen)\n','Haupt = leuchtet stark, Neben = nach Bewegungsmuster der Übung (Drücken, Rudern, Beugen …).\n']
for m,items in sorted(by.items(),key=lambda x:-len(x[1])):
    L.append(f'\n## {m} ({len(items)})\n')
    for k,v in sorted(items): L.append(f"- {v['de'] or k} ({k}): **{', '.join(v['primary'])}**" + (f" · Neben: {', '.join(v['secondary'])}" if v['secondary'] else '') + (f" — {v['why']}" if not v['why'].startswith('Regel') else ''))
open('muscle-map-pruefliste.md','w').write('\n'.join(L))
spec=sum(1 for v in out.values() if not v['why'].startswith('Regel'));print(len(out),'Übungen,',spec,'mit Spezialregel')
