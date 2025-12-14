
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, RoomPlayer, NationType, GameSettings, BattleRecord, Player } from '../types';
import { createInitialState, DEFAULT_SETTINGS, nextTurn, executeCardEffect, executeAttackAction, buyCard, resolveAttack } from '../services/gameEngine';
import { runMCTS } from '../services/aiAnalysis';
import { NATION_CONFIG } from '../constants';
import { Play, Pause, Download, ArrowLeft, Brain, Activity, Terminal, Zap, Eye, EyeOff, Skull, Coins, Repeat } from 'lucide-react';

interface SimulationScreenProps {
    onBack: () => void;
}

export const SimulationScreen: React.FC<SimulationScreenProps> = ({ onBack }) => {
    // UI States (Trigger Re-renders)
    const [displayState, setDisplayState] = useState<GameState | null>(null); // For Visualizer
    const [isRunning, setIsRunning] = useState(false);
    const [isHeadless, setIsHeadless] = useState(false); // New Option
    const [speed, setSpeed] = useState(500); 
    const [logs, setLogs] = useState<string[]>([]);
    const [gameCount, setGameCount] = useState(0);
    const [maxGames, setMaxGames] = useState(100); // Target games
    const [dataPointCount, setDataPointCount] = useState(0);
    const [winStats, setWinStats] = useState<Record<string, number>>({});

    // Data Refs (High performance, no re-render)
    const gameStateRef = useRef<GameState | null>(null);
    const battleRecordsRef = useRef<BattleRecord[]>([]);
    const isRunningRef = useRef(false);
    const isHeadlessRef = useRef(false);
    const speedRef = useRef(500);
    const maxGamesRef = useRef(100);
    const logContainerRef = useRef<HTMLDivElement>(null);

    // Sync Refs
    useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
    useEffect(() => { isHeadlessRef.current = isHeadless; }, [isHeadless]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { maxGamesRef.current = maxGames; }, [maxGames]);

    // Init Logic
    const startNewGame = () => {
        const bots: RoomPlayer[] = [
            { id: 'AI_Fighter', name: 'AI_Fighter', nation: NationType.FIGHTER, isHost: true, isBot: true, isReady: true, botDifficulty: 'mcts' },
            { id: 'AI_Holy', name: 'AI_Holy', nation: NationType.HOLY, isHost: false, isBot: true, isReady: true, botDifficulty: 'mcts' },
            { id: 'AI_Comm', name: 'AI_Comm', nation: NationType.COMMERCIAL, isHost: false, isBot: true, isReady: true, botDifficulty: 'mcts' },
            { id: 'AI_Magic', name: 'AI_Magic', nation: NationType.MAGIC, isHost: false, isBot: true, isReady: true, botDifficulty: 'mcts' }
        ];
        // Reduced turn wait for faster simulation games
        const settings: GameSettings = { ...DEFAULT_SETTINGS, maxPlayers: 4, initialGold: 200, eventFrequency: 5 };
        const state = createInitialState(bots, settings);
        
        gameStateRef.current = state;
        if (!isHeadlessRef.current) {
            setDisplayState(state);
            addLog(`--- Game Start ---`);
        }
    };

    const addLog = (msg: string) => {
        if (isHeadlessRef.current) return; // Don't log in headless to save memory
        setLogs(prev => {
            const newLogs = [...prev, msg];
            if (newLogs.length > 50) return newLogs.slice(newLogs.length - 50); // Keep last 50
            return newLogs;
        });
    };

    // Initialize on load
    useEffect(() => {
        if (!gameStateRef.current) startNewGame();
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    // Core Loop
    useEffect(() => {
        let animationFrameId: number;
        let timeoutId: ReturnType<typeof setTimeout>;

        const step = () => {
            if (!isRunningRef.current) return;

            // Stop if target reached
            if (gameCount >= maxGamesRef.current) {
                setIsRunning(false);
                addLog(`TARGET REACHED (${maxGamesRef.current} Games)`);
                return;
            }

            // --- HEADLESS MODE LOGIC (Batch Processing) ---
            if (isHeadlessRef.current) {
                const startTime = performance.now();
                // Run as many steps as possible in 16ms (Time Slicing)
                while (performance.now() - startTime < 16) {
                    if (!gameStateRef.current) startNewGame();
                    processSingleStep();
                    
                    // Break inner loop if game count reached during batch
                    if (gameCount >= maxGamesRef.current) break;
                }
                // Update stats UI occasionally (not every step)
                setDataPointCount(battleRecordsRef.current.length);
                
                if (gameCount < maxGamesRef.current) {
                    animationFrameId = requestAnimationFrame(step);
                } else {
                    setIsRunning(false); // Stop loop
                }
            } 
            // --- VISUAL MODE LOGIC (Delay) ---
            else {
                if (!gameStateRef.current) startNewGame();
                processSingleStep();
                // Update UI state
                setDisplayState(gameStateRef.current);
                
                if (gameCount < maxGamesRef.current) {
                    timeoutId = setTimeout(step, speedRef.current);
                } else {
                    setIsRunning(false);
                }
            }
        };

        const processSingleStep = () => {
            let currentState = gameStateRef.current;
            if (!currentState) return;

            // Check Win
            if (currentState.winnerId) {
                setWinStats(prev => ({
                    ...prev,
                    [currentState!.winnerId!]: (prev[currentState!.winnerId!] || 0) + 1
                }));
                setGameCount(c => c + 1);
                addLog(`Winner: ${currentState.winnerId}`);
                gameStateRef.current = null; // Trigger new game next loop
                return;
            }

            // Determine Acting Player
            let actingPlayer: Player = currentState.players[currentState.currentPlayerIndex];
            if (currentState.turnPhase === 'DEFENSE' && currentState.pendingAttack) {
                const target = currentState.players.find(p => p.id === currentState!.pendingAttack!.targetId);
                if (target) actingPlayer = target;
            }

            // MCTS Decision
            const iterations = 50; 
            const { bestAction, debugInfo } = runMCTS(currentState, iterations);

            let newState: GameState | null = null;

            if (bestAction) {
                switch (bestAction.type) {
                    case 'END_TURN':
                        newState = nextTurn(currentState);
                        addLog(`${actingPlayer.name}: End Turn`);
                        break;
                    case 'PLAY_CARD':
                        const c = actingPlayer.hand.find(x => x.id === bestAction.cardId);
                        if(c) {
                            newState = executeCardEffect(currentState, c, bestAction.targetId || actingPlayer.id);
                            addLog(`${actingPlayer.name}: Played ${c.name}`);
                        }
                        break;
                    case 'ATTACK':
                        const ac = actingPlayer.hand.find(x => x.id === bestAction.cardId);
                        if(ac && bestAction.targetId) {
                            newState = executeAttackAction(currentState, [ac], bestAction.targetId);
                            addLog(`${actingPlayer.name}: Attacked ${bestAction.targetId}`);
                        }
                        break;
                    case 'BUY_CARD':
                        const bc = currentState.shopCards.find(x => x.id === bestAction.cardId);
                        if(bc) {
                            newState = buyCard(currentState, bc);
                            addLog(`${actingPlayer.name}: Bought ${bc.name}`);
                        }
                        break;
                    case 'REPEL':
                        const rc = actingPlayer.hand.find(x => x.id === bestAction.cardId);
                        if(rc) {
                            newState = resolveAttack(currentState, [rc], true);
                            addLog(`${actingPlayer.name}: Repelled`);
                        }
                        break;
                    case 'TAKE_DAMAGE':
                        newState = resolveAttack(currentState, [], false);
                        addLog(`${actingPlayer.name}: Took Damage`);
                        break;
                }

                // Check if state ACTUALLY changed
                const hasChanged = newState && newState !== currentState;

                if (hasChanged && newState) {
                    // Record Data (Optimized: Push to ref array)
                    const record: BattleRecord = {
                        turn: currentState.turn,
                        player: actingPlayer.nation,
                        stateVector: [actingPlayer.hp, actingPlayer.mana, actingPlayer.gold, actingPlayer.soul],
                        policyTarget: debugInfo.policy.map((p: any) => p.prob),
                        valueTarget: debugInfo.bestScore,
                        actionTaken: bestAction.type
                    };
                    battleRecordsRef.current.push(record);
                    
                    gameStateRef.current = newState;
                } else {
                    // Fallback: If action failed (stuck in loop), force End Turn / Skip
                    addLog(`${actingPlayer.name}: Invalid/Stuck Action -> Force Skip`);
                    
                    if (currentState.turnPhase === 'DEFENSE') {
                        gameStateRef.current = resolveAttack(currentState, [], false);
                    } else {
                        gameStateRef.current = nextTurn(currentState);
                    }
                }
            } else {
                // No move possible
                addLog(`${actingPlayer.name}: No Moves -> Skip`);
                if (currentState.turnPhase === 'DEFENSE') {
                    gameStateRef.current = resolveAttack(currentState, [], false);
                } else {
                    gameStateRef.current = nextTurn(currentState);
                }
            }
        };

        if (isRunning) {
            if (isHeadless) {
                animationFrameId = requestAnimationFrame(step);
            } else {
                step(); // Trigger first step
            }
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timeoutId);
        };
    }, [isRunning, isHeadless, gameCount]);

    const exportData = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(battleRecordsRef.current, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `mcts_training_data_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col font-mono">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700"><ArrowLeft /></button>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-indigo-400">
                        <Brain className="text-indigo-500" /> AI Arena <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">MCTS v1.0</span>
                    </h1>
                </div>
                
                <div className="flex flex-wrap gap-4 items-center justify-end w-full md:w-auto">
                    {/* Max Games Setting */}
                    <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                        <Repeat size={14} className="text-slate-500"/>
                        <span className="text-xs text-slate-500 font-bold">TARGET</span>
                        <input 
                            type="number" min="1" max="10000"
                            value={maxGames} 
                            onChange={(e) => setMaxGames(Math.max(1, parseInt(e.target.value) || 100))}
                            className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-center outline-none focus:border-indigo-500"
                        />
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-700">
                        <button 
                            onClick={() => setIsHeadless(false)} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${!isHeadless ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Eye size={14}/> 視覺模式
                        </button>
                        <button 
                            onClick={() => setIsHeadless(true)} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${isHeadless ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Zap size={14}/> 極速運算
                        </button>
                    </div>

                    {!isHeadless && (
                        <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                            <span className="text-xs text-slate-500 font-bold">DELAY</span>
                            <input 
                                type="range" min="10" max="1000" step="10" 
                                value={speed} 
                                onChange={(e) => setSpeed(Number(e.target.value))}
                                className="w-24 accent-indigo-500"
                            />
                            <span className="text-xs w-10 text-right">{speed}ms</span>
                        </div>
                    )}

                    <button onClick={() => setIsRunning(!isRunning)} className={`flex items-center gap-2 px-4 py-2 rounded font-bold shadow-lg transition-transform active:scale-95 ${isRunning ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                        {isRunning ? <Pause size={16}/> : <Play size={16}/>} {isRunning ? 'STOP' : 'START'}
                    </button>
                    
                    <button onClick={exportData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded font-bold hover:bg-blue-500 shadow-lg transition-transform active:scale-95">
                        <Download size={16}/> JSON ({dataPointCount})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                
                {/* Stats Panel */}
                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
                    <h3 className="font-bold text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-2"><Activity size={16}/> 訓練數據統計</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950 p-3 rounded border border-