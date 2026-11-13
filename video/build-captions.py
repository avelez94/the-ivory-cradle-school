#!/usr/bin/env python3
"""Builds the WebVTT caption track for The First Overnight Shift from the approved narration.

Cues are timed inside each recorded voice clip (timeline.json, written by build-scenes.py),
spread by length across the clip. Numbers and units are written as figures.
"""
import json
import re
from pathlib import Path

# (scene start, scene end, narration). A "||" splits a scene's text across its voice clips: scene 1 is the
# parent's line (in the HeyGen clip) and the specialist's response; scene 3 pauses three seconds to think.
SCENES = [
    (0, 45, "We’re heading to bed. Is there anything you need from us before we go? || He’s heading to bed. Before you take over the shift, what would you confirm? Pause here, and name three things you’d ask. || Here’s one way to ask. || Before you go, can we review when the baby last fed and what you’d like me to do for the next feed? Can you show me where the baby sleeps and tell me when and how you’d like me to wake you? || That covers the three things to confirm before you take over: the feeding plan, the sleep setup, and when to wake a parent. Let’s build them into your arrival checklist."),
    (25, 80, "Start by asking when and how the baby last fed, how much they took if measured, and what the plan is for the next feed. Ask how the parents want to handle direct nursing, bottles, or both, and which instructions came from the baby's clinician. Ask when to wake a parent and how to reach them. Confirm the home's address and the pediatrician's after hours number. Locate the sleep space, clean feeding supplies, and diaper supplies before you need them. If the baby has a clinician directed plan, ask where it's written and clarify anything you can't confidently follow before accepting responsibility for that task."),
    (80, 125, "One parent thinks the baby last fed at 7:30. The other thinks it was closer to 8:00. What would you clarify before they head to bed? || Ask for their best estimate, then confirm what to do if the timing is uncertain. You could say, “If we aren't sure about the last feed, when should I wake you, and what's the plan if the baby cues sooner?” Record an estimate as an estimate. Read the plan back so everyone knows what you agreed to."),
    (125, 179, "The American Academy of Pediatrics recommends putting babies on their backs for every sleep. Use a separate, safety approved crib, bassinet, portable crib, or play yard with a firm, flat, level surface and a fitted sheet. Keep pillows, loose blankets, toys, and positioners out. If a baby falls asleep in a swing or car seat, move them to an appropriate sleep surface on their back as soon as possible. If you're getting drowsy while holding the baby, put them in the safe sleep space. If the setup isn't safe, raise it with the parents and agree on a safe alternative before using it."),
    (179, 245, "Wash your hands before preparing or handling feeding supplies. Use clean equipment and follow the family's feeding plan. Know what's in the bottle and when it was prepared, warmed, or first offered. CDC guidance says prepared infant formula should be used within 2 hours of preparation and within 1 hour of starting the feed. If you won't use freshly prepared formula right away, refrigerate it promptly and use it within 24 hours. Throw out formula left in the bottle after a feed. Expressed breast milk follows different rules. Once warmed or brought to room temperature, use it within 2 hours. CDC also allows leftover breast milk to be used within 2 hours after the feeding ends. Respect any earlier storage limit, and if the timing is unclear, check with the parent before using it. Follow the baby's clinician's directions for any special feeding instructions."),
    (245, 302, "If the baby stops breathing, is unresponsive, is struggling severely to breathe, or has blue or gray lips or face, call 911 immediately and follow the dispatcher's instructions. Notify the parents as soon as you can without delaying the call. Here's a different situation. A six week old has a rectal temperature of 100.4°F, or 38°C. Wake the parent immediately and contact the pediatrician or after hours service right away for urgent evaluation. Don't wait for the morning handoff or for the temperature to rise. Record the time, what you observed, whom you contacted, and what happened next. If a life threatening sign develops, call 911."),
    (302, 368, "A useful note gives the next caregiver something they can act on. Log the time, the feeding method and measured amount if known, diaper changes, sleep, and any unusual observations. Use the family's agreed private log. For example: “11:05 p.m., formula, 2 oz offered, 1.5 oz taken. Wet diaper. Back in bassinet at 11:30.” Those are observations for this scenario. The amounts are not feeding targets. In the morning, start with anything that needs attention. Then summarize the last feed and diaper, how the baby slept, and any agreed next steps. If there was a concern overnight, include who you contacted and when. Confirm that the parent has taken over before you leave."),
    (368, 406, "Before you leave this lesson, open the First Overnight Shift worksheet. Write one question you'd ask when the last feed time is unclear, then practice recording the sample feed and diaper. The worksheet also gives you a quick reference for safe sleep, feeding, and urgent concerns. When the lesson is complete, take the five question quiz. Four correct answers earn your Certificate of Completion."),
]
MAX = 84


def chunks(text):
    """Split narration into caption sized pieces at sentence, then clause, boundaries."""
    out = []
    for sentence in re.split(r'(?<=[.?!”])\s+(?=[A-Z“])', text.strip()):
        while len(sentence) > MAX:
            cut = max(sentence.rfind(', ', 0, MAX), sentence.rfind(' and ', 0, MAX), sentence.rfind(' or ', 0, MAX))
            if cut < 30:
                cut = sentence.rfind(' ', 0, MAX)
            piece, sentence = sentence[: cut + (1 if sentence[cut] == ',' else 0)].strip(), sentence[cut + 1:].strip()
            out.append(piece)
        out.append(sentence)
    return [c for c in out if c]


def ts(sec):
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f'{int(h):02d}:{int(m):02d}:{s:06.3f}'


def place(pieces, start, end):
    total = sum(len(p) for p in pieces)
    t, cues = start, []
    for p in pieces:
        d = (end - start) * len(p) / total
        cues.append((t, t + d - 0.05, p))
        t += d
    return cues


timeline = json.loads((Path(__file__).parent / 'first-overnight-shift' / 'timeline.json').read_text())
clips = timeline['voice']
keys = [['p1', 's1a', 's1b', 's1r', 's1c'], 's2', ['s3a', 's3b'], 's4', 's5', 's6', 's7', 's8']
cues = []
for (_, _, text), key in zip(SCENES, keys):
    parts = text.split('||')
    for part, k in zip(parts, key if isinstance(key, list) else [key]):
        start, length = clips[k]
        cues += place(chunks(part), start, start + length)

lines = ['WEBVTT', '', 'NOTE The First Overnight Shift. Captions from the approved narration script.', '']
for i, (a, b, text) in enumerate(cues, 1):
    lines += [str(i), f'{ts(a)} --> {ts(b)} line:85%', text, '']
out = Path(__file__).parent / 'first-overnight-shift' / 'captions.en.vtt'
out.write_text('\n'.join(lines))
print(len(cues), 'cues; longest', max(len(c[2]) for c in cues), 'characters')
