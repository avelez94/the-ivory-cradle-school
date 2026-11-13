"""Feeding Support on Shift: the seven scene workshop.

Builds video/feeding-support-on-shift/{index.html, compositions/*.html, assets/voice/*.wav,
captions.en.vtt, timeline.json} from the approved lesson script. Scene timing follows the
recorded narration, and practice pauses keep the lengths the script specifies.

Run from the repo root:  $HYPERFRAMES_PYTHON video/build-feeding.py
Then:  cd video/feeding-support-on-shift && npx hyperframes check && npx hyperframes render

Voices: narrator Kokoro Heart (af_heart), parent af_sarah, caregiver af_bella.
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / 'lib'))
from icsvideo import (CAREGIVER, NARRATOR, PARENT, Gap, Hold, Say, Scene, blur, build_lesson,  # noqa: E402
                      countdown, hide, highlight, panel, show)

PROJECT = HERE / 'feeding-support-on-shift'

CSS = """
.photo { position: absolute; object-fit: cover; box-shadow: 0 20px 50px rgba(48,36,31,.18); }
.stack { position: absolute; display: flex; flex-direction: column; gap: 26px; }
.bub { background: #FFFAF1; border: 2px solid #D6C4B4; border-left: 8px solid #8E3C2E; padding: 24px 34px 28px; }
.bub.parent { border-left-color: #30241F; }
.bub .t { font: 500 40px/1.32 'DM Sans'; }
.field { padding: 14px 0 16px; border-bottom: 2px solid #E4D6C6; }
.field:last-child { border-bottom: 0; }
.field .k { font: 700 28px 'DM Sans'; letter-spacing: .1em; text-transform: uppercase; color: #8E3C2E; }
.field .v { font: 500 31px/1.3 'DM Sans'; margin-top: 6px; }
.item { display: flex; gap: 24px; align-items: baseline; font: 500 36px/1.3 'DM Sans'; padding: 16px 20px; border-bottom: 2px solid #E4D6C6; }
.item b { font: 800 34px 'Bricolage Grotesque'; color: #8E3C2E; width: 44px; flex: none; }
.note { font: 500 34px/1.35 'DM Sans'; color: #69554A; }
.big { font: 500 50px/1.3 'DM Sans'; }
.tag { display: inline-block; font: 700 28px 'DM Sans'; letter-spacing: .1em; text-transform: uppercase; padding: 10px 18px; background: #8E3C2E; color: #FFFAF1; }
.tl { position: absolute; left: 140px; right: 140px; height: 6px; background: #30241F; }
.stop { position: absolute; width: 380px; text-align: center; }
.stop .dot { width: 34px; height: 34px; border-radius: 50%; background: #FFFAF1; border: 6px solid #30241F; margin: 0 auto 18px; }
.stop .time { font: 800 64px/1 'Bricolage Grotesque'; letter-spacing: -0.03em; }
.stop .ev { font: 500 34px 'DM Sans'; color: #69554A; margin-top: 10px; }
.ask { position: absolute; left: 96px; right: 96px; text-align: center; font: 800 64px/1.1 'Bricolage Grotesque'; letter-spacing: -0.03em; color: #8E3C2E; }
.answer { position: absolute; left: 96px; right: 96px; padding: 28px 40px; font: 700 50px/1.2 'DM Sans'; text-align: center; background: #8E3C2E; color: #FFFAF1; }
.grid2 { position: absolute; left: 96px; right: 96px; display: grid; grid-template-columns: 1fr 120px 1fr; align-items: center; row-gap: 34px; }
.cell { background: #FFFAF1; border: 3px solid #30241F; padding: 26px 34px; }
.cell .time { font: 800 66px/1 'Bricolage Grotesque'; letter-spacing: -0.03em; }
.cell .ev { font: 500 34px 'DM Sans'; color: #69554A; margin-top: 10px; }
.arrow { font: 800 70px 'Bricolage Grotesque'; color: #8E3C2E; text-align: center; }
.rule { font: 500 38px/1.3 'DM Sans'; padding: 20px 26px; border-left: 6px solid #D6C4B4; }
.rule b { font-weight: 700; }
.col { position: absolute; top: 200px; width: 540px; }
.col .lbl { margin-bottom: 14px; }
.strike { position: relative; display: inline-block; }
.strike i { position: absolute; left: -10px; right: -10px; top: 52%; height: 8px; background: #8E3C2E; transform-origin: left center; }
.task { display: flex; gap: 24px; align-items: baseline; font: 500 38px/1.3 'DM Sans'; padding: 20px 26px; border: 3px solid transparent; }
.task b { font: 800 36px 'Bricolage Grotesque'; color: #8E3C2E; flex: none; width: 40px; }
"""


def bottle(label_lines, fill=0.62, unlabeled=False, sid='b', width=280):
    """A capped bottle with its label in words. Drawn, since no bottle photo was supplied."""
    h = width * 410 / 240
    milk_top = 150 + (1 - fill) * 250
    if unlabeled:
        label = '<rect x="34" y="226" width="172" height="128" fill="none" stroke="#69554A" stroke-width="4" stroke-dasharray="10 9"/><text x="120" y="312" text-anchor="middle" font-family="Bricolage Grotesque" font-weight="800" font-size="64" fill="#69554A">?</text>'
    else:
        tspans = ''.join(f'<text x="120" y="{300 + i * 32 - (len(label_lines) - 1) * 16}" text-anchor="middle" font-family="DM Sans" font-weight="700" font-size="25" fill="#30241F">{t}</text>' for i, t in enumerate(label_lines))
        label = f'<rect x="28" y="226" width="184" height="128" fill="#FFFAF1" stroke="#30241F" stroke-width="3"/>{tspans}'
    return f'''<svg id="{sid}" width="{width}" height="{h:.0f}" viewBox="0 0 240 410" aria-hidden="true">
  <rect x="74" y="0" width="92" height="74" rx="18" fill="#8E3C2E"/>
  <rect x="58" y="64" width="124" height="40" rx="8" fill="#30241F"/>
  <rect x="16" y="104" width="208" height="300" rx="36" fill="#FFFFFF" stroke="#30241F" stroke-width="6"/>
  <clipPath id="{sid}-clip"><rect x="19" y="107" width="202" height="294" rx="33"/></clipPath>
  <rect x="16" y="{milk_top:.0f}" width="208" height="300" fill="#F3E7CF" clip-path="url(#{sid}-clip)"/>
  {''.join(f'<line x1="196" y1="{y}" x2="218" y2="{y}" stroke="#30241F" stroke-width="3"/>' for y in (130, 160, 190, 380))}
  {label}
</svg>'''


def items(prefix, rows, numbered=True):
    return '\n'.join(
        f'<div class="item" id="{prefix}{i}">{f"<b>{i}</b>" if numbered else ""}<span>{r}</span></div>'
        for i, r in enumerate(rows, 1))


def glow(sel, at, until=None):
    tw = [f"tl.fromTo('{sel}', {{ backgroundColor: 'rgba(240,223,201,0)' }}, {{ backgroundColor: 'rgba(240,223,201,1)', duration: 0.4, ease: 'power2.out' }}, {round(at, 2)});"]
    if until is not None:
        tw.append(f"tl.to('{sel}', {{ backgroundColor: 'rgba(240,223,201,0)', duration: 0.4, ease: 'power2.in' }}, {round(until, 2)});")
    return tw


# ============================================================ 1 · The bottle in the fridge
S1 = [
    Say('p1', 'There’s a bottle in the fridge if you need it.', PARENT),
    Say('n1', 'You’ve just arrived for an overnight shift, and that is the first thing the parent tells you. You could nod, put your bag away, and assume the bottle is for the next feed. But that one sentence leaves several decisions open.'),
    Say('q1', 'Do they want you to bring the baby to them to nurse first?'),
    Say('q2', 'Is this bottle intended for this baby and this shift?'),
    Say('q3', 'When do they want to hear from you if a feed goes differently?'),
    Say('n3', 'Tonight we’ll follow that same shift from arrival to morning handoff. You’ll hear what to ask, watch a bottle feeding demonstration, and work through two timelines that look similar but have different rules. Keep the worksheet nearby. You’ll use it to write a read back and a parent update before the quiz.'),
    Say('n4', 'A useful feeding plan tells you what to do when things go as expected, and how to reach someone when they don’t. The examples in this workshop are fictional. The times and amounts you’ll see are details to document, never targets to apply to another baby.'),
    Say('pr', 'Your first practice. Write one question you would ask that parent before they go to bed.'),
    Hold('h1', 20),
    Say('n5', 'That one sentence could point two ways. Bring the baby to the parent to nurse. Or offer a bottle, if that is what you agreed.'),
    Say('r1', 'Here is one question that settles it.'),
    Say('r2', 'When baby is ready, would you like me to bring them to you first, and under what circumstances should I use this bottle?', CAREGIVER),
]


def v1(T):
    m = f'''
      <div class="panel" id="f1-title">
        <img src="assets/wordmark.png" alt="" style="position:absolute;left:710px;top:220px;width:500px">
        <div class="h" style="position:absolute;left:0;right:0;top:470px;text-align:center;font-size:118px">Feeding Support on Shift</div>
        <div class="lbl" style="position:absolute;left:0;right:0;top:640px;text-align:center">Mini course 02 · Workshop edition</div>
      </div>
      <div class="panel" id="f1-fr">
        <img class="photo" src="assets/fridge.jpg" alt="" style="left:780px;top:150px;width:1044px;height:640px">
        <div class="bub parent" style="position:absolute;left:96px;top:250px;width:640px">
          <div class="who">Parent</div><div class="t" style="font-size:52px">“There’s a bottle in the fridge if you need it.”</div>
        </div>
        <div class="note" id="f1-open" style="position:absolute;left:96px;top:640px;width:640px">One sentence. Several decisions still open.</div>
      </div>
      <div class="panel" id="f1-qs">
        <div class="h" style="position:absolute;left:96px;top:170px;width:1500px;font-size:76px">What that sentence leaves open</div>
        <div style="position:absolute;left:96px;top:330px;width:1500px">
          {items('f1-q', ['Nurse first? Should baby come to the parent before any bottle?', 'Which bottle? Is it meant for this baby and this shift?', 'When to call? When do they want to hear from you?'])}
        </div>
      </div>
      <div class="panel" id="f1-map">
        <img class="photo" src="assets/worksheet.png" alt="" style="left:1300px;top:150px;width:500px;height:647px;object-fit:contain;background:#fff">
        <div class="h" style="position:absolute;left:96px;top:170px;width:1100px;font-size:76px">Tonight’s shift</div>
        <div style="position:absolute;left:96px;top:320px;width:1100px">
          {items('f1-m', ['Arrival: what to ask', 'Feeding: a responsive bottle demonstration', 'Milk clocks: two timelines, different rules', 'Morning: a factual handoff'])}
        </div>
        <div class="note" id="f1-ws" style="position:absolute;left:96px;top:720px;width:1100px">Keep the worksheet nearby for the read back and the parent update.</div>
      </div>
      <div class="panel" id="f1-rule">
        <div class="h" style="position:absolute;left:96px;top:200px;width:1500px;font-size:78px">A useful plan covers what to do when things go as expected, and how to reach someone when they don’t.</div>
        <div class="card rule" id="f1-fict" style="left:96px;top:560px;width:1300px;padding:28px 40px"><div class="big">Every example here is fictional. Times and amounts are details to document, never targets for another baby.</div></div>
      </div>
      <div class="panel" id="f1-prac">
        <div class="tag" style="position:absolute;left:96px;top:150px">Practice</div>
        <div class="bub parent" id="f1-pq" style="position:absolute;left:96px;top:240px;width:880px"><div class="who">Parent</div><div class="t">“There’s a bottle in the fridge if you need it.”</div></div>
        <div class="h" id="f1-pp" style="position:absolute;left:96px;top:520px;width:1500px;font-size:66px">Write one question you would ask.</div>
        <svg id="f1-branch" style="position:absolute;left:1040px;top:240px" width="300" height="380" viewBox="0 0 300 380"><path d="M0 190 H120 M120 190 V60 H300 M120 190 V320 H300" fill="none" stroke="#30241F" stroke-width="6"/></svg>
        <div class="chip" id="f1-b1" style="position:absolute;left:1360px;top:260px">Bring baby to nurse</div>
        <div class="chip" id="f1-b2" style="position:absolute;left:1360px;top:520px">Offer a bottle if agreed</div>
        <div class="bub" id="f1-rv" style="position:absolute;left:96px;top:520px;width:1728px"><div class="who">Ask</div><div class="t" style="font-size:44px">“When baby is ready, would you like me to bring them to you first, and under what circumstances should I use this bottle?”</div></div>
      </div>'''
    cd_html, cd_tw = countdown('f1-cd', T('h1'), 20)
    m += cd_html
    tw = panel('#f1-title', 0, T('p1') - 0.1)
    tw += panel('#f1-fr', T('p1') - 0.3, T('q1'))
    tw += [show('#f1-open', T('n1.3'))]
    tw += panel('#f1-qs', T('q1') - 0.3, T('n3'))
    tw += [show('#f1-q1', T('q1')), show('#f1-q2', T('q2')), show('#f1-q3', T('q3'))]
    tw += panel('#f1-map', T('n3'), T('n4'))
    tw += [show('#f1-m1', T('n3.2')), show('#f1-m2', T('n3.2') + 1.6), show('#f1-m3', T('n3.2') + 3.6), show('#f1-m4', T('n3.2') + 6.2), show('#f1-ws', T('n3.3'))]
    tw += panel('#f1-rule', T('n4'), T('pr'))
    tw += [show('#f1-fict', T('n4.2'))]
    tw += panel('#f1-prac', T('pr') - 0.2, T.dur)
    tw += [show('#f1-pp', T('pr.2')), *cd_tw, hide('#f1-pp', T.end('h1')),
           show('#f1-branch', T('n5'), 0.5, 0), show('#f1-b1', T('n5.2')), show('#f1-b2', T('n5.3')),
           hide('#f1-branch', T('r1')), hide('#f1-b1', T('r1')), hide('#f1-b2', T('r1')), show('#f1-rv', T('r2'))]
    return m, tw


# ============================================================ 2 · Make the plan explicit
S2 = [
    Say('c1', 'When was the last feed? What would you like me to do when the baby cues again?', CAREGIVER),
    Say('p1', 'They nursed around eight. Please bring them to me first. The bottle is backup if I ask for it.', PARENT),
    Say('c2', 'Which bottle is it, and when was it prepared or stored?', CAREGIVER),
    Say('p2', 'It’s the bottle labeled expressed milk, with today’s date. Let’s check its storage time together.', PARENT),
    Say('c3', 'If the baby takes less than usual, or the feed doesn’t go as expected, should I wake you right away? What’s the best way to reach you?', CAREGIVER),
    Say('p3', 'Yes, knock on my door. If you’re unsure which bottle to use, ask me first.', PARENT),
    Say('n1', 'Notice how each question removes a decision you otherwise might have had to make alone.'),
    Say('n2', 'Start with what happened last. Mark approximate times as approximate.'),
    Say('n3', 'Next, agree on the plan for the next feed, including whether the parent wants to nurse, offer a bottle, or use another arrangement already agreed with the family.'),
    Say('n4', 'If there are two bottles, or more than one baby, confirm the intended bottle.'),
    Say('n5', 'Ask about written clinician instructions, and resolve discrepancies before you take over. If the family says a clinician gave a specific plan you can’t verify or carry out, involve the parent and ask them to clarify with their care team.'),
    Say('n6', 'Then read the plan back in your own words.'),
    Say('rb', 'Bring baby to you first. Use the confirmed backup only if you ask. Knock if the baby takes less than usual, or the bottle details aren’t clear.', CAREGIVER),
    Say('n7', 'A read back gives the parent a chance to correct you while they are still available.'),
    Say('x1', 'Now a different family. At handoff, this parent says:'),
    Say('xq', 'Only wake me if it’s important.', PARENT),
    Say('x2', 'What counts as important? Write an observable trigger, and the way you will reach them.'),
    Hold('h1', 30),
    Say('x3', 'Here is one example.'),
    Say('x4', 'If the baby repeatedly takes less than usual, or I can’t confirm the bottle’s storage history, should I knock or call?', CAREGIVER),
    Say('x5', 'It names what you will watch for and how you will reach them, so the parent can agree or change it while they are still awake.'),
]

FIELDS = [('Last feed', 'Nursed around 8 p.m. (approximate)'),
          ('Next feed', 'Bring baby to parent to nurse first'),
          ('Bottle', 'Labeled expressed milk; check storage time'),
          ('Call back', 'Knock if a feed is smaller than usual'),
          ('Clinician plan', 'Ask for written instructions first')]


def v2(T):
    fields = '\n'.join(f'<div class="field" id="f2-f{i}"><div class="k">{k}</div><div class="v" id="f2-v{i}">{v}</div></div>' for i, (k, v) in enumerate(FIELDS, 1))
    pairs = [('c1', 'p1'), ('c2', 'p2'), ('c3', 'p3')]
    lines = {s.id: s.text for s in S2 if isinstance(s, Say)}
    dlg = ''
    for i, (c, p) in enumerate(pairs, 1):
        dlg += f'''
      <div class="panel stack" id="f2-d{i}" style="left:96px;top:160px;width:840px">
        <div class="bub" id="f2-{c}"><div class="who">Caregiver</div><div class="t">“{lines[c]}”</div></div>
        <div class="bub parent" id="f2-{p}"><div class="who">Parent</div><div class="t">“{lines[p]}”</div></div>
      </div>'''
    m = dlg + f'''
      <div class="panel" id="f2-pl"><div class="card rule" style="left:1000px;top:150px;width:824px;padding:24px 40px 20px">
        <div class="h" style="font-size:50px;margin-bottom:6px">Feeding plan</div>
        {fields}
      </div></div>
      <div class="panel" id="f2-why" style="left:96px;top:160px;width:840px;right:auto">
        <div class="h" style="font-size:62px">Each question removes a decision you would otherwise make alone.</div>
        <div class="stack" style="position:relative;margin-top:44px;gap:20px">
          <div class="note" id="f2-w1">Mark approximate times as approximate.</div>
          <div class="note" id="f2-w2">Agree on nursing, a bottle, or another arrangement.</div>
          <div class="note" id="f2-w3">Two bottles or two babies? Confirm the intended bottle.</div>
          <div class="note" id="f2-w4">A plan you can’t verify? Involve the parent.</div>
        </div>
      </div>
      <div class="panel" id="f2-rb" style="left:96px;top:160px;width:840px;right:auto">
        <div class="tag">Read it back</div>
        <div class="bub" style="margin-top:28px"><div class="who">Caregiver</div><div class="t">“Bring baby to you first. Use the confirmed backup only if you ask. Knock if the baby takes less than usual, or the bottle details aren’t clear.”</div></div>
        <div class="note" id="f2-rbn" style="margin-top:30px">The parent can correct you while they are still available.</div>
      </div>
      <div class="panel" id="f2-prac">
        <div class="tag" style="position:absolute;left:96px;top:150px">Practice</div>
        <div class="bub parent" style="position:absolute;left:96px;top:240px;width:1000px"><div class="who">Parent</div><div class="t" style="font-size:52px">“Only wake me if it’s important.”</div></div>
        <div class="h" id="f2-pp" style="position:absolute;left:96px;top:520px;width:1600px;font-size:62px">Write an observable trigger and the way you will reach them.</div>
        <div class="bub" id="f2-ex" style="position:absolute;left:96px;top:470px;width:1728px"><div class="who">Example</div><div class="t" style="font-size:44px">“If the baby repeatedly takes less than usual, or I can’t confirm the bottle’s storage history, should I knock or call?”</div></div>
        <div class="note" id="f2-exn" style="position:absolute;left:96px;top:740px;width:1728px">What you will watch for, plus how you will reach them.</div>
      </div>'''
    cd_html, cd_tw = countdown('f2-cd', T('h1'), 30)
    m += cd_html
    tw = []
    ends = [T('c2'), T('c3'), T('n1')]
    for i, (c, p) in enumerate(pairs, 1):
        tw += panel(f'#f2-d{i}', T(c) - 0.3, ends[i - 1])
        tw += [show(f'#f2-{c}', T(c) - 0.2), show(f'#f2-{p}', T(p) - 0.2)]
    tw += panel('#f2-pl', 0.3, T('x1'))
    for i in range(1, 6):
        tw.append(f"tl.set('#f2-v{i}', {{ opacity: 0 }}, 0);")
    for i, at in enumerate([T('p1.1'), T('p1.2'), T('p2.1'), T('p3.1'), T('n5.1')], 1):
        tw.append(f"tl.to('#f2-v{i}', {{ opacity: 1, duration: 0.45, ease: 'power2.out' }}, {round(at + 0.3, 2)});")
        tw += glow(f'#f2-f{i}', at + 0.3, at + 2.6)
    tw += panel('#f2-why', T('n1') - 0.2, T('n6'))
    tw += [show('#f2-w1', T('n2.2')), show('#f2-w2', T('n3')), show('#f2-w3', T('n4')), show('#f2-w4', T('n5.2'))]
    tw += glow('#f2-f1', T('n2'), T('n3'))
    tw += glow('#f2-f2', T('n3'), T('n4'))
    tw += glow('#f2-f3', T('n4'), T('n5'))
    tw += panel('#f2-rb', T('n6') - 0.2, T('x1'))
    tw += [show('#f2-rbn', T('n7'))]
    tw += panel('#f2-prac', T('x1') - 0.2, T.dur)
    tw += [show('#f2-pp', T('x2')), *cd_tw, hide('#f2-pp', T.end('h1')), show('#f2-ex', T('x4') - 0.3), show('#f2-exn', T('x5'))]
    return m, tw


# ============================================================ 3 · Responsive bottle feeding
S3 = [
    Say('n1', 'Start with clean hands and clean feeding supplies. Check the label against the plan before you bring the bottle over.'),
    Say('n2', 'In this demonstration, the parent has asked us to offer the confirmed bottle. Watch how the caregiver holds the baby close, and keeps hold of the bottle.'),
    Say('n3', 'The bottle is angled, rather than held vertically. That gives the baby more control over the feed.'),
    Say('n4', 'This is a demonstration of routine responsive feeding, so a baby with a clinician directed feeding plan may need different instructions.'),
    Say('n5', 'Now watch the caregiver slow down. When the baby wants a break, make room for that pause. In real life, you’re watching the baby throughout the feed.'),
    Say('n6', 'If the baby closes their mouth, turns away, or keeps showing that they are done, end the feed. How much is left in the bottle is information for the log. It does not tell you to keep feeding.'),
    Say('g1', 'Here is the label check and the clean setup. The caregiver keeps the baby close and remains with them throughout the feed.'),
    Hold('gh1', 16),
    Say('g2', 'Here is the pause. Notice that the caregiver is watching the baby’s face, and allowing the baby a break.'),
    Hold('gh2', 16),
    Say('g3', 'Here is the end of the feed. The caregiver records the amount if measured, and checks the correct handling rule for what is left.'),
    Hold('gh3', 16),
    Say('pr', 'Your turn. The baby turns away twice, and keeps their mouth closed. Pause, stop, or continue?'),
    Hold('h1', 20),
    Say('rv', 'Stop when the baby continues to signal fullness. If the amount differs from what the parent expected, record what you observed, and use the agreed call back plan. Never prop the bottle, or pressure the baby to finish.'),
]

GUIDE = [
    ('holding.jpg', 'Label check and setup', ['Label matches the plan', 'Clean hands and supplies', 'Baby held close, with support', 'Caregiver stays for the whole feed']),
    ('baby.jpg', 'The pause', ['Eyes on the baby’s face', 'Bottle eased back for a break', 'Baby sets the pace']),
    ('handoff.jpg', 'End of the feed', ['Amount recorded, if measured', 'Correct rule for what is left', 'No pressure to finish']),
]


def v3(T):
    guide = ''
    for i, (img, title, pts) in enumerate(GUIDE, 1):
        pos = 'object-position:50% 30%' if img == 'baby.jpg' else ''
        guide += f'''
      <div class="panel" id="f3-g{i}">
        <img class="photo" src="assets/{img}" alt="" style="left:96px;top:150px;width:960px;height:640px;{pos}">
        <div style="position:absolute;left:1120px;top:160px;width:704px">
          <div class="lbl">Demonstration {i} of 3</div>
          <div class="h" style="font-size:66px;margin:12px 0 26px">{title}</div>
          {items(f"f3-g{i}p", pts, numbered=False)}
        </div>
      </div>'''
    m = f'''
      <div class="panel" id="f3-a">
        <img class="photo" src="assets/holding.jpg" alt="" style="left:96px;top:150px;width:900px;height:640px">
        <div style="position:absolute;left:1060px;top:160px;width:764px">
          {items('f3-a', ['Clean hands, clean supplies', 'Check the label against the plan', 'Hold baby close, with support', 'Keep hold of the bottle', 'Angle it; never hold it vertical'])}
          <div class="note" id="f3-cl" style="margin-top:26px">Routine responsive feeding. A clinician directed plan comes first.</div>
        </div>
      </div>
      <div class="panel" id="f3-b">
        <img class="photo" src="assets/baby.jpg" alt="" style="left:96px;top:150px;width:640px;height:640px;object-position:50% 30%">
        <div style="position:absolute;left:820px;top:160px;width:1004px">
          <div class="h" style="font-size:66px">Let the baby set the pace</div>
          <div class="note" id="f3-b1" style="margin-top:24px">Make room for a pause. Watch the baby throughout.</div>
          <div class="lbl" id="f3-b2" style="margin-top:46px">Signs the baby is done</div>
          <div id="f3-b3" style="display:flex;gap:18px;margin-top:18px;flex-wrap:wrap"><span class="chip">Closes mouth</span><span class="chip">Turns away</span><span class="chip">Keeps signaling done</span></div>
          <div class="card rule" id="f3-b4" style="position:relative;margin-top:44px;padding:22px 30px"><div class="body">What is left in the bottle is information for the log, not a reason to keep feeding.</div></div>
        </div>
      </div>
      {guide}
      <div class="panel" id="f3-p">
        <div class="tag" style="position:absolute;left:96px;top:150px">Practice</div>
        <div class="card rule" style="left:96px;top:240px;width:1728px;padding:36px 48px"><div class="h" style="font-size:66px">Baby turns away twice and keeps their mouth closed.</div></div>
        <div style="position:absolute;left:96px;top:520px;display:flex;gap:30px">
          <span class="chip" id="f3-c1">Pause</span><span class="chip" id="f3-c2">Stop</span><span class="chip" id="f3-c3">Continue</span>
        </div>
        <div class="note" id="f3-pn" style="position:absolute;left:96px;top:650px;width:1728px">Record what you observed. Use the agreed call back plan. Never prop the bottle or pressure the baby to finish.</div>
      </div>'''
    cd_html, cd_tw = countdown('f3-cd', T('h1'), 20, 'Pause and choose')
    m += cd_html
    tw = panel('#f3-a', 0.2, T('n5'))
    tw += [show('#f3-a1', T('n1.1')), show('#f3-a2', T('n1.2')), show('#f3-a3', T('n2.2')), show('#f3-a4', T('n2.2') + 2.2),
           show('#f3-a5', T('n3')), show('#f3-cl', T('n4'))]
    tw += panel('#f3-b', T('n5') - 0.2, T('g1'))
    tw += [show('#f3-b1', T('n5.2')), show('#f3-b2', T('n6')), show('#f3-b3', T('n6') + 0.3), show('#f3-b4', T('n6.2'))]
    for i, (gid, hid) in enumerate([('g1', 'gh1'), ('g2', 'gh2'), ('g3', 'gh3')], 1):
        tw += panel(f'#f3-g{i}', T(gid) - 0.2, T.end(hid) + 0.2)
        n = len(GUIDE[i - 1][2])
        for j in range(1, n + 1):
            at = T(gid) + 1.0 + (T.end(hid) - T(gid) - 3.5) * (j - 1) / max(1, n - 1)
            tw.append(show(f'#f3-g{i}p{j}', at))
            tw += glow(f'#f3-g{i}p{j}', at, at + 2.2)
    tw += panel('#f3-p', T('pr') - 0.2, T.dur)
    tw += [show('#f3-c1', T('pr.3')), show('#f3-c2', T('pr.3') + 0.4), show('#f3-c3', T('pr.3') + 0.8), *cd_tw,
           highlight('#f3-c2', T('rv')), hide('#f3-c1', T('rv'), 0.4), hide('#f3-c3', T('rv'), 0.4), show('#f3-pn', T('rv.2'))]
    return m, tw


# ============================================================ 4 · Compare the two milk clocks
S4 = [
    Say('o1', 'Here are two capped bottles. One holds prepared formula. The other holds expressed breast milk. Start with the type of milk. Then ask which event started the clock.'),
    Say('f1', 'For prepared infant formula at room temperature, use it within two hours of preparation, and within one hour of starting the feed. Both limits matter.'),
    Say('f2', 'If freshly prepared formula won’t be used promptly, refrigerate it right away and use it within twenty four hours, following CDC storage guidance.'),
    Say('f3', 'When a formula feed ends, discard what the baby left in that bottle.'),
    Say('a1', 'Here’s the first timeline. The formula is prepared at 10:00 p.m. The baby starts feeding at 10:30 p.m. The feed ends at 10:45 p.m. There’s some formula left.'),
    Say('a2', 'When should you discard what’s left?'),
    Hold('ha', 25),
    Say('a3', 'Discard it when the feed ends, at 10:45 p.m. The one hour window from the start of the feed does not turn leftovers into a bottle for later. Write the event that controls the decision, not just the time.'),
    Say('b0', 'Now change the label to expressed breast milk.'),
    Say('b1', 'CDC says to use it within two hours after it is warmed or brought to room temperature. If there’s expressed milk left after a feed, use it within two hours after the feed ends, while respecting any earlier limit that applies. Warming or feeding does not restart a deadline that already applies.'),
    Say('b2', 'This bottle was warmed at 11:00 p.m. That starts a warming limit of 1:00 a.m.'),
    Say('b3', 'The feed ends at 11:30 p.m. That starts a leftover limit of 1:30 a.m.'),
    Say('b4', 'Which deadline comes first?'),
    Say('b5', 'For this case, assume no earlier storage limit applies.'),
    Hold('hb', 30),
    Say('b6', '1:00 a.m. comes first. Two different events started those clocks. You don’t get to extend the warming limit because the feed ended later.'),
    Say('c1', 'One more. These two bottles look the same, but one has no label.'),
    Hold('hc', 15),
    Say('c2', 'You can’t confirm what’s in this bottle, or how long it’s been out. Set it aside, check with the parent, and use a verified bottle from the agreed plan. Don’t guess by looking at the liquid.'),
]


def v4(T):
    F, E = ['Prepared', 'Formula'], ['Expressed', 'Breast Milk']
    m = f'''
      <div class="panel" id="f4-o">
        <div style="position:absolute;left:0;right:0;top:150px;display:flex;justify-content:center;gap:260px">
          <div id="f4-o1" style="text-align:center">{bottle(F, sid='bo1', width=300)}</div>
          <div id="f4-o2" style="text-align:center">{bottle(E, sid='bo2', width=300)}</div>
        </div>
        <div class="ask" id="f4-oq" style="top:710px;color:#30241F">Which event started the clock?</div>
      </div>
      <div class="panel" id="f4-fr">
        <div style="position:absolute;left:120px;top:190px">{bottle(F, sid='bf', width=280)}</div>
        <div style="position:absolute;left:520px;top:160px;width:1304px">
          <div class="lbl">Prepared formula at room temperature</div>
          <div class="stack" style="position:relative;margin-top:22px;gap:18px">
            <div class="rule" id="f4-r1">Use within <b>2 hours of preparation</b></div>
            <div class="rule" id="f4-r2">and within <b>1 hour of starting the feed</b></div>
            <div class="rule" id="f4-r3">Not used promptly? <b>Refrigerate right away</b>, use within 24 hours</div>
            <div class="rule" id="f4-r4">Feed ended? <b>Discard what is left</b></div>
          </div>
        </div>
      </div>
      <div class="panel" id="f4-a">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Case A · Prepared Formula</div>
        <div class="tl" id="f4-atl" style="top:330px"></div>
        <div class="stop" id="f4-s1" style="left:110px;top:312px"><div class="dot"></div><div class="time">10:00 p.m.</div><div class="ev">Prepared</div></div>
        <div class="stop" id="f4-s2" style="left:770px;top:312px"><div class="dot"></div><div class="time">10:30 p.m.</div><div class="ev">Feed starts</div></div>
        <div class="stop" id="f4-s3" style="left:1430px;top:312px"><div class="dot" id="f4-s3d"></div><div class="time">10:45 p.m.</div><div class="ev">Feed ends</div></div>
        <div class="tag" id="f4-disc" style="position:absolute;left:1545px;top:220px">Discard</div>
        <div class="ask" id="f4-aq" style="top:600px">When should you discard what’s left?</div>
        <div class="answer" id="f4-aa" style="top:580px">✓ 10:45 p.m. Discard leftovers when the feed ends</div>
        <div class="note" id="f4-an" style="position:absolute;left:96px;right:96px;top:730px;text-align:center">The one hour window does not make leftovers a bottle for later.</div>
      </div>
      <div class="panel" id="f4-er">
        <div style="position:absolute;left:120px;top:190px">{bottle(E, sid='be', width=280)}</div>
        <div style="position:absolute;left:520px;top:160px;width:1304px">
          <div class="lbl">Expressed breast milk</div>
          <div class="stack" style="position:relative;margin-top:22px;gap:18px">
            <div class="rule" id="f4-e1">Use within <b>2 hours after warming</b> or reaching room temperature</div>
            <div class="rule" id="f4-e2">Leftovers: use within <b>2 hours after the feed ends</b></div>
            <div class="rule" id="f4-e3">Respect <b>any earlier limit</b> that applies</div>
            <div class="rule" id="f4-e4">Warming or feeding <b>never restarts</b> a deadline</div>
          </div>
        </div>
      </div>
      <div class="panel" id="f4-b">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Case B · Expressed Breast Milk</div>
        <div class="grid2" style="top:220px">
          <div class="cell" id="f4-b11"><div class="time">11:00 p.m.</div><div class="ev">Warmed</div></div>
          <div class="arrow" id="f4-b12">→</div>
          <div class="cell" id="f4-b13"><div class="time">1:00 a.m.</div><div class="ev">Warming limit</div></div>
          <div class="cell" id="f4-b21"><div class="time">11:30 p.m.</div><div class="ev">Feed ends</div></div>
          <div class="arrow" id="f4-b22">→</div>
          <div class="cell" id="f4-b23"><div class="time">1:30 a.m.</div><div class="ev">Leftover limit</div></div>
        </div>
        <div class="ask" id="f4-bq" style="top:640px">Which deadline comes first?</div>
        <div class="note" id="f4-bn" style="position:absolute;left:96px;right:96px;top:730px;text-align:center">No earlier storage limit is assumed in this case.</div>
        <div class="tag" id="f4-bg" style="position:absolute;left:1640px;top:196px">✓ Governs</div>
        <div class="answer" id="f4-ba" style="top:640px">✓ 1:00 a.m. The warming limit comes first</div>
      </div>
      <div class="panel" id="f4-c">
        <div class="lbl" style="position:absolute;left:96px;top:150px">Case C · A missing label</div>
        <div style="position:absolute;left:0;right:0;top:170px;display:flex;justify-content:center;gap:200px">
          <div>{bottle(E, sid='bc1', width=280)}</div>
          <div>{bottle([], unlabeled=True, sid='bc2', width=280)}</div>
        </div>
        <div class="answer" id="f4-ca" style="top:690px;font-size:40px">Set it aside. Check with the parent. Use a verified bottle from the agreed plan.</div>
      </div>'''
    cd_a, tw_a = countdown('f4-cda', T('ha'), 25, 'Pause and decide')
    cd_b, tw_b = countdown('f4-cdb', T('hb'), 30, 'Write both deadlines')
    cd_c, tw_c = countdown('f4-cdc', T('hc'), 15, 'What would you do?')
    m += cd_a + cd_b + cd_c
    tw = panel('#f4-o', 0.2, T('f1'))
    tw += [show('#f4-o1', T('o1.2'), 0.6, 30), show('#f4-o2', T('o1.3'), 0.6, 30), show('#f4-oq', T('o1.5'))]
    tw += panel('#f4-fr', T('f1') - 0.2, T('a1'))
    tw += [show('#f4-r1', T('f1')), show('#f4-r2', T('f1') + 3.2), show('#f4-r3', T('f2')), show('#f4-r4', T('f3'))]
    tw += glow('#f4-r1', T('f1.2'), T('f2')) + glow('#f4-r2', T('f1.2'), T('f2')) + glow('#f4-r4', T('f3') + 0.4)
    tw += panel('#f4-a', T('a1') - 0.2, T('b0'))
    tw += [show('#f4-atl', T('a1.1'), 0.6, 0), show('#f4-s1', T('a1.2')), show('#f4-s2', T('a1.3')), show('#f4-s3', T('a1.4')),
           show('#f4-aq', T('a2') - 0.1), *tw_a, hide('#f4-aq', T('a3') - 0.2), show('#f4-aa', T('a3')), show('#f4-disc', T('a3') + 0.3, 0.4, 10),
           f"tl.to('#f4-s3d', {{ backgroundColor: '#8E3C2E', borderColor: '#8E3C2E', duration: 0.4 }}, {T('a3')});", show('#f4-an', T('a3.2'))]
    tw += panel('#f4-er', T('b0') - 0.2, T('b2'))
    tw += [show('#f4-e1', T('b1.1')), show('#f4-e2', T('b1.2')), show('#f4-e3', T('b1.2') + 4.5), show('#f4-e4', T('b1.3'))]
    tw += panel('#f4-b', T('b2') - 0.2, T('c1'))
    tw += [show('#f4-b11', T('b2.1')), show('#f4-b12', T('b2.2'), 0.4, 0), show('#f4-b13', T('b2.2') + 0.3),
           show('#f4-b21', T('b3.1')), show('#f4-b22', T('b3.2'), 0.4, 0), show('#f4-b23', T('b3.2') + 0.3),
           show('#f4-bq', T('b4') - 0.1), show('#f4-bn', T('b5')), *tw_b,
           hide('#f4-bq', T('b6') - 0.2), hide('#f4-bn', T('b6') - 0.2), show('#f4-ba', T('b6')), show('#f4-bg', T('b6') + 0.3, 0.4, 10),
           f"tl.to('#f4-b13', {{ backgroundColor: '#8E3C2E', borderColor: '#8E3C2E', color: '#FFFAF1', duration: 0.45 }}, {T('b6')});",
           f"tl.to('#f4-b13 .ev', {{ color: '#FFFAF1', duration: 0.45 }}, {T('b6')});"]
    tw += panel('#f4-c', T('c1') - 0.2, T.dur)
    tw += [*tw_c, show('#f4-ca', T('c2.2'))]
    return m, tw


# ============================================================ 5 · Support the parent and report
S5 = [
    Say('n1', 'If the plan is direct nursing, bring the baby to the parent when agreed. You can help with practical tasks, like getting a burp cloth or handling the diaper change.'),
    Say('n2', 'Record the session as observed. Don’t estimate ounces from a nursing session.'),
    Say('n3', 'If the parent asks about ongoing latch or milk transfer concerns, a lactation professional can help, and the pediatric team can assess concerns about the baby’s intake or hydration.'),
    Say('u1', 'A useful update begins with what you observed. Give the time, milk type, measured amount if known, the baby’s response, and what you did.'),
    Say('u2', 'Ask the parent what they want you to do next within the agreed plan. Avoid labels such as “bad feeder.”'),
    Say('u3', 'In the morning, carry forward any open question, so the next caregiver knows who was contacted and what follow up is due.'),
    Say('e1', 'If feeding is repeatedly different from the baby’s usual pattern, the baby is having trouble feeding, or wet diapers are fewer than expected, tell the parent promptly and help them reach the pediatrician for guidance.'),
    Say('e2', 'For severe trouble breathing, unresponsiveness, or blue or gray lips or face, call 911 immediately in the United States, and follow dispatcher instructions.'),
    Say('p1', 'Practice. A shift note says, “Baby barely ate.” Rewrite it using measured observations.'),
    Hold('h1', 25),
    Say('r1', 'Here is a factual version.'),
    Say('r2', '12:10 a.m. Expressed milk, 2 oz offered, 1 oz taken. Turned away twice. Stopped and notified parent as agreed.', CAREGIVER),
    Say('r3', 'Each detail is something you saw or measured. The parent can compare it with the baby’s usual feeds and decide on follow up, without guessing what “barely” meant.'),
]


def v5(T):
    m = f'''
      <div class="panel" id="f5-a">
        <img class="photo" src="assets/handoff.jpg" alt="" style="left:96px;top:150px;width:820px;height:640px">
        <div style="position:absolute;left:980px;top:150px;width:844px">
          <div class="lbl">Nursing support</div>
          {items('f5-a', ['Bring baby to the parent when agreed', 'Help with a burp cloth or diaper change', 'Record the session as observed', 'No ounce estimates from nursing', 'Latch or transfer: lactation professional', 'Intake or hydration: pediatric team'], numbered=False)}
        </div>
      </div>
      <div class="panel" id="f5-u">
        <div class="card rule" id="f5-log" style="left:96px;top:150px;width:840px;padding:26px 36px 18px">
          <div class="lbl">Shift log</div>
          <div class="field" id="f5-l1"><div class="k">Time</div><div class="v">2:40 a.m.</div></div>
          <div class="field" id="f5-l2"><div class="k">Milk type</div><div class="v">Prepared formula</div></div>
          <div class="field" id="f5-l3"><div class="k">Amount</div><div class="v">3 oz offered, 3 oz taken</div></div>
          <div class="field" id="f5-l4"><div class="k">Response</div><div class="v">One pause, burped, settled</div></div>
          <div class="field" id="f5-l5"><div class="k">Action</div><div class="v">Logged; no call needed per plan</div></div>
        </div>
        <div class="card" id="f5-upd" style="left:984px;top:150px;width:840px;padding:26px 36px">
          <div class="lbl">Parent update</div>
          <div class="t body" style="margin-top:14px">“Baby took all 3 oz at 2:40 with one pause, then burped and settled. Anything you’d like me to do differently next feed?”</div>
          <div style="margin-top:34px" id="f5-bad"><span class="strike note" style="font-size:40px">“Bad feeder”<i id="f5-badx"></i></span></div>
        </div>
        <div class="card rule" id="f5-am" style="left:984px;top:640px;width:840px;padding:20px 36px"><div class="note" style="color:#30241F">Morning: carry forward open questions, who was contacted, and follow up due.</div></div>
      </div>
      <div class="panel" id="f5-e">
        <div class="card rule" id="f5-e1" style="left:96px;top:150px;width:840px;padding:30px 40px">
          <div class="h" style="font-size:50px">Tell the parent promptly</div>
          <div class="note" style="margin:10px 0 18px">and help them reach the pediatrician</div>
          {items('f5-e1', ['Feeding repeatedly differs from usual', 'Trouble feeding', 'Fewer wet diapers than expected'], numbered=False)}
        </div>
        <div class="card" id="f5-e2" style="left:984px;top:150px;width:840px;padding:30px 40px;background:#8E3C2E;border-color:#8E3C2E;color:#FFFAF1">
          <div class="h" style="font-size:50px;color:#FFFAF1">Call 911 immediately</div>
          <div style="font:500 34px 'DM Sans';margin:10px 0 18px">and follow dispatcher instructions</div>
          <div style="font:500 36px/1.6 'DM Sans'">Severe trouble breathing<br>Unresponsive<br>Blue or gray lips or face</div>
        </div>
      </div>
      <div class="panel" id="f5-p">
        <div class="tag" style="position:absolute;left:96px;top:150px">Practice</div>
        <div class="card" style="left:96px;top:240px;width:1728px;padding:32px 48px"><div class="lbl">Shift note</div><div class="h" style="font-size:72px;margin-top:10px"><span class="strike">Baby barely ate.<i id="f5-px"></i></span></div></div>
        <div class="h" id="f5-pp" style="position:absolute;left:96px;top:540px;width:1600px;font-size:60px">Rewrite it using measured observations.</div>
        <div class="card rule" id="f5-pr" style="left:96px;top:500px;width:1728px;padding:30px 48px"><div class="lbl">Factual version</div><div class="big" style="margin-top:12px">12:10 a.m. Expressed milk, 2 oz offered, 1 oz taken. Turned away twice. Stopped and notified parent as agreed.</div></div>
      </div>'''
    cd_html, cd_tw = countdown('f5-cd', T('h1'), 25, 'Pause and rewrite')
    m += cd_html
    tw = panel('#f5-a', 0.2, T('u1'))
    tw += [show('#f5-a1', T('n1.1')), show('#f5-a2', T('n1.2')), show('#f5-a3', T('n2.1')), show('#f5-a4', T('n2.2')),
           show('#f5-a5', T('n3')), show('#f5-a6', T('n3') + 4.5)]
    tw += panel('#f5-u', T('u1') - 0.2, T('e1'))
    tw += [show('#f5-log', T('u1'))]
    for i, off in enumerate([0, 1.3, 2.4, 4.0, 5.6], 1):
        tw += glow(f'#f5-l{i}', T('u1.2') + off, T('u1.2') + off + 1.6)
    tw += [show('#f5-upd', T('u2.1')), show('#f5-bad', T('u2.2')),
           f"tl.fromTo('#f5-badx', {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.5, ease: 'power2.out' }}, {round(T('u2.2') + 1.0, 2)});",
           show('#f5-am', T('u3'))]
    tw += panel('#f5-e', T('e1') - 0.2, T('p1'))
    tw += [show('#f5-e1', T('e1')), show('#f5-e2', T('e2'))]
    tw += panel('#f5-p', T('p1') - 0.2, T.dur)
    tw += [f"tl.fromTo('#f5-px', {{ scaleX: 0 }}, {{ scaleX: 1, duration: 0.5, ease: 'power2.out' }}, {round(T('p1.3'), 2)});",
           show('#f5-pp', T('p1.3')), *cd_tw, hide('#f5-pp', T.end('h1')), show('#f5-pr', T('r1'))]
    return m, tw


# ============================================================ 6 · Run the full case
S6 = [
    Say('n1', 'Let’s put the pieces together.'),
    Say('n2', 'At arrival the parent says, “There’s a bottle in the fridge if you need it.” They clarify that the baby should come to them to nurse first. Later, they ask you to use a confirmed bottle of expressed milk.'),
    Say('n3', 'At 12:10 a.m. you offer 2 oz. The baby takes 1 oz, and turns away twice.'),
    Say('n4', 'This was less than usual, and the parent asked you to wake them for a smaller than usual feed.'),
    Say('n5', 'The bottle was warmed at midnight, and the feed ended at 12:20 a.m.'),
    Say('n6', 'On your worksheet, write one clarification question you could have asked at arrival, a shift note, and a short spoken update. Then work out the earliest deadline for the leftover milk, assuming no other storage limit comes first.'),
    Say('n7', 'A soft chime marks each new task. Pause the video if you need more time.'),
    Hold('hw', 100),
    Say('d1', 'At arrival, you could ask:'),
    Say('d1q', 'When do you want me to bring the baby to nurse, and when should I offer the backup bottle?', CAREGIVER),
    Say('d2', 'The shift note gives the time, type, amount offered and taken, the cues, and the action: stopped feeding and woke parent as agreed.'),
    Say('d3', 'Your spoken update can be brief.'),
    Say('d3q', 'Baby took one ounce of the two offered and turned away twice. I stopped and came to get you like we planned. How would you like to proceed?', CAREGIVER),
    Say('d4', 'For the leftover milk, two hours from warming is 2:00 a.m. Two hours from the end of the feed is 2:20 a.m. The earlier one, 2:00 a.m., governs.'),
    Say('d5', 'Document the deadline if the family plans to use the milk within it. The exercise amounts describe this fictional feed.'),
    Say('rv', 'One more look at the note.'),
    Say('rf', 'Time. Milk type. Amount offered and taken. Cues. Action.'),
    Say('rd', 'Warmed at midnight, so 2:00 a.m. Feed ended at 12:20 a.m., so 2:20 a.m. The earlier deadline governs.'),
    Gap(1.5),
]

TASKS = ['A clarification question for arrival', 'A shift note', 'A short spoken update', 'The earliest deadline for the leftover milk']
NOTE = [('Time', '12:10 a.m.'), ('Milk type', 'Expressed milk'), ('Amount', '2 oz offered, 1 oz taken'), ('Cues', 'Turned away twice'), ('Action', 'Stopped; woke parent as agreed')]


def v6(T):
    tasks = '\n'.join(f'<div class="task" id="f6-t{i}"><b>{i}</b><span>{t}</span></div>' for i, t in enumerate(TASKS, 1))
    note = '\n'.join(f'<div class="field" id="f6-n{i}" style="padding-left:16px;padding-right:16px"><div class="k">{k}</div><div class="v">{v}</div></div>' for i, (k, v) in enumerate(NOTE, 1))
    m = f'''
      <div class="panel" id="f6-c">
        <img class="photo" src="assets/worksheet.png" alt="" style="left:1330px;top:150px;width:494px;height:640px;object-fit:contain;background:#fff">
        <div class="card rule" style="left:96px;top:150px;width:1170px;padding:30px 44px">
          <div class="lbl">The full case</div>
          <div class="stack" style="position:relative;margin-top:18px;gap:16px">
            <div class="body" id="f6-c1">Arrival: “There’s a bottle in the fridge if you need it.”</div>
            <div class="body" id="f6-c2">Plan: bring baby to nurse first. Later, a confirmed bottle of expressed milk.</div>
            <div class="body" id="f6-c3">12:10 a.m.: 2 oz offered, 1 oz taken, turned away twice.</div>
            <div class="body" id="f6-c4">Less than usual. Parent asked to be woken.</div>
            <div class="body" id="f6-c5">Warmed at midnight. Feed ended at 12:20 a.m.</div>
          </div>
        </div>
      </div>
      <div class="panel" id="f6-w">
        <img class="photo" src="assets/worksheet.png" alt="" style="left:1330px;top:150px;width:494px;height:620px;object-fit:contain;background:#fff">
        <div style="position:absolute;left:96px;top:150px;width:1170px">
          <div class="h" style="font-size:62px;margin-bottom:22px">On your worksheet</div>
          {tasks}
        </div>
      </div>
      <div class="panel" id="f6-d">
        <div style="position:absolute;left:96px;top:150px;width:1728px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:34px">
          <div class="card rule" id="f6-d1" style="position:relative;padding:26px 32px"><div class="lbl">1 Clarify</div><div class="body" style="margin-top:12px;font-size:34px">“When do you want me to bring the baby to nurse, and when should I offer the backup bottle?”</div></div>
          <div class="card rule" id="f6-d2" style="position:relative;padding:26px 32px"><div class="lbl">2 Log</div><div class="body" style="margin-top:12px;font-size:34px">12:10 a.m. Expressed milk, 2 oz offered, 1 oz taken. Turned away twice. Stopped; woke parent as agreed.</div></div>
          <div class="card rule" id="f6-d3" style="position:relative;padding:26px 32px"><div class="lbl">3 Notify</div><div class="body" style="margin-top:12px;font-size:34px">“Baby took one ounce of the two offered and turned away twice. I stopped and came to get you like we planned. How would you like to proceed?”</div></div>
        </div>
        <div class="answer" id="f6-dd" style="top:690px;font-size:44px">Leftover milk deadline: 2:00 a.m. (earlier than 2:20 a.m.)</div>
      </div>
      <div class="panel" id="f6-r">
        <div class="card rule" style="left:96px;top:150px;width:840px;padding:26px 30px 14px"><div class="lbl" style="padding-left:16px">Shift note</div>{note}</div>
        <div style="position:absolute;left:1000px;top:170px;width:824px">
          <div class="lbl">Leftover expressed milk</div>
          <div class="cell" id="f6-r1" style="margin-top:20px"><div class="ev" style="margin:0 0 8px">Warmed at midnight</div><div class="time">2:00 a.m.</div></div>
          <div class="cell" id="f6-r2" style="margin-top:26px"><div class="ev" style="margin:0 0 8px">Feed ended at 12:20 a.m.</div><div class="time">2:20 a.m.</div></div>
          <div class="tag" id="f6-rg" style="margin-top:26px">✓ The earlier deadline governs</div>
        </div>
      </div>'''
    cd_html, cd_tw = countdown('f6-cd', T('hw'), 100, 'Worksheet time')
    m += cd_html
    tw = panel('#f6-c', 0.2, T('hw'))
    tw += [show('#f6-c1', T('n2.1')), show('#f6-c2', T('n2.2')), show('#f6-c3', T('n3')), show('#f6-c4', T('n4')), show('#f6-c5', T('n5'))]
    tw += panel('#f6-w', T('hw') - 0.3, T.end('hw') + 0.3)
    tw += cd_tw
    marks = [0, 25, 55, 80, 100]
    for i in range(1, 5):
        a, b = T('hw') + marks[i - 1], T('hw') + marks[i]
        tw.append(f"tl.fromTo('#f6-t{i}', {{ borderColor: 'rgba(142,60,46,0)', backgroundColor: 'rgba(255,250,241,0)' }}, {{ borderColor: 'rgba(142,60,46,1)', backgroundColor: 'rgba(255,250,241,1)', duration: 0.4 }}, {round(a, 2)});")
        tw.append(f"tl.to('#f6-t{i}', {{ borderColor: 'rgba(142,60,46,0)', backgroundColor: 'rgba(255,250,241,0)', duration: 0.4 }}, {round(b - 0.4, 2)});")
    tw += panel('#f6-d', T('d1') - 0.2, T('rv'))
    tw += [show('#f6-d1', T('d1')), show('#f6-d2', T('d2')), show('#f6-d3', T('d3')), show('#f6-dd', T('d4'))]
    tw += panel('#f6-r', T('rv') - 0.2, T.dur)
    for i in range(1, 6):
        tw += glow(f'#f6-n{i}', T(f'rf.{i}'), T(f'rf.{i}') + 1.4 if i < 5 else T('rd'))
    tw += [show('#f6-r1', T('rd.1')), show('#f6-r2', T('rd.2')), show('#f6-rg', T('rd.3')),
           f"tl.to('#f6-r1', {{ backgroundColor: '#8E3C2E', borderColor: '#8E3C2E', color: '#FFFAF1', duration: 0.45 }}, {T('rd.3')});",
           f"tl.to('#f6-r1 .ev', {{ color: '#FFFAF1', duration: 0.45 }}, {T('rd.3')});"]
    return m, tw


# ============================================================ 7 · Close
S7 = [
    Say('c1', 'Before a feed, read the plan back.'),
    Say('c2', 'During the feed, let the baby’s cues guide when to pause and stop.'),
    Say('c3', 'Afterward, apply the right milk handling limit, and report what happened.'),
    Say('c4', 'Keep the worksheet handy as a field reference. Once you’ve completed the required viewing, take the untimed five question quiz. Four correct answers earn your Certificate of Completion.'),
    Gap(7),
]


def v7(T):
    m = '''
      <img class="photo" id="f7-sheet" src="assets/worksheet.png" alt="" style="left:150px;top:150px;width:494px;height:640px;object-fit:contain;background:#fff">
      <div id="f7-take" style="position:absolute;left:760px;top:180px;width:1060px">
        <div class="h" id="f7-t1" style="font-size:88px">Read the plan back.</div>
        <div class="h" id="f7-t2" style="font-size:88px;margin-top:18px">Follow the baby’s cues.</div>
        <div class="h" id="f7-t3" style="font-size:88px;margin-top:18px;color:#8E3C2E">Use the right clock. Report it.</div>
        <div id="f7-quiz" style="margin-top:42px;font:500 36px/1.4 'DM Sans'">Next: the untimed five question quiz. Four correct earns your Certificate of Completion.</div>
      </div>
      <div class="card rule" id="f7-src" style="left:760px;top:180px;width:1060px;padding:36px 44px">
        <div class="h" style="font-size:52px">Sources</div>
        <div style="font:700 30px 'DM Sans';margin-top:22px">Centers for Disease Control and Prevention</div>
        <div style="font:500 30px/1.5 'DM Sans';color:#69554A">About Feeding From a Bottle · Infant Formula Preparation and Storage · Breast Milk Storage and Preparation</div>
        <div style="font:700 30px 'DM Sans';margin-top:22px">American Academy of Pediatrics, HealthyChildren.org</div>
        <div style="font:500 30px/1.5 'DM Sans';color:#69554A">Warning Signs of Breastfeeding Problems · When to Call Emergency Medical Services</div>
        <div style="font:500 30px 'DM Sans';margin-top:24px;color:#8E3C2E">Clickable links are in the course resources.</div>
      </div>'''
    t_src = T.end('c4') + 0.6
    tw = [show('#f7-sheet', 0.4, 0.8, 0), blur('#f7-t1', T('c1')), blur('#f7-t2', T('c2')), blur('#f7-t3', T('c3')), show('#f7-quiz', T('c4.2')),
          hide('#f7-take', t_src - 0.4), show('#f7-src', t_src)]
    return m, tw


SCENES = [
    Scene('f1-fridge', 'Part 1 · The bottle in the fridge', S1, v1),
    Scene('f2-plan', 'Part 2 · Make the plan explicit', S2, v2),
    Scene('f3-demo', 'Part 3 · Responsive bottle feeding', S3, v3),
    Scene('f4-clocks', 'Part 4 · Compare the two milk clocks', S4, v4),
    Scene('f5-report', 'Part 5 · Support the parent and report', S5, v5),
    Scene('f6-case', 'Part 6 · Run the full case', S6, v6, sfx=[('hw', 25), ('hw', 55), ('hw', 80)]),
    Scene('f7-close', 'Wrap up', S7, v7),
]

if __name__ == '__main__':
    total, cues = build_lesson(PROJECT, SCENES, CSS)
    print(f'runtime {total:.1f} s ({total / 60:.1f} min), {len(cues)} caption lines')
