
import { GameState, Player, NationType, Card, CardType, ElementType, AlignmentType, StanceType, MAX_LAND_SIZE, LogEntry, GameSettings, ActionEvent, RoomPlayer, GameEvent, MAX_ARTIFACT_SIZE, Rarity, PLAYS_PER_TURN, ReactionType, ActiveState } from '../types';
import { CARDS, NATION_CONFIG, getRandomCards, ELEMENT_RELATIONSHIPS, getComplexElementName, GAME_EVENTS as EVENTS_LIST, ELEMENT_CONFIG } from '../constants';

export const DEFAULT_SETTINGS: GameSettings = {
  initialGold: 100,
  initialMana: 50,
  maxPlayers: 4,
  cardsDrawPerTurn: 2,
  maxHandSize: 12,
  incomeMultiplier: 1,
  eventFrequency: 5,
  isMultiplayer: false,
  shopSize: 3,
  healthMultiplier: 1,
  damageMultiplier: 1,
  priceMultiplier: 1,
  rarityWeights: {
      common: 60,
      rare: 30,
      epic: 8,
      legendary: 2
  },
  manaRegenPerTurn: 15,
  maxPlaysPerTurn: PLAYS_PER_TURN,
  enableRandomEvents: true,
  banRitualCards: false,
  randomizeNations: false,
  freeShopMode: false,
  crazyMode: false
};

const MAX_TURNS = 100; // Hard limit to prevent infinite loops

const getWeightedRandomCards = (count: number, turn: number, settings?: GameSettings): Card[] => {
    const result: Card[] = [];
    
    let wCommon = settings?.rarityWeights?.common || 60;
    let wRare = settings?.rarityWeights?.rare || 30;
    let wEpic = settings?.rarityWeights?.epic || 8;
    let wLegendary = settings?.rarityWeights?.legendary || 2;

    if (settings?.crazyMode) {
        wCommon = 10; wRare = 30; wEpic = 40; wLegendary = 20;
    } else {
        if (turn > 5) { wCommon -= 10; wRare += 5; wEpic += 4; wLegendary += 1; }
        if (turn > 10) { wCommon -= 10; wRare -= 5; wEpic += 10; wLegendary += 5; }
        if (turn > 20) { wCommon -= 10; wEpic += 5; wLegendary += 5; }
    }

    wCommon = Math.max(0, wCommon);
    wRare = Math.max(0, wRare);
    wEpic = Math.max(0, wEpic);
    wLegendary = Math.max(0, wLegendary);
    
    const totalWeight = wCommon + wRare + wEpic + wLegendary;

    let availableCards = CARDS;
    if (settings?.banRitualCards) {
        availableCards = availableCards.filter(c => c.type !== CardType.RITUAL);
    }

    const cardsByRarity = {
        [Rarity.COMMON]: availableCards.filter(c => c.rarity === Rarity.COMMON),
        [Rarity.RARE]: availableCards.filter(c => c.rarity === Rarity.RARE),
        [Rarity.EPIC]: availableCards.filter(c => c.rarity === Rarity.EPIC),
        [Rarity.LEGENDARY]: availableCards.filter(c => c.rarity === Rarity.LEGENDARY),
    };

    for (let i = 0; i < count; i++) {
        const rand = Math.random() * totalWeight;
        let selectedRarity = Rarity.COMMON;
        
        let cumulative = 0;
        if (rand < (cumulative += wCommon)) selectedRarity = Rarity.COMMON;
        else if (rand < (cumulative += wRare)) selectedRarity = Rarity.RARE;
        else if (rand < (cumulative += wEpic)) selectedRarity = Rarity.EPIC;
        else selectedRarity = Rarity.LEGENDARY;

        const pool = cardsByRarity[selectedRarity];
        if (pool.length > 0) {
            let card = pool[Math.floor(Math.random() * pool.length)];
            let cost = card.cost;
            if (settings) {
                if (settings.freeShopMode) cost = 0;
                else if (settings.priceMultiplier !== 1) cost = Math.floor(cost * settings.priceMultiplier);
            }
            
            result.push({ ...card, cost, id: `${card.id}_${Math.random().toString(36).substr(2, 9)}`, purchasedByPlayerIds: [] });
        } else {
            // Fallback
            const card = CARDS[Math.floor(Math.random() * CARDS.length)];
            result.push({ ...card, id: `${card.id}_${Math.random().toString(36).substr(2, 9)}`, purchasedByPlayerIds: [] });
        }
    }
    return result;
};

const calculatePlayerIncome = (p: Player, incomeMult: number): number => {
    let artifactIncome = 0;
    let royalCrownBonus = false;
    p.artifacts.forEach(a => {
        if (a.id.includes('ancient_coin')) artifactIncome += 5;
        if (a.id.includes('midas_hand')) artifactIncome += 30;
        if (a.id.includes('royal_crown')) royalCrownBonus = true;
    });
    let finalMult = incomeMult;
    if (royalCrownBonus) finalMult += 0.5;
    const landIncome = p.lands.reduce((sum, land) => sum + (land.value || 0), 0);
    return Math.floor((p.income + landIncome + artifactIncome) * finalMult);
};

