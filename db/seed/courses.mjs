// Starting catalog for staging. The First Overnight Shift is the complete working course.
// The other two appear in the catalog as previews until their materials are ready.
// Visible copy avoids dashes by request.

export const FIRST_OVERNIGHT_SHIFT = {
  slug: 'the-first-overnight-shift',
  status: 'published',
  sortOrder: 10,
  draft: {
    title: 'The First Overnight Shift',
    category: 'Overnight care',
    summary: 'Practice what to ask at arrival and what to share in your morning handoff.',
    description:
      'Your first night with a new family sets the tone for everything that follows. This mini course walks through the three moments that shape a calm overnight shift: the arrival conversation, the quiet hours, and the morning handoff. You will leave with a checklist you can bring to your next placement.',
    audience: [
      'Caregivers preparing for their first overnight placement with a newborn',
      'Experienced nannies and doulas moving into overnight newborn work',
      'Anyone who wants a clear routine for arrival, the overnight hours, and the morning report',
    ],
    objectives: [
      'Confirm the family’s feeding plan, sleep setup, and wake instructions before the parents go to bed',
      'Keep a clear shift log of feeds, diapers, sleep, and anything unusual',
      'Follow safe sleep basics and the family’s plan when something concerns you',
      'Deliver a calm, complete morning handoff that parents can act on',
    ],
    included: [
      'One video lesson with captions',
      'A one page First Shift Checklist to print or fill in',
      'A five question quiz with no timer',
      'A Certificate of Completion when you score at least 4 out of 5',
    ],
    worksheetLabel: 'First shift checklist',
    estimatedMinutes: 15,
    questions: [
      {
        id: 'q1',
        prompt: 'Before the parents go to bed on your first night, what is the most important thing to confirm?',
        options: [
          'Where the spare blankets are kept',
          'The feeding plan, the sleep setup, and exactly when and how they want to be woken',
          'What time they usually wake up on weekends',
          'Whether they prefer you to keep the lights on',
        ],
        correctIndex: 1,
        explanation:
          'The arrival conversation should cover the feeding plan, the sleep setup, and the family’s wake instructions so you never have to guess in the middle of the night.',
      },
      {
        id: 'q2',
        prompt: 'What is the main purpose of a shift log?',
        options: [
          'To prove you stayed awake',
          'To give parents an accurate record of feeds, diapers, sleep, and anything unusual',
          'To track your own hours for payroll',
          'To compare this baby with other babies you have cared for',
        ],
        correctIndex: 1,
        explanation:
          'A shift log turns the night into facts the family can use: times, amounts, diapers, sleep stretches, and notes about anything that stood out.',
      },
      {
        id: 'q3',
        prompt: 'When you lay the baby down to sleep, which setup follows safe sleep basics?',
        options: [
          'On the back, on a firm flat surface, with no pillows, bumpers, or loose blankets',
          'On the side, propped with a rolled blanket',
          'On the tummy, so the baby settles faster',
          'In the adult bed between two pillows',
        ],
        correctIndex: 0,
        explanation:
          'Back to sleep on a firm, flat surface with nothing loose in the sleep space is the baseline for every overnight shift.',
      },
      {
        id: 'q4',
        prompt: 'During the night, something about the baby concerns you. What should you do?',
        options: [
          'Wait until the morning handoff to mention it',
          'Search online and decide on your own',
          'Follow the family’s instructions for waking them, and call 911 in an emergency',
          'Text a friend who has children',
        ],
        correctIndex: 2,
        explanation:
          'You agreed on wake instructions at arrival for exactly this reason. Use them, and call emergency services right away in an emergency.',
      },
      {
        id: 'q5',
        prompt: 'A strong morning handoff includes which of the following?',
        options: [
          'Only the total hours the baby slept',
          'A short summary of feeds, diapers, sleep, anything unusual, and supplies running low',
          'A list of things the parents should do differently',
          'Nothing, as long as the shift log is on the counter',
        ],
        correctIndex: 1,
        explanation:
          'Parents are tired in the morning. A brief spoken summary backed by the log, plus a note on supplies, lets them pick up the day with confidence.',
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
