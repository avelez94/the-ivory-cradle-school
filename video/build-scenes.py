#!/usr/bin/env python3
"""Writes the HyperFrames scene files for The First Overnight Shift from the approved scene script.

The generated HTML in first-overnight-shift/ is the editable source (open it in the HyperFrames
Studio or desktop app). Rerun this only to rebuild every scene from scratch.
Timings follow the edit targets in the production brief (6:46 total).
"""
import json
from pathlib import Path

OUT = Path(__file__).parent / 'first-overnight-shift'
(OUT / 'compositions').mkdir(parents=True, exist_ok=True)

# Script edit targets (seconds). The film is retimed to the recorded narration in narration.json.
TARGET = {'s1-open': 25, 's2-ask': 55, 's3-unclear': 45, 's4-sleep': 54, 's5-feeding': 66, 's6-escalate': 57, 's7-log': 66, 's8-wrap': 38}
LEAD, TAIL, THINK = 0.8, 1.6, 3.0  # silence before each scene's voice, after it, and the scene 3 thinking beat
INTRO, OUTRO = 3.5, 5.0  # music on its own before the first line and after the last one
_n = json.loads((OUT / 'narration.json').read_text())['lengths']

# Opening (scene 1): title card while the opening music plays, the parent at the nursery door (HeyGen),
# an 8 second freeze frame exercise, then the specialist's model response (HeyGen voice Deirdre).
import wave
with wave.open(str(OUT / 'assets' / 'voice' / 's1-response.wav')) as _w:
    OPEN_VO_LEN = round(_w.getnframes() / _w.getframerate(), 3)
OPEN_CLIP_AT, OPEN_CLIP_LEN = 3.5, 5.1      # the clip ends on his last natural expression
OPEN_PARENT_SPEECH = (0.61, 3.48)            # the line inside the clip
OPEN_FREEZE_AT, OPEN_FREEZE_LEN = OPEN_CLIP_AT + OPEN_CLIP_LEN, 8.0
OPEN_REVEAL_AT = OPEN_FREEZE_AT + OPEN_FREEZE_LEN
OPEN_VO_AT = OPEN_REVEAL_AT + 0.4
OPEN_VO_SPEECH = (0.34, 10.5)                # speech inside s1-response.wav
OPEN_TAKEAWAYS = (1.5, 6.8, 8.0)             # feeding plan, sleep setup, when to wake a parent (seconds into the response)
DUR = {
    's1-open': OPEN_VO_AT + OPEN_VO_LEN + TAIL,
    's2-ask': LEAD + _n['s2'] + TAIL,
    's3-unclear': LEAD + _n['s3a'] + THINK + _n['s3b'] + TAIL,
    's4-sleep': LEAD + _n['s4'] + TAIL,
    's5-feeding': LEAD + _n['s5'] + TAIL,
    's6-escalate': LEAD + _n['s6'] + TAIL,
    's7-log': LEAD + _n['s7'] + TAIL,
    's8-wrap': LEAD + _n['s8'] + OUTRO,
}
DUR = {k: round(v, 2) for k, v in DUR.items()}
SCENES, _t = [], 0.0
for sid in TARGET:
    SCENES.append((sid, round(_t, 2), DUR[sid]))
    _t += DUR[sid]
TOTAL = round(_t, 2)
PAUSE = round(LEAD + _n['s3a'], 2)  # scene 3: the thinking beat starts here

