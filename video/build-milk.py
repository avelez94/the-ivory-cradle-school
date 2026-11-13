"""Milk Handling on Shift: the seven part workshop (word for word narration).

Builds video/milk-handling-on-shift/{index.html, compositions/*.html, assets/voice/*.wav,
captions.en.vtt, timeline.json}. Every clinical statement in the narration is sourced in
docs/milk-handling-source-table.md (CDC is the named standard for storage times; AAP is the clinical
foundation; differences are listed there for clinical review).

Run from the repo root:  $HYPERFRAMES_PYTHON video/build-milk.py
Then:  cd video/milk-handling-on-shift && npx hyperframes check && npx hyperframes render --crf 26

Voices: narrator Kokoro Heart; caregiver example Kokoro Bella. The opening parent line is the fridge
clip from the Feeding Support opening (HeyGen, voice Janet).
"""
import importlib.util
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'lib'))
from icsvideo import (CAREGIVER, INTRO, Gap, Hold, Say, Scene, blur, build_lesson, countdown,  # noqa: E402
                      hide, highlight, panel, show, write_vtt)

_spec = importlib.util.spec_from_file_location('feeding', HERE / 'build-feeding.py')
feeding = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(feeding)
bottle, items, glow = feeding.bottle, feeding.items, feeding.glow

PROJECT = HERE / 'milk-handling-on-shift'
CLIP_LEN = 4.0                 # the fridge clip, cut on the mom's last clean frame
CLIP_SPEECH = (0.60, 2.58)     # her line inside the clip
CLIP_CAPTION = 'There’s a bottle in the fridge if you need it.'

CSS = feeding.CSS + """
.zone { position: absolute; top: 250px; width: 540px; height: 520px; background: #FFFAF1; border: 2px solid #D6C4B4; padding: 30px 34px; }
.zone .zt { font: 800 46px/1.05 'Bricolage Grotesque'; letter-spacing: -0.03em; }
.zone .temp { font: 700 34px 'DM Sans'; color: #8E3C2E; margin-top: 12px; }
.zone .time { font: 800 64px/1 'Bricolage Grotesque'; letter-spacing: -0.03em; margin-top: 26px; }
.zone .cond { font: 500 32px/1.3 'DM Sans'; color: #69554A; margin-top: 14px; }
.lab { background: #FFFFFF; border: 3px solid #30241F; padding: 22px 28px; font: 600 34px/1.35 'DM Sans'; }
.lab .lk { font: 700 28px 'DM Sans'; letter-spacing: .1em; text-transform: uppercase; color: #69554A; }
.pill { display: inline-block; font: 700 32px 'DM Sans'; padding: 12px 22px; background: #30241F; color: #FFFAF1; }
.pill.t { background: #8E3C2E; }
.say { font: 500 40px/1.35 'DM Sans'; }
.ans { font: 700 34px 'DM Sans'; padding: 10px 18px; display: inline-block; }
.ans.use { background: #3F5A3A; color: #FFFAF1; }
.ans.dis { background: #8E3C2E; color: #FFFAF1; }
.ans.set { background: #30241F; color: #FFFAF1; }
.src { position: absolute; left: 96px; top: 790px; font: 500 28px 'DM Sans'; color: #69554A; }
"""


# ---------------------------------------------------------------- illustrations (clear drawings, no photos of milk)
def bag(sid, lines, fill=0.5, frozen=False, crystals=False, w=240):
    """A breast milk storage bag with a written label."""
    h = round(w * 1.5)
    milk = '#EEF3F6' if frozen else '#F3E7CF'
    top = 300 - fill * 190
    marks = ''
    if frozen:
        marks += ''.join(f'<path d="M{x} {y} l8 8 m0 -8 l-8 8" stroke="#9FB3C1" stroke-width="2"/>' for x, y in ((40, 250), (120, 268), (150, 230), (70, 280)))
    if crystals:
        marks += ''.join(f'<path d="M{x} {y} l6 -10 l6 10 l-6 10 z" fill="#FFFFFF" stroke="#9FB3C1" stroke-width="2"/>' for x, y in ((50, 240), (110, 262), (140, 236), (80, 280)))
    text = ''.join(f'<text x="100" y="{98 + i * 30}" text-anchor="middle" font-family="DM Sans" font-weight="700" font-size="22" fill="#30241F">{t}</text>' for i, t in enumerate(lines))
    return f'''<svg id="{sid}" width="{w}" height="{h}" viewBox="0 0 200 300" aria-hidden="true">
  <clipPath id="{sid}-c"><path d="M18 40 H182 V270 Q182 296 156 296 H44 Q18 296 18 270 Z"/></clipPath>
  <path d="M18 40 H182 V270 Q182 296 156 296 H44 Q18 296 18 270 Z" fill="#FFFFFF" stroke="#30241F" stroke-width="5"/>
  <rect x="18" y="{top:.0f}" width="164" height="300" fill="{milk}" clip-path="url(#{sid}-c)"/>
  {marks}
  <rect x="10" y="12" width="180" height="26" rx="6" fill="#8E3C2E"/>
  <rect x="28" y="62" width="144" height="{max(46, 30 * len(lines) + 22)}" fill="#FFFAF1" stroke="#30241F" stroke-width="3"/>
  {text}
</svg>'''


def fridge(sid, w=430):
    """Refrigerator with the freezer above; the shelves at the back are marked, the door is not."""
    return f'''<svg id="{sid}" width="{w}" height="{round(w * 1.3)}" viewBox="0 0 300 390" aria-hidden="true">
  <rect x="10" y="10" width="200" height="370" rx="14" fill="#FFFAF1" stroke="#30241F" stroke-width="5"/>
  <line x1="10" y1="120" x2="210" y2="120" stroke="#30241F" stroke-width="5"/>
  <rect x="30" y="28" width="160" height="76" fill="#EEF3F6"/>
  <rect x="30" y="138" width="160" height="226" fill="#F8F1E6"/>
  <line x1="30" y1="215" x2="190" y2="215" stroke="#D6C4B4" stroke-width="4"/>
  <line x1="30" y1="290" x2="190" y2="290" stroke="#D6C4B4" stroke-width="4"/>
  <rect id="{sid}-back1" x="36" y="40" width="70" height="56" fill="#8E3C2E" opacity="0.85"/>
  <rect id="{sid}-back2" x="36" y="150" width="70" height="58" fill="#8E3C2E" opacity="0.85"/>
  <path d="M210 10 L288 40 V350 L210 380" fill="#FFFAF1" stroke="#30241F" stroke-width="5"/>
  <line x1="214" y1="150" x2="284" y2="168" stroke="#D6C4B4" stroke-width="4"/>
  <line x1="214" y1="240" x2="284" y2="252" stroke="#D6C4B4" stroke-width="4"/>
  <path id="{sid}-x" d="M226 180 L272 230 M272 180 L226 230" stroke="#8E3C2E" stroke-width="8" stroke-linecap="round"/>
</svg>'''


def cooler(sid, w=460):
    return f'''<svg id="{sid}" width="{w}" height="{round(w * 0.75)}" viewBox="0 0 320 240" aria-hidden="true">
  <rect x="20" y="60" width="280" height="160" rx="18" fill="#FFFAF1" stroke="#30241F" stroke-width="5"/>
  <rect x="10" y="38" width="300" height="34" rx="10" fill="#8E3C2E"/>
  <rect x="130" y="20" width="60" height="22" rx="8" fill="none" stroke="#30241F" stroke-width="5"/>
  <rect x="44" y="96" width="60" height="96" rx="8" fill="#C9DCE6" stroke="#30241F" stroke-width="3"/>
  <rect x="216" y="96" width="60" height="96" rx="8" fill="#C9DCE6" stroke="#30241F" stroke-width="3"/>
  <rect x="116" y="104" width="88" height="88" rx="10" fill="#F3E7CF" stroke="#30241F" stroke-width="3"/>
</svg>'''


