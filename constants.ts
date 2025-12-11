import { Card, CardType, NationType } from './types';
import { Sparkles, Shield, Sword, Factory, Scroll, Zap, Target } from 'lucide-react';

export const NATION_CONFIG = {
  [NationType.FIGHTER]: {
    name: '鬥士之國',
    description: '為戰鬥而生。起始擁有較高生命值與攻擊卡。',
    hpBonus: 20,
    manaBonus: 0,
    goldBonus: 0,
    startCardId: 'basic_attack',
    color: 'text-red-500',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500'
  },
  [NationType.HOLY]: {
    name: '神聖之國',
    description: '神聖庇護。生命值會再生，起始擁有治療卡。',
    hpBonus: 10,
    manaBonus: 10,
    goldBonus: 0,
    startCardId: 'minor_heal',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-400'
  },
  [NationType.COMMERCIAL]: {
    name: '商業之國',
    description: '金錢主宰。起始擁有較高收入與金錢。',
    hpBonus: 0,
    manaBonus: 0,
    goldBonus: 100,
    startCardId: 'small_shop',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20',
    borderColor: 'border-emerald-400'
  },
  [NationType.MAGIC]: {
    name: '魔法之國',
    description: '奧術精通。起始擁有巨大魔力池與魔法卡。',
    hpBonus: -10,
    manaBonus: 30,
    goldBonus: 20,
    startCardId: 'magic_missile',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-400'
  }
};

// Helper to create cards easily
const createCard = (id: string, name: string, type: CardType, cost: number, mana: number, val: number, effect: any = 'damage'): Card => ({
  id, name, type, cost, manaCost: mana, value: val, effectType: effect, description: ''
});