BASE_CSS = """
@font-face { font-family: 'Bricolage Grotesque'; font-weight: 700; src: url('assets/fonts/BricolageGrotesque-700.ttf'); }
@font-face { font-family: 'Bricolage Grotesque'; font-weight: 800; src: url('assets/fonts/BricolageGrotesque-800.ttf'); }
@font-face { font-family: 'DM Sans'; font-weight: 400; src: url('assets/fonts/DMSans-400.ttf'); }
@font-face { font-family: 'DM Sans'; font-weight: 500; src: url('assets/fonts/DMSans-500.ttf'); }
@font-face { font-family: 'DM Sans'; font-weight: 700; src: url('assets/fonts/DMSans-700.ttf'); }
#root { position: absolute; inset: 0; background: #F8F1E6; color: #30241F; font-family: 'DM Sans', sans-serif; overflow: hidden; }
.wrap { position: absolute; inset: 0; }
.kicker { position: absolute; left: 96px; top: 84px; font: 700 28px/1 'DM Sans'; letter-spacing: 0.13em; text-transform: uppercase; color: #8E3C2E; }
.mark { position: absolute; right: 96px; top: 64px; width: 150px; }
.h { font-family: 'Bricolage Grotesque'; font-weight: 800; letter-spacing: -0.04em; line-height: 1.02; color: #30241F; margin: 0; }
.card { position: absolute; background: #FFFAF1; border: 2px solid #D6C4B4; }
.rule { border-top: 4px solid #8E3C2E; }
.row { font: 500 38px/1.25 'DM Sans'; padding: 22px 0; border-bottom: 2px solid #D6C4B4; display: flex; gap: 26px; align-items: baseline; }
.row b { font: 700 28px 'Bricolage Grotesque'; color: #8E3C2E; width: 52px; flex: none; }
.src { position: absolute; left: 96px; top: 792px; font: 500 28px 'DM Sans'; color: #69554A; letter-spacing: 0.02em; }
"""

import re as _re

def _scale(tweens, k):
    tweens = _re.sub(r'(\},\s*)(\d+(?:\.\d+)?)\);', lambda m: f"{m.group(1)}{round(float(m.group(2)) * k, 2)});", tweens)
    return _re.sub(r'stagger: (\d+(?:\.\d+)?)', lambda m: f"stagger: {round(float(m.group(1)) * k, 2)}", tweens)

def scene(sid, _target, markup, tweens, extra_css=''):
    dur = DUR[sid]
    if sid not in ('s1-open', 's3-unclear'):  # these two are timed in seconds, not stretched from targets
        tweens = _scale(tweens, dur / TARGET[sid])
    first_opacity = 1 if sid == 's1-open' else 0
    return f"""<template>
  <style>{BASE_CSS}{extra_css}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="1920" data-height="1080">
    <div class="wrap" id="{sid}-wrap" data-hold>
{markup}
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo('#{sid}-wrap', {{ opacity: {first_opacity} }}, {{ opacity: 1, duration: 0.6, ease: 'power2.out' }}, 0);
{tweens}
    tl.to('#{sid}-wrap', {{ opacity: 0, duration: 0.5, ease: 'power2.in' }}, {dur - 0.6});
    window.__timelines['{sid}'] = tl;
  </script>
</template>
"""

def fade(sel, at, dur=0.6, y=24):
    return f"    tl.fromTo('{sel}', {{ opacity: 0, y: {y} }}, {{ opacity: 1, y: 0, duration: {dur}, ease: 'expo.out' }}, {at});"

def blur_in(sel, at):
    return f"    tl.fromTo('{sel}', {{ opacity: 0, filter: 'blur(8px)' }}, {{ opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' }}, {at});"

def out(sel, at, dur=0.35):
    if isinstance(sel, list):
        sel = '[' + ', '.join(f"'{x}'" for x in sel) + ']'
        return f"    tl.to({sel}, {{ opacity: 0, duration: {dur}, ease: 'power2.in' }}, {at});"
    return f"    tl.to('{sel}', {{ opacity: 0, duration: {dur}, ease: 'power2.in' }}, {at});"

MARK = '      <img class="mark" src="assets/wordmark.png" alt="">'
files = {}