def microwave(sid, w=300):
    return f'''<svg id="{sid}" width="{w}" height="{round(w * 0.7)}" viewBox="0 0 200 140" aria-hidden="true">
  <rect x="8" y="12" width="184" height="116" rx="12" fill="#FFFAF1" stroke="#30241F" stroke-width="5"/>
  <rect x="24" y="30" width="112" height="80" rx="6" fill="#EDDFCB" stroke="#30241F" stroke-width="3"/>
  <circle cx="164" cy="50" r="10" fill="none" stroke="#30241F" stroke-width="4"/><circle cx="164" cy="86" r="10" fill="none" stroke="#30241F" stroke-width="4"/>
  <line x1="6" y1="134" x2="194" y2="6" stroke="#8E3C2E" stroke-width="10" stroke-linecap="round"/>
</svg>'''


def separated_bottle(sid, w=260):
    """A capped bottle of stored milk with the fat risen into a layer on top."""
    return f'''<svg id="{sid}" width="{w}" height="{round(w * 410 / 240)}" viewBox="0 0 240 410" aria-hidden="true">
  <rect x="74" y="0" width="92" height="74" rx="18" fill="#8E3C2E"/>
  <rect x="58" y="64" width="124" height="40" rx="8" fill="#30241F"/>
  <clipPath id="{sid}-c"><rect x="19" y="107" width="202" height="294" rx="33"/></clipPath>
  <rect x="16" y="104" width="208" height="300" rx="36" fill="#FFFFFF" stroke="#30241F" stroke-width="6"/>
  <rect x="16" y="170" width="208" height="240" fill="#F1EEE6" clip-path="url(#{sid}-c)"/>
  <rect id="{sid}-fat" x="16" y="170" width="208" height="40" fill="#F2D9A6" clip-path="url(#{sid}-c)"/>
  <rect id="{sid}-mixed" x="16" y="170" width="208" height="240" fill="#F3E7CF" opacity="0" clip-path="url(#{sid}-c)"/>
</svg>'''


def formula_forms(sid):
    rtf = '<svg width="200" height="300" viewBox="0 0 140 210"><rect x="44" y="6" width="52" height="30" rx="6" fill="#8E3C2E"/><path d="M30 46 Q30 36 44 36 H96 Q110 36 110 46 V196 Q110 204 102 204 H38 Q30 204 30 196 Z" fill="#FFFAF1" stroke="#30241F" stroke-width="5"/><rect x="40" y="90" width="60" height="70" fill="#FFFFFF" stroke="#30241F" stroke-width="3"/></svg>'
    can = '<svg width="200" height="300" viewBox="0 0 140 210"><ellipse cx="70" cy="40" rx="50" ry="14" fill="#EDDFCB" stroke="#30241F" stroke-width="5"/><path d="M20 40 V178 Q70 200 120 178 V40" fill="#FFFAF1" stroke="#30241F" stroke-width="5"/><rect x="34" y="84" width="72" height="62" fill="#FFFFFF" stroke="#30241F" stroke-width="3"/></svg>'
    tub = '<svg width="200" height="300" viewBox="0 0 140 210"><rect x="16" y="40" width="108" height="26" rx="8" fill="#8E3C2E"/><rect x="20" y="66" width="100" height="134" rx="10" fill="#FFFAF1" stroke="#30241F" stroke-width="5"/><rect x="34" y="98" width="72" height="62" fill="#FFFFFF" stroke="#30241F" stroke-width="3"/><path d="M96 20 q22 0 22 18 q0 16 -22 16 z" fill="#EDDFCB" stroke="#30241F" stroke-width="3"/><line x1="96" y1="37" x2="60" y2="37" stroke="#30241F" stroke-width="6" stroke-linecap="round"/></svg>'
    cols = [('rtf', rtf, 'Ready to feed', 'Use as is. Never add water.'),
            ('con', can, 'Liquid concentrate', 'Mix with water exactly as the label says.'),
            ('pow', tub, 'Powder', 'Water first, then level scoops, as the label says.')]
    return '\n'.join(
        f'<div id="{sid}-{k}" style="position:absolute;left:{120 + i * 580}px;top:200px;width:520px;text-align:center">{svg}'
        f'<div class="h" style="font-size:50px;margin-top:10px">{t}</div><div class="note" style="margin-top:10px">{d}</div></div>'
        for i, (k, svg, t, d) in enumerate(cols))


def timeline(prefix, stops, top=330):
    """Stops: (left px, time, event). Returns markup; ids prefix-s1.. ; the line is prefix-line."""
    out = f'<div class="tl" id="{prefix}-line" style="top:{top}px"></div>'
    for i, (left, time, ev) in enumerate(stops, 1):
        out += f'<div class="stop" id="{prefix}-s{i}" style="left:{left}px;top:{top - 18}px"><div class="dot" id="{prefix}-d{i}"></div><div class="time" style="font-size:56px">{time}</div><div class="ev">{ev}</div></div>'
    return out


# ============================================================ 1 · The bottle in the fridge
S1 = [
    Hold('clip', CLIP_LEN),
    Say('q', 'What would you verify before offering this bottle?'),
    Say('qp', 'Pause here and name what you would check.'),
    Hold('h1', 20),
    Say('r0', 'Here’s what to check.'),
    Say('r1', 'First, which baby is this bottle for? When milk is stored for more than one child, the label should say.'),
    Say('r2', 'Second, what it contains. Is it expressed breast milk or prepared formula?'),
    Say('r3', 'Third, its handling history. When was the milk expressed, or the formula prepared? Has it been frozen, thawed, warmed, or offered at a feed? Those events decide whether it’s still usable.'),
    Say('n1', 'The parent’s sentence tells you where the bottle is. It doesn’t tell you whether it’s safe to offer. In this workshop you’ll learn to read a bottle the way you’d read a chart: what’s in it, what has happened to it, and which deadline applies.'),
    Say('n2', 'We use CDC as our standard for storage times, with guidance from the American Academy of Pediatrics. This guidance is for routine care of healthy babies at home in the United States. For a baby born prematurely, a baby in the hospital, or a baby with medical needs, follow the plan from the baby’s care team. Whenever formula is involved, follow the directions on the product.'),
    Say('n3', 'Keep your Milk Handling Decision Sheet nearby. The examples in this workshop are fictional teaching examples, and you’ll use the sheet for a 2:00 a.m. decision at the end.'),
]


