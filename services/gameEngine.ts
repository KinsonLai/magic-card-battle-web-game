import { GameState, Player, NationType, Card, CardType, BANK_INTEREST_RATE, MAX_HAND_SIZE, MAX_LAND_SIZE, LogEntry, GameSettings, ActionEvent } from '../types';
import { CARDS, NATION_CONFIG, getRandomCards } from '../constants';

export const DEFAULT_SETTINGS: GameSettings = {
  initialGold: 100,
  maxPlayers: 4,
  botCount: 3,
  botDifficulty: 'normal',
  cardsDrawPerTurn: 1,
  incomeMultiplier: 1,
  eventFrequency: 5
};

export const createInitialState = (playerNation: NationType, playerName: string, settings: GameSettings = DEFAULT_SETTINGS): GameState => {
  const botNames = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'];
  const availableNations = [NationType.FIGHTER, NationType.HOLY, NationType.COMMERCIAL, NationType.MAGIC];
  
  const bots: { name: string, nation: NationType }[] = [];
  for (let i = 0; i < settings.botCount; i++) {
     const n = availableNations[(i + 1) % availableNations.length];
     bots.push({ name: `電腦${botNames[i]}`, nation: n });
  }

  const createPlayer = (name: string, nation: NationType, isHuman: boolean): Player => {
    const config = NATION_CONFIG[nation];
    const startingHand: Card[] = [];
    const startCard = CARDS.find(c => c.id === config.startCardId);
    if (startCard) startingHand.push({ ...startCard, id: `start_${Math.random()}` });

    let gold = settings.initialGold + config.goldBonus;
    if (nation === NationType.COMMERCIAL) gold += 50;

    return {
      id: Math.random().toString(36).substr(2, 9),
      name,
      isHuman,
      nation,
      hp: 100 + config.hpBonus,
      maxHp: 100 + config.hpBonus,
      mana: 50 + config.manaBonus,
      maxMana: 100,
      gold: gold,
      income: (20 + (nation === NationType.COMMERCIAL ? 10 : 0)) * settings.incomeMultiplier,
      bankDeposit: 0,
      hand: startingHand,
      lands: [],
      isDead: false
    };
  };

  const players = [createPlayer(playerName, playerNation, true), ...bots.map(b => createPlayer(b.name, b.nation, false))];

  return {
    turn: 1,
    currentPlayerIndex: 0,
    players,
    shopCards: getRandomCards(5),
    gameLog: [{ id: 'init', message: '遊戲開始！', type: 'info' }],
    playedCardTypesThisTurn: [],
    turnPhase: 'ACTION',
    winnerId: null,
    eventMessage: null,
    settings,
    lastAction: null
  };
};

export const nextTurn = (state: GameState): GameState => {
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  let nextTurnNum = state.turn;
  
  let attempts = 0;
  while (state.players[nextIndex].isDead && attempts < 4) {
    nextIndex = (nextIndex + 1) % state.players.length;
    attempts++;
  }

  if (nextIndex === 0) {
    nextTurnNum++;
  }

  let eventMsg = null;
  if (nextIndex === 0 && nextTurnNum % state.settings.eventFrequency === 0) {
    const isGood = Math.random() > 0.5;
    if (isGood) {
      eventMsg = "祝福：所有玩家恢復 20 點生命！";
      state.players.forEach(p => { if(!p.isDead) p.hp = Math.min(p.maxHp, p.hp + 20); });
    } else {
      eventMsg = "災難：魔力風暴！所有玩家失去 20 點魔力。";
      state.players.forEach(p => { if(!p.isDead) p.mana = Math.max(0, p.mana - 20); });
    }
  }

  const updatedPlayers = state.players.map((p, idx) => {
    if (idx !== nextIndex) return p;
    if (p.isDead) return p;

    const income = p.income + p.lands.reduce((sum, land) => sum + (land.value || 0), 0) * state.settings.incomeMultiplier;
    const bankInterest = Math.floor(p.bankDeposit * BANK_INTEREST_RATE);
    
    const cardsToDraw = state.settings.cardsDrawPerTurn;
    const drawnCards = getRandomCards(cardsToDraw);
    let newHand = [...p.hand];
    
    drawnCards.forEach(c => {
        if (newHand.length < MAX_HAND_SIZE) {
            newHand.push(c);
        }
    });

    return {
      ...p,
      gold: p.gold + Math.floor(income + bankInterest),
      mana: Math.min(p.maxMana, p.mana + 15 + (p.nation === NationType.HOLY ? 5 : 0)),
      hand: newHand
    };
  });

  const newShop = nextIndex === 0 ? getRandomCards(5) : state.shopCards;

  const newLog: LogEntry[] = [
      { id: Date.now().toString(), message: `第 ${nextTurnNum} 回合: ${updatedPlayers[nextIndex].name}`, type: 'info' },
      ...(eventMsg ? [{ id: `evt-${Date.now()}`, message: eventMsg, type: 'event' as const }] : []),
      ...state.gameLog
  ];

  return {
    ...state,
    turn: nextTurnNum,
    currentPlayerIndex: nextIndex,
    players: updatedPlayers,
    shopCards: newShop,
    playedCardTypesThisTurn: [],
    turnPhase: 'ACTION',
    eventMessage: eventMsg,
    gameLog: newLog.slice(0, 50),
    lastAction: null 
  };
};

