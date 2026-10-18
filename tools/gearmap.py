# Geräte-Zuordnung aller Pool-Übungen für Alex' Heim-Gym. Ausgabe: gearmap.json
# s: ok = machbar, no = nicht machbar (Grund r), ask = Alex entscheidet (Gruppe r)
import json,re
P=json.load(open('/home/claude/heimtraining/pool.json'))
def cls(name):
    n=name.lower(); g=[]
    def R(s,r): return {'g':g,'s':s,'r':r}
    # --- nicht machbar (Gerät fehlt) ---
    if re.search(r'chain',n): return R('no','Ketten')
    if re.search(r'bosu|exercise ball|stability|medicine|sandbag|\bsled|tire|\blog\b|axle|atlas|machine|lever',n): return R('no','Zubehör/Maschine fehlt')
    if re.search(r'smith',n): return R('no','Smith-Maschine')
    if re.search(r'landmine|jammer',n): return R('no','Landmine')
    if re.search(r'\bez[- ]?bar|\bez-',n): return R('no','SZ-Stange fehlt')
    if re.search(r'preacher|spider curl|\bspider\b',n) and 'spider crawl' not in n: return R('no','Scottbank fehlt')
    if re.search(r'blocks|pin presses|board press|good morning off pins|plate movers|anti-gravity|rack delivery|power partials|heaving|jerk balance|snatch balance|reverse band|speed band|weighted sissy|jefferson|zercher|olympic squat|bradford|rocky|frankenstein',n): return R('no','Spezialaufbau')
    if re.search(r'kettlebell|vertical swing',n): return R('no','Kettlebell fehlt')
    # Olympische Übungen
    if re.search(r'\bclean\b|clean |snatch|\bjerk|hang clean|power clean|split clean|clean pull|clean shrug|muscle snatch|push press|squat jerk|clean and',n) and 'pull-up' not in n: return R('ask','Olympische Übungen (Plattform/Technik)')
    # Seilzug: nur oberer Zug vorhanden
    if re.search(r'cable|pulley|rope|pull through|pushdown|pulldown|face pull|pallof|wood chop',n):
        g.append('cable')
        lowp=re.search(r'low|seated|lying|incline|kickback|deadlift|hip adduction|preacher|chest press|flye|shrug|upright|front cable|wrist|judo|iron cross|squat|lift|lateral|row(?!.*high)|elevated|one-legged|pull through|internal|external rotation|russian|reverse curl|standing biceps cable curl|one-arm cable curl|hammer|alternating cable shoulder|shoulder press|incline|kneeling cable triceps|standing low',n)
        if re.search(r'high|overhead|pushdown|pulldown|face pull|crossover(?!.*low)|crunch|wood chop|rear delt fly|rope straight|straight-arm|triceps extension with rope|one arm tricep extension|kneeling high',n) and not re.search(r'low cable|low-pulley|seated|lying|incline|bench',n): lowp=None
        if re.search(r'pallof',n): return R('ask','Pallof (Seilzug auf Brusthöhe)')
        if lowp: return R('no','Seilzug nur von oben vorhanden')
        return R('ok','Seilzug oben')
    # Gerüst
    if re.search(r'pull-?up|pullup|chin-?up|hanging|muscle.up',n): g.append('rig'); return R('ok','Klimmzugstange')
    if re.search(r'dips - |^dips|body-up|body tricep press|handstand',n):
        g.append('rig'); return R('ask','Dips/Handstand am Gerüst')
    if 'bench dip' in n: g.append('bench'); return R('ok','Bank')
    # Extension-Stuhl
    if re.search(r'hyperext|glute ham raise',n):
        if 'no hyperextension bench' in n: return R('ok','Boden')
        g.append('ext'); return R('ask','Extension-Stuhl / GHR')
    # Bänder
    if re.search(r'band|pull apart',n) and not re.search(r'barbell|with bands$',n): g.append('band'); return R('ok','Bänder')
    if re.search(r'with bands|- with bands',n): g+=['band']; 
    # Geräte
    if re.search(r'barbell|bar row|long bar|t-bar|\bbar\b|jm press|tate|squat to a bench|box squat|hack squat|floor press|rack pull|good morning|deadlift|squat|lunge|step ups|military|bench press|press behind|pullover|shrug|curl',n) and not re.search(r'dumbbell|bodyweight|freehand|jump|kneeling|air|isometric|wrist circles|knee circles',n):
        if re.search(r'barbell|bar|rack pull|deadlift|good morning|squat|lunge|step ups|military|jm press|tate|floor press|bench press|shrug|curl|pullover',n):
            g.append('barbell')
    if re.search(r'dumbbell|\bdb\b|dumbbells|plie|stiff-legged dumbbell|arnold|zottman|hammer|concentration|cross body hammer|drag curl|scaption|cuban|kickback|raise|spell caster|dumbbell',n) and 'barbell' not in g and not re.search(r'cable|band|low pulley',n):
        g.append('dumbbell')
    if re.search(r'bench|incline|decline|lying|flat bench|seated(?!.*cable)|skull|flyes|one-arm dumbbell row|pullover|step.?up|bench jump|box|preacher|wrist curl over',n) and not re.search(r'hyperext|bench dip',n):
        g.append('bench')
    if re.search(r'decline',n) and 'bench' not in g: g.append('bench')
    if re.search(r'rack pull|squat|overhead squat|front squat',n) and 'barbell' in g: pass
    if not g: g=['body']
    return R('ok','')
out={}
for e in P:
    c=cls(e['name']); out[e['name']]={'g':sorted(set(c['g'])),'s':c['s'],'r':c['r']}
json.dump(out,open('/home/claude/heimtraining/gearmap.json','w'),ensure_ascii=False,indent=0)
import collections
print(collections.Counter(v['s'] for v in out.values()))
print(collections.Counter(v['r'] for v in out.values() if v['s']!='ok'))
