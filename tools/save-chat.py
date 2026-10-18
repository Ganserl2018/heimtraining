# Chatverlauf (User + Claude-Text, ohne Tool-Ausgaben) -> Markdown fürs Vault. Aufruf: python3 tools/save-chat.py <out.md>
import json,sys,glob,re
fs=sorted(glob.glob('/root/.claude/projects/*/16add7bd-*.jsonl'),key=lambda x:__import__('os').path.getmtime(x))
out=['---\ntype: chat-archiv\ntitle: "Chat-Archiv Heimtraining"\ntags: [heimtraining, chat-archiv]\n---\n# Chat-Archiv Heimtraining (Session 16add7bd)\n']
def txt(c):
    if isinstance(c,str): return c
    return '\n'.join(b.get('text','') for b in c if isinstance(b,dict) and b.get('type')=='text')
for l in (l for f in fs for l in open(f)):
    try: d=json.loads(l)
    except: continue
    r=d.get('message',{}).get('role'); t=d.get('timestamp','')[:16].replace('T',' ')
    if r not in('user','assistant'): continue
    s=txt(d['message'].get('content',''))
    s=re.sub(r'<system-reminder>.*?</system-reminder>','',s,flags=re.S).strip()
    if not s or s.startswith('This session is being continued'): continue
    out.append(f"\n**{'Alex' if r=='user' else 'Claude'}** {t}\n\n{s}\n")
open(sys.argv[1],'w').write('\n'.join(out)); print(len(out),'Einträge')
