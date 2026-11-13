# Lesson video standards

Every Ivory Cradle School lesson video follows these rules. The First Overnight Shift
(`video/first-overnight-shift`, built by `video/build-scenes.py`) is the reference.

## Music

* **Opening:** one calm track plays at full level from the first frame. It starts fading at
  **3 seconds** and is **silent by 4 seconds**. No music under the narration after that.
* **Closing:** the same track enters softly under the final (wrap) scene, sits about 18 dB under
  the voice, rises once the last line ends, then fades out with the final frame.
* Music comes from the HeyGen library through `npx hyperframes` (signed in with the school's
  HeyGen account). Note the track's source in the commit.

## Narration

* Voice: Kokoro **Heart** (`af_heart`), read verbatim from the approved script.
* Pronunciation fixes are applied in `video/build-narration.py`: verbs such as "record" and
  "use" are forced to their verb pronunciation, and times say "PM" / "AM" with no pause.
  Listen for other words that have a noun and a verb form and add them there.
* Scenes are timed to the recorded voice, never the other way round. Keep any pause the script
  asks for (for example the three second thinking beat).

## Look

* 1920 by 1080 at 30 fps. Parchment background, espresso text, terracotta accents.
* Bricolage Grotesque for headings, DM Sans for body text, no text under 28 px.
* Keep the lower fifth of the frame clear for captions; captions ship as a separate WebVTT file
  timed to the voice.
* Use real photos supplied by the school instead of drawn people or babies.
* No dashes in on screen copy.
