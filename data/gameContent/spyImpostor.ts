export type SpyImpostorPhase =
  | "setup"
  | "word-pack"
  | "role-reveal"
  | "question"
  | "vote"
  | "result"
  | "game-over";

export type SpyRole = "agent" | "spy";

export type SpyPlayer = {
  id: string;
  name: string;
  role: SpyRole;
  word: string;
  vote: string | null;
};

export type SpyWordPack = {
  category: string;
  words: string[];
};

export type SpyGameState = {
  phase: SpyImpostorPhase;
  players: SpyPlayer[];
  spyIndex: number;
  secretWord: string;
  wordPack: SpyWordPack;
  currentRevealIndex: number;
  questionTimeLeft: number;
  votes: Record<string, string>; // voterId -> voteForId
  votedPlayers: string[];
  questionStartTime: number;
};

export const WORD_PACKS_FALLBACK: SpyWordPack[] = [
  {
    category: "Places",
    words: [
      "beach", "airport", "hospital", "library", "museum", "restaurant",
      "school", "stadium", "theater", "prison", "castle", "island",
    ],
  },
  {
    category: "Animals",
    words: [
      "penguin", "octopus", "owl", "shark", "rabbit", "eagle",
      "snake", "dolphin", "bear", "wolf", "tiger", "koala",
    ],
  },
  {
    category: "Jobs",
    words: [
      "chef", "pilot", "doctor", "teacher", "actor", "athlete",
      "soldier", "artist", "scientist", "detective", "priest", "nurse",
    ],
  },
  {
    category: "Food",
    words: [
      "pizza", "sushi", "pasta", "curry", "tacos", "ramen",
      "burrito", "salad", "steak", "noodles", "soup", "cake",
    ],
  },
  {
    category: "Sports",
    words: [
      "soccer", "tennis", "golf", "boxing", "surfing", "skiing",
      "cycling", "basketball", "swimming", "running", "climbing", "dancing",
    ],
  },
  {
    category: "Transport",
    words: [
      "airplane", "train", "subway", "bicycle", "helicopter", "boat",
      "motorcycle", "bus", "car", "truck", "rocket", "spaceship",
    ],
  },
];

export const GAME_INSTRUCTIONS = [
  "Everyone gets a secret word — except one person who only gets a category hint.",
  "That person is the SPY. They must blend in and figure out the word.",
  "Take turns asking questions to the table. The spy tries to guess.",
  "After the question round, vote on who you think the spy is.",
  "If the group finds the spy → Group wins. If the spy survives → Spy wins!",
];

export const HOST_INTRO_LINES = [
  "One player is the Spy. Everyone else sees the word. Can you find the imposter?",
  "The AI host secretly assigns roles. Pass the device — each player sees only their own!",
  "Ask clever questions, watch for tells, and cast your vote carefully.",
];

export const SPY_INTRO_LINES = [
  "You are the Spy! You don't know the word — but you have a hint.",
  "Blend in, ask questions, and try to guess the secret word before they vote you out.",
  "Good spies act confident. Try to figure out what the word is!",
];

export const AGENT_INTRO_LINES = [
  "You know the secret word. Keep it safe and help find the spy!",
  "Don't give it away! Answer questions carefully without revealing the word.",
  "Watch others carefully — the spy will try to blend in.",
];

export const VOTE_HINT_LINES = [
  "Who do you think is the spy? Cast your vote.",
  "Time to decide. Who seems suspicious?",
  "The vote is open. Pick carefully!",
];

export const WIN_LINES = [
  "The group wins! The spy has been caught!",
  "Well done, team! The impostor didn't fool you.",
  "Spy found! The town is safe.",
];

export const SPY_WIN_LINES = [
  "The Spy escapes! Nobody suspected you.",
  "Perfect cover! The spy wins.",
  "You fooled them all. Spy victory!",
];

export const AI_QUESTION_SAMPLES = [
  "Is it something you can see from space?",
  "Is it a living thing?",
  "Can you buy it in a store?",
  "Is it larger than a car?",
  "Do children often play with it?",
  "Is it found outdoors?",
  "Does it have a specific color?",
  "Is it round or square?",
];

export function pickWordPack(): SpyWordPack {
  return WORD_PACKS_FALLBACK[Math.floor(Math.random() * WORD_PACKS_FALLBACK.length)];
}

export function pickWordFromPack(pack: SpyWordPack): string {
  return pack.words[Math.floor(Math.random() * pack.words.length)];
}

export function getRoleHint(word: string, pack: SpyWordPack): string {
  return `The category is: ${pack.category}`;
}

export function tallyVotes(
  votes: Record<string, string>,
  playerIds: string[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const id of playerIds) counts[id] = 0;
  for (const voterId of Object.keys(votes)) {
    const targetId = votes[voterId];
    if (targetId in counts) counts[targetId]++;
  }
  return counts;
}

export function determineWinner(
  votes: Record<string, string>,
  spyId: string,
  playerIds: string[]
): "group" | "spy" {
  const counts = tallyVotes(votes, playerIds);
  const maxVotes = Math.max(...Object.values(counts));
  const topVoted = Object.entries(counts).filter(([, c]) => c === maxVotes);

  // If there's a tie, spy wins (safe)
  if (topVoted.length > 1) return "spy";
  // If spy got most votes, group wins
  if (topVoted[0]?.[0] === spyId) return "group";
  // Otherwise spy wins
  return "spy";
}