# 1 · Open the lesson: the parent at the nursery door (HeyGen clip), a freeze frame exercise, then a
# model response with the three things to confirm. Times are seconds into the scene.
files['s1-open'] = scene('s1-open', 25, f"""
      <div id="s1-title" style="position:absolute;left:96px;right:96px;top:300px;text-align:center">
        <img src="assets/wordmark.png" alt="" style="width:360px;display:block;margin:0 auto">
        <h1 class="h" style="font-size:132px;margin-top:40px">The First Overnight Shift</h1>
      </div>
      <video id="s1-clip" src="assets/opening/parent-doorway.mp4" data-start="{OPEN_CLIP_AT}" data-duration="{OPEN_CLIP_LEN}" data-media-start="0" data-has-audio="true" data-track-index="0" style="position:absolute;left:0;top:0;width:1920px;height:1080px"></video>
      <img id="s1-freeze" src="assets/opening/parent-freeze.png" alt="" data-start="{OPEN_FREEZE_AT}" data-duration="{OPEN_FREEZE_LEN}" data-track-index="0" style="position:absolute;left:0;top:0;width:1920px;height:1080px">
      <div id="s1-dim" style="position:absolute;inset:0;background:linear-gradient(90deg, rgba(30,22,19,0.9) 0%, rgba(30,22,19,0.84) 38%, rgba(30,22,19,0.38) 56%, rgba(30,22,19,0.28) 100%)"></div>
      <div id="s1-time" style="position:absolute;left:96px;top:72px;padding:12px 22px;background:rgba(30,22,19,0.72);font:700 30px 'DM Sans';letter-spacing:.1em;color:#FFFAF1">9:00 P.M.</div>
      <div id="s1-ask" data-hold style="position:absolute;left:96px;top:200px;width:800px">
        <div style="display:inline-block;font:700 30px 'DM Sans';letter-spacing:.12em;text-transform:uppercase;padding:12px 22px;background:#8E3C2E;color:#FFFAF1">Pause and practice</div>
        <div style="margin-top:30px;font:800 80px/1.06 'Bricolage Grotesque';letter-spacing:-0.035em;color:#FFFAF1">What would you confirm before taking over the shift?</div>
      </div>
      <div id="s1-cue" style="position:absolute;left:96px;top:690px;width:780px;font:500 46px/1.3 'DM Sans';color:#F3E7CF">Pause here and name three things you’d ask.</div>
      <div id="s1-reveal" style="position:absolute;inset:0;background:#F8F1E6">
{MARK}
        <div class="kicker">One way to ask</div>
        <div id="s1-quote" style="position:absolute;left:96px;top:190px;width:1060px;font:500 52px/1.36 'DM Sans';color:#30241F">
          “Before you go, can we review <span id="s1-ph1">when the baby last fed and what you’d like me to do for the next feed</span>? Can you show me <span id="s1-ph2">where the baby sleeps</span> and tell me <span id="s1-ph3">when and how you’d like me to wake you</span>?”
        </div>
        <div style="position:absolute;left:1240px;top:200px;width:584px">
          <div class="h" style="font-size:52px">Confirm before you take over</div>
          <div style="margin-top:30px;display:flex;flex-direction:column;gap:22px">
            <div class="s1-take" id="s1-t1" style="font:700 46px 'DM Sans';padding:24px 30px;border:3px solid #30241F">1 Feeding plan</div>
            <div class="s1-take" id="s1-t2" style="font:700 46px 'DM Sans';padding:24px 30px;border:3px solid #30241F">2 Sleep setup</div>
            <div class="s1-take" id="s1-t3" style="font:700 46px 'DM Sans';padding:24px 30px;border:3px solid #30241F">3 When to wake a parent</div>
          </div>
        </div>
      </div>""", "\n".join([
    out('#s1-title', OPEN_CLIP_AT - 0.3, 0.3),
    "    tl.set(['#s1-dim', '#s1-ask', '#s1-cue', '#s1-reveal'], { opacity: 0 }, 0);",
    "    tl.set('#s1-time', { opacity: 0 }, 0);",
    fade('#s1-time', OPEN_CLIP_AT + 0.3, 0.5, 0),
    # freeze frame exercise: dim the last frame, then the question and the cue; answers stay hidden
    f"    tl.fromTo('#s1-dim', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6, ease: 'power2.out' }}, {OPEN_FREEZE_AT});",
    fade('#s1-ask', OPEN_FREEZE_AT + 0.4),
    fade('#s1-cue', OPEN_FREEZE_AT + 1.2, 0.6, 16),
    out(['#s1-time'], OPEN_REVEAL_AT - 0.4),
    # the reveal: the specialist's words on screen while they are spoken, each takeaway lit as it is said
    f"    tl.fromTo('#s1-reveal', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6, ease: 'power2.out' }}, {OPEN_REVEAL_AT});",
    out(['#s1-ask', '#s1-cue', '#s1-dim'], OPEN_REVEAL_AT + 0.6, 0.2),
    fade('#s1-quote', OPEN_VO_AT - 0.2, 0.6, 16),
    f"    tl.fromTo('.s1-take', {{ opacity: 0, x: 24 }}, {{ opacity: 0.35, x: 0, duration: 0.5, ease: 'expo.out', stagger: 0.12 }}, {OPEN_REVEAL_AT + 0.3});",
] + [
    line for i, at in enumerate(OPEN_TAKEAWAYS, 1) for line in (
        f"    tl.to('#s1-ph{i}', {{ color: '#8E3C2E', duration: 0.3 }}, {round(OPEN_VO_AT + at, 2)});",
        f"    tl.to('#s1-t{i}', {{ opacity: 1, backgroundColor: '#8E3C2E', borderColor: '#8E3C2E', color: '#FFFAF1', duration: 0.4, ease: 'power2.out' }}, {round(OPEN_VO_AT + at, 2)});",
    )
]))

