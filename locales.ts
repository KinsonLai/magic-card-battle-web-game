import { NationType, CardType } from './types';
import { CARDS } from './constants';

const generateCardDesc = (card: any) => {
    switch (card.effectType) {
        case 'income': return `+${card.value} 金錢/回合`;
        case 'damage': return `造成 ${card.value} 點傷害`;
        case 'heal': return `恢復/獲得 ${card.value} 點生命`;
        case 'mana': return `恢復 ${card.value} 點魔力`;
        case 'gold_gain': return `立即獲得 ${card.value} 金錢`;
        case 'gold_steal': return `從目標身上偷取 ${card.value} 金錢`;
        case 'full_restore_hp': return `完全恢復生命值`;
        case 'full_restore_mana': return `完全恢復魔力`;
        case 'full_restore_all': return `完全恢復生命與魔力`;
        default: return '';
    }
};

const cardTranslations: Record<string, {name: string, desc: string}> = {};
CARDS.forEach(c => {
    cardTranslations[c.id] = {
        name: c.name,
        desc: generateCardDesc(c)
    };
});

const zhTW = {
    title: "魔法卡片對戰",
    subtitle: "選擇你的國家，征服世界。",
    start: "開始遊戲",
    host: "建立房間",
    gallery: "卡牌圖鑑",
    yourName: "你的名字",
    enterName: "輸入名字...",
    startGame: "開始對戰",
    back: "返回",
    settings: "房間設定",
    initialGold: "初始金錢",
    botCount: "電腦數量",
    botDifficulty: "電腦難度",
    drawPerTurn: "每回合抽卡",
    incomeMult: "收入倍率",
    eventFreq: "事件頻率 (回合)",
    easy: "簡單",
    normal: "普通",
    hard: "困難",
    turn: "回合",
    shop: "商店",
    bank: "銀行",
    endTurn: "結束回合",
    wait: "等待中...",
    buy: "購買",
    close: "關閉",
    deposit: "存款",
    withdraw: "提款",
    all: "全部",
    wins: "獲勝！",
    defeated: "已敗陣",
    logs: "戰鬥紀錄",
    playAgain: "再玩一次",
    lands: "領土產業",
    buildHere: "在此建造產業卡以獲得收入",
    selectTarget: "選擇目標",
    interestRate: "利率：每回合 10%",
    filterAll: "全部",
    nations: {
      [NationType.FIGHTER]: { name: "鬥士之國", desc: "為戰鬥而生。起始擁有較高生命值與攻擊卡。" },
      [NationType.HOLY]: { name: "神聖之國", desc: "神聖庇護。生命值會再生，起始擁有治療卡。" },
      [NationType.COMMERCIAL]: { name: "商業之國", desc: "金錢主宰。起始擁有較高收入與金錢。" },
      [NationType.MAGIC]: { name: "魔法之國", desc: "奧術精通。起始擁有巨大魔力池與魔法卡。" },
    },
    cards: cardTranslations,
    types: {
      [CardType.INDUSTRY]: "產業",
      [CardType.ATTACK]: "攻擊",
      [CardType.DEFENSE]: "防禦",
      [CardType.MISSILE]: "導彈",
      [CardType.MAGIC]: "魔法",
      [CardType.CONTRACT]: "契約",
      [CardType.ENCHANTMENT]: "附魔"
    }
};

export const TRANSLATIONS = {
  en: zhTW, 
  'zh-TW': zhTW
};