export const createInitialState = (roomPlayers: RoomPlayer[], settings: GameSettings = DEFAULT_SETTINGS): GameState => {
  const createPlayer = (rp: RoomPlayer): Player => {
    let nation = rp.nation;
    if (settings.randomizeNations) {
        const nations = Object.values(NationType);
        nation = nations[Math.floor(Math.random() * nations.length)];
    }

    const config = NATION_CONFIG[nation];
    let startingHand: Card[] = [];
    
    const startCard = CARDS.find(c => c.id === config.startCardId);
    if (startCard) startingHand.push({ ...startCard, id: `start_${Math.random()}` });
    startingHand = [...startingHand, ...getWeightedRandomCards(2, 1, settings)];

    let gold = settings.initialGold + config.goldBonus;
    if (nation === NationType.COMMERCIAL) gold += 50;

    const maxHp = Math.floor((100 + config.hpBonus) * settings.healthMultiplier);
    const baseIncome = (20 + (nation === NationType.COMMERCIAL ? 10 : 0)) * settings.incomeMultiplier;

    const p: Player = {
      id: rp.id,
      name: rp.name,
      isHuman: !rp.isBot,
      nation: nation,
      hp: maxHp,
      maxHp: maxHp,
      mana: settings.initialMana + config.manaBonus,
      maxMana: 100,
      gold: gold,
      income: baseIncome,
      damageBonus: 0,
      hand: startingHand,
      lands: [],
      artifacts: [],
      isDead: false,
      isStunned: false,
      botDifficulty: rp.botDifficulty,
      playsUsed: 0,
      hasPurchasedInShop: false,
      soul: 0,
      elementMark: null,
      isBleeding: false,
      techShield: 0,
      maxPlays: settings.maxPlaysPerTurn,
      shopDiscount: false,
      isAdmin: rp.isAdmin,
      activeStates: []
    };
    p.calculatedIncome = calculatePlayerIncome(p, settings.incomeMultiplier);
    return p;
  };

  const players = roomPlayers.map(rp => createPlayer(rp));
  const initialShop = getWeightedRandomCards(settings.shopSize, 1, settings);

  return {
    turn: 1,
    currentPlayerIndex: 0,
    players,
    shopCards: initialShop,
    gameLog: [{ id: 'init', message: '遊戲開始！', type: 'info', timestamp: Date.now() }],
    chat: [],
    playedCardTypesThisTurn: [],
    turnPhase: 'ACTION',
    pendingAttack: null,
    winnerId: null,
    eventMessage: null,
    currentEvent: null,
    settings,
    lastAction: null,
    topNotification: undefined
  };
};

export const nextTurn = (state: GameState): GameState => {
  let nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
  let nextTurnNum = state.turn;
  
  if (nextIndex === 0) {
      nextTurnNum = state.turn + 1;
  }

  // --- HARD LIMIT CHECK ---
  if (nextTurnNum > MAX_TURNS) {
      const sortedPlayers = [...state.players].sort((a, b) => b.hp - a.hp);
      const winner = sortedPlayers[0];
      return {
          ...state,
          winnerId: winner.id,
          gameLog: [...state.gameLog, { id: Date.now().toString(), message: `回合上限已達 (${MAX_TURNS})。判定 ${winner.name} 獲勝！`, type: 'info', timestamp: Date.now() }]
      };
  }

  let attempts = 0;
  while (state.players[nextIndex].isDead && attempts < state.players.length) {
    nextIndex = (nextIndex + 1) % state.players.length;
    if (nextIndex === 0) nextTurnNum++; 
    attempts++;
  }

  return processTurnStart(state, nextIndex, nextTurnNum);
};

