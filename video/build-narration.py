#!/usr/bin/env python3
"""Narrates The First Overnight Shift with the Kokoro "Heart" voice (af_heart), verbatim from the
approved script, one file per scene. Scene 3 is split around the three second thinking pause.

Writes first-overnight-shift/assets/voice/*.wav and narration.json (clip lengths), which
build-scenes.py and build-captions.py use to time the film to the voice.
Run it with a Python that has kokoro-onnx and soundfile installed; it uses the Kokoro model files
that `npx hyperframes tts` downloads to ~/.cache/hyperframes/tts. Pass scene keys to redo only those.
"""
import json
from pathlib import Path

HERE = Path(__file__).parent
PROJECT = HERE / 'first-overnight-shift'
VOICE_DIR = PROJECT / 'assets' / 'voice'
VOICE = 'af_heart'

# Spoken form of the approved narration (numbers written as they should be said).
NARRATION = {
    # Scene 1 opens on the HeyGen parent clip; the narrator frames the freeze frame and the specialist's model response.
    's1a': "He's heading to bed. Before you take over the shift, what would you confirm? Pause here, and name three things you'd ask.",
    's1b': "Here's one way to ask.",
    's1c': "That covers the three things to confirm before you take over: the feeding plan, the sleep setup, and when to wake a parent. Let's build them into your arrival checklist.",
    's2': "Start by asking when and how the baby last fed, how much they took if measured, and what the plan is for the next feed. Ask how the parents want to handle direct nursing, bottles, or both, and which instructions came from the baby's clinician. Ask when to wake a parent and how to reach them. Confirm the home's address and the pediatrician's after-hours number. Locate the sleep space, clean feeding supplies, and diaper supplies before you need them. If the baby has a clinician-directed plan, ask where it's written and clarify anything you can't confidently follow before accepting responsibility for that task.",
    's3a': "One parent thinks the baby last fed at seven thirty. The other thinks it was closer to eight. What would you clarify before they head to bed?",
    's3b': "Ask for their best estimate, then confirm what to do if the timing is uncertain. You could say, \"If we aren't sure about the last feed, when should I wake you, and what's the plan if the baby cues sooner?\" Record an estimate as an estimate. Read the plan back so everyone knows what you agreed to.",
    's4': "The American Academy of Pediatrics recommends putting babies on their backs for every sleep. Use a separate, safety-approved crib, bassinet, portable crib, or play yard with a firm, flat, level surface and a fitted sheet. Keep pillows, loose blankets, toys, and positioners out. If a baby falls asleep in a swing or car seat, move them to an appropriate sleep surface on their back as soon as possible. If you're getting drowsy while holding the baby, put them in the safe sleep space. If the setup isn't safe, raise it with the parents and agree on a safe alternative before using it.",
    's5': "Wash your hands before preparing or handling feeding supplies. Use clean equipment and follow the family's feeding plan. Know what's in the bottle and when it was prepared, warmed, or first offered. C D C guidance says prepared infant formula should be used within two hours of preparation and within one hour of starting the feed. If you won't use freshly prepared formula right away, refrigerate it promptly and use it within twenty-four hours. Throw out formula left in the bottle after a feed. Expressed breast milk follows different rules. Once warmed or brought to room temperature, use it within two hours. C D C also allows leftover breast milk to be used within two hours after the feeding ends. Respect any earlier storage limit, and if the timing is unclear, check with the parent before using it. Follow the baby's clinician's directions for any special feeding instructions.",
    's6': "If the baby stops breathing, is unresponsive, is struggling severely to breathe, or has blue or gray lips or face, call nine one one immediately and follow the dispatcher's instructions. Notify the parents as soon as you can without delaying the call. Here's a different situation. A six-week-old has a rectal temperature of one hundred point four degrees Fahrenheit, or thirty-eight degrees Celsius. Wake the parent immediately and contact the pediatrician or after-hours service right away for urgent evaluation. Don't wait for the morning handoff or for the temperature to rise. Record the time, what you observed, whom you contacted, and what happened next. If a life-threatening sign develops, call nine one one.",
    's7': "A useful note gives the next caregiver something they can act on. Log the time, the feeding method and measured amount if known, diaper changes, sleep, and any unusual observations. Use the family's agreed private log. For example: \"Eleven oh five p.m., formula, two ounces offered, one and a half taken. Wet diaper. Back in bassinet at eleven thirty.\" Those are observations for this scenario. The amounts are not feeding targets. In the morning, start with anything that needs attention. Then summarize the last feed and diaper, how the baby slept, and any agreed next steps. If there was a concern overnight, include who you contacted and when. Confirm that the parent has taken over before you leave.",
    's8': "Before you leave this lesson, open the First Overnight Shift worksheet. Write one question you'd ask when the last feed time is unclear, then practice recording the sample feed and diaper. The worksheet also gives you a quick reference for safe sleep, feeding, and urgent concerns. When the lesson is complete, take the five-question quiz. Four correct answers earn your Certificate of Completion.",
}

# Pronunciation fixes, applied to the phonemes Kokoro produces. Every "record" and "use" in this
# script is a verb, and times say "PM" without a pause between the letters.
TEXT_FIXES = [('p.m.', 'PM'), ('a.m.', 'AM')]
PHONEME_FIXES = [
    (r'ɹˈɛkɚd(?=[\s,.;:!?]|$)', 'ɹᵻkˈɔːɹd'),  # record (verb), not REH-kerd
    (r'jˈuːs(?=[\s,.;:!?]|$)', 'jˈuːz'),  # use (verb), not the noun
]

import os
import re
import sys
from kokoro_onnx import Kokoro  # run with the Python that has kokoro-onnx (see HYPERFRAMES_PYTHON)
import soundfile as sf

CACHE = Path(os.path.expanduser('~/.cache/hyperframes/tts'))
kokoro = Kokoro(str(CACHE / 'models' / 'kokoro-v1.0.onnx'), str(CACHE / 'voices' / 'voices-v1.0.bin'))

VOICE_DIR.mkdir(parents=True, exist_ok=True)
only = set(sys.argv[1:])
lengths = json.loads((PROJECT / 'narration.json').read_text())['lengths'] if (PROJECT / 'narration.json').exists() else {}
for key, text in NARRATION.items():
    if only and key not in only:
        continue
    for a, b in TEXT_FIXES:
        text = text.replace(a, b)
    phonemes = kokoro.tokenizer.phonemize(text, 'en-us')
    for pattern, repl in PHONEME_FIXES:
        phonemes = re.sub(pattern, repl, phonemes)
    samples, rate = kokoro.create(phonemes, voice=VOICE, speed=1.0, lang='en-us', is_phonemes=True)
    sf.write(VOICE_DIR / f'{key}.wav', samples, rate)
    lengths[key] = round(len(samples) / rate, 3)
    print(key, lengths[key], 's', flush=True)

(PROJECT / 'narration.json').write_text(json.dumps({'voice': VOICE, 'lengths': lengths}, indent=2) + '\n')
print('total voice', round(sum(lengths.values()), 1), 's')
