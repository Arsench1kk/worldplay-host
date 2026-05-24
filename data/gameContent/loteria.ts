/**
 * Loteria game content — fallback card deck, caller riddles, and types.
 * No network dependency. All content is local.
 */

export type LoteriaCard = {
  id: number;
  name: string;
  emoji: string;
  riddle: string; // AI Cantor fallback clue
};

export type LoteriaPhase =
  | "intro"
  | "playing"
  | "win"
  | "lose";

export type LoteriaGameState = {
  phase: LoteriaPhase;
  board: LoteriaCard[];        // 9 cards on the player's tabla
  deck: LoteriaCard[];         // shuffled caller deck (remaining)
  calledCards: LoteriaCard[];   // cards already called
  currentCall: LoteriaCard | null;
  marked: Set<number>;         // card ids the player has marked
  callCount: number;
  won: boolean;
  winLine: number[] | null;    // indices of winning 3 cells
};

/** The traditional 54-card Loteria deck — we use 20 for the MVP. */
export const LOTERIA_DECK: LoteriaCard[] = [
  { id: 1,  name: "El Gallo",       emoji: "🐓", riddle: "The one who sings at dawn." },
  { id: 2,  name: "El Diablito",    emoji: "😈", riddle: "Small but full of mischief." },
  { id: 3,  name: "La Dama",        emoji: "👸", riddle: "Grace walks wherever she goes." },
  { id: 4,  name: "El Catrín",      emoji: "🎩", riddle: "Dressed sharp, never out of style." },
  { id: 5,  name: "El Paraguas",    emoji: "☂️",  riddle: "Your best friend when the sky cries." },
  { id: 6,  name: "La Sirena",      emoji: "🧜", riddle: "She sings from the waves below." },
  { id: 7,  name: "La Escalera",    emoji: "🪜", riddle: "Climb me rung by rung." },
  { id: 8,  name: "La Botella",     emoji: "🍾", riddle: "Pop! The party begins." },
  { id: 9,  name: "El Barril",      emoji: "🛢️", riddle: "Round and full, I hold the goods." },
  { id: 10, name: "El Árbol",       emoji: "🌳", riddle: "I give shade and ask for nothing." },
  { id: 11, name: "El Melón",       emoji: "🍈", riddle: "Sweet on the inside, tough on the outside." },
  { id: 12, name: "El Valiente",    emoji: "🗡️", riddle: "Brave of heart with blade in hand." },
  { id: 13, name: "El Gorrito",     emoji: "🧢", riddle: "A small cap for a big head." },
  { id: 14, name: "La Muerte",      emoji: "💀", riddle: "She comes for everyone, no exceptions." },
  { id: 15, name: "La Pera",        emoji: "🍐", riddle: "Shaped like a tear, sweet to eat." },
  { id: 16, name: "La Bandera",     emoji: "🇲🇽", riddle: "Three colors fly with pride." },
  { id: 17, name: "El Bandolón",    emoji: "🎸", riddle: "Strings that sing the ranchera." },
  { id: 18, name: "El Violoncello", emoji: "🎻", riddle: "Deep tones from the orchestra pit." },
  { id: 19, name: "La Garza",       emoji: "🦢", riddle: "Long neck, still waters, patient hunter." },
  { id: 20, name: "El Pájaro",      emoji: "🐦", riddle: "Free wings and a morning song." },
];

export const GAME_INSTRUCTIONS = [
  "Your tabla has 9 picture cards in a 3×3 grid.",
  "The AI Cantor calls one card at a time with a riddle clue.",
  "If the called card matches one on your tabla, tap it to mark it.",
  "Get 3 in a row (horizontal, vertical, or diagonal) to win!",
  "If the deck runs out before you get a line — the Cantor wins.",
];

export const CANTOR_INTRO_LINES = [
  "¡Lotería! Let the cards speak…",
  "The Cantor is ready. Listen carefully!",
  "Gather around the tabla — it is time!",
  "Cards on the table, ears open wide.",
];

export const CANTOR_WIN_LINES = [
  "¡Lotería! You have a winning line!",
  "¡Buena! The tabla smiles upon you!",
  "Three in a row — the Cantor bows!",
];

export const CANTOR_LOSE_LINES = [
  "The deck is empty… the Cantor wins this time.",
  "No line found — better luck next tabla!",
  "The cards were not in your favor today.",
];