const processTurnStart = (state: GameState, nextIndex: number, nextTurnNum: number): GameState => {
  const activePlayers = state.players.filter(p => !p.isDead);
  if (activePlayers.length <= 1) {
      return { ...state, winnerId: activePlayers[0]?.id || null };
  }

  let eventMsg = null;
  let currentEvent = state.currentEvent;
  let newState = { ...state };
  let newShop = state.shopCards;
  let logs: LogEntry[] = [];
  let topNotif: { message: string, type: 'event'|'artifact'|'info' } | undefined = undefined;

  if (nextIndex === 0) {
      newShop = getWeightedRandomCards(state.settings.shopSize, nextTurnNum, state.settings);
  }

  // Event Logic (Crazy Mode or Standard)
  const isEventTurn = state.settings.crazyMode ? true : (state.settings.enableRandomEvents && nextTurnNum >= 5 && (nextTurnNum - 5) % state.settings.eventFrequency === 0);
  
  if (nextIndex === 0 && isEventTurn && nextTurnNum !== state.turn) {
      const randomEvent = EVENTS_LIST[Math.floor(Math.random() * EVENTS_LIST.length)];
      currentEvent = randomEvent;
      eventMsg = `【${randomEvent.type === 'DISASTER' ? '災難' : '祝福'}】${randomEvent.name}: ${randomEvent.description}`;
      topNotif = { message: eventMsg, type: 'event' };
      if (randomEvent.effect) newState = randomEvent.effect(newState);
  }

  const triggeredArtifacts: string[] = [];
  
  const processedPlayers = newState.players.map(p => {
      let activeP = { ...p };
      
      // Bleeding
      if (activeP.id === newState.players[nextIndex].id && activeP.isBleeding) {
          const bleedDamage = 15; 
          const newHp = Math.max(1, activeP.hp - bleedDamage);
          logs.push({ 
              id: Date.now().toString() + Math.random(), 
              message: `${activeP.name} 傷口裂開 (流血)，受到 ${bleedDamage} 點傷害。`, 
              type: 'combat', 
              timestamp: Date.now() 
          });
          activeP.hp = newHp;
          activeP.isBleeding = false; 
      }

      // --- NEW STATE TRIGGER LOGIC (Blessings/Curses) ---
      if (activeP.id === newState.players[nextIndex].id && activeP.activeStates.length > 0) {
          activeP.activeStates.forEach(state => {
              if (Math.random() < state.triggerChance) {
                  let val = state.effectValue;
                  if (state.effectType === 'heal') {
                      activeP.hp = Math.min(activeP.maxHp, activeP.hp + val);
                      logs.push({ id: Date.now() + Math.random().toString(), message: `【${state.name}】觸發！恢復了 ${val} 生命。`, type: 'info', timestamp: Date.now() });
                  } else if (state.effectType === 'damage') {
                      activeP.hp = Math.max(1, activeP.hp - val);
                      logs.push({ id: Date.now() + Math.random().toString(), message: `【${state.name}】觸發！受到了 ${val} 傷害。`, type: 'combat', timestamp: Date.now() });
                  } else if (state.effectType === 'gold_gain') {
                      activeP.gold += val;
                      logs.push({ id: Date.now() + Math.random().toString(), message: `【${state.name}】觸發！獲得了 ${val} 金錢。`, type: 'economy', timestamp: Date.now() });
                  } else if (state.effectType === 'gold_loss') {
                      activeP.gold = Math.max(0, activeP.gold - val);
                      logs.push({ id: Date.now() + Math.random().toString(), message: `【${state.name}】觸發！遺失了 ${val} 金錢。`, type: 'economy', timestamp: Date.now() });
                  } else if (state.effectType === 'mana_gain') {
                      activeP.mana = Math.min(activeP.maxMana, activeP.mana + val);
                      logs.push({ id: Date.now() + Math.random().toString(), message: `【${state.name}】觸發！恢復了 ${val} 魔力。`, type: 'info', timestamp: Date.now() });
                  } else if (state.effectType === 'mana_loss') {
                      activeP.mana = Math.max(0, activeP.mana - val);
                      logs.push({ id: Date.now() + Math.random().toString(), message: `【${state.name}】觸發！流失了 ${val} 魔力。`, type: 'info', timestamp: Date.now() });
                  }
              }
          });
      }

      return activeP;
  });

  const updatedPlayers = processedPlayers.map((p, idx) => {
    let incomeMultiplier = state.settings.incomeMultiplier;
    if (state.settings.crazyMode) incomeMultiplier *= 2;
    if (currentEvent?.globalModifier?.incomeMultiplier !== undefined) incomeMultiplier *= currentEvent.globalModifier.incomeMultiplier;

    const calcIncome = calculatePlayerIncome(p, incomeMultiplier);

    if (idx !== nextIndex) {
        return { ...p, calculatedIncome: calcIncome };
    }
    if (p.isDead) return p;

    let artifactMana = 0;
    let drawBonus = 0;

    p.artifacts.forEach(a => {
        if (a.id.includes('mana_crystal')) { 
            artifactMana += 10; 
            triggeredArtifacts.push(a.id);
        }
        if (a.id.includes('philosopher_stone')) { 
            artifactMana += 25; 
            triggeredArtifacts.push(a.id); 
        }
        if (a.id.includes('hermes_boots')) { 
            drawBonus += 1; 
            triggeredArtifacts.push(a.id); 
        }
    });

    let maxPlays = state.settings.maxPlaysPerTurn;
    // Apply Mire Effect (Slow)
    if (p.maxPlaysModifier) {
        maxPlays += p.maxPlaysModifier;
        logs.push({ id: Date.now().toString(), message: `${p.name} 受到泥沼影響，本回合行動次數減少！`, type: 'info', timestamp: Date.now() });
    }

    let cardsToDraw = state.settings.cardsDrawPerTurn + drawBonus;
    const drawnCards = getWeightedRandomCards(cardsToDraw, nextTurnNum, state.settings);
    let newHand = [...p.hand, ...drawnCards];
    if (newHand.length > state.settings.maxHandSize) {
        newHand = newHand.slice(0, state.settings.maxHandSize);
    }

    let newGold = p.gold + calcIncome;
    let regen = state.settings.manaRegenPerTurn + artifactMana;
    if (state.settings.crazyMode) regen *= 2;
    
    let newMana = Math.min(p.maxMana, p.mana + regen); 

    let pAfterEvent = { ...p };
    if (currentEvent?.turnEffect) {
        pAfterEvent = currentEvent.turnEffect(pAfterEvent);
        newGold = pAfterEvent.gold + calcIncome - p.income; 
        newGold = Math.floor(newGold);
    }

    // Shop Discount for Soul +3 (Light State)
    const getsShopDiscount = pAfterEvent.soul === 3;

    return {
        ...pAfterEvent,
        gold: newGold,
        mana: newMana,
        hand: newHand,
        playsUsed: 0,
        hasPurchasedInShop: false,
        isStunned: false, 
        calculatedIncome: calcIncome,
        maxPlays,
        maxPlaysModifier: 0, // Reset modifier
        shopDiscount: getsShopDiscount
    };
  });
  
  const activePlayer = updatedPlayers[nextIndex];
  if (activePlayer && activePlayer.isStunned) {
      logs.push({ id: Date.now().toString(), message: `${activePlayer.name} 暈眩中，跳過此回合。`, type: 'combat', timestamp: Date.now() });
      const unStunnedPlayers = updatedPlayers.map((p, i) => i === nextIndex ? { ...p, isStunned: false } : p);
      unStunnedPlayers[nextIndex].playsUsed = PLAYS_PER_TURN; // Skip
      
      return {
          ...newState,
          turn: nextTurnNum,
          currentPlayerIndex: nextIndex,
          players: unStunnedPlayers,
          shopCards: newShop,
          currentEvent,
          eventMessage: eventMsg,
          gameLog: [...newState.gameLog, ...logs],
          topNotification: topNotif,
          turnPhase: 'ACTION', 
          triggeredArtifacts
      };
  }

  if (eventMsg) {
      logs.push({ id: Date.now().toString(), message: eventMsg, type: 'event', timestamp: Date.now() });
  }

  return {
      ...newState,
      turn: nextTurnNum,
      currentPlayerIndex: nextIndex,
      players: updatedPlayers,
      shopCards: newShop,
      currentEvent,
      eventMessage: eventMsg,
      gameLog: [...newState.gameLog, ...logs],
      topNotification: topNotif,
      turnPhase: 'ACTION',
      triggeredArtifacts
  };
};

