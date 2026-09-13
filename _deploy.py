# -*- coding: utf-8 -*-
"""Deploy website to 90days repo"""
import shutil, os, subprocess

SRC = r"F:\ZCode-Work\secops-academy"
DST = r"F:\ZCode-Work\90days-secops-projects"
SUB = os.path.join(DST, "secops-academy")

os.chdir(DST)

# Step 1: Clean old scattered files
print("[1/4] Cleaning...")
for f in ['index.html','learn.html','games.html','quiz.html','cases.html',
          'glossary.html','ctf.html','soc.html','detective.html','lab.html',
          'hwv.html','triage.html','interview.html','manuals.html',
          'serve.js','package.json','LICENSE']:
    p = os.path.join(DST, f)
    if os.path.exists(p):
        os.remove(p)

old_assets = os.path.join(DST, 'assets')
if os.path.exists(old_assets):
    shutil.rmtree(old_assets)

# Step 2: Copy website into secops-academy/ subdir
print("[2/4] Copying website files...")
os.makedirs(SUB, exist_ok=True)
copied = 0

RESERVED = {'.git', '.mimosa', 'node_modules', 'serve.js', 'package.json', 'NUL', 'CON', 'PRN', 'AUX'}

for f in os.listdir(SRC):
    if f.upper() in RESERVED or f.startswith('.'):
        continue
    src = os.path.join(SRC, f)
    dst = os.path.join(SUB, f)
    if os.path.isdir(src) and not os.path.islink(src):
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    elif os.path.isfile(src):
        shutil.copy2(src, dst)
    copied += 1

# Copy serve.js/package.json/LICENSE into subdirectory too
for f in ['serve.js', 'package.json', 'LICENSE']:
    src = os.path.join(SRC, f)
    if os.path.exists(src):
        shutil.copy2(src, os.path.join(SUB, f))
        copied += 1

print(f"       {copied} files copied")

# Step 3: Git commit
print("[3/4] Git commit...")
subprocess.run(['git', 'add', '-A'], cwd=DST, check=True)
subprocess.run(['git', 'commit', '-m',
    'Add SecOps Academy website (125 lessons, 9 games, 61 attack scripts, 300 quiz, 264 glossary, 12 cases, 6 manuals)'],
    cwd=DST, capture_output=True, text=True)
print("       committed")

# Step 4: Push via Clash proxy
print("[4/4] Pushing to GitHub...")
result = subprocess.run(
    ['git', '-c', 'http.proxy=http://127.0.0.1:17890', 'push', 'origin', 'main'],
    cwd=DST, capture_output=True, text=True, timeout=120
)
if result.returncode == 0:
    print("       pushed OK!")
else:
    # try direct
    result2 = subprocess.run(['git', 'push', 'origin', 'main'],
        cwd=DST, capture_output=True, text=True, timeout=120)
    if result2.returncode == 0:
        print("       pushed OK (direct)!")
    else:
        print(f"       push failed: {result2.stderr[:200]}")
        print("       >>> Please run manually: cd F:\\ZCode-Work\\90days-secops-projects && git push origin main")

print("\nDone! Check: https://github.com/fuhua-jie/90days-secops-projects")