# 2 · Ask before the parents go to sleep (0:25 to 1:20)
files['s2-ask'] = scene('s2-ask', 55, MARK + """
      <div class="kicker">Before the parents go to sleep</div>
      <img id="s2-photo" src="assets/first-overnight-shift.jpg" alt="A parent shows a caregiver the feeding notes in a logbook beside a bassinet." style="position:absolute;left:96px;top:160px;width:820px;height:600px;object-fit:cover;object-position:58% 50%">
      <div class="card rule" style="left:980px;top:160px;width:844px;height:600px;padding:40px 48px">
        <div class="h" style="font-size:58px">Arrival checklist</div>
        <div style="margin-top:22px;border-top:2px solid #D6C4B4">
          <div class="row s2-line"><b>01</b>Last feed</div>
          <div class="row s2-line"><b>02</b>Feeding plan</div>
          <div class="row s2-line"><b>03</b>Sleep setup</div>
          <div class="row s2-line"><b>04</b>When to wake a parent</div>
        </div>
        <div id="s2-confirm" style="margin-top:30px;font:700 32px/1.3 'DM Sans';color:#8E3C2E">Confirm the address and after hours number.</div>
      </div>""", "\n".join([
    fade('#s2-photo', 0.5, 0.8, 0),
    fade('.s2-line:nth-child(1)', 3.5), fade('.s2-line:nth-child(2)', 11), fade('.s2-line:nth-child(3)', 18), fade('.s2-line:nth-child(4)', 22),
    fade('#s2-confirm', 27),
]))

# 3 · Practice the unclear handoff (1:20 to 2:05), with a three second thinking beat
files['s3-unclear'] = scene('s3-unclear', 45, MARK + """
      <div class="kicker">Practice: an unclear handoff</div>
      <div class="card s3-note" style="left:150px;top:220px;width:760px;padding:44px 52px;transform:rotate(-2deg)">
        <div style="font:700 28px 'DM Sans';letter-spacing:.13em;text-transform:uppercase;color:#69554A">Parent one</div>
        <div class="h" style="font-size:84px;margin-top:14px;white-space:nowrap">Last feed: 7:30?</div>
      </div>
      <div class="card s3-note" style="left:1010px;top:260px;width:760px;padding:44px 52px;transform:rotate(2deg)">
        <div style="font:700 28px 'DM Sans';letter-spacing:.13em;text-transform:uppercase;color:#69554A">Parent two</div>
        <div class="h" style="font-size:84px;margin-top:14px;white-space:nowrap">Maybe 8:00?</div>
      </div>
      <div id="s3-ask" class="h" style="position:absolute;left:96px;right:96px;top:560px;text-align:center;font-size:84px;color:#8E3C2E">What would you clarify first?</div>
      <div id="s3-beat" style="position:absolute;left:0;right:0;top:690px;text-align:center;font:500 30px 'DM Sans';color:#69554A">Pause and think</div>
      <div id="s3-answer" style="position:absolute;left:96px;right:96px;top:560px;text-align:center">
        <div class="h" style="font-size:76px">Confirm the best estimate</div>
        <div class="h" style="font-size:76px;color:#8E3C2E">and agree on the next step.</div>
      </div>
      <div id="s3-readback" style="position:absolute;left:0;right:0;top:780px;text-align:center;font:500 34px 'DM Sans';color:#69554A">Record an estimate as an estimate. Read the plan back.</div>""", "\n".join([
    "    tl.fromTo('.s3-note', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 2.2 }, 1);",
    blur_in('#s3-ask', round(PAUSE - 3.2, 2)),
    # three second thinking beat (12 s to 15 s), then the answer
    fade('#s3-beat', PAUSE, 0.4, 0),
    out('#s3-beat', round(PAUSE + THINK, 2), 0.25),
    out('#s3-ask', round(PAUSE + THINK + 0.2, 2), 0.3),
    "    tl.set('#s3-answer', { opacity: 0 }, 0);",
    blur_in('#s3-answer', round(PAUSE + THINK + 0.6, 2)),
    fade('#s3-readback', round(PAUSE + THINK + _n['s3b'] * 0.72, 2)),
]))

