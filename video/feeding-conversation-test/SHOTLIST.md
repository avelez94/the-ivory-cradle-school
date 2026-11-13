# Feeding Support on Shift: conversation test (HeyGen)

Kitchen two shot reference: `assets/kitchen-reference.jpg` (the fridge scene photo). Each speaker's medium close up is cropped from it (`assets/parent-mcu.png`, `assets/specialist-mcu.png`) so lighting and wardrobe match across cuts. Voices are the workshop's dialogue voices: parent Kokoro Sarah, specialist Kokoro Bella (`make_lines.py`).

Order for HyperFrames (about 22 seconds):

| # | Shot | Line | Status |
| --- | --- | --- | --- |
| 01 | Parent, medium close up, speaking | "There's a bottle in the fridge if you need it." | Done: `shots/01-parent-bottle-in-the-fridge.mp4` |
| 02 | Specialist, medium close up, speaking | "Do you want me to bring the baby to you to nurse first?" | Blocked: needs HyperFrames Pro |
| 03 | Parent, medium close up, speaking (cut to 05 midway) | "Yes. The bottle is backup. Knock if you're unsure which one to use." | Blocked: needs HyperFrames Pro |
| 04 | Specialist, medium close up, speaking | "Got it. I'll bring the baby to you first and check with you before using the bottle." | Blocked: needs HyperFrames Pro |
| 05 | Specialist listening reaction (cutaway during 03) | none | Blocked: needs HyperFrames Pro |
| 06 | Parent listening reaction, nods (end) | none | Done: `shots/06-parent-listens-reaction.mp4` |

`gen_shots.sh` generates every shot; rerunning a finished one reuses it without charging again.
