# Usage: python3 tools/makegif.py <slug> <m|w> <start.jpeg> <end.jpeg>
# Baut img/<slug>-<g>.gif (Start -> Ende -> Start, weich ueberblendet, 360x480)
import sys
from PIL import Image
slug,g,a,b=sys.argv[1:5]
A=Image.open(a).convert('RGB').resize((360,480),Image.LANCZOS)
B=Image.open(b).convert('RGB').resize((360,480),Image.LANCZOS)
fr=[];d=[]
def hold(im,ms): fr.append(im); d.append(ms)
def fade(x,y,n=6):
    for i in range(1,n+1): fr.append(Image.blend(x,y,i/(n+1))); d.append(60)
hold(A,500); fade(A,B); hold(B,500); fade(B,A)
fr=[f.quantize(96) for f in fr]
fr[0].save(f'img/{slug}-{g}.gif',save_all=True,append_images=fr[1:],duration=d,loop=0,optimize=True)
print('ok',slug,g)