# 4 · Check the sleep space (2:05 to 2:59): overhead view of an empty bassinet with a mannequin
files['s4-sleep'] = scene('s4-sleep', 54, MARK + """
      <div class="kicker">Check the sleep space</div>
      <img id="s4-bassinet" src="assets/baby-swaddled.jpg" alt="A swaddled newborn asleep on their back on a smooth fitted sheet" style="position:absolute;left:120px;top:165px;width:800px;height:600px;object-fit:cover;object-position:50% 24%">
      <div style="position:absolute;left:1000px;top:190px;width:820px">
        <div class="row s4-label"><b>01</b>On the back</div>
        <div class="row s4-label"><b>02</b>Firm, flat, level surface</div>
        <div class="row s4-label"><b>03</b>Fitted sheet only</div>
        <div id="s4-keepout" style="margin-top:36px;font:700 32px/1.35 'DM Sans'">Keep out: pillows, loose blankets, toys, positioners.</div>
        <div id="s4-move" style="margin-top:22px;font:500 32px/1.35 'DM Sans';color:#8E3C2E">Asleep in a swing or car seat? Move to a safe sleep space, on the back.</div>
      </div>
      <div class="src" id="s4-src">Source: American Academy of Pediatrics, Safe Sleep</div>""", "\n".join([
    fade('#s4-bassinet', 0.6, 0.8, 0),
    fade('.s4-label:nth-child(1)', 4), fade('.s4-label:nth-child(2)', 13), fade('.s4-label:nth-child(3)', 19),
    fade('#s4-keepout', 25), fade('#s4-move', 31), fade('#s4-src', 4, 0.6, 0),
]))

# 5 · Follow the feeding plan and handle milk safely (2:59 to 4:05)
BOTTLE = lambda label: f"""<svg width="120" height="230" viewBox="0 0 120 230" aria-hidden="true" data-layout-ignore>
            <rect x="40" y="6" width="40" height="30" rx="10" fill="#D6AB68"/><rect x="28" y="34" width="64" height="18" rx="6" fill="#B08A5C"/>
            <rect x="18" y="52" width="84" height="170" rx="22" fill="#FFFFFF" stroke="#30241F" stroke-width="5"/>
            <rect x="24" y="120" width="72" height="96" rx="16" fill="#F2E7D2"/>
            <rect x="8" y="78" width="104" height="36" rx="6" fill="#8E3C2E"/><text x="60" y="102" text-anchor="middle" font-family="DM Sans" font-weight="700" font-size="19" fill="#FFFAF1">{label}</text>
          </svg>"""
files['s5-feeding'] = scene('s5-feeding', 66, MARK + f"""
      <div class="kicker">Follow the plan and handle milk safely</div>
      <div id="s5-basics" class="h" style="position:absolute;left:96px;right:96px;top:150px;font-size:58px">Clean hands. Clean equipment. The family’s plan.</div>
      <div class="card rule s5-panel" id="s5-formula" style="left:96px;top:270px;width:840px;height:480px;padding:36px 44px;display:flex;gap:36px">
        <div style="flex:none;padding-top:6px">{BOTTLE('10:15 PM')}</div>
        <div>
          <div class="h" style="font-size:54px">Formula</div>
          <div style="font:500 32px/1.4 'DM Sans';margin-top:16px">Use within <b>2 hr</b> of preparation and <b>1 hr</b> of feed start.</div>
          <div style="font:700 34px/1.3 'DM Sans';margin-top:16px;color:#8E3C2E">Discard leftovers.</div>
          <div style="font:500 28px/1.4 'DM Sans';margin-top:16px;color:#69554A">Not using it right away? Refrigerate promptly and use within 24 hr.</div>
        </div>
      </div>
      <div class="card rule s5-panel" id="s5-milk" style="left:984px;top:270px;width:840px;height:480px;padding:36px 44px;display:flex;gap:36px">
        <div style="flex:none;padding-top:6px">{BOTTLE('10:40 PM')}</div>
        <div>
          <div class="h" style="font-size:54px">Expressed breast milk</div>
          <div style="font:500 32px/1.4 'DM Sans';margin-top:16px">Warmed or at room temperature: use within <b>2 hr</b>.</div>
          <div style="font:500 30px/1.4 'DM Sans';margin-top:16px">Leftovers: within <b>2 hr</b> after the feed ends, within applicable storage limits.</div>
          <div style="font:500 28px/1.4 'DM Sans';margin-top:16px;color:#69554A">Timing unclear? Check with the parent first.</div>
        </div>
      </div>
      <div class="src" id="s5-src" style="top:792px">Source: CDC, Infant Formula Preparation and Storage; Breast Milk Storage and Preparation</div>""", "\n".join([
    blur_in('#s5-basics', 0.6),
    fade('#s5-formula', 13), fade('#s5-milk', 35), fade('#s5-src', 13, 0.6, 0),
]))