def v1(T):
    clip_at, freeze_at = T('clip'), T.end('clip')
    m = f'''
      <div class="panel" id="m1-title" style="background:#F8F1E6">
        <img src="assets/wordmark.png" alt="" style="position:absolute;left:740px;top:250px;width:440px">
        <div class="h" style="position:absolute;left:0;right:0;top:470px;text-align:center;font-size:124px">Milk Handling on Shift</div>
        <div class="lbl" style="position:absolute;left:0;right:0;top:640px;text-align:center">Mini course 02 · Workshop</div>
      </div>
      <video id="m1-clip" src="assets/fridge-clip.mp4" data-start="{clip_at}" data-duration="{CLIP_LEN}" data-media-start="0" data-has-audio="true" data-track-index="0" style="position:absolute;left:0;top:0;width:1920px;height:1080px"></video>
      <img id="m1-freeze" src="assets/fridge-freeze.png" alt="" data-start="{freeze_at}" data-duration="{round(T.end('h1') - freeze_at + 0.6, 2)}" data-track-index="0" style="position:absolute;left:0;top:0;width:1920px;height:1080px">
      <div class="panel" id="m1-dim" style="background:linear-gradient(90deg, rgba(30,22,19,0.9) 0%, rgba(30,22,19,0.84) 40%, rgba(30,22,19,0.4) 56%, rgba(30,22,19,0.3) 100%)"></div>
      <div id="m1-ask" data-hold style="position:absolute;left:110px;top:200px;width:820px;opacity:0">
        <div class="tag">Pause and practice</div>
        <div style="margin-top:30px;font:800 82px/1.06 'Bricolage Grotesque';letter-spacing:-0.035em;color:#FFFAF1">What would you verify before offering this bottle?</div>
      </div>
      <div id="m1-cue" style="position:absolute;left:110px;top:640px;width:800px;opacity:0;font:500 46px/1.3 'DM Sans';color:#F3E7CF">Pause here and name what you would check.</div>
      <div class="panel" id="m1-checks" style="background:#F8F1E6">
        <div class="h" style="position:absolute;left:96px;top:170px;font-size:76px">Before you offer any bottle</div>
        <div style="position:absolute;left:96px;top:300px;width:1728px">
          {items('m1-c', ['Which baby is it for?', 'What does it contain? Expressed breast milk or prepared formula', 'What is its handling history? Expressed or prepared, frozen, thawed, warmed, offered'])}
        </div>
      </div>
      <div class="panel" id="m1-read" style="background:#F8F1E6">
        <div class="h" style="position:absolute;left:96px;top:190px;width:1500px;font-size:80px">Read a bottle the way you’d read a chart.</div>
        <div style="position:absolute;left:96px;top:420px;display:flex;gap:24px;flex-wrap:wrap;width:1700px">
          <span class="chip" id="m1-p1">What’s in it</span><span class="chip" id="m1-p2">What has happened to it</span><span class="chip" id="m1-p3">Which deadline applies</span>
        </div>
      </div>
      <div class="panel" id="m1-std" style="background:#F8F1E6">
        <div class="card rule" style="left:96px;top:190px;width:1728px;padding:36px 48px">
          <div class="lbl">Our standard</div>
          <div class="body" style="margin-top:14px;font-size:42px">Storage times follow <b>CDC</b>. Clinical guidance from the <b>American Academy of Pediatrics</b>.</div>
        </div>
        <div class="card" id="m1-scope" style="left:96px;top:480px;width:1728px;padding:30px 48px">
          <div class="body">Routine care of healthy babies at home in the United States. Premature, hospitalized, or medically vulnerable baby? Follow the care team’s plan. Formula? Follow the product directions.</div>
        </div>
      </div>'''
    cd_html, cd_tw = countdown('m1-cd', T('h1'), 20, 'Pause and answer')
    m += cd_html
    tw = [f"tl.set('#m1-open-kicker', {{ opacity: 0 }}, 0);",
          f"tl.fromTo('#m1-title', {{ opacity: 1 }}, {{ opacity: 1, duration: 0.01 }}, 0);",
          hide('#m1-title', clip_at - 0.3, 0.3),
          f"tl.fromTo('#m1-dim', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.6, ease: 'power2.out' }}, {freeze_at});",
          show('#m1-ask', T('q') - 0.1), show('#m1-cue', T('qp'), 0.5, 16), *cd_tw]
    tw += panel('#m1-checks', T('r0') - 0.3, T('n1'))
    tw += [hide('#m1-ask', T('r0') + 0.3, 0.2), hide('#m1-cue', T('r0') + 0.3, 0.2), hide('#m1-dim', T('r0') + 0.3, 0.2)]
    tw += [show('#m1-c1', T('r1')), show('#m1-c2', T('r2')), show('#m1-c3', T('r3'))]
    tw += glow('#m1-c1', T('r1'), T('r2')) + glow('#m1-c2', T('r2'), T('r3')) + glow('#m1-c3', T('r3'), T('n1') - 0.3)
    tw += panel('#m1-read', T('n1') - 0.2, T('n2'))
    tw += [show('#m1-p1', T('n1.3') + 2.2), show('#m1-p2', T('n1.3') + 3.4), show('#m1-p3', T('n1.3') + 5.0)]
    tw += panel('#m1-std', T('n2') - 0.2, T.dur)
    tw += [show('#m1-scope', T('n2.2')), f"tl.fromTo('#m1-open-kicker', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.4 }}, {T('n2') - 0.2});"]
    return m, tw


# ============================================================ 2 · Label and store fresh milk
S2 = [
    Say('h', 'Start clean. CDC says to wash your hands well with soap and water before expressing or handling breast milk. If soap and water aren’t available, use an alcohol based hand sanitizer that contains at least 60 percent alcohol.'),
    Say('c', 'Store milk in breast milk storage bags, or in clean, food grade containers made of glass or plastic with tight fitting lids. Never use disposable bottle liners, or plastic bags that aren’t meant for storing breast milk.'),
    Say('l1', 'Label each container clearly with the date the milk was expressed. If the milk goes to a childcare provider, CDC and the AAP also say to add the child’s name.'),
    Say('l2', 'In the Ivory Cradle workflow, we also write the time it was expressed, and any later event, such as when it was moved to thaw. That’s our teaching practice, so the next caregiver doesn’t have to guess.'),
    Say('p', 'Practice. The parent filled this bag on Sunday at 9:15 p.m. for her daughter, Maya. What goes on the label? Pause and write it.'),
    Hold('ph', 20),
    Say('pr', 'The date it was expressed is required. Maya’s name matters whenever milk could be mixed up. The time is our workflow habit.'),
    Say('s1', 'Now, how long fresh milk keeps, and where.'),
    Say('s2', 'Freshly expressed milk can stay at room temperature, 77°F or colder, for up to 4 hours.'),
    Say('s3', 'In the refrigerator, at 40°F or colder, it can be stored for up to 4 days.'),
    Say('s4', 'In the freezer, at 0°F or colder, about 6 months is best, and up to 12 months is acceptable.'),
    Say('b', 'Store milk toward the back of the refrigerator or freezer, not in the door. Further inside, it’s protected from temperature changes when the door opens and closes.'),
    Say('f', 'If you don’t think the milk will be used within 4 days, CDC says to freeze it right away. And when you take milk out, use the oldest first: first in, first out.'),
    Say('a', 'You may see different numbers in AAP materials, such as up to 9 months in a standard freezer. This course teaches the CDC times, so every answer in the video, the worksheet, and the quiz matches. If the family’s pediatrician gives different instructions, follow the family’s plan.'),
]


def v2(T):
    m = f'''
      <div class="panel" id="m2-clean">
        <div style="position:absolute;left:120px;top:200px">{bag('m2-bag0', ['Breast milk', 'storage bag'], fill=0.0, w=300)}</div>
        <div style="position:absolute;left:560px;top:200px;width:1264px">
          {items('m2-k', ['Wash hands with soap and water, or use sanitizer with at least 60 percent alcohol', 'Breast milk storage bags, or clean food grade glass or plastic with tight lids', 'Never disposable bottle liners or bags not made for breast milk'], numbered=False)}
        </div>
      </div>
      <div class="panel" id="m2-label">
        <div id="m2-bagq" style="position:absolute;left:120px;top:170px">{bag('m2-bagq-svg', ['', '', ''], fill=0.45, w=330)}</div>
        <div id="m2-bagw" style="position:absolute;left:120px;top:170px">{bag('m2-bag1', ['Expressed', 'Sun 9:15 p.m.', 'Maya'], fill=0.45, w=330)}</div>
        <div style="position:absolute;left:600px;top:190px;width:1224px">
          <div class="lab" id="m2-l1"><div class="lk">Required</div>Date expressed</div>
          <div class="lab" id="m2-l2" style="margin-top:22px"><div class="lk">When milk goes to childcare</div>Child’s name</div>
          <div class="lab" id="m2-l3" style="margin-top:22px;border-style:dashed"><div class="lk">ICS workflow</div>Time expressed and later events, such as moved to thaw</div>
        </div>
      </div>
      <div class="panel" id="m2-chart">
        <div class="h" style="position:absolute;left:96px;top:150px;font-size:66px">Freshly expressed milk</div>
        <div class="zone" id="m2-z1" style="left:96px"><div class="zt">Room temperature</div><div class="temp">77°F or colder</div><div class="time">Up to 4 hours</div><div class="cond">Fresh milk on the counter</div></div>
        <div class="zone" id="m2-z2" style="left:690px"><div class="zt">Refrigerator</div><div class="temp">40°F or colder</div><div class="time">Up to 4 days</div><div class="cond">Back of the fridge, not the door</div></div>
        <div class="zone" id="m2-z3" style="left:1284px"><div class="zt">Freezer</div><div class="temp">0°F or colder</div><div class="time">About 6 months best</div><div class="cond">Up to 12 months acceptable</div></div>
        <div class="src" id="m2-src">Source: CDC Breast Milk Storage and Preparation; CDC Breast Milk Storage FAQ</div>
      </div>
      <div class="panel" id="m2-back">
        <div style="position:absolute;left:150px;top:160px">{fridge('m2-fr', w=460)}</div>
        <div style="position:absolute;left:760px;top:200px;width:1064px">
          {items('m2-b', ['Back of the fridge or freezer, not the door', 'Not used within 4 days? Freeze it right away', 'Oldest first: first in, first out'], numbered=False)}
          <div class="card" id="m2-aap" style="position:relative;margin-top:30px;padding:24px 30px"><div class="note" style="color:#30241F">AAP materials list some different times. This course teaches the CDC times. A pediatrician’s instructions for the family come first.</div></div>
        </div>
      </div>'''
    cd_html, cd_tw = countdown('m2-cd', T('ph'), 20, 'Pause and write')
    m += cd_html
    tw = panel('#m2-clean', 0.2, T('l1'))
    tw += [show('#m2-k1', T('h')), show('#m2-k2', T('c.1')), show('#m2-k3', T('c.2'))]
    tw += panel('#m2-label', T('l1') - 0.2, T('s1'))
    tw += [f"tl.set(['#m2-l1', '#m2-l2', '#m2-l3', '#m2-bagw'], {{ opacity: 0 }}, 0);", hide('#m2-bagq', T('pr') - 0.3, 0.2),
           show('#m2-l1', T('l1.1')), show('#m2-l2', T('l1.2')), show('#m2-l3', T('l2')), *cd_tw,
           show('#m2-bagw', T('pr') - 0.2, 0.6, 0)]
    tw += glow('#m2-l1', T('pr.1'), T('pr.2')) + glow('#m2-l2', T('pr.2'), T('pr.3')) + glow('#m2-l3', T('pr.3'), T('s1'))
    tw += panel('#m2-chart', T('s1') - 0.2, T('b'))
    tw += [show('#m2-z1', T('s2')), show('#m2-z2', T('s3')), show('#m2-z3', T('s4')), show('#m2-src', T('s4') + 1)]
    tw += panel('#m2-back', T('b') - 0.2, T.dur)
    tw += [show('#m2-b1', T('b')), show('#m2-b2', T('f.1')), show('#m2-b3', T('f.2')), show('#m2-aap', T('a'))]
    return m, tw