export const executeCardEffect = (state: GameState, card: Card, targetId?: string): GameState => {
    const playerIndex = state.currentPlayerIndex;
    const player = state.players[playerIndex];
    const newHand = player.hand.filter(c => c.id !== card.id);
    let newPlayers = [...state.players];
    
    let actualManaCost = card.manaCost;
    let actualHpCost = card.hpCost || 0;
    
    // Soul Penalty: Opposite alignment costs HP
    let soulPenalty = 0;
    if (card.alignment) {
        if (player.soul > 0 && card.alignment === AlignmentType.EVIL) {
            soulPenalty = Math.floor(card.manaCost * 0.25);
        } else if (player.soul < 0 && card.alignment === AlignmentType.HOLY) {
            soulPenalty = Math.floor(card.manaCost * 0.25);
        }
    }
    actualHpCost += soulPenalty;

    // Soul Update
    let newSoul = player.soul;
    if (card.alignment === AlignmentType.HOLY) newSoul = Math.min(3, newSoul + 1);
    if (card.alignment === AlignmentType.EVIL) newSoul = Math.max(-3, newSoul - 1);

    let currentPlayer = { 
        ...player, 
        hand: newHand, 
        mana: player.mana - actualManaCost, 
        hp: player.hp - actualHpCost, 
        playsUsed: player.playsUsed + 1,
        soul: newSoul
    };
    
    newPlayers[playerIndex] = currentPlayer;

    let logMsg = `${player.name} 使用了 ${card.name}`;
    if (soulPenalty > 0) logMsg += ` (陣營衝突: -${soulPenalty} HP)`;

    let type: ActionEvent['type'] = card.type;
    const targetPlayerIndex = targetId ? newPlayers.findIndex(p => p.id === targetId) : -1;
    let targetPlayer = targetPlayerIndex >= 0 ? newPlayers[targetPlayerIndex] : null;

    // Effect Logic
    if (card.type === CardType.INDUSTRY) {
        if (currentPlayer.lands.length < MAX_LAND_SIZE) {
            currentPlayer.lands = [...currentPlayer.lands, card];
            logMsg += `，建造了新的產業。`;
        } else {
            // Should be handled by REPLACE_LAND action, this is a fallback or for AI
            const [removed, ...rest] = currentPlayer.lands;
            currentPlayer.lands = [...rest, card];
            logMsg += `，拆除舊產業並建造了新產業。`;
        }
        newPlayers[playerIndex] = currentPlayer;
    } 
    else if (card.type === CardType.ARTIFACT) {
        if (currentPlayer.artifacts.length < MAX_ARTIFACT_SIZE) {
            currentPlayer.artifacts = [...currentPlayer.artifacts, card];
            logMsg += `，裝備了神器。`;
        } else {
             const [removed, ...rest] = currentPlayer.artifacts;
             currentPlayer.artifacts = [...rest, card];
             logMsg += `，替換了舊神器。`;
        }
        newPlayers[playerIndex] = currentPlayer;
    }
    else if (card.type === CardType.HEAL || card.effectType === 'heal' || card.effectType === 'full_restore_hp') {
        const val = card.effectType === 'full_restore_hp' ? currentPlayer.maxHp : (card.value || 0);
        currentPlayer.hp = Math.min(currentPlayer.maxHp, currentPlayer.hp + val);
        logMsg += `，恢復了 ${val} 點生命。`;
        newPlayers[playerIndex] = currentPlayer;
    }
    else if (card.type === CardType.BLESSING && card.stateData) {
        // --- NEW LOGIC: BLESSING REPLACES CURSES ---
        const hasCurses = currentPlayer.activeStates.some(s => s.type === 'CURSE');
        if (hasCurses) {
            currentPlayer.activeStates = currentPlayer.activeStates.filter(s => s.type !== 'CURSE');
            logMsg += `，神聖之力淨化了所有詛咒！`;
        } else {
            logMsg += `，獲得了祝福狀態。`;
        }
        // Add new blessing
        currentPlayer.activeStates.push(card.stateData);
        newPlayers[playerIndex] = currentPlayer;
    }
    else if (card.type === CardType.CURSE && targetPlayer && card.stateData) {
        // --- NEW LOGIC: CURSE REPLACES BLESSINGS ---
        let tPlayer = { ...targetPlayer };
        const hasBlessings = tPlayer.activeStates.some(s => s.type === 'BLESSING');
        if (hasBlessings) {
            tPlayer.activeStates = tPlayer.activeStates.filter(s => s.type !== 'BLESSING');
            logMsg += `，邪惡力量吞噬了 ${tPlayer.name} 的所有祝福！`;
        } else {
            logMsg += `，詛咒了 ${tPlayer.name}。`;
        }
        // Add new curse
        tPlayer.activeStates.push(card.stateData);
        newPlayers[targetPlayerIndex] = tPlayer;
        newPlayers[playerIndex] = currentPlayer;
    }
    else if (card.type === CardType.RITUAL) {
        // Ritual Logic with Soul State requirement
        let canCast = false;
        if (card.alignment === AlignmentType.HOLY && player.soul === 3) canCast = true;
        if (card.alignment === AlignmentType.EVIL && player.soul === -3) canCast = true;

        if (canCast) {
             const randomEvent = EVENTS_LIST.find(e => e.id === card.eventPayload);
             const eventToTrigger = randomEvent || EVENTS_LIST[Math.floor(Math.random() * EVENTS_LIST.length)];
             
             // Reset Soul
             currentPlayer.soul = 0;
             newPlayers[playerIndex] = currentPlayer;

             logMsg += `，發動了儀式，天平回歸平衡！觸發了 ${eventToTrigger.name}！`;
             
             let nextState: GameState = {
                 ...state,
                 players: newPlayers,
                 currentEvent: eventToTrigger,
                 eventMessage: `【儀式】${eventToTrigger.name} 降臨！`,
                 topNotification: { message: eventToTrigger.name, type: 'event' },
                 gameLog: [...state.gameLog, { id: Date.now().toString(), message: logMsg, type: 'event', timestamp: Date.now() }],
                 lastAction: { id: Date.now().toString(), sourceId: player.id, targetId: null, cardId: card.id, cardsPlayed: [card], type: card.type, timestamp: Date.now() }
             }
             if (eventToTrigger.effect) nextState = eventToTrigger.effect(nextState);
             return nextState;
        } else {
            logMsg += `，但靈魂狀態不足 (需極致狀態)，儀式失敗！`;
            newPlayers[playerIndex] = currentPlayer;
        }
    }
    else if (card.type === CardType.SPECIAL || card.type === CardType.CONTRACT) {
        if (card.effectType === 'income') {
            currentPlayer.income += (card.value || 0);
            logMsg += `，永久提升了收入。`;
        }
        else if (card.effectType === 'gold_gain') {
            currentPlayer.gold += (card.value || 0);
            logMsg += `，獲得了 ${card.value} 金幣。`;
        }
        else if (card.effectType === 'gold_steal' && targetPlayer) {
             const stolen = Math.min(targetPlayer.gold, card.value || 0);
             targetPlayer.gold -= stolen;
             currentPlayer.gold += stolen;
             logMsg += `，從 ${targetPlayer.name} 偷取了 ${stolen} 金錢！`;
             newPlayers[targetPlayerIndex] = targetPlayer;
        }
        newPlayers[playerIndex] = currentPlayer;
    }
    
    if (card.effectType === 'buff_damage') {
        currentPlayer.damageBonus += (card.value || 0);
        logMsg += `，攻擊力提升。`;
        newPlayers[playerIndex] = currentPlayer;
    }

    return {
        ...state,
        players: newPlayers,
        gameLog: [...state.gameLog, { id: Date.now().toString(), message: logMsg, type: 'info', timestamp: Date.now() }],
        lastAction: {
            id: Date.now().toString(),
            sourceId: player.id,
            targetId: targetId || null,
            cardId: card.id,
            cardsPlayed: [card],
            type: type,
            timestamp: Date.now()
        }
    };
};

