#!/usr/bin/env python3
# Chat-Archiv: Sitzungs-Transkript (jsonl) -> Markdown fuer den Obsidian-Vault.
# Aufruf: python3 tools/chat-archiv.py /root/.claude/projects/-home-claude/<session>.jsonl out.md
import json, re, sys
src, dst = sys.argv[1], sys.argv[2]
def txt(c):
    return c if isinstance(c, str) else '\n'.join(b.get('text', '') for b in c if isinstance(b, dict) and b.get('type') == 'text')
out = []
for line in open(src, errors='ignore'):
    try: o = json.loads(line)
    except Exception: continue
    t, m = o.get('type'), o.get('message') or {}
    ts = (o.get('timestamp') or '')[:16].replace('T', ' ')
    if t == 'user' and not o.get('isSynthetic'):
        s = re.sub(r'<system-reminder>.*?</system-reminder>', '', txt(m.get('content', '')), flags=re.S).strip()
        if s and 'artifact-content-authored-by-others' not in s and not s.startswith('This session is being continued'):
            out.append(f"**[{ts}] Alex:** {s[:1500]}")
    elif t == 'assistant':
        s = txt(m.get('content', [])).strip()
        if s: out.append(f"[{ts}] Claude: {s[:700]}")
        for b in (m.get('content') or []):
            if isinstance(b, dict) and b.get('type') == 'tool_use' and b.get('name') == 'Bash':
                for mm in re.finditer(r'git commit[^\n]*?-m "([^"]+)"', b.get('input', {}).get('command', '')):
                    out.append(f"  ⤷ commit: {mm.group(1)}")
open(dst, 'w').write('\n\n'.join(out))
