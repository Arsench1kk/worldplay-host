export type CultureId =
  | "kazakhstan"
  | "japan"
  | "brazil"
  | "nigeria"
  | "india"
  | "turkey"
  | "mexico"
  | "korea"
  | "iran"
  | "italy"
  | "classic";

export type PartyVibe =
  | "funny"
  | "chaotic"
  | "cultural"
  | "family"
  | "strategic"
  | "deep";

export type GameId =
  | "asyk-atu"
  | "togyzkumalak-lite"
  | "daruma"
  | "kagome-kagome"
  | "peteca-lite"
  | "adedonha"
  | "ayo-lite"
  | "suwe"
  | "antakshari"
  | "kabaddi-cards"
  | "mangala-lite"
  | "mendil-kapmaca"
  | "loteria"
  | "vibora-de-la-mar"
  | "yutnori-sprint"
  | "gonggi-lite"
  | "gol-ya-pooch"
  | "dooz-lite"
  | "strega-colore"
  | "morra"
  | "the-hat"
  | "truth-or-dare"
  | "spy-impostor"
  | "broken-telephone";

export type CulturePack = {
  id: CultureId;
  country: string;
  flag: string;
  greeting: string;
  hostName: string;
  hostVoiceLang: string;
  visualTheme: {
    gradientClass: string;
    accentClass: string;
    stampLabel: string;
    icon: string;
  };
  facts: string[];
  featuredGameIds: GameId[];
  supportedVibes: PartyVibe[];
  fallbackHostIntro: string;
  fallbackOpeningLine: string;
};
