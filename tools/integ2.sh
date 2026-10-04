#!/bin/bash
# usage: integ.sh <slug> <nbase>  (files /mnt/user-data/uploads/Downloads/<nbase>-{m,m-end,w,w-end}.jpeg)
set -e
cd /home/claude/heimtraining
S=$1; N=$2; U=/mnt/user-data/uploads/Downloads
G="${3:-m w}"
for g in $G; do
  python3 tools/makegif.py $U/$N-$g.jpeg $U/$N-$g-end.jpeg img/$S-$g.gif --blend --sharp 2 | tail -1
  python3 -c "
from PIL import Image
im=Image.open('$U/$N-$g.jpeg').convert('RGB');w,h=im.size;s=max(540/w,720/h)
im=im.resize((round(w*s),round(h*s)),Image.LANCZOS);l,t=(im.width-540)//2,(im.height-720)//2
im.crop((l,t,l+540,t+720)).save('img/$S-$g.jpg',quality=82)"
done
python3 - <<P
import json
d=json.load(open('img/index.json'))
for e in [x for g in "$3".split() or ["m","w"] for x in ("$S-"+g,"$S-"+g+".gif")]:
    if e not in d: d.append(e)
json.dump(d,open('img/index.json','w'),ensure_ascii=False)
P
echo $S >> tools/regie/queue_done.txt
V=$(grep -o "index.json?v=[0-9]*" script.js | head -1 | cut -d= -f2); sed -i "s/index.json?v=$V/index.json?v=$((V+1))/" script.js
