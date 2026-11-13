// Starting catalog for staging. The First Overnight Shift is the complete working course.
// The other two appear in the catalog as previews until their materials are ready.
// Visible copy avoids dashes by request.

export const FIRST_OVERNIGHT_SHIFT = {
  slug: 'the-first-overnight-shift',
  status: 'published',
  sortOrder: 10,
  priceCents: 1000,
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

export const PREVIEW_COURSES = [
  {
    slug: 'feeding-support-on-shift',
    status: 'preview',
    sortOrder: 20,
    draft: {
      title: 'Feeding Support on Shift',
      category: 'Feeding & lactation',
      summary: 'Clarify the family’s feeding plan and practice communicating changes.',
      description:
        'Feeding plans change quickly in the newborn weeks. Learn how to confirm the current plan at the start of every shift and how to share changes clearly with parents.',
      audience: ['Caregivers who support breastfed, bottle fed, or combination fed newborns'],
      objectives: ['Confirm the family’s current feeding plan', 'Communicate changes clearly and calmly'],
      included: ['One video lesson with captions', 'A one page conversation guide', 'A five question quiz', 'A Certificate of Completion'],
      worksheetLabel: 'Feeding plan conversation guide',
      estimatedMinutes: 15,
      questions: [],
    },
  },
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
