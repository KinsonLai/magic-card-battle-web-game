
import { Card, CardType, NationType, ElementType, AlignmentType, GameEvent, Rarity } from './types';
import { cardsData } from './cardsData';

// PURE DATA CONSTANTS (Safe for Node.js Server)

export const NATION_CONFIG = {
  [NationType.FIGHTER]: {
    name: '鬥士之國',
    description: '為戰鬥而生。起始擁有較高生命值與攻擊卡。',
    hpBonus: 50,
    manaBonus: 0,
    goldBonus: 0,
    startCardId: 'wpn_iron_sword', 
    color: 'text-red-500',
    bgColor: 'bg-red-900/40',
    borderColor: 'border-red-500'
  },
  [NationType.HOLY]: {
    name: '神聖之國',
    description: '神聖庇護。生命值會再生，起始擁有治療卡。',
    hpBonus: 30,
    manaBonus: 20,
    goldBonus: 0,
    startCardId: 'minor_heal',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/40',
    borderColor: 'border-yellow-400'
  },
  [NationType.COMMERCIAL]: {
    name: '商業之國',
    description: '金錢主宰。起始擁有較高收入與金錢。',
    hpBonus: 0,
    manaBonus: 10,
    goldBonus: 150,
    startCardId: 'small_shop',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/40',
    borderColor: 'border-emerald-400'
  },
  [NationType.MAGIC]: {
    name: '魔法之國',
    description: '奧術精通。起始擁有巨大魔力池與魔法卡。',
    hpBonus: -10,
    manaBonus: 60,
    goldBonus: 20,
    startCardId: 'FIRE_atk_1', 
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/40',
    borderColor: 'border-purple-400'
  }
};

export const ELEMENT_CONFIG = {
  [ElementType.NEUTRAL]: { name: '無屬性', color: 'text-slate-400', bg: 'bg-slate-700', icon: 'Sparkles' },
  [ElementType.FIRE]: { name: '火', color: 'text-orange-500', bg: 'bg-orange-700', icon: 'Flame' },
  [ElementType.WATER]: { name: '水', color: 'text-blue-500', bg: 'bg-blue-700', icon: 'Droplets' },
  [ElementType.EARTH]: { name: '地', color: 'text-amber-600', bg: 'bg-amber-800', icon: 'Mountain' },
  [ElementType.AIR]: { name: '風', color: 'text-sky-400', bg: 'bg-sky-600', icon: 'Wind' },
};

export const ALIGNMENT_CONFIG = {
    [AlignmentType.HOLY]: { name: '神聖', color: 'text-yellow-200', bg: 'bg-yellow-900/50', icon: 'Cross' },
    [AlignmentType.EVIL]: { name: '邪惡', color: 'text-purple-300', bg: 'bg-purple-900/50', icon: 'Ghost' },
};

export const RARITY_CONFIG = {
    [Rarity.COMMON]: { 
        name: '普通', 
        color: 'text-slate-300', 
        border: 'ring-1 ring-slate-600', 
        bg: 'bg-slate-800', 
        shadow: 'shadow-none' 
    },
    [Rarity.RARE]: { 
        name: '稀有', 
        color: 'text-cyan-300', 
        border: 'ring-1 ring-cyan-500/50', 
        bg: 'bg-cyan-950/30', 
        shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
    },
    [Rarity.EPIC]: { 
        name: '史詩', 
        color: 'text-fuchsia-300', 
        border: 'ring-1 ring-fuchsia-500/60', 
        bg: 'bg-fuchsia-950/30', 
        shadow: 'shadow-[0_0_20px_rgba(232,121,249,0.2)]' 
    },
    [Rarity.LEGENDARY]: { 
        name: '傳說', 
        color: 'text-amber-300', 
        border: 'ring-1 ring-amber-500/80', 
        bg: 'bg-amber-950/40', 
        shadow: 'shadow-[0_0_25px_rgba(251,191,36,0.3)]' 
    },
};

