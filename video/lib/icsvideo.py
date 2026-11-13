"""Shared builder for Ivory Cradle School lesson videos (HyperFrames).

A lesson is a list of scenes. Each scene is a list of steps:
  Say(id, text, voice=NARRATOR)  spoken line; `text` is also the caption (numbers as figures)
  Hold(id, seconds)              a silent practice pause (countdown shown on screen)
  Gap(seconds)                   a short silence
and a `visuals(T)` function that returns (markup, tweens) using T('id') = the step's start time
in that scene, T.end('id') = its end time, and T.dur = the scene length.

Rules from video/STANDARDS.md are applied here: Kokoro Heart narration with pronunciation fixes,
opening music silent by 4 s, closing music under the final scene, captions timed to the voice,
1920 x 1080 at 30 fps, brand fonts and colours, lower fifth kept clear.

Run with a Python that has kokoro-onnx, soundfile and numpy (see video/README in the repo).
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from dataclasses import dataclass, field
from pathlib import Path

NARRATOR, PARENT, CAREGIVER = 'af_heart', 'af_sarah', 'af_bella'
SPEED = 0.9  # slower than Kokoro's default, toward the scripts' teaching pace
GAP_SAME, GAP_CHANGE, GAP_STEP = 0.6, 0.9, 0.35  # between sentences, speaker changes, and an extra beat between lines
LEAD, TAIL = 0.8, 1.4
INTRO, OUTRO = 3.5, 5.0  # music alone before the first line / after the last line
INTRO_FADE_START, INTRO_SILENT = 3.0, 4.0
BED, SOLO = 0.12, 0.5

PHONEME_FIXES = [
    (r'ɹˈɛkɚd(?=[\s,.;:!?]|$)', 'ɹᵻkˈɔːɹd'),   # record (verb)
    (r'ɹˈɛkɚdz(?=[\s,.;:!?]|$)', 'ɹᵻkˈɔːɹdz'),  # records (verb)
    (r'jˈuːs(?=[\s,.;:!?]|$)', 'jˈuːz'),       # use (verb)
]

# ---------------------------------------------------------------- spoken form of captions
ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
        'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
TENS = {2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty'}


def _num(n: int) -> str:
    if n < 20:
        return ONES[n]
    t, o = divmod(n, 10)
    return TENS[t] + ('' if o == 0 else ' ' + ONES[o])


def _time(m: re.Match) -> str:
    h, mm, ap = int(m.group(1)), int(m.group(2)), m.group(3)
    words = _num(h)
    if mm:
        words += ' oh ' + ONES[mm] if mm < 10 else ' ' + _num(mm)
    if ap:
        words += ' AM' if ap.startswith('a') else ' PM'
    return words


def spoken(caption: str) -> str:
    s = caption
    # "a.m." at the end of a sentence also ends the sentence; keep that full stop
    s = re.sub(r'(a\.m\.|p\.m\.)(?=\s+[A-Z“"]|\s*$)', r'\1#', s)
    s = re.sub(r'\b(\d{1,2}):(\d{2})(?:\s*(a\.m\.|p\.m\.))?', _time, s)
    s = re.sub(r'\b(\d{1,2})\s*(a\.m\.|p\.m\.)', lambda m: _num(int(m.group(1))) + (' AM' if m.group(2)[0] == 'a' else ' PM'), s)
    s = re.sub(r'\b1 oz\b', 'one ounce', s)
    s = re.sub(r'\b(\d+) oz\b', lambda m: _num(int(m.group(1))) + ' ounces', s)
    s = s.replace('#', '.').replace('911', 'nine one one').replace('CDC', 'C D C').replace('AAP', 'A A P')
    return s


# ---------------------------------------------------------------- steps
@dataclass
class Say:
    id: str
    text: str
    voice: str = NARRATOR


@dataclass
class Hold:
    id: str
    seconds: float


@dataclass
class Gap:
    seconds: float


@dataclass
class Scene:
    id: str
    kicker: str
    steps: list
    visuals: object  # callable(T) -> (markup, tweens)
    sfx: list = field(default_factory=list)  # (cue id, offset seconds)


def split_sentences(text: str) -> list[str]:
    parts = re.split(r'(?<=[.?!”"])\s+(?=[A-Z“"])', text.strip())
    return [p for p in parts if p]


# ---------------------------------------------------------------- voice
class Voice:
    def __init__(self, project: Path):
        from kokoro_onnx import Kokoro
        cache = Path(os.path.expanduser('~/.cache/hyperframes/tts'))
        self.k = Kokoro(str(cache / 'models' / 'kokoro-v1.0.onnx'), str(cache / 'voices' / 'voices-v1.0.bin'))
        self.dir = project / 'assets' / 'voice' / 'lines'
        self.dir.mkdir(parents=True, exist_ok=True)

    def line(self, text: str, voice: str):
        """Returns (samples, rate). Cached by text, voice and settings."""
        import numpy as np
        import soundfile as sf
        say = spoken(text)
        key = hashlib.sha1(f'{voice}|{SPEED}|{say}|{PHONEME_FIXES}'.encode()).hexdigest()[:16]
        path = self.dir / f'{key}.wav'
        if path.exists():
            data, rate = sf.read(path, dtype='float32')
            return data, rate
        ph = self.k.tokenizer.phonemize(say, 'en-us')
        for pat, rep in PHONEME_FIXES:
            ph = re.sub(pat, rep, ph)
        samples, rate = self.k.create(ph, voice=voice, speed=SPEED, lang='en-us', is_phonemes=True)
        sf.write(path, samples, rate)
        return np.asarray(samples, dtype='float32'), rate


# ---------------------------------------------------------------- timeline
class Times:
    def __init__(self, starts, ends, dur):
        self._s, self._e, self.dur = starts, ends, dur

    def __call__(self, key):
        return round(self._s[key], 2)

    def end(self, key):
        return round(self._e[key], 2)


def build_lesson(project: Path, scenes: list[Scene], css: str = ''):
    import numpy as np
    import soundfile as sf

    voice = Voice(project)
    (project / 'compositions').mkdir(exist_ok=True)
    clips, cues, scene_rows = [], [], []
    t_global, rate = 0.0, 24000
    for si, sc in enumerate(scenes):
        first, last = si == 0, si == len(scenes) - 1
        t = INTRO if first else LEAD
        starts, ends, chunks, prev_voice, last_voice = {}, {}, [], None, 0.0
        for st in sc.steps:
            if isinstance(st, Gap):
                t += st.seconds
                continue
            if isinstance(st, Hold):
                starts[st.id], ends[st.id] = t, t + st.seconds
                t += st.seconds
                prev_voice = None
                continue
            sentences = split_sentences(st.text)
            starts[st.id] = None
            if prev_voice == st.voice:
                t += GAP_STEP
            for n, sentence in enumerate(sentences):
                if prev_voice is not None:
                    t += GAP_SAME if prev_voice == st.voice else GAP_CHANGE
                samples, rate = voice.line(sentence, st.voice)
                d = len(samples) / rate
                if starts[st.id] is None:
                    starts[st.id] = t
                starts[f'{st.id}.{n + 1}'] = t
                ends[f'{st.id}.{n + 1}'] = t + d
                chunks.append((t, samples))
                cues.append((t_global + t, t_global + t + d, sentence))
                t += d
                prev_voice = st.voice
            ends[st.id] = t
            last_voice = t
        dur = round(t + (OUTRO if last else TAIL), 2)
        # one narration track per scene
        buf = np.zeros(int(dur * rate) + rate, dtype='float32')
        for at, samples in chunks:
            i = int(at * rate)
            buf[i:i + len(samples)] += samples
        sf.write(project / 'assets' / 'voice' / f'{sc.id}.wav', buf[: int(dur * rate)], rate)
        T = Times(starts, ends, dur)
        markup, tweens = sc.visuals(T)
        no_dashes(sc.id, markup, [x for x in sc.steps if isinstance(x, Say)])
        if f'id="{sc.id}"' in markup:
            raise SystemExit(f'{sc.id}: an element reuses the scene id, so its tweens would move the whole scene')
        (project / 'compositions' / f'{sc.id}.html').write_text(scene_html(sc.id, sc.kicker, dur, markup, tweens, css))
        scene_rows.append((sc.id, round(t_global, 2), dur, round(last_voice, 2)))
        clips.append(f'      <audio id="vo-{sc.id}" class="clip" src="assets/voice/{sc.id}.wav" data-start="{round(t_global, 2)}" data-duration="{dur}" data-volume="1" data-track-index="2"></audio>')
        for cue_id, offset in sc.sfx:
            at = round(t_global + T(cue_id) + offset, 2)
            clips.append(f'      <audio id="sfx-{sc.id}-{len(clips)}" class="clip" src="assets/sfx/chime.mp3" data-start="{at}" data-duration="2.5" data-volume="0.35" data-track-index="4"></audio>')
        t_global += dur
    total = round(t_global, 2)
    write_index(project, scene_rows, clips, total)
    write_vtt(project / 'captions.en.vtt', cues)
    (project / 'timeline.json').write_text(json.dumps({'total': total, 'scenes': scene_rows}, indent=2) + '\n')
    return total, cues


DASHES = re.compile('[\u002d\u2010\u2011\u2012\u2013\u2014\u2015\u2212]')


def no_dashes(sid, markup, says):
    """The school's copy rule: no dashes in anything a student reads."""
    text = re.sub(r'<style.*?</style>|<script.*?</script>|<svg.*?</svg>', ' ', markup, flags=re.S)
    text = re.sub(r'<[^>]+>', ' ', text)
    svg_text = ' '.join(re.findall(r'<text[^>]*>([^<]*)</text>', markup))
    for where, t in [('screen', text), ('screen', svg_text)] + [(f'caption {x.id}', x.text) for x in says]:
        m = DASHES.search(t)
        if m:
            raise SystemExit(f'{sid}: dash in {where}: ...{t[max(0, m.start() - 40): m.end() + 40]}...')