export const executeCardEffect = (state: GameState, card: Card, targetPlayerId?: string): GameState => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  
  if (currentPlayer.mana < card.manaCost) return state;

  let players = [...state.players];
  const pIndex = state.currentPlayerIndex;
  const targetIndex = players.findIndex(p => p.id === targetPlayerId);

  players[pIndex] = {
    ...players[pIndex],
    mana: players[pIndex].mana - card.manaCost,
    hand: players[pIndex].hand.filter(c => c.id !== card.id)
  };

  let logMsg = `${currentPlayer.name} 使用了 ${card.name}`;
  
  const actionEvent: ActionEvent = {
      id: Math.random().toString(),
      sourceId: currentPlayer.id,
      targetId: targetPlayerId || null,
      cardId: card.id,
      type: card.type,
      timestamp: Date.now()
  };

  // Generic Logic based on EffectType
  switch (card.effectType) {
    case 'income':
        if (players[pIndex].lands.length < MAX_LAND_SIZE) {
            players[pIndex].lands = [...players[pIndex].lands, card];
            logMsg += ` (建設)`;
            actionEvent.targetId = currentPlayer.id;
        } else {
             logMsg += ` (土地已滿)`;
        }
        break;

    case 'damage':
        if (targetIndex !== -1) {
             players[targetIndex].hp -= (card.value || 0);
             logMsg += ` -> ${players[targetIndex].name} (-${card.value})`;
             if (players[targetIndex].hp <= 0) {
                 players[targetIndex].isDead = true;
                 players[targetIndex].hp = 0;
                 logMsg += ` [被擊敗]`;
             }
        } else if (card.type === CardType.MISSILE) {
             // Random target if none provided for missile
             const aliveEnemies = players.filter((p, i) => i !== pIndex && !p.isDead);
             if (aliveEnemies.length > 0) {
                 const randomEnemy = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
                 const rIndex = players.findIndex(p => p.id === randomEnemy.id);
                 players[rIndex].hp -= (card.value || 0);
                 logMsg += ` -> ${players[rIndex].name} (隨機 -${card.value})`;
                 actionEvent.targetId = randomEnemy.id;
             }
        }
        break;

    case 'heal':
        // Defaults to self if not specified, but could be target (for now assume self or friendly target logic matches self in this game's context)
        // Usually these cards target self in single player context or current player
        players[pIndex].hp = Math.min(players[pIndex].maxHp, players[pIndex].hp + (card.value || 0));
        logMsg += ` (恢復)`;
        actionEvent.targetId = currentPlayer.id;
        break;

    case 'mana':
        players[pIndex].mana = Math.min(players[pIndex].maxMana, players[pIndex].mana + (card.value || 0));
        logMsg += ` (回魔)`;
        actionEvent.targetId = currentPlayer.id;
        break;

    case 'gold_gain':
        players[pIndex].gold += (card.value || 0);
        logMsg += ` (獲金)`;
        actionEvent.targetId = currentPlayer.id;
        break;

    case 'gold_steal':
        if (targetIndex !== -1) {
            const steal = Math.min(players[targetIndex].gold, card.value || 0);
            players[targetIndex].gold -= steal;
            players[pIndex].gold += steal;
            logMsg += ` -> ${players[targetIndex].name} (竊取 ${steal})`;
        }
        break;

    case 'full_restore_hp':
        players[pIndex].hp = players[pIndex].maxHp;
        logMsg += ` (全恢復)`;
        actionEvent.targetId = currentPlayer.id;
        break;

    case 'full_restore_mana':
        players[pIndex].mana = players[pIndex].maxMana;
        logMsg += ` (魔力全滿)`;
        actionEvent.targetId = currentPlayer.id;
        break;

    case 'full_restore_all':
        players[pIndex].hp = players[pIndex].maxHp;
        players[pIndex].mana = players[pIndex].maxMana;
        logMsg += ` (奇蹟)`;
        actionEvent.targetId = currentPlayer.id;
        break;
  }

  // Check Win Condition
  const alivePlayers = players.filter(p => !p.isDead);
  let winnerId = state.winnerId;
  if (alivePlayers.length === 1) {
    winnerId = alivePlayers[0].id;
    logMsg += ` 獲勝！`;
  }

  return {
    ...state,
    players,
    playedCardTypesThisTurn: [...state.playedCardTypesThisTurn, card.type],
    winnerId,
    gameLog: [{ id: Date.now().toString(), message: logMsg, type: 'combat' }, ...state.gameLog],
    lastAction: actionEvent
  };
};

export const buyCard = (state: GameState, card: Card): GameState => {
  const pIndex = state.currentPlayerIndex;
  const player = state.players[pIndex];

  if (player.gold < card.cost) return state;
  if (player.hand.length >= MAX_HAND_SIZE) return state;

  const newHand = [...player.hand, { ...card, id: `${card.id}_${Math.random()}` }];
  const newShop = state.shopCards.filter(c => c !== card); 

  const updatedPlayers = [...state.players];
  updatedPlayers[pIndex] = { ...player, gold: player.gold - card.cost, hand: newHand };

  return {
    ...state,
    players: updatedPlayers,
    shopCards: newShop,
    gameLog: [{ id: Date.now().toString(), message: `${player.name} 購買了 ${card.name}`, type: 'economy' }, ...state.gameLog]
  };
};

export const handleBankTransaction = (state: GameState, amount: number): GameState => {
    const pIndex = state.currentPlayerIndex;
    const player = state.players[pIndex];
    let newGold = player.gold;
    let newBank = player.bankDeposit;

    if (amount > 0) {
        if (player.gold >= amount) {
            newGold -= amount;
            newBank += amount;
        }
    } else {
        const absAmount = Math.abs(amount);
        if (player.bankDeposit >= absAmount) {
            newBank -= absAmount;
            newGold += absAmount;
        }
    }
    const updatedPlayers = [...state.players];
    updatedPlayers[pIndex] = { ...player, gold: newGold, bankDeposit: newBank };
    return { ...state, players: updatedPlayers };
};
