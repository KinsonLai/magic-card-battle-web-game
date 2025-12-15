
import { NationType, CardType } from './types';
import { CARDS } from './constants';

const cardTranslations: Record<string, {name: string, desc: string}> = {};
// Use the description directly from constants.ts as it is already in Chinese
CARDS.forEach(c => {
    cardTranslations[c.id] = {
        name: c.name,
        desc: c.description
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
    sell: "出售",
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
    playSelected: "出牌",
    combo: "連擊",
    opponents: "對手列表",
    selected: "已選",
    cost: "消耗",
    shieldUp: "展開護盾",
    activateShield: "啟動防禦",
    takeDamage: "直接承受傷害",
    takeDestruction: "承受破壞",
    block: "格擋",
    attackExcl: "攻擊！",
    defendExcl: "防禦！",
    enemyDamage: "敵方傷害",
    enemyMissile: "敵方導彈",
    missileLevel: "破壞等級",
    selectDefense: "請選擇手牌中的防禦卡 (格擋傷害)",
    selectShield: "請選擇手牌中的護盾卡 (格擋破壞)",
    selectTargetHint: "(請選擇目標)",
    cardUsed: "使用了",
    chatPlaceholder: "輸入訊息...",
    send: "發送",
    cantUseAlone: "符文卡必須與物理卡一起使用",
    notStackable: "此卡牌不可堆疊",
    onlyDefenseInDefensePhase: "防禦卡只能在防禦階段使用",
    nations: {
      [NationType.FIGHTER]: { name: "鬥士之國", desc: "為戰鬥而生。起始擁有較高生命值與攻擊卡。" },
      [NationType.HOLY]: { name: "神聖之國", desc: "神聖庇護。生命值會再生，起始擁有治療卡。" },
      [NationType.COMMERCIAL]: { name: "商業之國", desc: "金錢主宰。起始擁有較高收入與金錢。" },
      [NationType.MAGIC]: { name: "魔法之國", desc: "奧術精通。起始擁有巨大魔力池與魔法卡。" },
    },
    cards: cardTranslations,
    types: {
      [CardType.INDUSTRY]: "產業",
      [CardType.ATTACK]: "物理攻擊",
      [CardType.MAGIC_ATTACK]: "魔法攻擊",
      [CardType.HEAL]: "治療",
      [CardType.SPECIAL]: "特殊",
      [CardType.CONTRACT]: "契約",
      [CardType.RUNE]: "符文",
      [CardType.RITUAL]: "儀式",
      [CardType.ARTIFACT]: "聖物",
      [CardType.BLESSING]: "祝福",
      [CardType.CURSE]: "詛咒"
    }
};

export const TRANSLATIONS = {
  en: zhTW, 
  'zh-TW': zhTW
};