# ---------------------------------------------------------------- output
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
.panel { position: absolute; inset: 0; opacity: 0; }
.h { font-family: 'Bricolage Grotesque'; font-weight: 800; letter-spacing: -0.04em; line-height: 1.04; color: #30241F; margin: 0; }
.card { position: absolute; background: #FFFAF1; border: 2px solid #D6C4B4; }
.rule { border-top: 5px solid #8E3C2E; }
.lbl { font: 700 28px 'DM Sans'; letter-spacing: 0.12em; text-transform: uppercase; color: #8E3C2E; }
.body { font: 500 38px/1.35 'DM Sans'; color: #30241F; }
.muted { color: #69554A; }
.quote { font: 500 46px/1.3 'DM Sans'; }
.who { font: 700 28px 'DM Sans'; letter-spacing: 0.12em; text-transform: uppercase; color: #69554A; margin-bottom: 12px; }
.chip { display: inline-block; font: 700 34px 'DM Sans'; padding: 16px 28px; border: 3px solid #30241F; background: #FFFAF1; }
.chip.on { background: #8E3C2E; border-color: #8E3C2E; color: #FFFAF1; }
.pp { position: absolute; left: 96px; right: 96px; top: 792px; display: flex; align-items: center; gap: 28px; }
.pp-label { font: 700 30px 'DM Sans'; letter-spacing: 0.1em; text-transform: uppercase; color: #8E3C2E; white-space: nowrap; }
.pp-bar { flex: 1; height: 14px; background: #EDDFCB; position: relative; overflow: hidden; }
.pp-bar span { position: absolute; inset: 0; background: #8E3C2E; transform-origin: left center; }
.pp-sec { font: 700 30px 'DM Sans'; color: #30241F; white-space: nowrap; }
"""


def scene_html(sid, kicker, dur, markup, tweens, css):
    mark = '' if sid.endswith('-open') else '<img class="mark" src="assets/wordmark.png" alt="">'
    kick = f'<div class="kicker" id="{sid}-kicker">{kicker}</div>' if kicker else ''
    return f"""<template>
  <style>{BASE_CSS}{css}
  </style>
  <div id="root" data-composition-id="{sid}" data-width="1920" data-height="1080">
    <div class="wrap" id="{sid}-wrap" data-hold>
      {mark}
      {kick}
{markup}
    </div>
  </div>
  <script>
    const tl = gsap.timeline({{ paused: true }});
    tl.fromTo('#{sid}-wrap', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.5, ease: 'power2.out' }}, 0);
{chr(10).join('    ' + t for t in tweens)}
    tl.to('#{sid}-wrap', {{ opacity: 0, duration: 0.45, ease: 'power2.in' }}, {round(dur - 0.5, 2)});
    window.__timelines['{sid}'] = tl;
  </script>
</template>
"""


def write_index(project: Path, rows, clips, total):
    hosts = '\n'.join(
        f'      <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{start}" data-duration="{dur}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>'
        for sid, start, dur, _ in rows
    )
    last = rows[-1]
    intro_lane = {"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": SOLO}, {"t": INTRO_FADE_START, "v": SOLO}, {"t": INTRO_SILENT, "v": 0}]}]}
    music = [
        f"""      <audio id="music-intro" class="clip" src="assets/bgm/track.mp3" data-start="0" data-duration="{INTRO_SILENT}" data-volume="1" data-fade-in="0.6" data-track-index="3" data-automation='{json.dumps(intro_lane)}'></audio>""",
    ]
    outro_len = min(last[2], 34.0)
    outro_start = round(last[1] + last[2] - outro_len, 2)
    voice_end = outro_len - (last[2] - last[3])
    outro_lane = {"version": 1, "lanes": [{"target": "volume", "points": [{"t": 0, "v": BED}, {"t": round(voice_end, 2), "v": BED}, {"t": round(voice_end + 1.0, 2), "v": SOLO}]}]}
    music.append(f"""      <audio id="music-outro" class="clip" src="assets/bgm/track.mp3" data-start="{outro_start}" data-duration="{outro_len}" data-volume="1" data-fade-in="2" data-fade-out="3.5" data-track-index="3" data-automation='{json.dumps(outro_lane)}'></audio>""")
    (project / 'index.html').write_text(f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1920px; height: 1080px; overflow: hidden; background: #F8F1E6; }}
      #ground {{ position: absolute; inset: 0; background: #F8F1E6; }}
    </style>
  </head>
  <body>
    <!-- Generated by video/build-*.py with video/lib/icsvideo.py. Narration: Kokoro Heart, with dialogue voices. -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1920" data-height="1080" data-fps="30">
      <div id="ground"></div>
{hosts}
{chr(10).join(clips)}
{chr(10).join(music)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
""")


def _ts(sec):
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f'{int(h):02d}:{int(m):02d}:{s:06.3f}'


def write_vtt(path: Path, cues, max_len=84):
    out = ['WEBVTT', '']
    n = 0
    for start, end, text in cues:
        pieces, rest = [], text
        while len(rest) > max_len:
            cut = max(rest.rfind(', ', 0, max_len), rest.rfind(' and ', 0, max_len), rest.rfind(' or ', 0, max_len))
            if cut < 30:
                cut = rest.rfind(' ', 0, max_len)
            pieces.append(rest[: cut + (1 if rest[cut] == ',' else 0)].strip())
            rest = rest[cut + 1:].strip()
        pieces.append(rest)
        total = sum(len(p) for p in pieces)
        t = start
        for p in pieces:
            d = (end - start) * len(p) / total
            n += 1
            out += [str(n), f'{_ts(t)} --> {_ts(t + d - 0.03)} line:85%', p, '']
            t += d
    path.write_text('\n'.join(out))


# ---------------------------------------------------------------- tween helpers
def show(sel, at, d=0.5, y=20):
    return f"tl.fromTo('{sel}', {{ opacity: 0, y: {y} }}, {{ opacity: 1, y: 0, duration: {d}, ease: 'expo.out' }}, {round(at, 2)});"


def blur(sel, at):
    return f"tl.fromTo('{sel}', {{ opacity: 0, filter: 'blur(8px)' }}, {{ opacity: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' }}, {round(at, 2)});"


def hide(sel, at, d=0.35):
    return f"tl.to('{sel}', {{ opacity: 0, duration: {d}, ease: 'power2.in' }}, {round(at, 2)});"


def panel(sel, start, end):
    """Full frame panel visible from start to end."""
    return [f"tl.fromTo('{sel}', {{ opacity: 0 }}, {{ opacity: 1, duration: 0.5, ease: 'power2.out' }}, {round(start, 2)});",
            f"tl.to('{sel}', {{ opacity: 0, duration: 0.4, ease: 'power2.in' }}, {round(end - 0.4, 2)});"]


def countdown(prefix, start, seconds, label='Pause and write'):
    """Markup and tweens for a practice pause bar that empties over `seconds`."""
    html = f'<div class="pp" id="{prefix}"><div class="pp-label">{label}</div><div class="pp-bar"><span id="{prefix}-fill"></span></div><div class="pp-sec">{int(round(seconds))} seconds</div></div>'
    tw = [show(f'#{prefix}', start, 0.4, 0),
          f"tl.fromTo('#{prefix}-fill', {{ scaleX: 1 }}, {{ scaleX: 0, duration: {seconds}, ease: 'none' }}, {round(start, 2)});",
          hide(f'#{prefix}', start + seconds)]
    return html, tw


def highlight(sel, at):
    return f"tl.fromTo('{sel}', {{ backgroundColor: 'rgba(142,60,46,0)', color: '#30241F' }}, {{ backgroundColor: 'rgba(142,60,46,1)', color: '#FFFAF1', duration: 0.45, ease: 'power2.out' }}, {round(at, 2)});"