export const replaceLand = (state: GameState, newCardId: string, slotIndex: number): GameState => {
    const playerIndex = state.currentPlayerIndex;
    const player = state.players[playerIndex];
    
    // Find card in hand
    const cardIndex = player.hand.findIndex(c => c.id === newCardId);
    if (cardIndex === -1) return state;
    
    const card = player.hand[cardIndex];
    const newHand = [...player.hand];
    newHand.splice(cardIndex, 1);

    // Validate slot
    if (slotIndex < 0 || slotIndex >= player.lands.length) return state;

    // Costs
    const newPlayer = {
        ...player,
        hand: newHand,
        mana: player.mana - card.manaCost,
        hp: player.hp - (card.hpCost || 0),
        playsUsed: player.playsUsed + 1
    };

    // Replace land
    const oldLand = newPlayer.lands[slotIndex];
    const newLands = [...newPlayer.lands];
    newLands[slotIndex] = card;
    newPlayer.lands = newLands;

    const newPlayers = [...state.players];
    newPlayers[playerIndex] = newPlayer;

    return {
        ...state,
        players: newPlayers,
        gameLog: [...state.gameLog, { 
            id: Date.now().toString(), 
            message: `${player.name} 拆除了 ${oldLand.name} 並建造了 ${card.name}。`, 
            type: 'economy', 
            timestamp: Date.now() 
        }],
        lastAction: {
            id: Date.now().toString(),
            sourceId: player.id,
            targetId: null,
            cardId: card.id,
            cardsPlayed: [card],
            type: CardType.INDUSTRY,
            timestamp: Date.now()
        }
    };
};

