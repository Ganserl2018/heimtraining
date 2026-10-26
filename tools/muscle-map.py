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
    # --- Korrekturen nach Coach-Prüfung ---
    mode='kraft';HAM=['lateral_hamstrings','medial_hamstrings']
    if has(n,'stretch','90/90','seated biceps','seated front deltoid','(lying|seated) glute','lying prone quad','all fours quad'): mode='stretch';s=[];why='Dehnung: gedehnter Muskel'
    if mode=='stretch' and has(n,'front deltoid'): p=['anterior_delt']
    elif has(n,'circles','swings','rolls','cat-cow','cat cow','open book','inchworm','groiners','wipers'): mode='mobility';s=[];why='Mobilisation (kaum Kraft)'
    elif has(n,'sprint','skipping','butt kick','star jump','tuck jump','bench jump','scissors jump','split jump','rocket jump','long jump','lateral bound'):
        mode='cardio';p=['glute_max','vastus_group','rectus_femoris','gastrocnemius','soleus'];s=[];why='Cardio/Sprung: Beine'
        if has(n,'sprint','skipping','tuck jump'): p.append('hip_flexors')
        if has(n,'butt kick'): p=['lateral_hamstrings','medial_hamstrings','glute_max','gastrocnemius']
    elif has(n,'snatch','clean','jerk','push press'):
        p=['glute_max','vastus_group','erector_spinae','upper_traps']+(['anterior_delt'] if has(n,'jerk','push press','press') else []);s=HAM+['forearm_flexors']+TRI;why='Olympisch: Ganzkörper-Zug'
    else:
        if m=='shoulders':
            if has(n,'rear','low-pulley side lateral','low pulley row to neck'): p=['posterior_delt']+(['upper_traps','mid_traps'] if has(n,'row to neck') else []);s=['rhomboids','mid_traps','rotator_cuff','triceps_long'];why='Hintere Schulter'
            elif has(n,'upright'): p=['lateral_delt','upper_traps'];s=['biceps','forearm_flexors','rhomboids'];why='Aufrechtes Rudern'
            elif has(n,'front.*raise','^dumbbell raise','single dumbbell raise','alternating deltoid raise','straight raises') and not has(n,'lateral'): p=['anterior_delt'];s=['lateral_delt','upper_traps','pec_major_upper'];why='Frontheben'
            elif p==['anterior_delt','lateral_delt'] and has(n,'press'): s=s+['pec_major_upper']
        if m=='traps' and has(n,'upright'): p=['upper_traps','lateral_delt'];s=['rhomboids','forearm_flexors','biceps']
        if m=='chest':
            if has(n,'pullover'): s=['upper_lats','teres_major','triceps_long','serratus_anterior'];why='Pullover'
            if has(n,'incline push'): p=['pec_major_lower'];why='Incline Push-Up → untere Brust'
            elif has(n,'feet elevated','decline push'): p=['pec_major_upper'];why='Füße erhöht → obere Brust'
            if has(n,'scapular'): p=['serratus_anterior'];s=['pec_major_lower'];why='Scapular Push-Up'
        if m=='triceps':
            if has(n,'overhead','skull','incline','french'): p=['triceps_long','triceps_lateral','triceps_medial'];why='Trizeps (langer Kopf betont)'
            if has(n,'pushdown','kickback','extension'): s=[]
            if has(n,'powerlifting','board','floor press','pin press','jm press','close-grip','close grip'): s=['pec_major_upper','pec_major_lower','anterior_delt']
        if m=='biceps' and has(n,'reverse','zottman'): p=['brachioradialis','brachialis','forearm_extensors'];s=['biceps'];why='Reverse-Curl → Unterarm/Brachialis'
        if m=='biceps' and has(n,'chin'): p=['biceps','brachialis'];s=['upper_lats','lower_lats','rhomboids','forearm_flexors']
        if m=='forearms':
            if has(n,'palms-down','palms down','reverse','extension','behind the back'): p=['forearm_extensors'];why='Handgelenk-Strecker'
            elif has(n,'palms-up','palms up','wrist curl','finger','gripper','farmer'): p=['forearm_flexors'];why='Handgelenk-Beuger'
        if m=='abdominals':
            if has(n,'side bridge'): p=['obliques'];s=['transverse_abdominis'];why='Seitstütz'
            elif has(n,'vacuum'): p=['transverse_abdominis'];s=[];why='Stomach Vacuum'
            elif has(n,'pallof'): p=['obliques','transverse_abdominis'];s=['rectus_abdominis'];why='Anti-Rotation'
            elif has(n,'heel touch','air bike','cross-body','elbow to knee','toe touch','spider','landmine 180','cable lift','judo flip','spell caster'): p=['obliques','rectus_abdominis'];why='Rotation → schräge Bauchmuskeln'
            if has(n,'cocoon','leg tuck','scissor kick','jackknife','bottoms up','butt-up','butt up','flutter'): p=list(dict.fromkeys(p+['hip_flexors']))
            if has(n,'plank'): s=list(dict.fromkeys(s+['obliques']))
            if has(n,'roll'): s=list(dict.fromkeys(s+['upper_lats','serratus_anterior']))
        if m=='quadriceps':
            if has(n,'cable deadlift','side deadlift'): p=['glute_max']+HAM+['erector_spinae'];why='Hüftstrecken'
            elif has(n,'rear leg raise'): p=['glute_max']+HAM;why='Beinheben hinten'
            elif has(n,'hip flexion'): p=['hip_flexors'];why='Hüftbeugen'
            elif has(n,'hip adduction'): p=['adductors'];why='Adduktion'
            if 'rectus_abdominis' in s and not has(n,'overhead'): s=[x for x in s if x!='rectus_abdominis']
            if has(n,'jump'): s=list(dict.fromkeys(s+['gastrocnemius','soleus']))
        if m in ('lower back','hamstrings') and has(n,'deadlift','rack pull') and not has(n,'romanian','stiff','sumo'):
            p=['erector_spinae','glute_max']+HAM;s=['upper_traps','upper_lats','vastus_group','forearm_flexors'];why='Kreuzheben'
        if m=='hamstrings':
            if has(n,'sumo'): p=['vastus_group','adductors','glute_max']+HAM;why='Sumo-Kreuzheben'
            elif has(n,'good morning','romanian','stiff'): p=HAM+['glute_max','erector_spinae'];why='Hüftbeugen'
            elif has(n,'vertical swing'): p=['glute_max'];why='Swing'
            elif has(n,'front leg raise'): p=['hip_flexors'];why='Beinheben vorne'
            elif has(n,'glute ham'): s=list(dict.fromkeys(s+['gastrocnemius']))
        if m=='lats':
            if has(n,'incline pushdown'): p=['upper_lats','teres_major'];s=['triceps_long'];why='Gestreckte Arme ziehen'
            elif has(n,'chin'): p=['upper_lats','lower_lats','biceps','brachialis']
            elif not has(n,'row','pullover','straight-arm'): s=list(dict.fromkeys(s+['lower_traps']))
        if m=='middle back':
            if has(n,'reverse grip'): s=['upper_lats','lower_lats','biceps','brachialis','forearm_flexors'];why='Rudern Untergriff'
            if has(n,'face pull'): s=list(dict.fromkeys(s+['lower_traps']))
        if m=='calves' and has(n,'standing','donkey'): s=['soleus']
        if m=='adductors' and has(n,'side leg raise'): p=['glute_med'];why='Seitheben Bein → Abduktoren'
        if m=='glutes':
            if has(n,'step-up with knee','kneeling squat','kneeling jump'): p=list(dict.fromkeys(p+['vastus_group']))
            elif has(n,'pull through'): p=list(dict.fromkeys(p+HAM+['erector_spinae']))
            elif has(n,'flutter'): p=['rectus_abdominis','hip_flexors'];s=[];why='Flutter Kicks → Bauch'
    s=[x for x in s if x not in p]
    out[e['name']]={'de':names.get(e['name'],''),'muscle':m,'primary':p,'secondary':s,'why':why,'sec_why':sw,'mode':mode}
json.dump(out,open('muscle-map.json','w'),ensure_ascii=False,indent=1)
# Prüf-Liste nach Gruppe
by={}
for k,v in out.items(): by.setdefault(v['muscle'],[]).append((k,v))
L=['# Muskel-Zuordnung Übungen → 3D-Modell (zum Prüfen)\n','Haupt = leuchtet stark, Neben = nach Bewegungsmuster der Übung (Drücken, Rudern, Beugen …).\n']
for m,items in sorted(by.items(),key=lambda x:-len(x[1])):
    L.append(f'\n## {m} ({len(items)})\n')
    for k,v in sorted(items): L.append(f"- {v['de'] or k} ({k}): **{', '.join(v['primary'])}**" + (f" · Neben: {', '.join(v['secondary'])}" if v['secondary'] else '') + (f" — {v['why']}" if not v['why'].startswith('Regel') else '')+(f" [{v['mode']}]" if v['mode']!='kraft' else ''))
open('muscle-map-pruefliste.md','w').write('\n'.join(L))
spec=sum(1 for v in out.values() if not v['why'].startswith('Regel'));print(len(out),'Übungen,',spec,'mit Spezialregel')
