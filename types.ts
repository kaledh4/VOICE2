export enum CharacterID {
  ZOUZOU = 'zouzou',
  SNOW_PRINCESS = 'elsa',
  SPIDER_HERO = 'spiderman',
  ISLAND_GIRL = 'moana',
  ANTAR = 'antar',
  AISHA = 'aisha'
}

export enum BehaviorID {
  HYGIENE = 'hygiene',
  RESPECT = 'respect',
  STUDY = 'study',
  EATING = 'eating',
  CLEANING = 'cleaning',
  SHARING = 'sharing',
  HONESTY = 'honesty',
  SLEEP = 'sleep',
  KINDNESS = 'kindness'
}

export enum Screen {
  HOME = 'HOME',
  SETUP = 'SETUP',
  CHAT = 'CHAT'
}

export interface Character {
  id: CharacterID;
  name: string;
  title: string;
  avatarUrl: string;
  themeColor: string;
  voiceName: string; // Mapping for Gemini Voice
  systemPromptBase: string;
}

export interface Behavior {
  id: BehaviorID;
  title: string;
  emoji: string;
  description: string;
  promptContext: string;
}

export interface AppState {
  screen: Screen;
  character: Character | null;
  behavior: Behavior | null;
}