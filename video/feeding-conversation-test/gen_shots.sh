#!/usr/bin/env bash
# Generates the six conversation shots on HeyGen (needs HyperFrames Pro for 02 to 05).
# Rerunning a finished shot reuses the earlier job without charging again.
set -u
cd "$(dirname "$0")"
export NODE_USE_ENV_PROXY=1
SP="Medium close-up. A Newborn Care Specialist in sage green scrubs, hair in a low bun, stands in a softly lit family kitchen at night"
PA="Medium close-up. A mother in an oatmeal cardigan stands at the open fridge in a softly lit family kitchen at night"
g() { npx hyperframes media-use generate "$@"; }
g --type video --reference assets/parent-mcu.png --audio assets/01-parent.wav --prompt "$PA and speaks warmly to someone off screen to her right, gesturing to the bottle on the shelf, then smiles and listens. Static camera, same warm lighting and wardrobe. No text." --seconds 5 --aspect 16:9 --out assets/shot01-parent.mp4
g --type video --reference assets/specialist-mcu.png --audio assets/02-specialist.wav --prompt "$SP and asks a gentle question to the parent off screen to her right, attentive and respectful, then listens. Static camera, same warm lighting and wardrobe. No text." --seconds 5 --aspect 16:9 --out assets/shot02-specialist.mp4
g --type video --reference assets/parent-mcu.png --audio assets/03-parent.wav --prompt "$PA and answers the caregiver off screen to her left, relaxed and clear, a small nod on 'Yes', then smiles and listens. Static camera, same warm lighting and wardrobe. No text." --seconds 7 --aspect 16:9 --out assets/shot03-parent.mp4
g --type video --reference assets/specialist-mcu.png --audio assets/04-specialist.wav --prompt "$SP and reads the plan back to the parent off screen to her right, warm and reassuring, a small nod, then smiles. Static camera, same warm lighting and wardrobe. No text." --seconds 8 --aspect 16:9 --out assets/shot04-specialist.mp4
g --type video --first-frame assets/specialist-mcu.png --prompt "$SP and silently listens to the parent off screen to her right, mouth closed, a small understanding nod, soft smile. She does not speak. Static camera, same warm lighting. No text." --seconds 5 --out assets/shot05-specialist-listens.mp4
g --type video --first-frame assets/parent-mcu.png --prompt "$PA and silently listens to the caregiver off screen to her left, mouth closed, nods and smiles, reassured. She does not speak. Static camera, same warm lighting. No text." --seconds 5 --out assets/shot06-parent-listens.mp4
