
import { GameState, Player, Card, CardType, ElementType, ActionEvent, BattleRecord } from '../types';
import { executeCardEffect, executeAttackAction, nextTurn, buyCard, resolveAttack } from './gameEngine';
import { getComplexElementName, ELEMENT_CONFIG } from '../constants';

// --- Types for Internal Logic ---

type AIActionType = 'PLAY_CARD' | 'ATTACK' | 'BUY_CARD' | 'END_TURN' | 'REPEL' | 'TAKE_DAMAGE';

interface AIAction {
    type: AIActionType;
    cardId?: string;
    targetId?: string;
    comboCards?: string[]; // For stacking
    score?: number; // For visualization
}

interface MCTSNode {
    state: GameState;
    parent: MCTSNode | null;
    children: MCTSNode[];
    visits: number;
    score: number; // Cumulative value
    action?: AIAction;
    untriedActions: AIAction[];
    playerIndex: number;
}

// --- 1. VALUE NETWORK (Heuristic Approximation) ---
export const evaluateState = (state: GameState, perspectivePlayerId: string): number => {
    const p = state.players.find(pl => pl.id === perspectivePlayerId);
    if (!p) return -1; 
    if (p.isDead) return -1; // Loss
    
    // Win condition check
    const aliveEnemies = state.players.filter(pl => pl.id !== perspectivePlayerId && !pl.isDead);
    if (aliveEnemies.length === 0) return 1; // Win

    // --- Heuristic Tuning for Aggression ---
    
    // 1. HP Gap (Most important)
    const avgEnemyHp = aliveEnemies.reduce((sum, e) => sum + e.hp, 0) / aliveEnemies.length;
    const hpDiff = p.hp - avgEnemyHp;
    const hpScore = (hpDiff / 100) * 0.8; // High weight on having more HP than enemies

    // 2. Resource Hoarding Penalty
    // If we have tons of mana/gold but aren't winning, that's bad.
    // We want to spend resources to gain advantage.
    const manaScore = Math.min(1, p.mana / 100) * 0.1; // Low weight
    const goldScore = Math.min(1, p.gold / 500) * 0.1; // Low weight
    
    // 3. Board Presence (Income/Assets)
    const incomeScore = (p.income + p.lands.reduce((sum, l) => sum + (l.value || 0), 0)) / 100 * 0.4;
    const artifactScore = p.artifacts.length * 0.1;
    
    // 4. Inaction Penalty (Implicit)
    // We punish states where turn count is high but enemies are healthy
    const stalematePenalty = (state.turn > 20 && avgEnemyHp > 80) ? -0.3 : 0;

    let totalScore = hpScore + incomeScore + manaScore + goldScore + artifactScore + stalematePenalty;
    
    // Normalize roughly to [-1, 1]
    return Math.max(-1, Math.min(1, totalScore));
};

// --- Helper: Get Acting Player ---
const getActingPlayer = (state: GameState): Player => {
    if (state.turnPhase === 'DEFENSE' && state.pendingAttack) {
        return state.players.find(p => p.id === state.pendingAttack!.targetId) || state.players[state.currentPlayerIndex];
    }
    return state.players[state.currentPlayerIndex];
};

// --- 2. POLICY NETWORK (Action Generation) ---
export const getLegalActions = (state: GameState): AIAction[] => {
    const actions: AIAction[] = [];
    const p = getActingPlayer(state);

    if (state.turnPhase === 'DEFENSE') {
        // Double check we are the target (Safety)
        if (state.pendingAttack && state.pendingAttack.targetId !== p.id) return [];

        const incomingType = state.pendingAttack?.attackType;
        
        // Option 1: Take Damage
        actions.push({ type: 'TAKE_DAMAGE' });

        // Option 2: Repel (single cards)
        if (incomingType) {
            const validRepels = p.hand.filter(c => {
                if (incomingType === CardType.ATTACK) return c.type === CardType.ATTACK;
                if (incomingType === CardType.MAGIC_ATTACK) return c.type === CardType.MAGIC_ATTACK;
                return false;
            });

            // Dedup by ID to avoid explosion
            validRepels.forEach(c => {
                actions.push({ type: 'REPEL', cardId: c.id, comboCards: [c.id] });
            });
        }

        return actions;
    }

    // Action Phase
    if (state.turnPhase === 'ACTION') {
        // Option 1: End Turn
        actions.push({ type: 'END_TURN' });

        if (p.playsUsed >= p.maxPlays) return actions; // Can only end turn if out of plays

        const enemies = state.players.filter(pl => pl.id !== p.id && !pl.isDead);

        // Option 2: Play Cards (Single)
        p.hand.forEach(card => {
            // Affordability check
            if (p.mana < card.manaCost) return;
            if (card.hpCost && p.hp <= card.hpCost) return;

            // Attack Cards
            if (card.type === CardType.ATTACK || card.type === CardType.MAGIC_ATTACK) {
                enemies.forEach(target => {
                    actions.push({ 
                        type: 'ATTACK', 
                        cardId: card.id, 
                        targetId: target.id,
                        comboCards: [card.id]
                    });
                });
            } 
            // Self/Global Effects
            else if (card.type === CardType.RUNE) {
                // Skip standalone runes
            }
            else {
                // Buff/Heal/Ind
                if ((card.type === CardType.HEAL || card.effectType === 'heal') && p.hp >= p.maxHp) return;
                
                actions.push({ type: 'PLAY_CARD', cardId: card.id });
            }
        });

        // Option 3: Buy Cards
        // CRITICAL FIX: Only allow buying if hand is not full AND hasn't bought yet
        if (!p.hasPurchasedInShop && p.hand.length < state.settings.maxHandSize) {
            state.shopCards.forEach(card => {
                // Skip if already bought (visual check simulation)
                if (card.purchasedByPlayerIds?.includes(p.id)) return;

                let cost = card.cost;
                if (p.shopDiscount) cost = Math.floor(cost * 0.5);
                
                if (p.gold >= cost) {
                    actions.push({ type: 'BUY_CARD', cardId: card.id });
                }
            });
        }
    }

    return actions;
};