# ============================================================ 3 · Freeze, thaw, and transport
S3 = [
    Say('f1', 'When milk will be frozen, store small amounts, 2 to 4 ounces or the amount offered at one feeding, so less is wasted.'),
    Say('f2', 'Leave about one inch of space at the top of the container, because breast milk expands as it freezes. Keep the oldest bags where they’ll be used first.'),
    Say('t1', 'To thaw milk, put the container in the refrigerator overnight, set it in warm or lukewarm water, or hold it under lukewarm running water. Never thaw or heat breast milk in a microwave.'),
    Say('w1', 'Here’s a worked example. On Monday at 8:00 p.m., a frozen bag is moved to the refrigerator. By Tuesday at 6:00 a.m., it has completely thawed. Which event starts the clock?'),
    Hold('wh', 20),
    Say('w2', 'CDC says to start counting 24 hours when the milk is completely thawed, not from the time it came out of the freezer. So this bag should be used by Wednesday at 6:00 a.m.'),
    Say('w3', 'Write the thawed time on the label. If you can’t tell when it finished thawing, ask the parent before you use it.'),
    Say('w4', 'Once thawed milk is brought to room temperature or warmed, use it within 2 hours. And never refreeze breast milk after it has thawed.'),
    Say('c1', 'For travel between homes, breast milk can be kept in an insulated cooler with frozen ice packs for up to 24 hours. At the destination, use it right away, store it in the refrigerator, or freeze it.'),
    Say('c2', 'Frozen milk that’s moved to another freezer should go quickly, packed on ice packs so it stays frozen. Its age still counts from the first time it was frozen.'),
    Say('o1', 'Now a brief power outage example. The power was off overnight. When it comes back on, you check two bags. Bag A still has ice crystals. Bag B has completely thawed but still feels cold. What happens to each?'),
    Hold('oh', 20),
    Say('o2', 'CDC says frozen milk that has started to thaw but still contains ice crystals can be refrozen. So Bag A can go back in the freezer.'),
    Say('o3', 'Milk that has completely thawed but still feels cold goes in the refrigerator, to be used within the next day or thrown away. That’s Bag B. Tell the parent what happened, so the family can decide what to keep.'),
]


def v3(T):
    m = f'''
      <div class="panel" id="m3-frz">
        <div style="position:absolute;left:96px;top:150px;display:flex;gap:24px">
          {bag('m3-a', ['Sun', '2 oz'], fill=0.5, frozen=True, w=260)}{bag('m3-b', ['Mon', '3 oz'], fill=0.62, frozen=True, w=260)}{bag('m3-c', ['Tue', '4 oz'], fill=0.72, frozen=True, w=260)}
        </div>
        <div id="m3-oldest" class="tag" style="position:absolute;left:130px;top:560px">Use first</div>
        <div style="position:absolute;left:1000px;top:190px;width:824px">
          {items('m3-k', ['2 to 4 ounces, or one feeding', 'Leave about 1 inch at the top', 'Oldest first'], numbered=False)}
        </div>
      </div>
      <div class="panel" id="m3-thaw">
        <div class="h" style="position:absolute;left:96px;top:170px;font-size:66px">Thaw it one of three ways</div>
        <div style="position:absolute;left:96px;top:300px;width:1100px">
          {items('m3-t', ['In the refrigerator overnight', 'In warm or lukewarm water', 'Under lukewarm running water'])}
        </div>
        <div id="m3-mw" style="position:absolute;left:1360px;top:300px;text-align:center">{microwave('m3-mwsvg', 340)}<div class="lbl" style="margin-top:14px">Never microwave</div></div>
      </div>
      <div class="panel" id="m3-clock">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Worked example · Frozen bag moved to thaw</div>
        {timeline('m3-tl', [(110, 'Mon 8:00 p.m.', 'Moved to fridge'), (770, 'Tue 6:00 a.m.', 'Completely thawed'), (1430, 'Wed 6:00 a.m.', 'Use by')])}
        <div class="ask" id="m3-q" style="top:600px">Which event starts the clock?</div>
        <div class="answer" id="m3-a1" style="top:580px">✓ Completely thawed. Count 24 hours from Tue 6:00 a.m.</div>
        <div class="note" id="m3-a2" style="position:absolute;left:96px;right:96px;top:720px;text-align:center">Write the thawed time on the label. Not sure when it thawed? Ask before you use it.</div>
      </div>
      <div class="panel" id="m3-rules">
        <div style="position:absolute;left:96px;top:190px;width:1728px">
          <div class="rule" id="m3-r1" style="font-size:44px">Warmed or at room temperature: use within <b>2 hours</b></div>
          <div class="rule" id="m3-r2" style="font-size:44px;margin-top:26px">Thawed: <b>never refreeze</b></div>
        </div>
      </div>
      <div class="panel" id="m3-cool">
        <div style="position:absolute;left:120px;top:220px">{cooler('m3-cooler', 560)}</div>
        <div style="position:absolute;left:800px;top:190px;width:1024px">
          {items('m3-c', ['Insulated cooler with frozen ice packs: up to 24 hours', 'Then use right away, refrigerate, or freeze', 'Moving frozen milk: keep it frozen; age counts from first frozen'], numbered=False)}
        </div>
      </div>
      <div class="panel" id="m3-out">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Power outage · After the power comes back</div>
        <div style="position:absolute;left:110px;top:190px;text-align:center" id="m3-oa">{bag('m3-ba', ['Bag A', 'ice crystals'], fill=0.6, crystals=True, w=270)}</div>
        <div style="position:absolute;left:520px;top:190px;text-align:center" id="m3-ob">{bag('m3-bb', ['Bag B', 'liquid, cold'], fill=0.6, w=270)}</div>
        <div style="position:absolute;left:980px;top:220px;width:844px">
          <div class="lab" id="m3-ra"><div class="lk">Bag A</div>Still has ice crystals: can be refrozen</div>
          <div class="lab" id="m3-rb" style="margin-top:24px"><div class="lk">Bag B</div>Completely thawed but cold: refrigerate, use within the next day or throw away</div>
          <div class="note" id="m3-rp" style="margin-top:24px">Tell the parent what happened.</div>
        </div>
      </div>'''
    cd1, tw1 = countdown('m3-cd1', T('wh'), 20, 'Pause and decide')
    cd2, tw2 = countdown('m3-cd2', T('oh'), 20, 'Pause and decide')
    m += cd1 + cd2
    tw = panel('#m3-frz', 0.2, T('t1'))
    tw += [show('#m3-k1', T('f1')), show('#m3-k2', T('f2.1')), show('#m3-k3', T('f2.2')), show('#m3-oldest', T('f2.2'))]
    tw += panel('#m3-thaw', T('t1') - 0.2, T('w1'))
    tw += [show('#m3-t1', T('t1.1') + 1.6), show('#m3-t2', T('t1.1') + 3.6), show('#m3-t3', T('t1.1') + 5.4), show('#m3-mw', T('t1.2'))]
    tw += panel('#m3-clock', T('w1') - 0.2, T('w4'))
    tw += [show('#m3-tl-line', T('w1.1'), 0.5, 0), show('#m3-tl-s1', T('w1.2')), show('#m3-tl-s2', T('w1.3')), show('#m3-q', T('w1.4')), *tw1,
           hide('#m3-q', T('w2') - 0.2), show('#m3-a1', T('w2.1')), show('#m3-tl-s3', T('w2.2')),
           f"tl.to('#m3-tl-d2', {{ backgroundColor: '#8E3C2E', borderColor: '#8E3C2E', duration: 0.4 }}, {T('w2.1')});", show('#m3-a2', T('w3'))]
    tw += panel('#m3-rules', T('w4') - 0.2, T('c1'))
    tw += [show('#m3-r1', T('w4.1')), show('#m3-r2', T('w4.2'))]
    tw += panel('#m3-cool', T('c1') - 0.2, T('o1'))
    tw += [show('#m3-c1', T('c1.1')), show('#m3-c2', T('c1.2')), show('#m3-c3', T('c2'))]
    tw += panel('#m3-out', T('o1') - 0.2, T.dur)
    tw += [f"tl.set(['#m3-ra', '#m3-rb', '#m3-rp'], {{ opacity: 0 }}, 0);", show('#m3-oa', T('o1.4')), show('#m3-ob', T('o1.5')), *tw2,
           show('#m3-ra', T('o2')), show('#m3-rb', T('o3.1')), show('#m3-rp', T('o3.3'))]
    return m, tw