export const executeAttackAction = (state: GameState, cards: Card[], targetId: string): GameState => {
    const playerIndex = state.currentPlayerIndex;
    const player = state.players[playerIndex];
    const target = state.players.find(p => p.id === targetId);
    
    if (!target) return state;

    let totalManaCost = 0;
    let totalHpCost = 0;
    let baseDamage = 0;
    let elements: ElementType[] = [];
    let cardNames: string[] = [];
    let soulDelta = 0;
    let penaltyHp = 0;

    const isMagicAttack = cards[0].type === CardType.MAGIC_ATTACK;
    const weapon = !isMagicAttack ? cards.find(c => c.type === CardType.ATTACK) : null;
    const runes = !isMagicAttack ? cards.filter(c => c.type === CardType.RUNE) : [];

    // --- Calculation ---
    for (const c of cards) {
        totalManaCost += c.manaCost;
        totalHpCost += (c.hpCost || 0);
        
        // Soul Update Accumulation (Runes/Magic might have alignment)
        if (c.alignment === AlignmentType.HOLY) soulDelta++;
        if (c.alignment === AlignmentType.EVIL) soulDelta--;

        if (c.element && c.element !== ElementType.NEUTRAL) elements.push(c.element);
        cardNames.push(c.name);
    }

    if (isMagicAttack) {
        // Simple Sum for Magic
        baseDamage = cards.reduce((sum, c) => sum + (c.value || 0), 0);
    } else if (weapon) {
        // Physical Calculation with Dual Effects
        baseDamage = (weapon.value || 0);
        
        // Apply Weapon Alignment Bonus based on Player Soul
        if (player.soul > 0) {
            baseDamage += (weapon.holyBonus || 0);
        } else if (player.soul < 0) {
            baseDamage += (weapon.evilBonus || 0);
        }

        // Add Rune Values
        const runeDamage = runes.reduce((sum, r) => sum + (r.value || 0), 0);
        baseDamage += runeDamage;
    }

    totalHpCost += penaltyHp;

    let attackType = isMagicAttack ? CardType.MAGIC_ATTACK : CardType.ATTACK;
    let attackElement = elements.length > 0 ? elements[0] : ElementType.NEUTRAL;
    let finalDamage = Math.floor((baseDamage + player.damageBonus) * state.settings.damageMultiplier);

    // REACTION LOGIC (Determine potential reaction)
    let reaction: ReactionType | undefined = undefined;
    let reactionEffectValue = 0;
    const targetMark = target.elementMark;

    if (targetMark && attackElement !== ElementType.NEUTRAL && attackElement !== targetMark) {
        const set = new Set([targetMark, attackElement]);
        
        // Spread (Fire + Air)
        if (set.has(ElementType.FIRE) && set.has(ElementType.AIR)) {
            reaction = 'SPREAD';
        }
        // Mire (Earth + Water)
        else if (set.has(ElementType.EARTH) && set.has(ElementType.WATER)) {
            reaction = 'MIRE';
        }
        // Annihilation (Opposites: Fire/Water, Earth/Air)
        else if ((set.has(ElementType.FIRE) && set.has(ElementType.WATER)) || (set.has(ElementType.EARTH) && set.has(ElementType.AIR))) {
            reaction = 'ANNIHILATION';
            reactionEffectValue = Math.floor(finalDamage * 0.25); // Self damage
            finalDamage = Math.floor(finalDamage * 1.5);
        }
        // Overload (Complements: Fire/Earth, Water/Air, etc - simpler: remaining pairs)
        else {
            reaction = 'OVERLOAD';
            reactionEffectValue = 10; // Heal amount
            finalDamage = Math.floor(finalDamage * 1.25);
        }
    } else if (!targetMark && attackElement !== ElementType.NEUTRAL) {
        reaction = 'PRIME'; // Not a full reaction, but applies mark
    }

    const newHand = player.hand.filter(c => !cards.find(played => played.id === c.id));
    let newSoul = Math.max(-3, Math.min(3, player.soul + soulDelta));

    let newPlayer = {
        ...player,
        hand: newHand,
        mana: player.mana - totalManaCost,
        hp: player.hp - totalHpCost,
        playsUsed: player.playsUsed + 1,
        soul: newSoul
    };

    let logMsg = `${player.name} 發動${attackType === CardType.MAGIC_ATTACK ? '魔法' : '物理'}攻擊！(傷害: ${finalDamage})`;
    let comboName = '';
    if (reaction && reaction !== 'PRIME') {
        logMsg += ` [元素反應: ${reaction}]`;
        comboName = reaction;
    }
    if (reaction === 'PRIME') logMsg += ` [掛載印記: ${attackElement}]`;
    
    // Log bonus info for physical
    if (!isMagicAttack && weapon) {
        if (player.soul > 0 && weapon.holyBonus) logMsg += ` (光明加成 +${weapon.holyBonus})`;
        if (player.soul < 0 && weapon.evilBonus) logMsg += ` (黑暗加成 +${weapon.evilBonus})`;
    }

    let updatedPlayers = state.players.map(p => p.id === player.id ? newPlayer : p);

    return {
        ...state,
        players: updatedPlayers,
        turnPhase: 'DEFENSE',
        pendingAttack: {
            sourceId: player.id,
            targetId: target.id,
            damage: finalDamage,
            cardNames,
            element: attackElement,
            attackType,
            reaction,
            reactionEffectValue
        },
        gameLog: [...state.gameLog, { id: Date.now().toString(), message: logMsg, type: 'combat', timestamp: Date.now() }],
        lastAction: {
            id: Date.now().toString(),
            sourceId: player.id,
            targetId: target.id,
            cardId: cards[0].id,
            cardsPlayed: cards, 
            type: attackType,
            totalValue: finalDamage,
            timestamp: Date.now(),
            comboName
        }
    };
};