# 6 · Know when to escalate (4:05 to 5:02)
files['s6-escalate'] = scene('s6-escalate', 57, MARK + """
      <div class="kicker">Know when to escalate</div>
      <div class="card" id="s6-911" style="left:96px;top:160px;width:840px;height:620px;padding:40px 48px;border:4px solid #30241F">
        <div style="font:700 28px 'DM Sans';letter-spacing:.13em;text-transform:uppercase;color:#FFFAF1;background:#30241F;display:inline-block;padding:8px 16px">Emergency</div>
        <div class="h" style="font-size:96px;margin-top:22px">Call 911</div>
        <div style="font:500 28px 'DM Sans';color:#69554A;margin-top:6px">In the U.S. Follow the dispatcher’s instructions.</div>
        <div style="margin-top:22px;border-top:2px solid #D6C4B4">
          <div class="row" style="font-size:32px;padding:14px 0">Not breathing</div>
          <div class="row" style="font-size:32px;padding:14px 0">Unresponsive</div>
          <div class="row" style="font-size:32px;padding:14px 0">Severe trouble breathing</div>
          <div class="row" style="font-size:32px;padding:14px 0;border-bottom:0">Blue or gray lips or face</div>
        </div>
      </div>
      <div class="card rule" id="s6-fever" style="left:984px;top:160px;width:840px;height:620px;padding:40px 48px">
        <div style="font:700 28px 'DM Sans';letter-spacing:.13em;text-transform:uppercase;color:#8E3C2E">Scenario: 6 week old infant</div>
        <div class="h" style="font-size:72px;margin-top:22px">Newborn fever</div>
        <div class="h" style="font-size:64px;color:#8E3C2E;margin-top:10px">100.4°F / 38°C or higher</div>
        <div style="font:700 34px/1.35 'DM Sans';margin-top:28px">Wake the parent now.</div>
        <div style="font:500 32px/1.4 'DM Sans';margin-top:10px">Immediate pediatric contact and urgent evaluation. Don’t wait for morning.</div>
      </div>
      <div id="s6-record" style="position:absolute;left:96px;right:96px;top:806px;font:500 30px 'DM Sans';color:#69554A">Record the time, what you observed, whom you contacted, and what happened next.</div>""", "\n".join([
    fade('#s6-911', 0.6), fade('#s6-fever', 16), fade('#s6-record', 43),
]))

