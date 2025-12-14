
export enum NationType {
  FIGHTER = 'FIGHTER',
  HOLY = 'HOLY',
  COMMERCIAL = 'COMMERCIAL',
  MAGIC = 'MAGIC'
}

export enum CardType {
  INDUSTRY = 'INDUSTRY',
  ATTACK = 'ATTACK', 
  MAGIC_ATTACK = 'MAGIC_ATTACK',
  HEAL = 'HEAL',
  SPECIAL = 'SPECIAL',
  CONTRACT = 'CONTRACT',
  RUNE = 'RUNE', 
  RITUAL = 'RITUAL', 
  ARTIFACT = 'ARTIFACT'
}

export enum ElementType {
  NEUTRAL = 'NEUTRAL',
  FIRE = 'FIRE',
  WATER = 'WATER',
  EARTH = 'EARTH',
  AIR = 'AIR'
}

export enum AlignmentType {
  HOLY = 'HOLY',
  EVIL = 'EVIL'
}

export enum StanceType {
  NONE = 'NONE',
  LIGHT = 'LIGHT',
  SHADOW = 'SHADOW'
}

export enum Rarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY'
}

export type EffectType = 'damage' | 'heal' | 'mana' | 'income' | 'gold_gain' | 'gold_steal' | 'full_restore_hp' | 'full_restore_mana' | 'full_restore_all' | 'buff_damage' | 'stun' | 'discard_opponent' | 'mana_burn' | 'destroy_land' | 'trigger_event' | 'equip_artifact';

export interface Card {
  id: string;
  name: string; 
  type: CardType;
  element: ElementType;
  alignment?: AlignmentType; // For Runes/Rituals/Magic
  rarity: Rarity;
  effectType?: EffectType;
  cost: number;
  hpCost?: number; 
  manaCost: number;
  description: string;
  value?: number; // Base Value
  
  // Dual Alignment Bonuses for Physical Weapons
  holyBonus?: number;
  evilBonus?: number;

  runeLevel?: number; 
  isDisposable?: boolean;
  eventPayload?: string; 
  // Shop tracking
  purchasedByPlayerIds?: string[];
}

export interface GameEvent {
  id: string;
  name: string;
  type: 'DISASTER' | 'BLESSING';
  description: string;
  icon: string; 
  effect: (state: GameState) => GameState; 
  turnEffect?: (player: Player) => Player; 
  globalModifier?: {
      priceMultiplier?: number;
      incomeMultiplier?: number;
      damageMultiplier?: number;
      manaRegenMultiplier?: number;
  }
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
  calculatedIncome?: number; 
  damageBonus: number; 
  hand: Card[];
  lands: Card[];
  artifacts: Card[]; 
  isDead: boolean;
  isStunned: boolean;
  isBleeding?: boolean;
  techShield?: number;
  
  // New Soul System
  soul: number; // -3 to 3
  elementMark: ElementType | null; // Current element primed on player
  maxPlaysModifier?: number; // For Mire effect

  maxPlays: number; 
  shopDiscount?: boolean; 
  botDifficulty?: 'easy' | 'normal' | 'hard' | 'mcts'; // Added 'mcts'
  playsUsed: number;
  hasPurchasedInShop: boolean;
  currentStance?: StanceType;
}

export interface RoomPlayer {
  id: string;
  name: string;
  nation: NationType;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean; 
  botDifficulty?: 'easy' | 'normal' | 'hard' | 'mcts';
}

export interface GameSettings {
  initialGold: number;
  initialMana: number;
  maxPlayers: number; 
  cardsDrawPerTurn: number;
  maxHandSize: number;
  incomeMultiplier: number;
  eventFrequency: number;
  isMultiplayer: boolean;
  roomCode?: string;
  shopSize: number;
  healthMultiplier: number;
  damageMultiplier: number;
  priceMultiplier: number;
  rarityWeights?: {
      common: number;
      rare: number;
      epic: number;
      legendary: number;
  };
}

export interface ActionEvent {
  id: string;
  sourceId: string;
  targetId: string | null;
  cardId: string; 
  cardsPlayed?: Card[]; 
  type: CardType | 'REPEL'; 
  totalValue?: number;
  timestamp: number;
  elementalModifier?: number;
  comboName?: string;
  reflectedDamage?: number; 
}

export type ReactionType = 'SPREAD' | 'MIRE' | 'ANNIHILATION' | 'OVERLOAD' | 'PRIME';

export interface PendingAttack {
  sourceId: string;
  targetId: string;
  damage: number;
  cardNames: string[];
  element: ElementType;
  alignment?: AlignmentType; 
  attackType: CardType;
  
  // New Reaction Logic
  reaction?: ReactionType;
  reactionEffectValue?: number; // e.g., self damage amount or heal amount
}

export interface GameState {
  turn: number;
  currentPlayerIndex: number;
  players: Player[];
  shopCards: Card[];
  gameLog: LogEntry[];
  chat: ChatMessage[]; 
  playedCardTypesThisTurn: CardType[]; 
  turnPhase: 'START' | 'ACTION' | 'DEFENSE' | 'END'; 
  pendingAttack: PendingAttack | null;
  winnerId: string | null;
  eventMessage: string | null;
  currentEvent: GameEvent | null; 
  settings: GameSettings;
  lastAction: ActionEvent | null;
  isDisconnected?: boolean;
  disconnectTime?: number;
  triggeredArtifacts?: string[]; 
  topNotification?: { message: string, type: 'event' | 'artifact' | 'info' }; 
  
  // Socket Extra
  roomId?: string;
  isMultiplayer?: boolean;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'combat' | 'event' | 'economy' | 'tutorial';
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isSystem?: boolean;
}

// Data Record for ML Training
export interface BattleRecord {
    turn: number;
    player: string; // Nation
    stateVector: number[]; // Simplified numeric representation of state
    policyTarget: number[]; // Probability distribution over actions (from MCTS)
    valueTarget: number; // Final game result (-1 or 1)
    actionTaken: string;
}

// Socket Action Types
export type ClientAction = 
  | { type: 'PLAY_CARD', cardId: string, targetId?: string }
  | { type: 'ATTACK', cardIds: string[], targetId: string }
  | { type: 'REPEL', cardIds: string[] }
  | { type: 'TAKE_DAMAGE' }
  | { type: 'BUY_CARD', cardId: string }
  | { type: 'SELL_CARD', cardId: string }
  | { type: 'END_TURN' }
  | { type: 'SEND_CHAT', message: string };

export const MAX_LAND_SIZE = 5;
export const MAX_ARTIFACT_SIZE = 3;
export const PLAYS_PER_TURN = 3;

export type Language = 'en' | 'zh-TW';