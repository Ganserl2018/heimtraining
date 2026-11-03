#!/usr/bin/env python3
# Baut /mnt/user-data/outputs/Home-Force-Code-aktuell.zip (Code ohne img/gifs/qa-shots/reports) fuer den Projektordner auf dem Mac.
import zipfile, subprocess, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
h = subprocess.check_output(['git', 'log', '-1', '--format=%h %ad %s', '--date=format:%d.%m.%Y %H:%M']).decode().strip()
fs = [f for f in subprocess.check_output(['git', 'ls-files']).decode().split('\n') if f and not f.startswith(('img/', 'gifs/', 'exercise-gif-experiments/', 'qa-shots', 'reports/'))]
os.makedirs('/mnt/user-data/outputs', exist_ok=True)
out = '/mnt/user-data/outputs/Home-Force-Code-aktuell.zip'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for f in fs:
        if os.path.isfile(f): z.write(f)
    z.writestr('STAND-CODE.txt', 'Home Force Code-Stand: ' + h + '\nBilder (img/, gifs/) nicht enthalten: Repo Ganserl2018/heimtraining\n')
print(h, os.path.getsize(out) // 1024, 'KB', len(fs), 'Dateien')
