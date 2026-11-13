// The school's catalog. Courses with `media` are published with their lesson video, captions and
// worksheet from private-assets/<media>. Courses without it appear as catalog previews.
// Visible copy avoids dashes by request.

export const FIRST_OVERNIGHT_SHIFT = {
  slug: 'the-first-overnight-shift',
  status: 'published',
  sortOrder: 10,
  priceCents: 1000,
  media: 'course-media/first-overnight-shift',
  worksheetFile: 'first-overnight-shift-worksheet.pdf',
  draft: {
    title: 'The First Overnight Shift',
    category: 'Overnight care',
    summary: 'Practice what to ask at arrival and what to share in your morning handoff.',
    description:
      'It’s nine at night, and the parents are ready for bed. This mini course walks through your first overnight shift in order: the arrival conversation, an unclear handoff, the sleep space, feeding and milk handling, when to escalate, and a factual log with a clear morning handoff. Plan on about 5 minutes of video, 5 minutes of worksheet practice, and an untimed five question quiz.',
    scope:
      'This lesson covers nonmedical newborn support: verifying the plan, observing, documenting, communicating, and escalating. Individual feeding instructions come from the family and the baby’s clinical team. It does not teach infant CPR, medical assessment, medication administration, or care for medically complex infants.',
    audience: [
      'New and early career Newborn Care Specialists supporting families at home in the United States',
      'Postpartum doulas who take overnight shifts with newborns',
    ],
    objectives: [
      'Confirm the last feed, overnight feeding instructions, sleep location, and how to reach the parents before taking over',
      'Select a sleep setup consistent with AAP guidance and explain when formula leftovers must be discarded',
      'Distinguish an emergency requiring 911 from newborn fever requiring immediate pediatric contact and urgent evaluation',
      'Write an objective shift entry and deliver a morning handoff that highlights any follow up',
    ],
    included: [
      'A 5 minute video lesson with captions',
      'A one page field reference and practice worksheet',
      'An untimed five question quiz',
      'A Certificate of Completion when you score at least 4 out of 5',
    ],
    worksheetLabel: 'Field reference and practice worksheet',
    image: '/images/first-overnight-shift.jpg',
    imageAlt: 'A parent points to the feeding notes in a logbook while a caregiver in sage green scrubs listens, beside a bassinet in a softly lit nursery.',
    estimatedMinutes: 15,
    resources: [
      { label: 'American Academy of Pediatrics: Safe Sleep', url: 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx' },
      { label: 'American Academy of Pediatrics: Fever and Your Baby', url: 'https://www.healthychildren.org/english/health-issues/conditions/fever/pages/fever-and-your-baby.aspx' },
      { label: 'American Academy of Pediatrics: When to Call Emergency Medical Services', url: 'https://www.healthychildren.org/english/health-issues/injuries-emergencies/pages/when-to-call-emergency-medical-services-ems.aspx' },
      { label: 'American Academy of Pediatrics: Pediatrician, Urgent Care, or ER', url: 'https://www.healthychildren.org/English/family-life/health-management/Pages/urgent-care-ER-or-pediatrician-a-parent-guide.aspx' },
      { label: 'CDC: Infant Formula Preparation and Storage', url: 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html' },
      { label: 'CDC: Breast Milk Storage and Preparation', url: 'https://www.cdc.gov/breastfeeding/breast-milk-preparation-and-storage/handling-breastmilk.html' },
    ],
    // Explanations are staff only grading notes. Students see their score, never the key.
    questions: [
      {
        id: 'q1',
        prompt: 'The parents disagree about when the baby last fed. What should you do before they go to bed?',
        options: [
          'Enter the earlier time as confirmed.',
          'Ask for their best estimate, confirm the next feed and wake up plan, and mark the time as approximate.',
          'Wait until morning to clarify the feeding plan.',
          'Use the feeding schedule from your last placement.',
        ],
        correctIndex: 1,
        explanation: 'Clarify the plan while the parents are available. An uncertain time should stay marked as an estimate. (ICS arrival and read back procedure.)',
      },
      {
        id: 'q2',
        prompt: 'Which setup should you use for routine newborn sleep?',
        options: [
          'A firm bassinet with a rolled blanket next to the baby.',
          'A reclined swing while an adult watches.',
          'A flat adult bed with the baby on their back.',
          'A safety approved bassinet with a firm, flat, level surface and a fitted sheet only, with the baby on their back.',
        ],
        correctIndex: 3,
        explanation: 'AAP guidance calls for back sleeping and a separate, firm, flat sleep surface with a fitted sheet and no loose objects. Source: AAP Safe Sleep.',
      },
      {
        id: 'q3',
        prompt: 'The baby finishes feeding and leaves some prepared formula in the bottle. What should you do?',
        options: [
          'Discard the leftover formula.',
          'Refrigerate it for the next feed.',
          'Add fresh formula to the same bottle.',
          'Save it for two hours after the feed as you might with expressed breast milk.',
        ],
        correctIndex: 0,
        explanation: 'CDC directs caregivers to discard formula left in the bottle after feeding. Expressed milk has different guidance. Source: CDC Formula Preparation and Storage.',
      },
      {
        id: 'q4',
        prompt: 'A six week old has a rectal temperature of 100.4°F (38°C). The baby is responsive and breathing normally. What should you do?',
        options: [
          'Wait until the temperature reaches 102°F.',
          'Mention it at the morning handoff.',
          'Wake the parent immediately and contact the pediatrician or after hours service right away for urgent evaluation.',
          'Continue the usual routine if the baby appears comfortable.',
        ],
        correctIndex: 2,
        explanation: 'Fever at this threshold in a six week old requires immediate pediatric contact and urgent evaluation, even when other symptoms are absent. Source: AAP Fever and Your Baby.',
      },
      {
        id: 'q5',
        prompt: 'Which entry gives the next caregiver the most useful, objective information?',
        options: [
          '“Baby ate well and slept fine.”',
          '“11:05 p.m. formula, 2 oz offered, 1.5 oz taken. Wet diaper. Back in bassinet at 11:30 p.m.”',
          '“Probably hungry again around 11.”',
          '“Typical night. No need to review the log.”',
        ],
        correctIndex: 1,
        explanation: 'The entry gives the next caregiver the time, measured amounts, diaper observation, and return to the bassinet. (ICS factual shift log procedure.)',
      },
    ],
  },
}

const SRC = {
  cdcMilk: { label: 'CDC: Breast Milk Storage and Preparation', url: 'https://www.cdc.gov/breastfeeding/breast-milk-preparation-and-storage/handling-breastmilk.html' },
  cdcFaq: { label: 'CDC: Breast Milk Storage Questions and Answers', url: 'https://www.cdc.gov/breastfeeding/php/guidelines-recommendations/faqs.html' },
  cdcFormula: { label: 'CDC: Infant Formula Preparation and Storage', url: 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html' },
  aapStorage: { label: 'American Academy of Pediatrics: Milk Storage Guidelines', url: 'https://www.aap.org/en/patient-care/breastfeeding/milk-storage-guidelines/' },
  hcStorage: { label: 'AAP HealthyChildren.org: Tips for Freezing & Refrigerating Breast Milk', url: 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Storing-and-Preparing-Expressed-Breast-Milk.aspx' },
  hcFormula: { label: 'AAP HealthyChildren.org: How to Safely Prepare Baby Formula With Water', url: 'https://www.healthychildren.org/English/ages-stages/baby/formula-feeding/Pages/How-to-Safely-Prepare-Formula-with-Water.aspx' },
}

// Rebuilt from Feeding Support on Shift. Storage times follow CDC; AAP is the clinical foundation.
// Every clinical claim is traced in docs/milk-handling-source-table.md (instructor only).
export const MILK_HANDLING = {
  slug: 'milk-handling-on-shift',
  status: 'published',
  sortOrder: 20,
  priceCents: 2500,
  media: 'course-media/milk-handling-on-shift',
  worksheetFile: 'milk-handling-on-shift-reference.pdf',
  draft: {
    title: 'Milk Handling on Shift',
    category: 'Feeding & Lactation',
    summary:
      'Decide whether a bottle is safe to offer based on what it contains, how it was handled, and which deadline applies. Practice storing, thawing, warming, and combining breast milk, preparing formula safely, and making a 2 a.m. bottle decision.',
    description:
      'You arrive for an overnight shift and the parent says, “There’s a bottle in the fridge if you need it.” This workshop teaches you to read that bottle: which baby it is for, what it contains, and what has happened to it. You will label and store fresh milk, freeze, thaw, and transport it, swirl, combine, and warm it, prepare formula safely, and compare the two milk clocks before a 2 a.m. decision with three containers. Plan on about 20 minutes of video and guided practice, a printable quick reference, and an untimed five question quiz.',
    scope:
      'Routine care of healthy babies at home in the United States. Storage times follow CDC, with clinical guidance from the American Academy of Pediatrics. For a premature, hospitalized, or medically vulnerable baby, follow the care team’s plan, and always follow the directions on formula products. Cases are fictional teaching examples.',
    audience: [
      'Newborn Care Specialists providing nonmedical support during in home shifts',
      'Postpartum doulas supporting families at home in the United States',
    ],
    objectives: [
      'Verify which baby a bottle is for, what it contains, and its handling history before offering it',
      'Label, store, freeze, thaw, and transport expressed breast milk using CDC storage times',
      'Swirl, combine, and warm milk safely, and know which date sets the storage limit',
      'Prepare formula exactly as directed, including extra precautions for higher risk infants',
      'Apply the right deadline and choose use, discard, or set aside and verify',
    ],
    included: [
      'A video workshop of about 20 minutes with captions and guided practice',
      'A printable one page quick reference with clickable sources',
      'An untimed five question quiz',
      'A Certificate of Completion when you score at least 4 out of 5',
    ],
    worksheetLabel: 'Milk Handling on Shift Quick Reference',
    estimatedMinutes: 35,
    image: '/images/feeding-support-on-shift.jpg',
    imageAlt: 'A mother in an orange top holds her baby close and supports the bottle while the baby feeds and looks up at her.',
    resources: [SRC.cdcMilk, SRC.cdcFaq, SRC.cdcFormula, SRC.aapStorage, SRC.hcStorage, SRC.hcFormula],
    // Explanations are staff only grading notes with the supporting source. Students see their score, never the key.
    questions: [
      {
        id: 'q1',
        prompt: 'The family has twins. Two bags of milk in the fridge are labeled only with a date. The parent says, “There’s a bottle in the fridge if you need it.” What should you verify before offering one?',
        options: [
          'Nothing more, because the parent said to use it.',
          'Only the date, because dated milk is always safe to offer.',
          'Which baby each bag is for, what it contains, and its handling history.',
          'Whether the milk looks and smells normal.',
        ],
        correctIndex: 2,
        explanation: 'Before offering a bottle, confirm the baby, the contents, and the handling history (ICS verification workflow). CDC and AAP say to label milk with the date expressed and, for childcare, the child’s name. CDC Breast Milk Storage and Preparation; AAP HealthyChildren, Tips for Freezing & Refrigerating Breast Milk.',
      },
      {
        id: 'q2',
        prompt: 'A frozen bag was moved to the refrigerator Monday at 8:00 p.m. It was completely thawed Tuesday at 6:00 a.m. Using the CDC standard taught in this course, when should it be used by?',
        options: [
          'Tuesday at 8:00 p.m.',
          'Wednesday at 6:00 a.m.',
          'Wednesday at 8:00 p.m.',
          'Thursday at 6:00 a.m.',
        ],
        correctIndex: 1,
        explanation: 'CDC: if you thaw breast milk in the refrigerator, use it within 24 hours, and start counting when it is completely thawed, not when it left the freezer. CDC Breast Milk Storage and Preparation, Safe thawing of breast milk.',
      },
      {
        id: 'q3',
        prompt: 'The parent expresses milk Monday at 7:00 p.m. and asks you to add it to milk expressed and chilled Monday at 7:00 a.m. What does CDC advise?',
        options: [
          'Pour the fresh milk in right away. The newer time sets the limit.',
          'Warm both in the microwave, then combine them.',
          'Combine them only while the fresh milk is still warm.',
          'Cool the fresh milk first, then combine. The 7:00 a.m. milk sets the storage limit.',
        ],
        correctIndex: 3,
        explanation: 'CDC advises cooling freshly expressed milk before combining it with older cooled milk, and basing storage time on when the older milk was first stored. CDC Breast Milk Storage Questions and Answers, Can I mix fresh breast milk with older breast milk?',
      },
      {
        id: 'q4',
        prompt: 'You are preparing powdered formula for a 6 week old baby. The family has no special plan from the baby’s clinician. Which preparation follows CDC’s extra precautions?',
        options: [
          'Boil the water, wait about 5 minutes, mix in the powder, let it cool, and test a few drops on your wrist.',
          'Mix the powder with cold tap water and feed right away.',
          'Add extra water so the formula is easier to digest.',
          'Mix as usual, then warm the bottle in the microwave.',
        ],
        correctIndex: 0,
        explanation: 'For babies younger than 2 months, born prematurely, or with weakened immune systems, CDC says to boil the water, wait about 5 minutes, then mix (very hot water, around 158°F, kills germs such as Cronobacter), cool, and test on the wrist. CDC Infant Formula Preparation and Storage; AAP HealthyChildren, How to Safely Prepare Baby Formula With Water.',
      },
      {
        id: 'q5',
        prompt: 'It is 2:00 a.m. Wednesday. The family’s plan is to offer labeled expressed milk from the fridge. Which container can you offer?',
        options: [
          'A bottle warmed at 11:20 p.m. that the baby fed from until 11:45 p.m.',
          'A bag labeled “completely thawed Tuesday 4:00 p.m.,” kept in the fridge.',
          'An unlabeled bottle of milk from the fridge door.',
          'Any of them, as long as you warm it first.',
        ],
        correctIndex: 1,
        explanation: 'Thawed milk in the refrigerator can be used within 24 hours of complete thaw (until Wednesday 4:00 p.m.). The warmed bottle passed its 2 hour limits at 1:20 a.m. and 1:45 a.m. The unlabeled bottle is set aside and verified. CDC Breast Milk Storage and Preparation; CDC Breast Milk Storage Questions and Answers.',
      },
    ],
  },
}

export const PREVIEW_COURSES = [
  {
    slug: 'working-with-newborn-twins',
    status: 'preview',
    sortOrder: 30,
    draft: {
      title: 'Working With Newborn Twins',
      category: 'Care for multiples',
      summary: 'Organize supplies and practice tracking each baby’s care during a shift.',
      description:
        'Two babies means two feeding plans, two logs, and twice the supplies. Build a setup that keeps each baby’s care clear from the first hour to the morning report.',
      audience: ['Caregivers preparing to support a family with newborn twins'],
      objectives: ['Organize a two baby station', 'Track each baby’s care separately and accurately'],
      included: ['One video lesson with captions', 'A one page two baby tracker', 'A five question quiz', 'A Certificate of Completion'],
      worksheetLabel: 'Two baby shift tracker',
      estimatedMinutes: 15,
      questions: [],
    },
  },
]

export const COURSES = [FIRST_OVERNIGHT_SHIFT, MILK_HANDLING, ...PREVIEW_COURSES]