export const resolveAttack = (state: GameState, cardsPlayed: Card[], _isRepel: boolean): GameState => {
    if (!state.pendingAttack) return { ...state, turnPhase: 'ACTION' };

    const attack = state.pendingAttack;
    const defenderId = attack.targetId;
    const defenderIndex = state.players.findIndex(p => p.id === defenderId);
    if (defenderIndex === -1) return { ...state, turnPhase: 'ACTION', pendingAttack: null };

    const defender = state.players[defenderIndex];
    const attackerIndex = state.players.findIndex(p => p.id === attack.sourceId);
    const attacker = state.players[attackerIndex];

    let newDefender = { ...defender };
    let newAttacker = { ...attacker };
    
    // Defender Costs
    const totalMana = cardsPlayed.reduce((acc, c) => acc + c.manaCost, 0);
    const totalHpCost = cardsPlayed.reduce((acc, c) => acc + (c.hpCost || 0), 0);
    newDefender.mana -= totalMana;
    newDefender.hp -= totalHpCost;
    
    // Defender Soul Update
    let soulDelta = 0;
    cardsPlayed.forEach(c => {
        if (c.alignment === AlignmentType.HOLY) soulDelta++;
        if (c.alignment === AlignmentType.EVIL) soulDelta--;
    });
    newDefender.soul = Math.max(-3, Math.min(3, newDefender.soul + soulDelta));
    // Remove played cards
    const playedIds = cardsPlayed.map(c => c.id);
    newDefender.hand = newDefender.hand.filter(c => !playedIds.includes(c.id));

    let incomingDamage = attack.damage;
    let repelDamage = 0;
    let logMessage = '';

    // Calculate Repel (Simplified: Sum of played attack cards)
    let counterPower = 0;
    const isMagicRepel = cardsPlayed[0]?.type === CardType.MAGIC_ATTACK;
    const weapon = !isMagicRepel ? cardsPlayed.find(c => c.type === CardType.ATTACK) : null;
    const runes = !isMagicRepel ? cardsPlayed.filter(c => c.type === CardType.RUNE) : [];

    if (isMagicRepel) {
        counterPower = cardsPlayed.reduce((sum, c) => sum + (c.value || 0), 0);
    } else if (weapon) {
        counterPower = (weapon.value || 0);
        if (newDefender.soul > 0) counterPower += (weapon.holyBonus || 0);
        else if (newDefender.soul < 0) counterPower += (weapon.evilBonus || 0);
        counterPower += runes.reduce((sum, r) => sum + (r.value || 0), 0);
    }

    // Add damage bonus
    counterPower += newDefender.damageBonus;

    const damageDiff = counterPower - incomingDamage;

    // Resolve Damage
    if (damageDiff >= 0) {
        repelDamage = damageDiff;
        logMessage += ` 反擊成功！抵消傷害並反彈 ${repelDamage}。`;
        newAttacker.hp -= repelDamage;
    } else {
        const damageTaken = Math.abs(damageDiff);
        newDefender.hp -= damageTaken;
        logMessage += ` 反擊不足，承受 ${damageTaken} 點傷害。`;

        // APPLY REACTION EFFECTS IF DAMAGE TAKEN
        if (attack.reaction) {
            if (attack.reaction === 'PRIME') {
                newDefender.elementMark = attack.element;
                logMessage += ` [印記掛載: ${attack.element}]`;
            } else {
                // Detonate: Reaction happened, clear mark
                newDefender.elementMark = null;
                logMessage += ` [印記引爆]`;

                if (attack.reaction === 'SPREAD') {
                    newDefender.isBleeding = true;
                    if (newDefender.lands.length > 0) {
                        const destroyIdx = Math.floor(Math.random() * newDefender.lands.length);
                        const land = newDefender.lands[destroyIdx];
                        newDefender.lands.splice(destroyIdx, 1);
                        logMessage += ` 擴散：造成流血並摧毀了 ${land.name}！`;
                    } else {
                        logMessage += ` 擴散：造成流血！`;
                    }
                } else if (attack.reaction === 'MIRE') {
                    newDefender.maxPlaysModifier = -1; // Reduce plays next turn
                    logMessage += ` 泥沼：行動遲緩，下回合只能出 2 張牌。`;
                } else if (attack.reaction === 'ANNIHILATION') {
                    newAttacker.hp -= (attack.reactionEffectValue || 0);
                    logMessage += ` 湮滅：爆發傷害，攻擊者反噬 ${(attack.reactionEffectValue || 0)} HP。`;
                } else if (attack.reaction === 'OVERLOAD') {
                    newAttacker.hp = Math.min(newAttacker.maxHp, newAttacker.hp + (attack.reactionEffectValue || 0));
                    logMessage += ` 過載：攻擊者恢復 ${(attack.reactionEffectValue || 0)} HP。`;
                }
            }
        }
    }

    if (newDefender.hp <= 0) newDefender.isDead = true;
    if (newAttacker.hp <= 0) newAttacker.isDead = true;

    let newPlayers = [...state.players];
    newPlayers[defenderIndex] = newDefender;
    newPlayers[attackerIndex] = newAttacker;

    return {
        ...state,
        players: newPlayers,
        turnPhase: 'ACTION',
        pendingAttack: null,
        gameLog: [...state.gameLog, { id: Date.now().toString(), message: logMessage, type: 'combat', timestamp: Date.now() }],
        lastAction: {
            id: Date.now().toString(),
            sourceId: defender.id,
            targetId: attack.sourceId,
            cardId: cardsPlayed[0]?.id || 'skip',
            cardsPlayed, 
            type: 'REPEL', 
            totalValue: counterPower,
            timestamp: Date.now(),
            message: logMessage // Added details for notification
        },
        winnerId: newPlayers.filter(p => !p.isDead).length <= 1 ? newPlayers.find(p => !p.isDead)?.id || null : null
    };
};

