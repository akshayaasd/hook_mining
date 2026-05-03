import type { HookPattern } from "./types";

export const HOOK_PATTERNS: HookPattern[] = [
  {
    id: "contrarian",
    name: "Contrarian Take",
    emoji: "⚡",
    description: "Calls out a widely-held belief and flips it. Pattern interrupt.",
    examples: [
      "Everyone says you need a logo. You don't.",
      "Stop optimizing your listing. Do this instead.",
    ],
  },
  {
    id: "stat-shock",
    name: "Stat Shock",
    emoji: "📊",
    description: "Opens with a surprising number that creates immediate curiosity.",
    examples: [
      "97% of Amazon listings are leaving money on the table.",
      "$4.2M wasted on Amazon ads last month.",
    ],
  },
  {
    id: "story-open",
    name: "Story Open",
    emoji: "📖",
    description: "Drops the reader into a specific moment. Personal, narrative.",
    examples: [
      "Last Tuesday I lost $50K because of one image.",
      "I cold-emailed 1,200 founders. 3 said yes.",
    ],
  },
  {
    id: "listicle",
    name: "Listicle",
    emoji: "📝",
    description: "Promises a specific count of items. Easy mental commitment.",
    examples: [
      "3 things killing your CTR right now.",
      "5 hooks every Amazon seller should steal.",
    ],
  },
  {
    id: "question",
    name: "Question Hook",
    emoji: "❓",
    description: "Direct second-person question. Forces self-reflection.",
    examples: [
      "Why do your photos look cheap?",
      "How are competitors getting 3x your CVR?",
    ],
  },
  {
    id: "pov",
    name: "POV / Scenario",
    emoji: "🎬",
    description: "Scene-setting. Reader becomes the protagonist.",
    examples: [
      "POV: your listing photos are killing your sales.",
      "Imagine launching a product at 9am and selling out by lunch.",
    ],
  },
  {
    id: "before-after",
    name: "Before / After",
    emoji: "🔁",
    description: "Frames a transformation. Sets up a reveal.",
    examples: [
      "From $0 to $40K MRR in 30 days.",
      "Before Pixii: 8 hours per listing. After: 2 minutes.",
    ],
  },
  {
    id: "callout",
    name: "Direct Callout",
    emoji: "🎯",
    description: "Names the audience. Creates self-selection.",
    examples: [
      "Amazon sellers — read this before you launch.",
      "If you sell on Shopify, this changes everything.",
    ],
  },
  {
    id: "secret-reveal",
    name: "Secret Reveal",
    emoji: "🔓",
    description: "Promises insider knowledge. Curiosity gap.",
    examples: [
      "The trick top sellers won't tell you.",
      "What Amazon's algorithm actually rewards.",
    ],
  },
  {
    id: "challenge",
    name: "Challenge / Bet",
    emoji: "🥊",
    description: "Puts a stake in the ground. Confrontational.",
    examples: [
      "I bet your A+ content is hurting you.",
      "Show me a $1M listing without these 4 things.",
    ],
  },
  {
    id: "mistake",
    name: "Mistake Frame",
    emoji: "🚨",
    description: "Reframes common practice as an error.",
    examples: [
      "You're using Helium 10 wrong.",
      "The biggest mistake new Amazon sellers make.",
    ],
  },
  {
    id: "case-study",
    name: "Case Study",
    emoji: "🧪",
    description: "Specific brand or person + specific outcome.",
    examples: [
      "How Skin Perfection 10x'd output with Pixii.",
      "Mindful Goods ships 80 listings a week. Here's how.",
    ],
  },
  {
    id: "step-by-step",
    name: "Step-by-Step",
    emoji: "🪜",
    description: "Promises a concrete process. Implementation-focused.",
    examples: [
      "Here's the exact 4-step listing audit I use.",
      "How to A/B test your hero image in 10 minutes.",
    ],
  },
  {
    id: "tool-stack",
    name: "Tool Stack",
    emoji: "🧰",
    description: "Lists tools used. Tactical and shareable.",
    examples: [
      "The 6-tool stack we use for $10M Amazon brands.",
      "I replaced my $4K agency with these 3 tools.",
    ],
  },
  {
    id: "warning",
    name: "Warning",
    emoji: "⚠️",
    description: "Threatens a downside. Loss aversion.",
    examples: [
      "Don't post your Amazon listing until you read this.",
      "Stop running ads if your hero image looks like this.",
    ],
  },
  {
    id: "metaphor",
    name: "Metaphor / Analogy",
    emoji: "🪞",
    description: "Reframes the topic via comparison. Memorable.",
    examples: [
      "Your listing is a billboard, not a brochure.",
      "Amazon SEO is dating. Stop ghosting your shoppers.",
    ],
  },
  {
    id: "trend-jack",
    name: "Trend-Jack",
    emoji: "📈",
    description: "Hooks into a current event or viral moment.",
    examples: [
      "GPT-5 just changed how shoppers search Amazon.",
      "Rufus is killing your conversion. Here's the fix.",
    ],
  },
  {
    id: "build-in-public",
    name: "Build in Public",
    emoji: "🛠️",
    description: "Founder voice. Numbers + lessons in real time.",
    examples: [
      "Day 47 of building Pixii: $94K MRR.",
      "We just shipped the feature 23 customers asked for.",
    ],
  },
  {
    id: "myth-bust",
    name: "Myth Bust",
    emoji: "🧨",
    description: "Names a popular belief and dismantles it.",
    examples: [
      "Myth: more keywords = more sales.",
      "The 'lifestyle photo' rule is a lie.",
    ],
  },
  {
    id: "comparison",
    name: "Comparison",
    emoji: "⚖️",
    description: "X vs Y framing. Forces preference.",
    examples: [
      "Pixii vs hiring a designer.",
      "Lifestyle photos vs studio shots: which actually convert?",
    ],
  },
];

export const PATTERN_BY_ID = Object.fromEntries(HOOK_PATTERNS.map((p) => [p.id, p]));

export const NICHES = [
  { id: "amazon-seller", name: "Amazon Sellers" },
  { id: "ecommerce", name: "E-commerce / DTC" },
  { id: "ai-tools", name: "AI Tools" },
  { id: "dtc", name: "DTC Brands" },
  { id: "creator-economy", name: "Creator Economy" },
  { id: "saas", name: "SaaS" },
  { id: "general", name: "General" },
] as const;
