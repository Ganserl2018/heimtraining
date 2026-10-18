# python3 tools/makegif_multi.py out.gif k1.png k2.png k3.png [...]   (Keyframes Start..Ende, Ping-Pong-Loop)
import sys, os, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from makegif import load, build_ab
out, files = sys.argv[1], sys.argv[2:]
K = [load(f) for f in files]
N = int(os.environ.get("N","5"))
fw, infos = [K[0]], []
for a, b in zip(K, K[1:]):
    m, i = build_ab(a, b, N, False, False, float(os.environ.get("SHARP","5"))); infos.append(i); fw += m + [b]
seq = fw + fw[-2:0:-1]
dur = [600 if (j in (0, len(fw)-1)) else 60 for j in range(len(fw))] + [60]*(len(fw)-2)
pal = Image.fromarray(np.concatenate(K, axis=1)).quantize(160, method=Image.MEDIANCUT, dither=Image.NONE)
fr = [Image.fromarray(x).quantize(palette=pal, dither=Image.NONE) for x in seq]
fr[0].save(out, save_all=True, append_images=fr[1:], duration=dur, loop=0, optimize=False, disposal=1)
import shutil, subprocess
if shutil.which('gifsicle'): subprocess.run(['gifsicle','-O3','--lossy=40',out,'-o',out],stderr=subprocess.DEVNULL)
print('ok', out, len(fr), 'Frames', round(os.path.getsize(out)/1e6,2), 'MB', infos)
