# Nutzung:
#   python3 tools/makegif.py start.jpg end.jpg out.gif [--frames 26] [--ms 70] [--hold 600] [--colors 128] [--nodither] [--blend]
#   python3 tools/makegif.py <slug> <m|w> start.jpg end.jpg      (alt: schreibt img/<slug>-<g>.gif)
# Start(A) -> Ende(B) -> Start(A), nahtloser Loop, 360x480 (3:4).
# Zwischenbilder: DIS-Optical-Flow (OpenCV), beidseitig gewarpt + Ease-in-out-Blend.
# Fallback auf reines Ueberblenden, wenn der Flow die Bilder nicht besser angleicht (Ghosting-Schutz).
import sys, argparse
import numpy as np
from PIL import Image
import cv2

W, H = 360, 480

def load(p):
    im = Image.open(p).convert('RGB')
    w, h = im.size
    s = max(W / w, H / h)                      # cover + Mittelcrop auf 3:4
    im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    l, t = (im.width - W) // 2, (im.height - H) // 2
    return np.asarray(im.crop((l, t, l + W, t + H)))

def flow(a, b):
    ga, gb = (cv2.cvtColor(x, cv2.COLOR_RGB2GRAY) for x in (a, b))
    d = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    d.setPatchSize(16); d.setPatchStride(3); d.setGradientDescentIterations(48); d.setVariationalRefinementIterations(5)
    d.setFinestScale(0)                         # volle Aufloesung: beste Treffer bei grosser Bewegung
    f = d.calc(ga, gb, None)
    return cv2.GaussianBlur(f, (0, 0), 1.5)

def warp(img, f, t):
    """Backward-Warp: sample img an x + t*f(x)."""
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    return cv2.remap(img, gx + t * f[..., 0], gy + t * f[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

def ease(t): return t * t * (3 - 2 * t)         # smoothstep

def build_ab(A, B, n, force_blend=False, force_flow=False, sharp=1.0):
    """Liefert n Zwischenbilder A->B (exklusive A und B) + Info-Text."""
    fab, fba = flow(A, B), flow(B, A)           # fab: Pixel in A -> Ort in B
    # Konsistenz (Vorwaerts-Rueckwaerts) -> Vertrauen pro Pixel
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    back = cv2.remap(fba, gx + fab[..., 0], gy + fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    err = np.linalg.norm(fab + back, axis=2)
    conf = cv2.GaussianBlur(0.5 + 0.5 * np.exp(-(err / 12.0) ** 2), (0, 0), 4)[..., None].astype(np.float32)
    fab, fba = fab * conf, fba * conf
    # Gesamtguete: gewarptes A vs B gegenueber ungewarptem
    d0 = np.abs(A.astype(np.float32) - B).mean(2)
    mov = cv2.GaussianBlur(d0, (0, 0), 3) > 12   # bewegter Bereich
    if mov.sum() < 50: mov = d0 >= 0
    e1 = np.abs(warp(A, fba, 1.0).astype(np.float32) - B).mean(2)
    e2 = np.abs(warp(B, fab, 1.0).astype(np.float32) - A).mean(2)
    ratio = ((e1[mov].mean() + e2[mov].mean()) / 2) / max(d0[mov].mean(), 1e-6)
    use_flow = (ratio < 0.8 or force_flow) and not force_blend
    info = f'Flow-Restfehler/Blend-Fehler (nur Bewegungsbereich)={ratio:.2f} -> {"FLOW" if use_flow else "BLEND (Fallback)"}'
    static = (1 - np.clip((cv2.GaussianBlur(d0, (0, 0), 2) - 4) / 6, 0, 1))[..., None].astype(np.float32)
    out = []
    Af, Bf = A.astype(np.float32), B.astype(np.float32)
    for i in range(1, n + 1):
        t = ease(i / (n + 1))
        if use_flow:
            a = warp(A, fba, t).astype(np.float32)          # A in Richtung B bewegt
            b = warp(B, fab, 1 - t).astype(np.float32)      # B in Richtung A bewegt
        else:
            a, b = Af, Bf
        w = float(np.clip((t - 0.5) * sharp + 0.5, 0, 1))   # sharp>1: kuerzere Doppelbild-Phase
        fr = (1 - w) * a + w * b
        fr = static * Af + (1 - static) * fr      # unbewegter Hintergrund bleibt pixelgleich (kein Rauschen, kleiner)
        out.append(np.clip(fr, 0, 255).astype(np.uint8))
    return out, info

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('args', nargs='+')
    ap.add_argument('--frames', type=int, default=24)
    ap.add_argument('--ms', type=int, default=70)
    ap.add_argument('--hold', type=int, default=600)
    ap.add_argument('--colors', type=int, default=128)
    ap.add_argument('--nodither', action='store_true')
    ap.add_argument('--lossy', type=int, default=60, help='gifsicle --lossy (0=aus), nur wenn gifsicle installiert')
    ap.add_argument('--sharp', type=float, default=3.0, help='Blend-Schaerfe (1=weich, 2-3=kurzes Ueberblenden)')
    ap.add_argument('--flow', action='store_true', help='Flow erzwingen (kein Fallback)')
    ap.add_argument('--blend', action='store_true', help='Flow ausschalten (nur Ueberblenden)')
    o = ap.parse_args()
    if len(o.args) == 4:
        slug, g, a, b = o.args; out = f'img/{slug}-{g}.gif'
    elif len(o.args) == 3:
        a, b, out = o.args
    else:
        ap.error('start.jpg end.jpg out.gif')
    A, B = load(a), load(b)
    mid, info = build_ab(A, B, o.frames, o.blend, o.flow, o.sharp)
    seq = [A] + mid + [B] + mid[::-1]           # danach Loop -> A (nahtlos)
    dur = [o.hold] + [o.ms] * len(mid) + [o.hold] + [o.ms] * len(mid)
    # eine gemeinsame Palette (kein Flackern): aus A, B und Zwischenbildern
    pick = [A, B] + mid[::max(1, len(mid) // 6)]
    mosaic = Image.fromarray(np.concatenate(pick, axis=1))
    pal = mosaic.quantize(o.colors, method=Image.MEDIANCUT, dither=Image.NONE)
    dth = Image.NONE if o.nodither else Image.FLOYDSTEINBERG
    fr = [Image.fromarray(x).quantize(palette=pal, dither=dth) for x in seq]
    fr[0].save(out, save_all=True, append_images=fr[1:], duration=dur, loop=0, optimize=False, disposal=1)
    import os, shutil, subprocess
    if shutil.which('gifsicle'):               # optional: Frame-Deltas + lossy LZW -> ca. 2x kleiner
        cmd = ['gifsicle', '-O3'] + ([f'--lossy={o.lossy}'] if o.lossy else []) + [out, '-o', out]
        subprocess.run(cmd, check=False, stderr=subprocess.DEVNULL)
    print(f'ok {out} {len(fr)} Frames {os.path.getsize(out)/1e6:.2f} MB | {info}')

if __name__ == '__main__':
    main()
