/** Public illustrative content only. Never learner progress, live inventory or provider output. */
export const DEMO_QUIZ = {
  question: "What does a Git branch actually store?",
  options: [
    "A complete copy of every project file",
    "A reference to a commit",
    "A separate repository on your computer",
  ],
  correctIndex: 1,
  explanation:
    "A branch is a lightweight reference to a commit. New commits move that reference forward; they don't create a separate copy of your repository.",
} as const;

export function checkDemoAnswer(index: number): boolean | null {
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= DEMO_QUIZ.options.length
  )
    return null;
  return index === DEMO_QUIZ.correctIndex;
}

/** A single shared recipe powers the hero controls and the explanation below. */
export const LEARNING_RECIPE = [
  {
    id: "learn",
    number: "01",
    verb: "Learn",
    title: "Follow a structured roadmap.",
    node: "Branches",
    caption: "Learn one concept at a time.",
    explanation:
      "What is a Git branch? Start with the idea before the commands: a branch points to a commit.",
    detail:
      "Roadmaps break a topic into modules and focused concept lessons. Follow the sequence and track your progress as you learn.",
  },
  {
    id: "connect",
    number: "02",
    verb: "Connect",
    title: "Understand the connections.",
    node: "Commit references",
    caption: "Connect branches to commits.",
    explanation:
      "Connect branches to commits. The branch is a reference; the commit records a snapshot. Two ideas, one clearer picture.",
    detail:
      "Explore explanations and diagrams, ask a private AI question, or discuss a concept with other developers. Keep the question next to the lesson.",
  },
  {
    id: "recall",
    number: "03",
    verb: "Recall",
    title: "Practice, then revisit.",
    node: "Quiz & review",
    caption: "Test what you remember.",
    explanation:
      "Close the notes: what does a branch store? A quick check and a later review help you revisit the connection.",
    detail:
      "Check your understanding with quizzes, then return to your review queue. Spaced reviews schedule the next visit based on your answers.",
  },
] as const;

/** Existing product capabilities, not claims that their new GUI pages are complete. */
export const PRODUCT_FEATURES = [
  {
    id: "generate",
    label: "AI-ASSISTED COURSES",
    title: "Start with a topic, not a prompt chain.",
    detail:
      "Generate a roadmap, modules, concept lessons and quizzes in one workspace. Use a supported provider with your own API key, and edit the content yourself.",
    note: "NVIDIA & Gemini · bring your own key",
  },
  {
    id: "discuss",
    label: "QUESTIONS IN CONTEXT",
    title: "Ask where you’re learning.",
    detail:
      "Post in a concept’s shared discussion, or use Ask AI for a private answer. Answers verified by the concept author or an admin are clearly marked.",
    note: "Shared discussion · private Ask AI",
  },
  {
    id: "author",
    label: "BUILT BY DEVELOPERS",
    title: "Write it. Make it yours. Share it.",
    detail:
      "Author your own roadmaps and lessons. Keep them private or submit them for review and publication. Readers can see whether content is AI-generated, handwritten or mixed.",
    note: "Private drafts · reviewed public roadmaps",
  },
] as const;

export const HOMEPAGE_FAQ = [
  {
    question: "Do I need to know terminal commands?",
    answer:
      "No. You can use the graphical interface, or switch to the keyboard-driven CLI appearance. Both use the same account and learning content; the homepage’s terminal example does not switch your preference.",
  },
  {
    question: "How do quizzes and reviews work together?",
    answer:
      "Quizzes check your understanding of a concept. The review queue brings questions back for spaced practice, with scheduling based on your answers. Your learning progress and review history stay in your account.",
  },
  {
    question: "Can I write and share my own content?",
    answer:
      "Yes. Developers can author roadmaps and concept lessons, manually or with AI assistance. They stay private until you submit them and they pass review for publication. You can also write public articles, which visitors can read without an account.",
  },
  {
    question: "Do I need an account or an AI key?",
    answer:
      "Public articles are readable without signing in. Roadmaps, lessons and saved learning progress require an account. You do not need your own AI key to read or practice; bringing a supported provider key gives you an additional option for AI generation.",
  },
] as const;