# 7 · Log facts and give a morning handoff (5:02 to 6:08)
files['s7-log'] = scene('s7-log', 66, MARK + """
      <div class="kicker">Log facts. Hand off clearly.</div>
      <div class="card" id="s7-table" style="left:96px;top:170px;width:1728px;padding:0">
        <div style="display:grid;grid-template-columns:260px 600px 380px 1fr;font:700 28px 'DM Sans';letter-spacing:.12em;text-transform:uppercase;background:#30241F;color:#FFFAF1">
          <div class="s7-h" style="padding:20px 28px">Time</div><div class="s7-h" style="padding:20px 28px">Care</div><div class="s7-h" style="padding:20px 28px">Observation</div><div class="s7-h" style="padding:20px 28px">Action</div>
        </div>
        <div style="display:grid;grid-template-columns:260px 600px 380px 1fr;font:500 34px/1.35 'DM Sans'">
          <div class="s7-c" style="padding:26px 28px">11:05 p.m.</div><div class="s7-c" style="padding:26px 28px">Formula: 2 oz offered, 1.5 oz taken</div><div class="s7-c" style="padding:26px 28px">Wet diaper</div><div class="s7-c" style="padding:26px 28px">Back in bassinet at 11:30 p.m.</div>
        </div>
      </div>
      <div id="s7-note" style="position:absolute;left:96px;top:420px;font:500 28px 'DM Sans';color:#69554A">Observations for this scenario. The amounts are not feeding targets.</div>
      <div class="card rule" id="s7-handoff" style="left:96px;top:500px;width:1728px;padding:30px 44px">
        <div class="h" style="font-size:52px">Morning handoff</div>
        <div style="display:flex;gap:18px;margin-top:22px;flex-wrap:wrap">
          <span class="s7-item" style="font:700 32px 'DM Sans';padding:14px 26px;background:#8E3C2E;color:#FFFAF1">Concerns first</span>
          <span class="s7-item" style="font:700 32px 'DM Sans';padding:14px 26px;border:2px solid #30241F">Last feed</span>
          <span class="s7-item" style="font:700 32px 'DM Sans';padding:14px 26px;border:2px solid #30241F">Last diaper</span>
          <span class="s7-item" style="font:700 32px 'DM Sans';padding:14px 26px;border:2px solid #30241F">Sleep</span>
          <span class="s7-item" style="font:700 32px 'DM Sans';padding:14px 26px;border:2px solid #30241F">Follow up</span>
        </div>
      </div>""", "\n".join([
    fade('#s7-table', 0.6),
    "    tl.fromTo('.s7-c', { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 2.2 }, 12);",
    "    tl.fromTo('.s7-h', { backgroundColor: 'rgba(214,171,104,0)' }, { backgroundColor: 'rgba(214,171,104,0.35)', duration: 0.4, stagger: 2.2 }, 12);",
    "    tl.to('.s7-h', { backgroundColor: 'rgba(214,171,104,0)', duration: 0.4 }, 22);",
    fade('#s7-note', 22),
    fade('#s7-handoff', 34),
    "    tl.fromTo('.s7-item', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'expo.out', stagger: 2.4 }, 36);",
]))

# 8 · Wrap and practice (6:08 to 6:46)
files['s8-wrap'] = scene('s8-wrap', 38, MARK + """
      <div class="kicker">Wrap and practice</div>
      <img id="s8-sheet" src="assets/worksheet.png" alt="The First Overnight Shift worksheet" style="position:absolute;left:150px;top:150px;height:640px;box-shadow:0 20px 50px rgba(48,36,31,.2)">
      <div style="position:absolute;left:760px;top:180px;width:1060px">
        <div class="h s8-take" style="font-size:96px">Clarify the plan.</div>
        <div class="h s8-take" style="font-size:96px;margin-top:18px">Keep a factual log.</div>
        <div class="h s8-take" style="font-size:96px;margin-top:18px;color:#8E3C2E">Speak up early.</div>
        <div id="s8-quiz" style="margin-top:42px;font:500 34px/1.4 'DM Sans'">Next: open the worksheet, then take the five question quiz.</div>
      </div>
      <div class="card rule" id="s8-sources" style="left:760px;top:180px;width:1060px;padding:36px 44px">
        <div class="h" style="font-size:52px">Sources</div>
        <div style="font:700 28px 'DM Sans';margin-top:22px">American Academy of Pediatrics, HealthyChildren.org</div>
        <div style="font:500 28px/1.5 'DM Sans';color:#69554A">Safe Sleep · Fever and Your Baby · When to Call Emergency Medical Services · Pediatrician, Urgent Care, or ER</div>
        <div style="font:700 28px 'DM Sans';margin-top:22px">Centers for Disease Control and Prevention</div>
        <div style="font:500 28px/1.5 'DM Sans';color:#69554A">Infant Formula Preparation and Storage · Breast Milk Storage and Preparation</div>
        <div style="font:500 28px 'DM Sans';margin-top:24px;color:#8E3C2E">Links are in the course resources.</div>
      </div>""", "\n".join([
    fade('#s8-sheet', 0.6, 0.8, 0),
    "    tl.fromTo('.s8-take', { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out', stagger: 2 }, 3);",
    fade('#s8-quiz', 13),
    "    tl.to(['.s8-take', '#s8-quiz'], { opacity: 0, duration: 0.35, ease: 'power2.in' }, 22);",
    "    tl.set('#s8-sources', { opacity: 0 }, 0);",
    fade('#s8-sources', 22.6),
]))

