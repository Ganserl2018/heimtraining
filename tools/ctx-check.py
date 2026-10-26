#!/usr/bin/env python3
# Misst, wie viel Verlauf seit der letzten Kontext-Kompression angefallen ist (Näherung für "Kontext wird voll").
# Aufruf: python3 tools/ctx-check.py [transkript.jsonl]
import glob, os, sys
p = sys.argv[1] if len(sys.argv) > 1 else max(glob.glob('/root/.claude/projects/*/*.jsonl'), key=os.path.getmtime)
size = 0; marker = 'This session is being continued'
for line in open(p, errors='ignore'):
    if marker in line[:4000] and '"type":"user"' in line[:400]: size = 0
    size += len(line)
print(f"{size/1e6:.2f} MB seit letzter Kompression ({os.path.basename(p)})")