export const ELEMENT_RELATIONSHIPS: Record<ElementType, Record<ElementType, number>> = {
  [ElementType.NEUTRAL]: { [ElementType.NEUTRAL]: 1, [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.EARTH]: 1, [ElementType.AIR]: 1 },
  [ElementType.FIRE]:    { [ElementType.NEUTRAL]: 1, [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.EARTH]: 1, [ElementType.AIR]: 1 },
  [ElementType.EARTH]:   { [ElementType.NEUTRAL]: 1, [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.EARTH]: 1, [ElementType.AIR]: 1 },
  [ElementType.AIR]:     { [ElementType.NEUTRAL]: 1, [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.EARTH]: 1, [ElementType.AIR]: 1 },
  [ElementType.WATER]:   { [ElementType.NEUTRAL]: 1, [ElementType.FIRE]: 1, [ElementType.WATER]: 1, [ElementType.EARTH]: 1, [ElementType.AIR]: 1 },
};

export const getComplexElementName = (e1: ElementType, e2: ElementType): string | null => {
  const set = new Set([e1, e2]);
  if (set.has(ElementType.FIRE) && set.has(ElementType.AIR)) return "擴散 (Spread)";
  if (set.has(ElementType.FIRE) && set.has(ElementType.WATER)) return "湮滅 (Annihilation)";
  if (set.has(ElementType.FIRE) && set.has(ElementType.EARTH)) return "過載 (Overload)";
  if (set.has(ElementType.WATER) && set.has(ElementType.AIR)) return "過載 (Overload)";
  if (set.has(ElementType.WATER) && set.has(ElementType.EARTH)) return "泥沼 (Mire)";
  if (set.has(ElementType.EARTH) && set.has(ElementType.AIR)) return "湮滅 (Annihilation)";
  return null;
};

