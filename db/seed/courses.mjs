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
  bottle: { label: 'CDC: About Feeding From a Bottle', url: 'https://www.cdc.gov/infant-toddler-nutrition/bottle-feeding/' },
  formula: { label: 'CDC: Infant Formula Preparation and Storage', url: 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html' },
  milk: { label: 'CDC: Breast Milk Storage and Preparation', url: 'https://www.cdc.gov/breastfeeding/breast-milk-preparation-and-storage/handling-breastmilk.html' },
  warning: { label: 'American Academy of Pediatrics: Warning Signs of Breastfeeding Problems', url: 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Warning-Signs-of-Breastfeeding-Problems.aspx' },
  ems: { label: 'American Academy of Pediatrics: When to Call Emergency Medical Services', url: 'https://www.healthychildren.org/english/health-issues/injuries-emergencies/pages/when-to-call-emergency-medical-services-ems.aspx' },
}

export const FEEDING_SUPPORT = {
  slug: 'feeding-support-on-shift',
  status: 'published',
  sortOrder: 20,
  priceCents: 2500,
  media: 'course-media/feeding-support-on-shift',
  worksheetFile: 'feeding-support-on-shift-worksheet.pdf',
  draft: {
    title: 'Feeding Support on Shift',
    category: 'Feeding & Lactation',
    summary:
      'Practice clarifying a family’s feeding plan, responding to a baby’s bottle feeding cues, applying formula and expressed breast milk handling guidance, and communicating when a feed goes differently than planned.',
    description:
      'You arrive for an overnight shift and the parent says, “There’s a bottle in the fridge if you need it.” This workshop follows that shift from arrival to morning handoff: making the feeding plan explicit, a responsive bottle feeding demonstration, two milk clocks that look alike but follow different rules, and a clear update when a feed goes differently than planned. Plan on about 18 minutes of video practice, with pauses to write on your worksheet, and an untimed five question quiz.',
    scope:
      'Examples concern routine support for healthy, full term newborns during nonmedical, in home shifts. For a baby with special feeding needs, follow the clinician directed plan and work within your role and training.',
    audience: [
      'Newborn Care Specialists providing nonmedical support during in home shifts',
      'Postpartum doulas supporting families at home in the United States',
    ],
    objectives: [
      'Read back an actionable feeding plan before you take over',
      'Recognize responsive bottle feeding: holding the baby close, pausing, and stopping at fullness cues',
      'Apply the correct milk handling deadline for prepared formula and expressed breast milk',
      'Report observed changes and know when to involve a parent, the pediatrician, or emergency services',
    ],
    included: [
      'A video workshop of about 18 minutes with captions',
      'A printable one page field guide and practice worksheet',
      'An untimed five question quiz',
      'A Certificate of Completion when you score at least 4 out of 5',
    ],
    worksheetLabel: 'Feeding Plan Field Guide & Workshop Practice',
    estimatedMinutes: 30,
    image: '/images/feeding-support-on-shift.jpg',
    imageAlt: 'A parent opens the fridge and points to a bottle of milk while a caregiver in sage green scrubs listens in a softly lit kitchen.',
    resources: [SRC.bottle, SRC.formula, SRC.milk, SRC.warning, SRC.ems],
    // Explanations are staff only grading notes. Students see their score, never the key.
    questions: [
      {
        id: 'q1',
        prompt: 'Which read back gives you enough information to act on “There’s a bottle if you need it”?',
        options: [
          '“I’ll use the bottle at the next feed.”',
          '“I’ll bring baby to you to nurse first, use the confirmed backup only if you ask, and knock if a feed is smaller than usual. Is that right?”',
          '“I’ll handle feeding the way I usually do.”',
          '“I’ll make a note and ask you in the morning.”',
        ],
        correctIndex: 1,
        explanation: 'The read back confirms the next action, bottle use, and when and how to involve the parent. ICS handoff practice.',
      },
      {
        id: 'q2',
        prompt: 'After a pause, baby turns away again and keeps their mouth closed during a routine bottle feed. What is the best response?',
        options: [
          'Tip the bottle more vertically.',
          'Keep offering the bottle until the planned amount is gone.',
          'Stop and document the observed cues and measured intake.',
          'Set up the bottle so baby can finish independently.',
        ],
        correctIndex: 2,
        explanation: 'Respond to fullness cues and record the observation. Source: CDC Bottle Feeding.',
      },
      {
        id: 'q3',
        prompt: 'Formula was prepared at 10:00 p.m. Feeding started at 10:30 and ended at 10:45. What should you do with the formula left in the bottle?',
        options: [
          'Discard it when the feed ends.',
          'Refrigerate it for use by 10:00 p.m. tomorrow.',
          'Save it until 11:30 because that is one hour after feeding began.',
          'Save it until midnight because that is two hours after preparation.',
        ],
        correctIndex: 0,
        explanation: 'Discard formula remaining after the feed ends. The other time limits do not make a used bottle safe for later. Source: CDC Formula Preparation and Storage.',
      },
      {
        id: 'q4',
        prompt: 'Expressed breast milk was warmed at 11:20 p.m. and the feed ended at midnight. Assuming no other earlier limit applies, which deadline governs the leftover milk?',
        options: ['2:00 a.m.', '1:20 a.m.', '12:20 a.m.', '11:20 a.m.'],
        correctIndex: 1,
        explanation: 'The warming deadline is 1:20 a.m. and the leftover deadline is 2:00 a.m. The earlier deadline governs. Source: CDC Breast Milk Storage and Preparation.',
      },
      {
        id: 'q5',
        prompt: 'At 12:10 a.m. a baby takes 1 oz of 2 oz expressed milk offered, turns away twice, and stops feeding. This is less than usual, and the parent asked to be woken. What should you do?',
        options: [
          'Tell the parent in the morning that baby is a poor feeder.',
          'Change the overnight plan without consulting the parent.',
          'Keep trying until the baby finishes the bottle.',
          'Log the time, measured intake, and cues. Wake the parent as agreed and report what happened.',
        ],
        correctIndex: 3,
        explanation: 'Document observations and follow the agreed notification plan. ICS shift documentation practice.',
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

export const COURSES = [FIRST_OVERNIGHT_SHIFT, FEEDING_SUPPORT, ...PREVIEW_COURSES]