# ============================================================ 4 · Swirl, combine, and warm
S4 = [
    Say('s1', 'Stored breast milk often separates. The fat rises and forms a layer on top. That’s normal. CDC says to swirl the milk to mix the fat, which may have separated.'),
    Say('s2', 'Families sometimes ask whether they can shake it instead. The CDC and AAP pages we use recommend a gentle swirl, and they don’t say that shaking makes milk unsafe. In this course we demonstrate the swirl. If a family prefers a different method, follow their plan.'),
    Say('m1', 'What about adding fresh milk to milk that’s already chilled? CDC advises against mixing freshly expressed milk with already cooled or frozen milk, because it can rewarm the older milk. Cool the fresh milk first, then combine.'),
    Say('m2', 'When cooled milk from different times is combined, base the storage time on when the older milk was first stored.'),
    Say('m3', 'Practice. Milk expressed Monday at 7:00 a.m. was chilled right away. Milk expressed Monday at 7:00 p.m. is chilled, then combined with it. Which time sets the storage limit?'),
    Hold('mh', 15),
    Say('m4', 'Monday at 7:00 a.m., the older milk. Label the combined container with that time.'),
    Say('w1', 'Breast milk doesn’t need to be warmed. It can be served at room temperature or cold, if that’s what the family prefers.'),
    Say('w2', 'If you warm it, keep the container sealed. Place it in a bowl of warm water, or hold it under warm, but not hot, running water for a few minutes. Test the temperature with a few drops on your wrist before feeding.'),
    Say('w3', 'Never heat breast milk on the stove or in a microwave. Microwaves can create hot spots that can burn a baby’s mouth. And once milk is warmed, the 2 hour clock has started.'),
]


def v4(T):
    m = f'''
      <div class="panel" id="m4-sw">
        <div id="m4-bwrap" style="position:absolute;left:220px;top:180px;transform-origin:50% 90%">{separated_bottle('m4-bot', 300)}</div>
        <div class="tag" id="m4-fat" style="position:absolute;left:560px;top:290px">Fat layer</div>
        <div style="position:absolute;left:840px;top:200px;width:984px">
          <div class="h" style="font-size:72px">Swirl gently to mix the fat back in.</div>
          <div class="card" id="m4-shake" style="position:relative;margin-top:40px;padding:26px 32px"><div class="lbl">Can I shake it?</div><div class="body" style="margin-top:10px">Our sources recommend a gentle swirl and don’t say shaking makes milk unsafe. We demonstrate the swirl. Follow the family’s plan.</div></div>
        </div>
      </div>
      <div class="panel" id="m4-mix">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Combining milk</div>
        <div class="grid2" style="top:220px">
          <div class="cell" id="m4-x1"><div class="ev" style="margin:0 0 8px">Expressed and chilled</div><div class="time">Mon 7:00 a.m.</div></div>
          <div class="arrow" id="m4-x2">+</div>
          <div class="cell" id="m4-x3"><div class="ev" style="margin:0 0 8px">Expressed, then chilled first</div><div class="time">Mon 7:00 p.m.</div></div>
        </div>
        <div class="note" id="m4-cool" style="position:absolute;left:96px;right:96px;top:470px;text-align:center">Cool fresh milk before combining. Warm milk can rewarm older milk.</div>
        <div class="ask" id="m4-q" style="top:600px">Which time sets the storage limit?</div>
        <div class="answer" id="m4-a" style="top:590px">✓ Mon 7:00 a.m. The older milk sets the limit.</div>
      </div>
      <div class="panel" id="m4-warm">
        <div style="position:absolute;left:96px;top:190px;width:1150px">
          {items('m4-w', ['Cold or room temperature is fine. Warming is optional.', 'Keep it sealed. Warm water bowl or warm running water.', 'Test a few drops on your wrist.', 'Warmed? The 2 hour clock has started.'], numbered=False)}
        </div>
        <div id="m4-mw" style="position:absolute;left:1380px;top:230px;text-align:center">{microwave('m4-mwsvg', 340)}<div class="lbl" style="margin-top:14px">No microwave, no stove</div></div>
      </div>'''
    cd, cdt = countdown('m4-cd', T('mh'), 15, 'Pause and decide')
    m += cd
    sw = T('s1.4')
    tw = panel('#m4-sw', 0.2, T('m1'))
    tw += [show('#m4-fat', T('s1.2')),
           f"tl.to('#m4-bwrap', {{ rotation: 14, duration: 0.7, ease: 'sine.inOut' }}, {sw});",
           f"tl.to('#m4-bwrap', {{ rotation: -14, duration: 1.4, ease: 'sine.inOut' }}, {round(sw + 0.7, 2)});",
           f"tl.to('#m4-bwrap', {{ rotation: 10, duration: 1.2, ease: 'sine.inOut' }}, {round(sw + 2.1, 2)});",
           f"tl.to('#m4-bwrap', {{ rotation: 0, duration: 0.8, ease: 'sine.inOut' }}, {round(sw + 3.3, 2)});",
           f"tl.to('#m4-bot-mixed', {{ opacity: 1, duration: 3.0, ease: 'power1.inOut' }}, {round(sw + 0.6, 2)});",
           hide('#m4-fat', sw + 1.5), show('#m4-shake', T('s2'))]
    tw += panel('#m4-mix', T('m1') - 0.2, T('w1'))
    tw += [show('#m4-x1', T('m1.1')), show('#m4-x3', T('m1.2')), show('#m4-x2', T('m1.3'), 0.4, 0), show('#m4-cool', T('m1.3')),
           hide('#m4-cool', T('m3') - 0.2), show('#m4-q', T('m3.4')), *cdt, hide('#m4-q', T('m4') - 0.2), show('#m4-a', T('m4')),
           f"tl.to('#m4-x1', {{ backgroundColor: '#8E3C2E', borderColor: '#8E3C2E', color: '#FFFAF1', duration: 0.4 }}, {T('m4')});",
           f"tl.to('#m4-x1 .ev', {{ color: '#FFFAF1', duration: 0.4 }}, {T('m4')});"]
    tw += panel('#m4-warm', T('w1') - 0.2, T.dur)
    tw += [show('#m4-w1', T('w1')), show('#m4-w2', T('w2.1')), show('#m4-w3', T('w2.3')), show('#m4-mw', T('w3.1')), show('#m4-w4', T('w3.3'))]
    return m, tw