for sid, body in files.items():
    (OUT / 'compositions' / f'{sid}.html').write_text(body)

voice, clips = [], {}
for sid, start, dur in SCENES:
    if sid == 's1-open':
        # the parent's line plays from the clip itself; the model response is a separate voice track
        clips['p1'] = [round(start + OPEN_CLIP_AT + OPEN_PARENT_SPEECH[0], 3), round(OPEN_PARENT_SPEECH[1] - OPEN_PARENT_SPEECH[0], 3)]
        clips['s1r'] = [round(start + OPEN_VO_AT + OPEN_VO_SPEECH[0], 3), round(OPEN_VO_SPEECH[1] - OPEN_VO_SPEECH[0], 3)]
        voice.append(f'      <audio id="vo-s1r" class="clip" src="assets/voice/s1-response.wav" data-start="{round(start + OPEN_VO_AT, 2)}" data-duration="{OPEN_VO_LEN}" data-volume="1" data-track-index="2"></audio>')
        continue
    keys = ['s3a', 's3b'] if sid == 's3-unclear' else [sid.split('-')[0]]
    at = start + (INTRO if sid == 's1-open' else LEAD)
    for key in keys:
        clips[key] = [round(at, 3), _n[key]]
        voice.append(f'      <audio id="vo-{key}" class="clip" src="assets/voice/{key}.wav" data-start="{round(at, 2)}" data-duration="{_n[key]}" data-volume="1" data-track-index="2"></audio>')
        at += _n[key] + THINK
# Music standard for every lesson video (see video/STANDARDS.md):
#  Opening: the track plays at full level, starts fading at 3 s and is silent by 4 s.
#  Closing: it enters softly under the final scene, rises after the last line, then fades out.
BED, SOLO = 0.12, 0.5
INTRO_FADE_START, INTRO_SILENT = 3.0, 4.0
s1 = next(x for x in SCENES if x[0] == 's1-open')
s8 = next(x for x in SCENES if x[0] == 's8-wrap')
intro_lane = {"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": SOLO}, {"t": INTRO_FADE_START, "v": SOLO}, {"t": INTRO_SILENT, "v": 0}]}]}
voice_end = LEAD + _n['s8']
outro_lane = {"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": BED}, {"t": voice_end, "v": BED}, {"t": voice_end + 1.0, "v": SOLO}]}]}
music = [
    f"""      <audio id="music-intro" class="clip" src="assets/bgm/track.mp3" data-start="0" data-duration="{INTRO_SILENT}" data-volume="1" data-fade-in="0.6" data-track-index="3" data-automation='{json.dumps(intro_lane)}'></audio>""",
    f"""      <audio id="music-outro" class="clip" src="assets/bgm/track.mp3" data-start="{s8[1]}" data-duration="{s8[2]}" data-volume="1" data-fade-in="2" data-fade-out="3.5" data-track-index="3" data-automation='{json.dumps(outro_lane)}'></audio>""",
]
hosts = "\n".join(
    f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{start}" data-duration="{dur}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>'
    for sid, start, dur in SCENES
)
(OUT / 'index.html').write_text(f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <title>The First Overnight Shift · The Ivory Cradle School</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: #F8F1E6; }}
      #ground {{ position: absolute; inset: 0; background: #F8F1E6; }}
    </style>
  </head>
  <body>
    <!-- The First Overnight Shift: eight scenes from the approved script.
         Opens on a HeyGen clip of the parent at the nursery door (voice Brodie), a freeze frame exercise and
         the specialist's model response (HeyGen voice Deirdre); the rest is narrated with Kokoro Heart (af_heart). -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{TOTAL}" data-width="1920" data-height="1080" data-fps="30">
      <div id="ground"></div>
{hosts}
{chr(10).join(voice)}
{chr(10).join(music)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
""")
(OUT / 'timeline.json').write_text(json.dumps({'total': TOTAL, 'scenes': SCENES, 'voice': clips}, indent=2) + '\n')
print('wrote', len(files), 'scenes;', TOTAL, 'seconds')
