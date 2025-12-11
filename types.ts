export enum NationType {
  FIGHTER = 'FIGHTER',
  HOLY = 'HOLY',
  COMMERCIAL = 'COMMERCIAL',
  MAGIC = 'MAGIC'
}

export enum CardType {
  INDUSTRY = 'INDUSTRY',
  ATTACK = 'ATTACK',
  DEFENSE = 'DEFENSE',
  MISSILE = 'MISSILE',
  MAGIC = 'MAGIC',
  CONTRACT = 'CONTRACT',
  ENCHANTMENT = 'ENCHANTMENT'
}

export type EffectType = 'damage' | 'heal' | 'mana' | 'income' | 'gold_gain' | 'gold_steal' | 'full_restore_hp' | 'full_restore_mana' | 'full_restore_all';

export interface Card {
  id: string;
  name: string; 
  type: CardType;
  effectType?: EffectType; // New field for generic logic
  cost: number;
  manaCost: number;
  description: string;
  value?: number;
  isDisposable?: boolean;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  nation: NationType;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  gold: number;
  income: number;
  bankDeposit: number;
  hand: Card[];
  lands: Card[];
  isDead: boolean;
}

export interface GameSettings {
  initialGold: number;
  maxPlayers: number;
  botCount: number;
  botDifficulty: 'easy' | 'normal' | 'hard';
  cardsDrawPerTurn: number;
  incomeMultiplier: number;
  eventFrequency: number;
}

export interface ActionEvent {
  id: string;
  sourceId: string;
  targetId: string | null;
  cardId: string;
  type: CardType;
  timestamp: number;
}

export interface GameState {
  turn: number;
  currentPlayerIndex: number;
  players: Player[];
  shopCards: Card[];
  gameLog: LogEntry[];
  playedCardTypesThisTurn: CardType[];
  turnPhase: 'START' | 'ACTION' | 'END';
  winnerId: string | null;
  eventMessage: string | null;
  settings: GameSettings;
  lastAction: ActionEvent | null;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'event' | 'economy';
}

export const BANK_INTEREST_RATE = 0.1;
export const MAX_HAND_SIZE = 12;
export const MAX_LAND_SIZE = 5;

export type Language = 'en' | 'zh-TW';