# ============================================================ 5 · Infant formula
S5 = [
    Say('t1', 'Now formula. It comes in three forms.'),
    Say('t2', 'Ready to feed formula is used as it is. Don’t add any water to it.'),
    Say('t3', 'Liquid concentrate and powder are mixed with water, but only as the label directs.'),
    Say('c1', 'Wash your hands well, and clean and sanitize the workspace. Bottles need to be clean and sanitized. If you use powdered formula, use water from a safe source. If the family isn’t sure their tap water is safe, they can contact the local health department.'),
    Say('c2', 'Measure exactly. Use the amount of water listed on the container, and measure the water first, then add the powder. Too much water may mean the formula won’t meet the baby’s nutritional needs. Too little can make the baby’s kidneys and digestive system work too hard.'),
    Say('c3', 'Never water formula down or make it stronger, unless the baby’s clinician has given different instructions.'),
    Say('e1', 'Let’s read a label. This is a teaching label, not a real product. It says: pour 4 fluid ounces of water into the bottle, then add 2 unpacked, level scoops of powder. What goes in first, and how much? Pause and answer.'),
    Hold('eh', 20),
    Say('e2', 'Water first, exactly 4 fluid ounces, then exactly 2 level scoops. Every product is different, so always follow the label on the container in front of you.'),
    Say('r1', 'Some babies need extra precautions with powdered formula: babies younger than 2 months, babies born prematurely, before 37 weeks, and babies with a weakened immune system.'),
    Say('r2', 'Powdered formula isn’t sterile and can sometimes contain germs such as Cronobacter. Infections are rare, but serious in infants.'),
    Say('r3', 'For these babies, CDC says to boil the water, then wait about 5 minutes before mixing it with the powder. Very hot water, around 158°F, is needed to kill these germs.'),
    Say('r4', 'After mixing, the formula is too hot to feed, so let it cool first. Test a few drops on your wrist. It should feel warm, not hot.'),
    Say('r5', 'If a baby has a clinician directed feeding plan, or uses a special formula, follow those instructions and the product directions. Ask before you assume.'),
    Say('s1', 'Keep an opened container of powdered formula in a cool, dry place with the lid tightly closed, not in the refrigerator. Check the label for how long it can be used after opening, and never use formula after its Use By date.'),
]


def v5(T):
    m = f'''
      <div class="panel" id="m5-forms">{formula_forms('m5-f')}</div>
      <div class="panel" id="m5-prep">
        <div style="position:absolute;left:96px;top:180px;width:1728px">
          {items('m5-p', ['Wash hands. Clean, sanitized bottles and workspace.', 'Safe water. Unsure about tap water? The family can ask the local health department.', 'Measure exactly: water first, then powder.', 'Never water it down or make it stronger, unless the baby’s clinician says so.'], numbered=False)}
        </div>
      </div>
      <div class="panel" id="m5-label">
        <div class="lab" id="m5-card" style="position:absolute;left:96px;top:180px;width:860px">
          <div class="lk">Teaching label · not a real product</div>
          <div style="margin-top:12px">1. Pour <b>4 fl oz</b> of water into the bottle.</div>
          <div>2. Add <b>2 unpacked, level scoops</b> of powder.</div>
          <div>3. Cap and mix well.</div>
        </div>
        <div class="ask" id="m5-q" style="left:1020px;right:96px;top:250px;text-align:left;font-size:60px">What goes in first, and how much?</div>
        <div id="m5-a" style="position:absolute;left:1020px;top:220px;width:804px">
          {items('m5-s', ['Water first: exactly 4 fl oz', 'Then exactly 2 level scoops', 'Follow the label on the container in front of you'], numbered=True)}
        </div>
      </div>
      <div class="panel" id="m5-risk">
        <div class="h" style="position:absolute;left:96px;top:160px;width:1700px;font-size:62px">Powdered formula: extra precautions</div>
        <div style="position:absolute;left:96px;top:280px;display:flex;gap:20px;flex-wrap:wrap;width:1728px">
          <span class="pill" id="m5-g1">Younger than 2 months</span><span class="pill" id="m5-g2">Born before 37 weeks</span><span class="pill" id="m5-g3">Weakened immune system</span>
        </div>
        <div style="position:absolute;left:96px;top:400px;width:1728px">
          {items('m5-r', ['Boil the water, then wait about 5 minutes', 'Mix while very hot, around 158°F, to kill germs such as Cronobacter', 'Cool the formula, then test on your wrist: warm, not hot'])}
        </div>
      </div>
      <div class="panel" id="m5-plan">
        <div class="card rule" id="m5-pl" style="left:96px;top:190px;width:1728px;padding:34px 46px"><div class="lbl">Clinician directed plan or special formula</div><div class="body" style="margin-top:12px;font-size:42px">Follow those instructions and the product directions. Ask before you assume.</div></div>
        <div class="card" id="m5-st" style="left:96px;top:450px;width:1728px;padding:34px 46px"><div class="lbl">Opened powder</div><div class="body" style="margin-top:12px;font-size:40px">Cool, dry place, lid tightly closed, not in the refrigerator. Check the label for how long it lasts once opened. Never use after the Use By date.</div></div>
      </div>'''
    cd, cdt = countdown('m5-cd', T('eh'), 20, 'Pause and answer')
    m += cd
    tw = panel('#m5-forms', 0.2, T('c1'))
    tw += [show('#m5-f-rtf', T('t2')), show('#m5-f-con', T('t3')), show('#m5-f-pow', T('t3') + 1.4)]
    tw += panel('#m5-prep', T('c1') - 0.2, T('e1'))
    tw += [show('#m5-p1', T('c1.1')), show('#m5-p2', T('c1.4')), show('#m5-p3', T('c2.2')), show('#m5-p4', T('c3'))]
    tw += panel('#m5-label', T('e1') - 0.2, T('r1'))
    tw += [f"tl.set('#m5-a', {{ opacity: 0 }}, 0);", show('#m5-card', T('e1.2')), show('#m5-q', T('e1.4')), *cdt,
           hide('#m5-q', T('e2') - 0.2), show('#m5-a', T('e2')), show('#m5-s1', T('e2')), show('#m5-s2', T('e2') + 2.6), show('#m5-s3', T('e2.2'))]
    tw += panel('#m5-risk', T('r1') - 0.2, T('r5'))
    tw += [show('#m5-g1', T('r1') + 3.5), show('#m5-g2', T('r1') + 5.3), show('#m5-g3', T('r1') + 7.6),
           show('#m5-r1', T('r3.1') + 2.0), show('#m5-r2', T('r3.2')), show('#m5-r3', T('r4'))]
    tw += panel('#m5-plan', T('r5') - 0.2, T.dur)
    tw += [show('#m5-st', T('s1'))]
    return m, tw


