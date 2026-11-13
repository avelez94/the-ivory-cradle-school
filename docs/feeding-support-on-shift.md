# Feeding Support on Shift: staging handoff

Mini course 02. Status: in staging for approval. Live payments stay off; testers enroll through staging enrollment, and staff can open the course from the staff course list.

## Where things are

| Item | Location |
| --- | --- |
| Course page | https://the-ivory-cradle-school.vercel.app/courses/feeding-support-on-shift |
| Catalog price | $25 (The First Overnight Shift: $10) |
| Lesson video (rendered) | `private-assets/course-media/feeding-support-on-shift/lesson.mp4` |
| Captions | `private-assets/course-media/feeding-support-on-shift/lesson.en.vtt` |
| Worksheet | `private-assets/course-media/feeding-support-on-shift/feeding-support-on-shift-worksheet.pdf`, labeled "Feeding Plan Field Guide & Workshop Practice" |
| HyperFrames source | `video/feeding-support-on-shift/` (index.html plus seven scenes in `compositions/`) |
| Scene builder | `video/build-feeding.py` with the shared `video/lib/icsvideo.py` |
| Course copy, quiz and sources | `db/seed/courses.mjs` (FEEDING_SUPPORT) |

To change a line of narration or a caption, edit `video/build-feeding.py`, run it, then render:

```bash
HYPERFRAMES_PYTHON=/path/to/python-with-kokoro python video/build-feeding.py
```

```bash
cd video/feeding-support-on-shift && npx hyperframes check && npx hyperframes render --crf 26 -o ../render/feeding-support-on-shift.mp4
```

Only lines that changed are spoken again; the rest come from the voice cache.

## The video

Runtime: __RUNTIME__. Seven scenes, 1920 × 1080 at 30 fps, with captions in a separate WebVTT file timed to the recorded voice.

1. The bottle in the fridge. Opens on the parent saying "There's a bottle in the fridge if you need it." over the fridge photo, then the open questions and a 20 second practice.
2. Make the plan explicit. Caregiver and parent dialogue builds a five field feeding plan, the read back, and a 30 second practice on "Only wake me if it's important."
3. Responsive bottle feeding. The four actions, three guided demonstration segments, and a 20 second cue card practice (pause, stop, or continue).
4. Compare the two milk clocks. Two capped bottles labeled Prepared Formula and Expressed Breast Milk. Case A reveals 10:00, 10:30 and 10:45 p.m., asks "When should you discard what's left?", holds 25 seconds, then highlights "10:45 p.m. Discard leftovers when the feed ends." Case B shows 11:00 p.m. warmed to 1:00 a.m. warming limit and 11:30 p.m. feed ends to 1:30 a.m. leftover limit, asks "Which deadline comes first?", states that no earlier limit is assumed, holds 30 seconds, then highlights 1:00 a.m. The missing label case reveals "Set it aside. Check with the parent. Use a verified bottle from the agreed plan."
5. Support the parent and report changes. Nursing support, factual log beside a parent update, when to call the pediatrician or 911, and a 25 second rewrite of "Baby barely ate."
6. Run the full case. The overnight case, 100 seconds of worksheet time with soft chimes at 25, 55 and 80 seconds, the clarify, log and notify debrief, and a review of the note and the 2:00 a.m. deadline.
7. Close. Takeaways, then the sources, with a reminder that clickable links are in the course resources.

Voices: narrator Kokoro Heart, parent Kokoro Sarah, caregiver Kokoro Bella. Music follows the video standard: the opening music is silent by 4 seconds and returns under the closing scene.

## Items awaiting review

1. **Clinician review of the demonstration (required by the script).** A pediatric or lactation clinician should review scene 3 and the on screen feeding cards before publication.
2. **Mannequin footage is still needed.** No mannequin footage was supplied, so scene 3 uses the existing photos with step cards. To finish it as written, film three 25 second mannequin close ups: (a) label check and clean setup with the baby held close, (b) the pause while watching the baby's face, (c) the end of the feed and recording the amount. The narration no longer says "with a mannequin" so it matches what is on screen.
3. **Bottles are drawn.** The capped bottles in scene 4 are illustrations so the labels stay readable on phones. A close up photo of two labeled prop bottles can replace them.
4. **Milk handling interpretation.** The CDC limits are quoted as written. The rule that the earlier deadline governs when a warming limit and a leftover limit both apply (Case B, the full case, and quiz question 4) is the course's interpretation of how the two CDC limits combine; please confirm it.
5. **Clinical wording I adjusted.** On screen cards say "Angle the bottle rather than holding it vertical" and "Room for a break when baby wants one" to stay within the script. Please confirm.
6. **Runtime.** The script targets about 22 minutes. Read at a natural pace with every practice pause at its specified length, the workshop runs __RUNTIME__. Mannequin footage at full length would add roughly half a minute. The course page lists the actual runtime.
7. **Copy without dashes.** Following the site's no dash rule, the worksheet label reads "Feeding Plan Field Guide & Workshop Practice" and the Case A highlight reads "10:45 p.m. Discard leftovers when the feed ends" without the dash in the brief.
8. **Database.** No database is connected to the Vercel site yet, so the public course page works but enrolling, the player, the quiz and certificates need the Supabase database first. Everything was tested locally against PostgreSQL.

## Test results

__TESTS__