// Full Card Database
export const CARDS: Card[] = [
  // --- INDUSTRY (Income) ---
  createCard('small_shop', '市場攤位', CardType.INDUSTRY, 50, 0, 10, 'income'),
  createCard('farm', '小麥農場', CardType.INDUSTRY, 80, 0, 15, 'income'),
  createCard('lumber_mill', '伐木場', CardType.INDUSTRY, 90, 0, 18, 'income'),
  createCard('tavern', '酒館', CardType.INDUSTRY, 100, 0, 20, 'income'),
  createCard('trading_post', '貿易站', CardType.INDUSTRY, 110, 0, 22, 'income'),
  createCard('workshop', '工坊', CardType.INDUSTRY, 120, 0, 25, 'income'),
  createCard('quarry', '採石場', CardType.INDUSTRY, 130, 0, 28, 'income'),
  createCard('blacksmith', '鐵匠鋪', CardType.INDUSTRY, 140, 0, 30, 'income'),
  createCard('vineyard', '葡萄園', CardType.INDUSTRY, 150, 0, 32, 'income'),
  createCard('library', '圖書館', CardType.INDUSTRY, 160, 5, 35, 'income'),
  createCard('mine', '金礦', CardType.INDUSTRY, 200, 0, 40, 'income'),
  createCard('alchemy_lab', '煉金實驗室', CardType.INDUSTRY, 220, 10, 45, 'income'),
  createCard('magic_tower', '魔法塔', CardType.INDUSTRY, 250, 50, 50, 'income'),
  createCard('arena', '競技場', CardType.INDUSTRY, 260, 0, 55, 'income'),
  createCard('port', '海港', CardType.INDUSTRY, 280, 0, 60, 'income'),
  createCard('cathedral', '大教堂', CardType.INDUSTRY, 300, 20, 65, 'income'),
  createCard('gem_mine', '寶石礦坑', CardType.INDUSTRY, 350, 0, 75, 'income'),
  createCard('bank', '銀行總部', CardType.INDUSTRY, 400, 0, 80, 'income'),
  createCard('silk_road', '絲綢之路', CardType.INDUSTRY, 450, 0, 90, 'income'),
  createCard('castle_treasury', '皇家寶庫', CardType.INDUSTRY, 500, 0, 100, 'income'),

  // --- ATTACK (Damage) ---
  createCard('quick_jab', '刺拳', CardType.ATTACK, 0, 0, 5, 'damage'),
  createCard('basic_attack', '斬擊', CardType.ATTACK, 0, 0, 8, 'damage'),
  createCard('shield_bash', '盾擊', CardType.ATTACK, 5, 0, 10, 'damage'),
  createCard('poison_dagger', '毒匕首', CardType.ATTACK, 15, 0, 12, 'damage'),
  createCard('axe_throw', '飛斧', CardType.ATTACK, 18, 0, 14, 'damage'),
  createCard('heavy_strike', '重擊', CardType.ATTACK, 20, 5, 15, 'damage'),
  createCard('double_strike', '雙重打擊', CardType.ATTACK, 25, 5, 16, 'damage'),
  createCard('spear_thrust', '長矛突刺', CardType.ATTACK, 30, 5, 18, 'damage'),
  createCard('pierce', '穿刺', CardType.ATTACK, 35, 5, 20, 'damage'),
  createCard('whirlwind', '旋風斬', CardType.ATTACK, 40, 10, 22, 'damage'),
  createCard('knights_charge', '騎士衝鋒', CardType.ATTACK, 45, 10, 25, 'damage'),
  createCard('shadow_strike', '暗影突襲', CardType.ATTACK, 50, 15, 28, 'damage'),
  createCard('holy_smite', '神聖懲擊', CardType.ATTACK, 55, 20, 30, 'damage'),
  createCard('hammer_blow', '巨錘重擊', CardType.ATTACK, 60, 10, 32, 'damage'),
  createCard('assassinate', '暗殺', CardType.ATTACK, 65, 15, 35, 'damage'),
  createCard('berserk', '狂暴', CardType.ATTACK, 70, 0, 40, 'damage'),
  createCard('crush', '粉碎', CardType.ATTACK, 80, 20, 45, 'damage'),
  createCard('dragon_slash', '龍牙斬', CardType.ATTACK, 100, 30, 50, 'damage'),
  createCard('execute', '處決', CardType.ATTACK, 120, 40, 60, 'damage'),
  createCard('flurry', '劍刃風暴', CardType.ATTACK, 30, 0, 15, 'damage'), // Low cost flurry

  // --- DEFENSE (Heal/HP Gain) ---
  createCard('buckler', '圓盾', CardType.DEFENSE, 5, 0, 8, 'heal'),
  createCard('wood_shield', '木盾', CardType.DEFENSE, 10, 0, 10, 'heal'),
  createCard('parry', '招架', CardType.DEFENSE, 15, 0, 12, 'heal'),
  createCard('dodge', '閃避', CardType.DEFENSE, 20, 0, 15, 'heal'),
  createCard('leather_armor', '皮甲', CardType.DEFENSE, 25, 0, 18, 'heal'),
  createCard('chainmail', '鎖子甲', CardType.DEFENSE, 30, 0, 20, 'heal'),
  createCard('wall_of_thorns', '荊棘之牆', CardType.DEFENSE, 35, 5, 22, 'heal'),
  createCard('iron_wall', '鋼鐵防禦', CardType.DEFENSE, 40, 5, 25, 'heal'),
  createCard('iron_skin', '鋼鐵皮膚', CardType.DEFENSE, 45, 10, 28, 'heal'),
  createCard('plate_armor', '板甲', CardType.DEFENSE, 50, 0, 30, 'heal'),
  createCard('tower_shield', '塔盾', CardType.DEFENSE, 60, 5, 35, 'heal'),
  createCard('magic_barrier', '魔法屏障', CardType.DEFENSE, 70, 20, 40, 'heal'),
  createCard('castle_wall', '城牆', CardType.DEFENSE, 80, 10, 45, 'heal'),
  createCard('fortify', '防禦工事', CardType.DEFENSE, 90, 15, 50, 'heal'),
  createCard('stone_form', '石化形態', CardType.DEFENSE, 100, 30, 55, 'heal'),
  createCard('sanctuary', '聖域', CardType.DEFENSE, 110, 40, 60, 'heal'),
  createCard('holy_armor', '神聖裝甲', CardType.DEFENSE, 120, 30, 65, 'heal'),
  createCard('divine_shield', '神聖護盾', CardType.DEFENSE, 130, 40, 70, 'heal'),
  createCard('guardian_spirit', '守護靈', CardType.DEFENSE, 140, 50, 75, 'heal'),
  createCard('aegis', '埃癸斯之盾', CardType.DEFENSE, 150, 60, 80, 'heal'),

  // --- MISSILE (Damage) ---
  createCard('stray_arrow', '流矢', CardType.MISSILE, 15, 0, 5, 'damage'),
  createCard('dart', '飛鏢', CardType.MISSILE, 20, 0, 6, 'damage'),
  createCard('throwing_knife', '投擲飛刀', CardType.MISSILE, 25, 0, 8, 'damage'),
  createCard('rock_throw', '投石', CardType.MISSILE, 30, 0, 10, 'damage'),
  createCard('guided_arrow', '追蹤箭', CardType.MISSILE, 30, 5, 12, 'damage'),
  createCard('boomerang', '迴力鏢', CardType.MISSILE, 35, 0, 14, 'damage'),
  createCard('shuriken', '手裏劍', CardType.MISSILE, 40, 0, 15, 'damage'),
  createCard('javelin', '標槍', CardType.MISSILE, 45, 0, 18, 'damage'),
  createCard('crossbow_bolt', '十字弓', CardType.MISSILE, 50, 0, 20, 'damage'),
  createCard('acid_flask', '酸液瓶', CardType.MISSILE, 55, 0, 22, 'damage'),
  createCard('bomb', '炸彈', CardType.MISSILE, 50, 0, 25, 'damage'),
  createCard('fire_bomb', '火焰彈', CardType.MISSILE, 60, 0, 30, 'damage'),
  createCard('grenade', '手榴彈', CardType.MISSILE, 70, 0, 35, 'damage'),
  createCard('cannonball', '加農砲', CardType.MISSILE, 80, 0, 40, 'damage'),
  createCard('sniper_shot', '狙擊', CardType.MISSILE, 90, 0, 45, 'damage'),
  createCard('ballista', '弩砲', CardType.MISSILE, 100, 0, 50, 'damage'),
  createCard('mortar', '迫擊砲', CardType.MISSILE, 110, 0, 55, 'damage'),
  createCard('catapult', '投石車', CardType.MISSILE, 120, 0, 60, 'damage'),
  createCard('rocket', '火箭', CardType.MISSILE, 140, 0, 70, 'damage'),
  createCard('homing_missile', '導彈', CardType.MISSILE, 160, 10, 80, 'damage'),

  // --- MAGIC (Mixed) ---
  createCard('minor_heal', '輕微治療', CardType.MAGIC, 20, 10, 15, 'heal'),
  createCard('healing_rain', '治療之雨', CardType.MAGIC, 30, 15, 20, 'heal'),
  createCard('purify', '淨化', CardType.MAGIC, 40, 20, 30, 'heal'),
  createCard('great_heal', '強效治療', CardType.MAGIC, 60, 30, 40, 'heal'),
  
  createCard('meditation', '冥想', CardType.MAGIC, 10, 0, 30, 'mana'),
  createCard('mana_crystal', '魔力水晶', CardType.MAGIC, 30, 0, 45, 'mana'),
  createCard('mana_potion', '魔力藥水', CardType.MAGIC, 40, 0, 60, 'mana'),
  createCard('ancient_wisdom', '遠古智慧', CardType.MAGIC, 100, 0, 120, 'mana'), // Expensive buy, huge mana

  createCard('magic_missile', '奧術飛彈', CardType.MAGIC, 30, 15, 20, 'damage'),
  createCard('ice_bolt', '寒冰箭', CardType.MAGIC, 40, 20, 25, 'damage'),
  createCard('dark_pulse', '黑暗脈衝', CardType.MAGIC, 50, 20, 30, 'damage'),
  createCard('chain_lightning', '連鎖閃電', CardType.MAGIC, 55, 25, 35, 'damage'),
  createCard('fireball', '火球術', CardType.MAGIC, 60, 25, 40, 'damage'),
  createCard('light_beam', '光束', CardType.MAGIC, 70, 30, 45, 'damage'),
  createCard('arcane_blast', '奧術衝擊', CardType.MAGIC, 80, 35, 50, 'damage'),
  createCard('blizzard', '暴風雪', CardType.MAGIC, 90, 40, 55, 'damage'),
  createCard('thunder_strike', '雷擊', CardType.MAGIC, 90, 40, 60, 'damage'),
  createCard('inferno', '煉獄', CardType.MAGIC, 110, 50, 70, 'damage'),
  createCard('meteor', '隕石術', CardType.MAGIC, 150, 80, 90, 'damage'),
  createCard('void', '虛空', CardType.MAGIC, 200, 100, 100, 'damage'),

  // --- CONTRACT (Gold) ---
  createCard('pickpocket', '扒竊', CardType.CONTRACT, 20, 0, 10, 'gold_steal'),
  createCard('tax', '稅收', CardType.CONTRACT, 50, 5, 20, 'gold_steal'),
  createCard('bribery', '賄賂', CardType.CONTRACT, 60, 0, 25, 'gold_steal'),
  createCard('blackmail', '勒索', CardType.CONTRACT, 70, 0, 30, 'gold_steal'),
  createCard('corruption', '腐敗', CardType.CONTRACT, 80, 5, 35, 'gold_steal'),
  createCard('extortion', '敲詐', CardType.CONTRACT, 90, 0, 40, 'gold_steal'),
  createCard('plunder', '掠奪', CardType.CONTRACT, 90, 20, 50, 'gold_steal'),
  createCard('ransom', '贖金', CardType.CONTRACT, 100, 10, 60, 'gold_steal'),
  createCard('embezzle', '盜用公款', CardType.CONTRACT, 120, 15, 70, 'gold_steal'),
  createCard('war_reparations', '戰爭賠款', CardType.CONTRACT, 150, 20, 80, 'gold_steal'),

  createCard('small_loan', '小額貸款', CardType.CONTRACT, 20, 0, 30, 'gold_gain'),
  createCard('smuggle', '走私', CardType.CONTRACT, 30, 0, 40, 'gold_gain'),
  createCard('merchant_gift', '商人禮物', CardType.CONTRACT, 35, 0, 45, 'gold_gain'),
  createCard('bounty', '懸賞', CardType.CONTRACT, 30, 0, 50, 'gold_gain'),
  createCard('gambling', '賭博', CardType.CONTRACT, 40, 0, 60, 'gold_gain'),
  createCard('investment', '投資', CardType.CONTRACT, 50, 0, 80, 'gold_gain'),
  createCard('trade_deal', '貿易協定', CardType.CONTRACT, 60, 10, 100, 'gold_gain'),
  createCard('treasure_map', '藏寶圖', CardType.CONTRACT, 70, 5, 120, 'gold_gain'),
  createCard('royal_grant', '皇家撥款', CardType.CONTRACT, 80, 10, 150, 'gold_gain'),
  createCard('inheritance', '遺產', CardType.CONTRACT, 100, 0, 200, 'gold_gain'),

  // --- ENCHANTMENT (Big Effects) ---
  createCard('regeneration', '再生', CardType.ENCHANTMENT, 80, 20, 40, 'heal'),
  createCard('protection_rune', '守護符文', CardType.ENCHANTMENT, 100, 30, 60, 'heal'),
  createCard('natures_touch', '自然之觸', CardType.ENCHANTMENT, 120, 40, 70, 'heal'),
  createCard('giant_growth', '巨大化', CardType.ENCHANTMENT, 140, 40, 80, 'heal'),
  createCard('holy_light', '聖光', CardType.ENCHANTMENT, 160, 50, 90, 'heal'),
  createCard('fountain_of_life', '生命之泉', CardType.ENCHANTMENT, 150, 60, 100, 'heal'),
  createCard('angelic_grace', '天使恩典', CardType.ENCHANTMENT, 180, 60, 110, 'heal'),
  createCard('dragon_heart', '龍之心', CardType.ENCHANTMENT, 200, 70, 120, 'heal'),
  createCard('phoenix_feather', '鳳凰羽毛', CardType.ENCHANTMENT, 250, 80, 150, 'heal'),
  createCard('elixir_of_life', '長生不老藥', CardType.ENCHANTMENT, 300, 90, 200, 'heal'),

  createCard('soul_stone', '靈魂石', CardType.ENCHANTMENT, 120, 0, 80, 'mana'),
  createCard('arcane_power', '奧術能量', CardType.ENCHANTMENT, 150, 0, 100, 'mana'),
  createCard('star_power', '星辰之力', CardType.ENCHANTMENT, 200, 0, 150, 'mana'),

  createCard('heroism', '英勇', CardType.ENCHANTMENT, 200, 50, 0, 'full_restore_hp'), // Placeholder value
  createCard('demonic_strength', '惡魔力量', CardType.ENCHANTMENT, 200, 50, 0, 'full_restore_hp'), 
  
  createCard('mana_spring', '魔力之泉', CardType.ENCHANTMENT, 100, 0, 0, 'full_restore_mana'),
  createCard('blessing', '神的祝福', CardType.ENCHANTMENT, 100, 50, 0, 'full_restore_hp'),
  createCard('miracle', '奇蹟', CardType.ENCHANTMENT, 500, 100, 0, 'full_restore_all'),
];

export const getCardById = (id: string): Card | undefined => CARDS.find(c => c.id === id);

export const getRandomCards = (count: number): Card[] => {
  const result: Card[] = [];
  for (let i = 0; i < count; i++) {
    const random = CARDS[Math.floor(Math.random() * CARDS.length)];
    result.push({ ...random, id: `${random.id}_${Math.random().toString(36).substr(2, 9)}` }); // Unique instances
  }
  return result;
};

export const getIconForType = (type: CardType) => {
  switch (type) {
    case CardType.INDUSTRY: return Factory;
    case CardType.ATTACK: return Sword;
    case CardType.DEFENSE: return Shield;
    case CardType.MAGIC: return Sparkles;
    case CardType.MISSILE: return Target;
    case CardType.CONTRACT: return Scroll;
    case CardType.ENCHANTMENT: return Zap;
    default: return Sparkles;
  }
};