// --- 3. MCTS ENGINE ---

const cloneState = (state: GameState): GameState => {
    return JSON.parse(JSON.stringify(state));
};

const applyAction = (state: GameState, action: AIAction): GameState => {
    let newState = cloneState(state);
    const p = getActingPlayer(newState);

    switch (action.type) {
        case 'END_TURN':
            return nextTurn(newState);
        
        case 'PLAY_CARD':
            const card = p.hand.find(c => c.id === action.cardId);
            if (card) newState = executeCardEffect(newState, card, action.targetId || p.id);
            break;

        case 'ATTACK':
            const atkCard = p.hand.find(c => c.id === action.cardId);
            if (atkCard && action.targetId) {
                newState = executeAttackAction(newState, [atkCard], action.targetId);
            }
            break;

        case 'BUY_CARD':
            const shopCard = newState.shopCards.find(c => c.id === action.cardId);
            if (shopCard) newState = buyCard(newState, shopCard);
            break;

        case 'TAKE_DAMAGE':
            newState = resolveAttack(newState, [], false);
            break;

        case 'REPEL':
            const repelCard = p.hand.find(c => c.id === action.cardId);
            if (repelCard) newState = resolveAttack(newState, [repelCard], true);
            break;
    }
    return newState;
};

const ucb1 = (node: MCTSNode): number => {
    if (node.visits === 0) return Infinity;
    const C = 1.41; 
    return (node.score / node.visits) + C * Math.sqrt(Math.log(node.parent!.visits) / node.visits);
};

export const runMCTS = (rootState: GameState, iterations: number = 50): { bestAction: AIAction | null, debugInfo: any } => {
    // Root player is the one making decision NOW (could be attacker OR defender)
    const actingPlayer = getActingPlayer(rootState);
    const rootPlayerId = actingPlayer.id;

    const root: MCTSNode = {
        state: rootState,
        parent: null,
        children: [],
        visits: 0,
        score: 0,
        untriedActions: getLegalActions(rootState),
        playerIndex: rootState.players.findIndex(p => p.id === rootPlayerId)
    };

    for (let i = 0; i < iterations; i++) {
        let node = root;
        let state = cloneState(rootState);

        // 1. Selection
        while (node.untriedActions.length === 0 && node.children.length > 0) {
            node = node.children.reduce((prev, curr) => ucb1(curr) > ucb1(prev) ? curr : prev);
            if (node.action) state = applyAction(state, node.action);
        }

        // 2. Expansion
        if (node.untriedActions.length > 0) {
            const actionIndex = Math.floor(Math.random() * node.untriedActions.length);
            const action = node.untriedActions.splice(actionIndex, 1)[0];
            state = applyAction(state, action);
            
            const newNode: MCTSNode = {
                state: state,
                parent: node,
                children: [],
                visits: 0,
                score: 0,
                action: action,
                untriedActions: getLegalActions(state),
                playerIndex: state.currentPlayerIndex // Index might drift, but value func handles ID
            };
            node.children.push(newNode);
            node = newNode;
        }

        // 3. Simulation
        const value = evaluateState(state, rootPlayerId);

        // 4. Backpropagation
        while (node) {
            node.visits++;
            node.score += value; 
            node = node.parent!;
        }
    }

    if (root.children.length === 0) return { bestAction: null, debugInfo: "No moves" };

    const bestChild = root.children.reduce((prev, curr) => curr.visits > prev.visits ? curr : prev);
    
    const policy = root.children.map(c => ({
        action: c.action?.type + (c.action?.cardId ? `:${c.action.cardId}` : ''),
        prob: c.visits / iterations
    }));

    return { 
        bestAction: bestChild.action || null,
        debugInfo: {
            visits: root.visits,
            bestScore: bestChild.score / bestChild.visits,
            policy: policy
        }
    };
};

export const generateTrainingData = (record: BattleRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(record));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `battle_data_${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};