export const GAME_EVENTS: GameEvent[] = [
    { id: 'evt_mana_void', name: '魔力異常', type: 'DISASTER', description: '所有玩家的魔力歸零。', icon: 'ZapOff', effect: (s) => ({...s, players: s.players.map(p => ({...p, mana: 0}))}) },
    { id: 'evt_plague', name: '大規模天災', type: 'DISASTER', description: '每回合扣減 10 點生命值。', icon: 'Skull', effect: (s) => s, turnEffect: (p) => ({...p, hp: Math.max(1, p.hp - 10)}) },
    { id: 'evt_inflation', name: '供應鏈破裂', type: 'DISASTER', description: '商店商品價格翻倍。', icon: 'TrendingUp', effect: (s) => s, globalModifier: { priceMultiplier: 2 } },
    { id: 'evt_desert', name: '沙漠化', type: 'DISASTER', description: '立即摧毀所有玩家一座隨機產業。', icon: 'Sun', effect: (s) => ({...s, players: s.players.map(p => { const l = [...p.lands]; if(l.length) l.splice(Math.floor(Math.random()*l.length), 1); return {...p, lands: l}; }) }) },
    { id: 'evt_taxes', name: '苛政重稅', type: 'DISASTER', description: '所有玩家失去 30% 金錢。', icon: 'Coins', effect: (s) => ({...s, players: s.players.map(p => ({...p, gold: Math.floor(p.gold * 0.7)}))}) },
    { id: 'evt_earthquake', name: '大地震', type: 'DISASTER', description: '所有玩家受到 30 點真實傷害。', icon: 'Activity', effect: (s) => ({...s, players: s.players.map(p => ({...p, hp: Math.max(1, p.hp - 30)}))}) },
    { id: 'evt_silence', name: '禁魔領域', type: 'DISASTER', description: '無法獲得魔力回復。', icon: 'MicOff', effect: (s) => s, globalModifier: { manaRegenMultiplier: 0 } },
    { id: 'evt_rust', name: '裝備鏽蝕', type: 'DISASTER', description: '隨機破壞每位玩家一個神器。', icon: 'Hammer', effect: (s) => ({...s, players: s.players.map(p => { const a = [...p.artifacts]; if(a.length) a.splice(Math.floor(Math.random()*a.length), 1); return {...p, artifacts: a}; }) }) },
    { id: 'evt_drought', name: '乾旱', type: 'DISASTER', description: '產業收入歸零。', icon: 'ThermometerSun', effect: (s) => s, globalModifier: { incomeMultiplier: 0 } },
    { id: 'evt_volcano', name: '火山爆發', type: 'DISASTER', description: '所有玩家受到 50 點火屬性傷害。', icon: 'Flame', effect: (s) => ({...s, players: s.players.map(p => ({...p, hp: Math.max(1, p.hp - 50)}))}) },
    { id: 'evt_curse', name: '虛弱詛咒', type: 'DISASTER', description: '所有傷害造成 0.5 倍效果。', icon: 'Ghost', effect: (s) => s, globalModifier: { damageMultiplier: 0.5 } },
    { id: 'evt_war', name: '全面戰爭', type: 'DISASTER', description: '商店關閉（無法購買卡牌）。', icon: 'Swords', effect: (s) => ({...s, shopCards: [] }) },
    { id: 'evt_market_crash', name: '市場崩盤', type: 'DISASTER', description: '所有玩家失去 50% 金錢。', icon: 'TrendingDown', effect: (s) => ({...s, players: s.players.map(p => ({...p, gold: Math.floor(p.gold * 0.5)}))}) },

    { id: 'evt_blessing', name: '魔神的祝福', type: 'BLESSING', description: '所有玩家恢復 20% 最大魔力。', icon: 'Zap', effect: (s) => ({...s, players: s.players.map(p => ({...p, mana: Math.min(p.maxMana, p.mana + p.maxMana * 0.2)}))}) },
    { id: 'evt_guardian', name: '守護神降臨', type: 'BLESSING', description: '清除所有負面狀態 (暈眩)。', icon: 'Shield', effect: (s) => ({...s, players: s.players.map(p => ({...p, isStunned: false}))}) },
    { id: 'evt_economy', name: '經濟發達', type: 'BLESSING', description: '每回合額外獲得 10% 現有金錢。', icon: 'TrendingUp', effect: (s) => s, turnEffect: (p) => ({...p, gold: Math.floor(p.gold * 1.1)}) },
    { id: 'evt_harvest', name: '大豐收', type: 'BLESSING', description: '商店商品七折優惠。', icon: 'ShoppingBag', effect: (s) => s, globalModifier: { priceMultiplier: 0.7 } },
    { id: 'evt_regenerate', name: '生命之雨', type: 'BLESSING', description: '每回合恢復 15 點生命。', icon: 'CloudRain', effect: (s) => s, turnEffect: (p) => ({...p, hp: Math.min(p.maxHp, p.hp + 15)}) },
    { id: 'evt_inspiration', name: '靈感湧現', type: 'BLESSING', description: '魔力回復加倍。', icon: 'Lightbulb', effect: (s) => s, globalModifier: { manaRegenMultiplier: 2 } },
    { id: 'evt_peace', name: '和平條約', type: 'BLESSING', description: '所有產業產出增加 50%。', icon: 'Flag', effect: (s) => s, globalModifier: { incomeMultiplier: 1.5 } },
    { id: 'evt_treasure', name: '發現寶藏', type: 'BLESSING', description: '所有玩家立即獲得 100 金幣。', icon: 'Gem', effect: (s) => ({...s, players: s.players.map(p => ({...p, gold: p.gold + 100}))}) },
    { id: 'evt_wisdom', name: '古老智慧', type: 'BLESSING', description: '所有玩家獲得 10 點傷害加成。', icon: 'BookOpen', effect: (s) => ({...s, players: s.players.map(p => ({...p, damageBonus: p.damageBonus + 10}))}) },
    { id: 'evt_reinforce', name: '城牆加固', type: 'BLESSING', description: '所有玩家最大生命值 +50。', icon: 'Castle', effect: (s) => ({...s, players: s.players.map(p => ({...p, maxHp: p.maxHp + 50, hp: p.hp + 50}))}) },
    { id: 'evt_bloodlust', name: '戰神降臨', type: 'BLESSING', description: '所有傷害提升 1.5 倍。', icon: 'Sword', effect: (s) => s, globalModifier: { damageMultiplier: 1.5 } },
    { id: 'evt_scholar', name: '學者來訪', type: 'BLESSING', description: '手牌上限增加 3 張。', icon: 'Glasses', effect: (s) => ({...s, settings: {...s.settings, maxHandSize: s.settings.maxHandSize + 3} }) },
    { id: 'evt_trade_route', name: '新貿易線', type: 'BLESSING', description: '增加 20% 基礎收入。', icon: 'Ship', effect: (s) => s, globalModifier: { incomeMultiplier: 1.2 } },
];

export const CARDS: Card[] = cardsData as unknown as Card[];

export const getCardById = (id: string): Card | undefined => CARDS.find(c => c.id === id);

export const getRandomCards = (count: number): Card[] => {
  const result: Card[] = [];
  for (let i = 0; i < count; i++) {
    const random = CARDS[Math.floor(Math.random() * CARDS.length)];
    result.push({ ...random, id: `${random.id}_${Math.random().toString(36).substr(2, 9)}` }); 
  }
  return result;
};