# ============================================================ 6 · Two milk clocks
S6 = [
    Say('f1', 'Now the two milk clocks. Prepared formula and expressed breast milk run on different events, so we keep them on separate timelines.'),
    Say('f2', 'Prepared formula: use it within 2 hours of preparation, and within 1 hour from when the feeding begins. If you won’t start using it within 2 hours, store it in the fridge right away and use it within 24 hours.'),
    Say('f3', 'And throw out any formula left in the bottle after the feed. Formula and the baby’s saliva can cause bacteria to grow.'),
    Say('fc', 'Worked case. Formula is prepared at 10:00 p.m. That sets a limit of midnight. The feed starts at 10:40 p.m. That sets a limit of 11:40 p.m. The feed ends at 11:05 p.m. with some formula left. When does it go?'),
    Hold('fh', 20),
    Say('fa', 'When the feed ends, at 11:05 p.m. Leftover formula is discarded then. The other limits don’t turn it into a bottle for later.'),
    Say('b1', 'Expressed breast milk. Once it’s brought to room temperature or warmed, use it within 2 hours. If the baby doesn’t finish, the leftover milk can be used within 2 hours after the baby finishes feeding. After that, it’s thrown away.'),
    Say('bc', 'Now an overlap. A bottle is warmed at 11:00 p.m. That warming clock ends at 1:00 a.m. The feed ends at 11:30 p.m. That leftover clock ends at 1:30 a.m. Which deadline applies?'),
    Hold('bh', 20),
    Say('ba', 'In this course we apply the earlier deadline: 1:00 a.m. A later event doesn’t restart a clock that’s already running. That’s how we combine the two CDC limits, and it’s marked for clinical review.'),
    Say('d1', 'One more difference to know. AAP’s HealthyChildren page says leftover milk may be quickly refrigerated and used for the next feeding. CDC says leftover milk is used within 2 hours, then thrown away. This course teaches the CDC rule. If the family’s pediatrician gives different instructions, follow the family’s plan and write it down.'),
]


def v6(T):
    m = f'''
      <div class="panel" id="m6-intro">
        <div style="position:absolute;left:96px;top:210px;width:820px">
          <div class="lbl">Clock 1</div><div class="h" style="font-size:72px;margin-top:10px">Prepared formula</div>
        </div>
        <div style="position:absolute;left:1000px;top:210px;width:824px">
          <div class="lbl">Clock 2</div><div class="h" style="font-size:72px;margin-top:10px">Expressed breast milk</div>
        </div>
        <div class="note" style="position:absolute;left:96px;right:96px;top:480px">Different events start each clock. Keep them on separate timelines.</div>
      </div>
      <div class="panel" id="m6-frule">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Prepared formula</div>
        <div style="position:absolute;left:96px;top:210px;width:1728px">
          {items('m6-fr', ['From preparation: use within 2 hours', 'From the start of the feed: use within 1 hour', 'Not starting within 2 hours? Fridge right away, use within 24 hours', 'Left in the bottle after the feed: throw it out'], numbered=False)}
        </div>
      </div>
      <div class="panel" id="m6-fcase">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Worked case · Prepared formula</div>
        {timeline('m6-ft', [(110, '10:00 p.m.', 'Prepared<br>Limit 12:00 a.m.'), (770, '10:40 p.m.', 'Feed starts<br>Limit 11:40 p.m.'), (1430, '11:05 p.m.', 'Feed ends')])}
        <div class="tag" id="m6-fdisc" style="position:absolute;left:1545px;top:220px">Discard</div>
        <div class="ask" id="m6-fq" style="top:640px">When does the leftover formula go?</div>
        <div class="answer" id="m6-fa" style="top:620px">✓ 11:05 p.m. Discard leftovers when the feed ends</div>
      </div>
      <div class="panel" id="m6-brule">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Expressed breast milk</div>
        <div style="position:absolute;left:96px;top:210px;width:1728px">
          {items('m6-br', ['Brought to room temperature or warmed: use within 2 hours', 'Left over after the feed: use within 2 hours after the baby finishes', 'After that: throw it away'], numbered=False)}
        </div>
      </div>
      <div class="panel" id="m6-bcase">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Worked case · Expressed breast milk</div>
        <div class="grid2" style="top:220px">
          <div class="cell" id="m6-b11"><div class="ev" style="margin:0 0 8px">Warmed</div><div class="time">11:00 p.m.</div></div>
          <div class="arrow" id="m6-b12">→</div>
          <div class="cell" id="m6-b13"><div class="ev" style="margin:0 0 8px">Warming limit</div><div class="time">1:00 a.m.</div></div>
          <div class="cell" id="m6-b21"><div class="ev" style="margin:0 0 8px">Feed ends</div><div class="time">11:30 p.m.</div></div>
          <div class="arrow" id="m6-b22">→</div>
          <div class="cell" id="m6-b23"><div class="ev" style="margin:0 0 8px">Leftover limit</div><div class="time">1:30 a.m.</div></div>
        </div>
        <div class="ask" id="m6-bq" style="top:650px">Which deadline applies?</div>
        <div class="answer" id="m6-ba" style="top:640px">✓ 1:00 a.m. In this course, the earlier deadline applies</div>
      </div>
      <div class="panel" id="m6-diff">
        <div class="h" style="position:absolute;left:96px;top:160px;font-size:66px">Leftover breast milk: the sources differ</div>
        <div class="card" id="m6-d1" style="left:96px;top:300px;width:840px;padding:30px 36px"><div class="lbl">AAP HealthyChildren</div><div class="body" style="margin-top:12px">Use within 2 hours, or quickly refrigerate and use for the next feeding.</div></div>
        <div class="card rule" id="m6-d2" style="left:984px;top:300px;width:840px;padding:30px 36px"><div class="lbl">CDC · taught in this course</div><div class="body" style="margin-top:12px">Use within 2 hours after the baby finishes. After 2 hours, throw it away.</div></div>
        <div class="note" id="m6-d3" style="position:absolute;left:96px;right:96px;top:640px">Pediatrician gave the family different instructions? Follow the family’s plan and write it down.</div>
      </div>'''
    cd1, t1 = countdown('m6-cd1', T('fh'), 20, 'Pause and decide')
    cd2, t2 = countdown('m6-cd2', T('bh'), 20, 'Pause and decide')
    m += cd1 + cd2
    tw = panel('#m6-intro', 0.2, T('f2'))
    tw += panel('#m6-frule', T('f2') - 0.2, T('fc'))
    tw += [show('#m6-fr1', T('f2.1')), show('#m6-fr2', T('f2.1') + 3.2), show('#m6-fr3', T('f2.2')), show('#m6-fr4', T('f3'))]
    tw += panel('#m6-fcase', T('fc') - 0.2, T('b1'))
    tw += [show('#m6-ft-line', T('fc.1'), 0.5, 0), show('#m6-ft-s1', T('fc.2')), show('#m6-ft-s2', T('fc.4')), show('#m6-ft-s3', T('fc.6')),
           show('#m6-fq', T('fc.7')), *t1, hide('#m6-fq', T('fa') - 0.2), show('#m6-fa', T('fa')), show('#m6-fdisc', T('fa') + 0.3, 0.4, 10),
           f"tl.to('#m6-ft-d3', {{ backgroundColor: '#8E3C2E', borderColor: '#8E3C2E', duration: 0.4 }}, {T('fa')});"]
    tw += panel('#m6-brule', T('b1') - 0.2, T('bc'))
    tw += [show('#m6-br1', T('b1.2')), show('#m6-br2', T('b1.3')), show('#m6-br3', T('b1.4'))]
    tw += panel('#m6-bcase', T('bc') - 0.2, T('d1'))
    tw += [show('#m6-b11', T('bc.2')), show('#m6-b12', T('bc.3'), 0.4, 0), show('#m6-b13', T('bc.3') + 0.3),
           show('#m6-b21', T('bc.4')), show('#m6-b22', T('bc.5'), 0.4, 0), show('#m6-b23', T('bc.5') + 0.3),
           show('#m6-bq', T('bc.6')), *t2, hide('#m6-bq', T('ba') - 0.2), show('#m6-ba', T('ba')),
           f"tl.to('#m6-b13', {{ backgroundColor: '#8E3C2E', borderColor: '#8E3C2E', color: '#FFFAF1', duration: 0.45 }}, {T('ba')});",
           f"tl.to('#m6-b13 .ev', {{ color: '#FFFAF1', duration: 0.45 }}, {T('ba')});"]
    tw += panel('#m6-diff', T('d1') - 0.2, T.dur)
    tw += [show('#m6-d1', T('d1.2')), show('#m6-d2', T('d1.3')), show('#m6-d3', T('d1.5'))]
    return m, tw


