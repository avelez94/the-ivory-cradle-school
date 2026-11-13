"""Speak the four test lines with the workshop's dialogue voices, padded with a silent tail
(HeyGen needs 5 to 15 s of audio per shot, and the tail gives room for a reaction)."""
import sys
from pathlib import Path
import numpy as np
import soundfile as sf
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'lib'))
from icsvideo import PARENT, CAREGIVER, Voice  # noqa: E402

LINES = [
    ('01-parent', PARENT, 'There’s a bottle in the fridge if you need it.'),
    ('02-specialist', CAREGIVER, 'Do you want me to bring the baby to you to nurse first?'),
    ('03-parent', PARENT, 'Yes. The bottle is backup. Knock if you’re unsure which one to use.'),
    ('04-specialist', CAREGIVER, 'Got it. I’ll bring the baby to you first and check with you before using the bottle.'),
]
v = Voice(HERE)
for name, voice, text in LINES:
    parts = []
    for i, sentence in enumerate(__import__('icsvideo').split_sentences(text)):
        s, rate = v.line(sentence, voice)
        if i:
            parts.append(np.zeros(int(0.35 * rate), dtype='float32'))
        parts.append(s)
    speech = np.concatenate([np.zeros(int(0.3 * rate), dtype='float32')] + parts)
    total = max(5.0, len(speech) / rate + 1.6)
    out = np.zeros(int(total * rate), dtype='float32')
    out[: len(speech)] = speech
    sf.write(HERE / 'assets' / f'{name}.wav', out, rate)
    print(name, round(len(speech) / rate, 2), 'speech,', round(total, 2), 'total')
