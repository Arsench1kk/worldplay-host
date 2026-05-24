import type { CulturePack, CultureId } from "@/types/culture";

export const cultures: CulturePack[] = [
  {
    id: "kazakhstan",
    country: "Kazakhstan",
    flag: "KZ",
    greeting: "Salem!",
    hostName: "Aruzhan",
    hostVoiceLang: "kk-KZ",
    visualTheme: {
      gradientClass: "theme-sky-gold",
      accentClass: "accent-gold",
      stampLabel: "Steppe Pass",
      icon: "sun"
    },
    facts: [
      "Kazakh play traditions often reward accuracy, patience, and table talk.",
      "Asyk pieces come from ankle bones and are used in many dexterity games."
    ],
    featuredGameIds: ["asyk-atu", "togyzkumalak-lite", "the-hat"],
    supportedVibes: ["cultural", "family", "strategic", "deep"],
    fallbackHostIntro:
      "Welcome to the steppe table. I will keep this quick: choose a steady hand game, a thinking game, or a fast party round.",
    fallbackOpeningLine:
      "The globe settles over Kazakhstan, and the room gets a calm challenge."
  },
  {
    id: "japan",
    country: "Japan",
    flag: "JP",
    greeting: "Konnichiwa!",
    hostName: "Hana",
    hostVoiceLang: "ja-JP",
    visualTheme: {
      gradientClass: "theme-red-ink",
      accentClass: "accent-coral",
      stampLabel: "Festival Stop",
      icon: "lantern"
    },
    facts: [
      "Many Japanese children's games use songs, timing, and a shared sense of suspense.",
      "Daruma-san ga koronda is a classic stop-and-go playground game."
    ],
    featuredGameIds: ["daruma", "kagome-kagome", "the-hat"],
    supportedVibes: ["funny", "chaotic", "family", "cultural"],
    fallbackHostIntro:
      "I am Hana, your festival host. Freeze when the call ends, laugh when the timing goes wrong, and keep the rules light.",
    fallbackOpeningLine:
      "The globe clicks to Japan, where timing becomes the joke."
  },
  {
    id: "brazil",
    country: "Brazil",
    flag: "BR",
    greeting: "Oi!",
    hostName: "Lia",
    hostVoiceLang: "pt-BR",
    visualTheme: {
      gradientClass: "theme-green-sun",
      accentClass: "accent-leaf",
      stampLabel: "Street Play",
      icon: "feather"
    },
    facts: [
      "Peteca is a hand-struck shuttle game with Indigenous Brazilian roots.",
      "Adedonha turns quick category thinking into a table race."
    ],
    featuredGameIds: ["peteca-lite", "adedonha", "broken-telephone"],
    supportedVibes: ["funny", "chaotic", "family", "cultural"],
    fallbackHostIntro:
      "Oi, I am Lia. We can go physical with a tiny target challenge or keep it seated with a speedy word race.",
    fallbackOpeningLine:
      "The globe lands in Brazil, and the room starts moving before the rules finish."
  },
  {
    id: "nigeria",
    country: "Nigeria",
    flag: "NG",
    greeting: "Nnoo!",
    hostName: "Tomi",
    hostVoiceLang: "en-NG",
    visualTheme: {
      gradientClass: "theme-green-night",
      accentClass: "accent-aqua",
      stampLabel: "Rhythm Table",
      icon: "drum"
    },
    facts: [
      "Ayo is a mancala-family game played with pits, seeds, and sharp counting.",
      "Call-and-response play appears across many party and children's games."
    ],
    featuredGameIds: ["ayo-lite", "suwe", "broken-telephone"],
    supportedVibes: ["strategic", "family", "cultural", "deep"],
    fallbackHostIntro:
      "I am Tomi. Tonight we can count seeds, call patterns, or let a message change as it travels around the room.",
    fallbackOpeningLine:
      "The globe stops in Nigeria, and the host sets a rhythm for the table."
  },
  {
    id: "india",
    country: "India",
    flag: "IN",
    greeting: "Namaste!",
    hostName: "Mira",
    hostVoiceLang: "en-IN",
    visualTheme: {
      gradientClass: "theme-saffron-rose",
      accentClass: "accent-coral",
      stampLabel: "Song Circle",
      icon: "spark"
    },
    facts: [
      "Antakshari is a beloved song-chain game where each song begins from the previous ending sound.",
      "Kabaddi-inspired party variants turn breath, bluffing, and tags into tabletop prompts."
    ],
    featuredGameIds: ["antakshari", "kabaddi-cards", "truth-or-dare"],
    supportedVibes: ["funny", "chaotic", "cultural", "family"],
    fallbackHostIntro:
      "Namaste, I am Mira. I will keep the music moving, the prompts playful, and the turn order obvious.",
    fallbackOpeningLine:
      "The globe warms over India, and everyone gets ready to answer with rhythm."
  },
  {
    id: "turkey",
    country: "Turkey",
    flag: "TR",
    greeting: "Merhaba!",
    hostName: "Deniz",
    hostVoiceLang: "tr-TR",
    visualTheme: {
      gradientClass: "theme-red-mint",
      accentClass: "accent-aqua",
      stampLabel: "Tea House",
      icon: "moon"
    },
    facts: [
      "Mangala is a Turkish mancala game with elegant counting and capture rules.",
      "Mendil kapmaca is a lively handkerchief chase game often played by children."
    ],
    featuredGameIds: ["mangala-lite", "mendil-kapmaca", "morra"],
    supportedVibes: ["strategic", "family", "chaotic", "cultural"],
    fallbackHostIntro:
      "Merhaba, I am Deniz. Choose the thinking board, the quick grab, or a guessing duel for two hands and loud voices.",
    fallbackOpeningLine:
      "The globe rests on Turkey, halfway between a puzzle and a chase."
  },
  {
    id: "mexico",
    country: "Mexico",
    flag: "MX",
    greeting: "Hola!",
    hostName: "Sofia",
    hostVoiceLang: "es-MX",
    visualTheme: {
      gradientClass: "theme-pink-green",
      accentClass: "accent-leaf",
      stampLabel: "Fiesta Card",
      icon: "card"
    },
    facts: [
      "Loteria is a picture-card game led by a caller's poetic clues.",
      "Vibora de la mar is a singing line game often played at parties and schoolyards."
    ],
    featuredGameIds: ["loteria", "vibora-de-la-mar", "truth-or-dare"],
    supportedVibes: ["funny", "family", "cultural", "chaotic"],
    fallbackHostIntro:
      "Hola, I am Sofia. I can call cards, start a singing line, or pick a tiny dare that still keeps the table friendly.",
    fallbackOpeningLine:
      "The globe pops into Mexico, and the host reaches for the caller deck."
  },
  {
    id: "korea",
    country: "Korea",
    flag: "KR",
    greeting: "Annyeong!",
    hostName: "Min",
    hostVoiceLang: "ko-KR",
    visualTheme: {
      gradientClass: "theme-blue-red",
      accentClass: "accent-sky",
      stampLabel: "Seollal Sprint",
      icon: "kite"
    },
    facts: [
      "Yutnori is a traditional race game using stick throws instead of dice.",
      "Gonggi is a dexterity game played with small stones or pieces."
    ],
    featuredGameIds: ["yutnori-sprint", "gonggi-lite", "daruma"],
    supportedVibes: ["family", "strategic", "chaotic", "cultural"],
    fallbackHostIntro:
      "Annyeong, I am Min. I will make the race short, the throws dramatic, and the dexterity round easy to try on a table.",
    fallbackOpeningLine:
      "The globe glides to Korea, and the next move depends on a lucky throw."
  },
  {
    id: "iran",
    country: "Iran",
    flag: "IR",
    greeting: "Salaam!",
    hostName: "Nika",
    hostVoiceLang: "fa-IR",
    visualTheme: {
      gradientClass: "theme-teal-rose",
      accentClass: "accent-gold",
      stampLabel: "Garden Game",
      icon: "tile"
    },
    facts: [
      "Gol ya Pooch is a hidden-object guessing game often played with teams.",
      "Do-o-z is a three-in-a-row strategy game related to mill-style board games."
    ],
    featuredGameIds: ["gol-ya-pooch", "dooz-lite", "the-hat"],
    supportedVibes: ["deep", "strategic", "family", "cultural"],
    fallbackHostIntro:
      "Salaam, I am Nika. Hide the object, read the bluff, or slow down with a small strategy board.",
    fallbackOpeningLine:
      "The globe lands in Iran, and the table starts watching hands closely."
  },
  {
    id: "italy",
    country: "Italy",
    flag: "IT",
    greeting: "Ciao!",
    hostName: "Luca",
    hostVoiceLang: "it-IT",
    visualTheme: {
      gradientClass: "theme-olive-red",
      accentClass: "accent-coral",
      stampLabel: "Piazza Round",
      icon: "mask"
    },
    facts: [
      "Strega comanda colore turns color spotting into a fast chase.",
      "Morra is an old hand-gesture guessing game played around the Mediterranean."
    ],
    featuredGameIds: ["strega-colore", "morra", "broken-telephone"],
    supportedVibes: ["funny", "chaotic", "family", "cultural"],
    fallbackHostIntro:
      "Ciao, I am Luca. I can call colors, referee hand guesses, or let a whispered phrase wander through the group.",
    fallbackOpeningLine:
      "The globe stops in Italy, and the piazza round starts with a shout."
  },
  {
    id: "classic",
    country: "Global Party Table",
    flag: "WP",
    greeting: "Welcome!",
    hostName: "Atlas",
    hostVoiceLang: "en-US",
    visualTheme: {
      gradientClass: "theme-night-gold",
      accentClass: "accent-sky",
      stampLabel: "Wildcard",
      icon: "globe"
    },
    facts: [
      "Classic party games are useful fallback bridges when a group needs almost no setup.",
      "WorldPlay can remix a familiar structure while keeping cultural discovery local and honest."
    ],
    featuredGameIds: ["the-hat", "spy-impostor", "truth-or-dare"],
    supportedVibes: ["funny", "chaotic", "family", "deep"],
    fallbackHostIntro:
      "I am Atlas. If the group needs a zero-setup round, I will keep it simple and still connect it back to the globe.",
    fallbackOpeningLine:
      "The globe gives you a wildcard, ready for a fast table round."
  }
];

export const cultureById = new Map<CultureId, CulturePack>(
  cultures.map((culture) => [culture.id, culture])
);

export function getCultureById(cultureId: CultureId): CulturePack | undefined {
  return cultureById.get(cultureId);
}