# ============================================================ 7 · The 2 a.m. bottle decision
S7 = [
    Say('s1', 'It’s 2:00 a.m. on Wednesday, and the baby is cueing to feed. These are teaching examples.'),
    Say('s2', 'The family’s plan: offer expressed milk from the fridge, use labeled milk only, and if no labeled milk is usable, wake a parent.'),
    Say('a', 'Container A is a bag expressed Sunday, frozen, then moved to the fridge Monday night. The label says it was completely thawed Tuesday at 4:00 p.m.'),
    Say('b', 'Container B is a bottle warmed at 11:20 p.m. The baby fed from it until 11:45 p.m. It has been on the nightstand since.'),
    Say('c', 'Container C is a bottle of milk in the fridge door, with no label.'),
    Say('t', 'For each one, choose use, discard, or set aside and verify. Name the rule you used. Then write one sentence you’d say to the parent in the morning. Pause the video if you need more time.'),
    Hold('h', 90),
    Say('ra', 'Container A: use it. It was completely thawed Tuesday at 4:00 p.m., so it can be used until Wednesday at 4:00 p.m., 24 hours from complete thaw. Once you warm it, the 2 hour clock starts.'),
    Say('rb', 'Container B: discard it. The warming clock ended at 1:20 a.m., and the leftover clock ended at 1:45 a.m. Both have passed.'),
    Say('rc', 'Container C: set it aside and verify. You can’t confirm which baby it’s for, what it contains, or how it was handled, and you can’t tell by looking. You have a usable labeled bag, so there’s no need to wake anyone for this one.'),
    Say('p', 'Now say your update out loud.'),
    Hold('ph', 15),
    Say('pm', 'Here’s one way to say it.'),
    Say('pc', 'At 2:00 a.m. I used the bag that thawed Tuesday afternoon. I threw out the bottle from the 11:20 p.m. feed because it was past 2 hours. There’s an unlabeled bottle in the fridge door. I set it aside so you can check it.', CAREGIVER),
    Say('e1', 'That’s the skill: what’s in it, what has happened to it, and which deadline applies.'),
    Say('e2', 'Keep the decision sheet with you on shift. When you’ve completed the required viewing, take the untimed five question quiz. Four correct answers earn your Certificate of Completion. Clickable sources are in the course resources.'),
    Gap(6),
]


def v7(T):
    def cont(k, title, lines, left):
        rows = ''.join(f'<div class="note" style="color:#30241F;margin-top:8px">{x}</div>' for x in lines)
        return f'<div class="card rule" id="m7-{k}" style="left:{left}px;top:330px;width:550px;height:470px;padding:26px 30px"><div class="h" style="font-size:46px">{title}</div>{rows}<div id="m7-{k}-ans" style="margin-top:18px"></div></div>'
    m = f'''
      <div class="panel" id="m7-case">
        <div class="tag" style="position:absolute;left:96px;top:150px">Teaching example · Wednesday 2:00 a.m.</div>
        <div class="card" id="m7-plan" style="left:96px;top:226px;width:1728px;padding:16px 28px"><div class="body" style="font-size:34px"><b>Family plan:</b> expressed milk from the fridge, labeled milk only. Nothing labeled usable? Wake a parent.</div></div>
        {cont('a', 'Container A', ['Bag expressed Sunday, frozen', 'Moved to fridge Monday night', 'Completely thawed Tue 4:00 p.m.'], 96)}
        {cont('b', 'Container B', ['Warmed 11:20 p.m.', 'Baby fed until 11:45 p.m.', 'On the nightstand since'], 685)}
        {cont('c', 'Container C', ['Bottle in the fridge door', 'Milk inside', 'No label'], 1274)}
      </div>
      <div class="panel" id="m7-ans">
        <div class="lbl" style="position:absolute;left:96px;top:150px">The reasoning</div>
        <div class="stack" style="left:96px;top:210px;width:1728px;gap:22px">
          <div class="card" id="m7-x1" style="position:relative;padding:22px 30px"><span class="ans use">Use</span> <b style="font-size:38px;margin-left:12px">Container A</b><div class="note" style="color:#30241F;margin-top:8px">Thawed Tue 4:00 p.m., so usable until Wed 4:00 p.m. (24 hours from complete thaw). Warm it and the 2 hour clock starts.</div></div>
          <div class="card" id="m7-x2" style="position:relative;padding:22px 30px"><span class="ans dis">Discard</span> <b style="font-size:38px;margin-left:12px">Container B</b><div class="note" style="color:#30241F;margin-top:8px">Warming limit 1:20 a.m. Leftover limit 1:45 a.m. Both have passed.</div></div>
          <div class="card" id="m7-x3" style="position:relative;padding:22px 30px"><span class="ans set">Set aside and verify</span> <b style="font-size:38px;margin-left:12px">Container C</b><div class="note" style="color:#30241F;margin-top:8px">Unknown baby, contents, and handling. Don’t guess. A labeled bag is usable, so no need to wake anyone.</div></div>
        </div>
      </div>
      <div class="panel" id="m7-say">
        <div class="tag" style="position:absolute;left:96px;top:150px">Say it out loud</div>
        <div class="bub" id="m7-sb" style="position:absolute;left:96px;top:250px;width:1728px"><div class="who">Caregiver, in the morning</div><div class="t">“At 2:00 a.m. I used the bag that thawed Tuesday afternoon. I threw out the bottle from the 11:20 p.m. feed because it was past 2 hours. There’s an unlabeled bottle in the fridge door. I set it aside so you can check it.”</div></div>
      </div>
      <div class="panel" id="m7-end">
        <div style="position:absolute;left:96px;top:190px;width:1728px">
          <div class="h" id="m7-e1" style="font-size:86px">What’s in it.</div>
          <div class="h" id="m7-e2" style="font-size:86px;margin-top:14px">What has happened to it.</div>
          <div class="h" id="m7-e3" style="font-size:86px;margin-top:14px;color:#8E3C2E">Which deadline applies.</div>
          <div id="m7-quiz" style="margin-top:40px;font:500 38px/1.4 'DM Sans'">Next: the untimed five question quiz. Four correct earns your Certificate of Completion. Clickable sources are in the course resources.</div>
        </div>
      </div>'''
    cd, cdt = countdown('m7-cd', T('h'), 90, 'Worksheet time')
    cd2, cdt2 = countdown('m7-cd2', T('ph'), 15, 'Say it out loud')
    m += cd + cd2
    tw = panel('#m7-case', 0.2, T('ra'))
    tw += [show('#m7-plan', T('s2')), show('#m7-a', T('a')), show('#m7-b', T('b')), show('#m7-c', T('c')), *cdt]
    tw += panel('#m7-ans', T('ra') - 0.2, T('p'))
    tw += [show('#m7-x1', T('ra')), show('#m7-x2', T('rb')), show('#m7-x3', T('rc'))]
    tw += panel('#m7-say', T('p') - 0.2, T('e1'))
    tw += [f"tl.set('#m7-sb', {{ opacity: 0 }}, 0);", *cdt2, show('#m7-sb', T('pc') - 0.3)]
    tw += panel('#m7-end', T('e1') - 0.2, T.dur)
    tw += [blur('#m7-e1', T('e1') + 0.3), blur('#m7-e2', T('e1') + 1.6), blur('#m7-e3', T('e1') + 3.2), show('#m7-quiz', T('e2.2'))]
    return m, tw


SCENES = [
    Scene('m1-open', 'Part 1 · The bottle in the fridge', S1, v1),
    Scene('m2-store', 'Part 2 · Label and store fresh milk', S2, v2),
    Scene('m3-freeze', 'Part 3 · Freeze, thaw, and transport', S3, v3),
    Scene('m4-swirl', 'Part 4 · Swirl, combine, and warm', S4, v4),
    Scene('m5-formula', 'Part 5 · Infant formula', S5, v5),
    Scene('m6-clocks', 'Part 6 · Two milk clocks', S6, v6),
    Scene('m7-decision', 'Part 7 · The 2:00 a.m. bottle decision', S7, v7, sfx=[('h', 30), ('h', 60)]),
]

if __name__ == '__main__':
    total, cues = build_lesson(PROJECT, SCENES, CSS)
    # The parent's line plays from the fridge clip, so add its caption by hand.
    at = INTRO
    cues = sorted(cues + [(at + CLIP_SPEECH[0], at + CLIP_SPEECH[1], CLIP_CAPTION)])
    write_vtt(PROJECT / 'captions.en.vtt', cues)
    print(f'runtime {total:.1f} s ({total / 60:.1f} min), {len(cues)} caption lines')