export const buyCard = (state: GameState, card: Card): GameState => {
    const playerIndex = state.currentPlayerIndex;
    const player = state.players[playerIndex];

    let finalCost = card.cost;
    if (player.shopDiscount && !player.hasPurchasedInShop) {
        finalCost = Math.floor(finalCost * 0.5);
    }

    if (player.gold < finalCost) return state;
    if (player.hand.length >= state.settings.maxHandSize) return state;

    const newCard = { ...card, id: `${card.id}_bought_${Date.now()}` };
    
    const newShop = state.shopCards.map(c => {
        if (c.id === card.id) {
            return { ...c, purchasedByPlayerIds: [...(c.purchasedByPlayerIds || []), player.id] };
        }
        return c;
    });

    const newPlayer = {
        ...player,
        gold: player.gold - finalCost,
        hand: [...player.hand, newCard],
        hasPurchasedInShop: true,
        shopDiscount: false // Consume discount
    };

    let newPlayers = [...state.players];
    newPlayers[playerIndex] = newPlayer;

    return {
        ...state,
        players: newPlayers,
        shopCards: newShop,
        gameLog: [...state.gameLog, { id: Date.now().toString(), message: `${player.name} 購買了 ${card.name}`, type: 'economy', timestamp: Date.now() }]
    };
};

export const sellCard = (state: GameState, card: Card): GameState => {
    const playerIndex = state.currentPlayerIndex;
    const player = state.players[playerIndex];

    const sellPrice = Math.floor(card.cost / 2);
    const newHand = player.hand.filter(c => c.id !== card.id);
    
    const newPlayer = {
        ...player,
        gold: player.gold + sellPrice,
        hand: newHand
    };

    let newPlayers = [...state.players];
    newPlayers[playerIndex] = newPlayer;

    return {
        ...state,
        players: newPlayers,
        gameLog: [...state.gameLog, { id: Date.now().toString(), message: `${player.name} 出售了 ${card.name} (+${sellPrice}G)`, type: 'economy', timestamp: Date.now() }]
    };
};
