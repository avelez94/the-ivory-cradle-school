"""One sample per English Kokoro voice, plus all of them in one file with the voice named first."""
import os
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

OUT = Path(__file__).resolve().parent
c = os.path.expanduser('~/.cache/hyperframes/tts')
k = Kokoro(c + '/models/kokoro-v1.0.onnx', c + '/voices/voices-v1.0.bin')
GROUPS = {'af': 'American female', 'am': 'American male', 'bf': 'British female', 'bm': 'British male'}
LINE = "There's a bottle in the fridge if you need it. When baby is ready, would you like me to bring them to you first?"
voices = [v for v in sorted(k.get_voices()) if v[:2] in GROUPS]
chunks, rate, rows = [], 24000, []
for n, v in enumerate(voices, 1):
    name = v.split('_', 1)[1].capitalize()
    lang = 'en-gb' if v.startswith('b') else 'en-us'
    intro, rate = k.create(f'{n}. {name}.', voice='af_heart' if v != 'af_heart' else 'af_bella', speed=1.0, lang='en-us')
    s, rate = k.create(LINE, voice=v, speed=0.95, lang=lang)
    sf.write(OUT / f'{n:02d}-{v}.wav', s, rate)
    chunks += [intro, np.zeros(int(0.4 * rate), 'float32'), s, np.zeros(int(1.0 * rate), 'float32')]
    rows.append(f'| {n} | {name} | `{v}` | {GROUPS[v[:2]]} |')
sf.write(OUT / 'all-voices.wav', np.concatenate(chunks), rate)
for f in sorted(OUT.glob('*.wav')):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(f), '-b:a', '128k', str(f.with_suffix('.mp3'))], check=True)
    f.unlink()
(OUT / 'README.md').write_text(
    '# Voice samples\n\nEvery English Kokoro voice reading the same two lines. In `all-voices.mp3` Heart announces each voice by number and name first (Bella announces Heart).\n\n'
    'Used now: narrator Heart (`af_heart`), parent Sarah (`af_sarah`), caregiver Bella (`af_bella`).\n\n'
    '| # | Voice | Id | Accent |\n| --- | --- | --- | --- |\n' + '\n'.join(rows) + '\n')
print(len(voices), 'voices')
