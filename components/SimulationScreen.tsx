
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, RoomPlayer, NationType, GameSettings, BattleRecord, Player, Card, SerializedCard, SerializedPlayer } from '../types';
import { createInitialState, DEFAULT_SETTINGS, nextTurn, executeCardEffect, executeAttackAction, buyCard, resolveAttack } from '../services/gameEngine';
import { runMCTS, loadModelWeights, hasModelLoaded } from '../services/aiAnalysis';
import { NATION_CONFIG } from '../constants';
import { Play, Pause, Download, ArrowLeft, Brain, Activity, Terminal, Zap, Eye, EyeOff, Skull, Coins, Repeat, Upload } from 'lucide-react';

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
    const [modelLoaded, setModelLoaded] = useState(false);

    // Data Refs (High performance, no re-render)
    const gameStateRef = useRef<GameState | null>(null);
    const battleRecordsRef = useRef<BattleRecord[]>([]);
    const isRunningRef = useRef(false);
    const isHeadlessRef = useRef(false);
    const speedRef = useRef(500);
    const maxGamesRef = useRef(100);
    const logContainerRef = useRef<HTMLDivElement>(null);
    const currentGameIdRef = useRef<string>(`game_${Date.now()}`);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync Refs
    useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
    useEffect(() => { isHeadlessRef.current = isHeadless; }, [isHeadless]);
    useEffect(() => { speedRef.current = speed; }, [speed]);
    useEffect(() => { maxGamesRef.current = maxGames; }, [maxGames]);

    // Helpers for Serialization
    const serializeCard = (c: Card): SerializedCard => ({
        id: c.id, name: c.name, type: c.type, cost: c.cost, manaCost: c.manaCost, element: c.element, value: c.value
    });

    const serializePlayer = (p: Player): SerializedPlayer => ({
        id: p.id, nation: p.nation, hp: p.hp, maxHp: p.maxHp, mana: p.mana, gold: p.gold, income: p.income, soul: p.soul,
        hand: p.hand.map(serializeCard),
        lands: p.lands.map(l => l.name),
        artifacts: p.artifacts.map(a => a.name),
        elementMark: p.elementMark,
        isDead: p.isDead
    });

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
        currentGameIdRef.current = `game_${Date.now()}_${Math.floor(Math.random()*1000)}`;

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
        setModelLoaded(hasModelLoaded());
    }, []);

    // Auto-scroll logs
    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const content = evt.target?.result as string;
            const success = loadModelWeights(content);
            if (success) {
                setModelLoaded(true);
                addLog("Neural Network Weights Loaded! AI Brain Upgrade Complete.");
            } else {
                addLog("Failed to load weights. Invalid JSON.");
            }
        };
        reader.readAsText(file);
    };

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
                    // Record Rich Data
                    const record: BattleRecord = {
                        gameId: currentGameIdRef.current,
                        turn: currentState.turn,
                        player: actingPlayer.nation,
                        state: {
                            turn: currentState.turn,
                            phase: currentState.turnPhase,
                            event: currentState.currentEvent?.name || null,
                            shop: currentState.shopCards.map(serializeCard),
                            players: currentState.players.map(serializePlayer)
                        },
                        policyTarget: debugInfo.policy, 
                        valueTarget: debugInfo.bestScore,
                        actionTaken: bestAction.type + (bestAction.cardId ? `:${bestAction.cardId}` : '')
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
                    {/* Model Loader */}
                    <div className="flex items-center">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json" />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all border ${modelLoaded ? 'bg-purple-600/20 text-purple-300 border-purple-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-400'}`}
                        >
                            {modelLoaded ? <Brain size={14} className="animate-pulse"/> : <Upload size={14}/>} 
                            {modelLoaded ? 'BRAIN LOADED' : 'LOAD WEIGHTS'}
                        </button>
                    </div>

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
                        <div className="bg-slate-950 p-3 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Games</div>
                            <div className="text-2xl font-mono text-white">{gameCount} <span className="text-xs text-slate-500">/ {maxGames}</span></div>
                            <div className="h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-indigo-500 transition-all" style={{width: `${Math.min(100, (gameCount/maxGames)*100)}%`}}></div>
                            </div>
                        </div>
                        <div className="bg-slate-950 p-3 rounded border border-slate-800">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Data Points</div>
                            <div className="text-2xl font-mono text-blue-400">{dataPointCount}</div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="text-left text-slate-500 border-b border-slate-800">
                                    <th className="pb-2 pl-2">Nation</th>
                                    <th className="pb-2 text-right pr-2">Win %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(NationType).map(n => {
                                    const idMap: Record<string, string> = {
                                        [NationType.FIGHTER]: 'AI_Fighter',
                                        [NationType.HOLY]: 'AI_Holy',
                                        [NationType.COMMERCIAL]: 'AI_Comm',
                                        [NationType.MAGIC]: 'AI_Magic'
                                    };
                                    const id = idMap[n];
                                    const wins = winStats[id] || 0;
                                    const rate = gameCount > 0 ? ((wins / gameCount) * 100).toFixed(1) : '0.0';
                                    const color = NATION_CONFIG[n].color;
                                    
                                    // Calculate bar width
                                    const width = gameCount > 0 ? (wins / gameCount) * 100 : 0;

                                    return (
                                        <tr key={n} className="group hover:bg-slate-800/50">
                                            <td className="py-2 pl-2">
                                                <div className={`font-bold ${color} mb-1`}>{n}</div>
                                                <div className="h-1 bg-slate-800 rounded-full overflow-hidden w-full">
                                                    <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{width: `${width}%`}}></div>
                                                </div>
                                            </td>
                                            <td className="py-2 text-right pr-2 font-mono">
                                                <div className="text-white">{wins}</div>
                                                <div className="text-slate-500">{rate}%</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Visualizer Area */}
                <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex flex-col shadow-2xl">
                    {isHeadless ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4 animate-pulse">
                            <Zap size={64} className="text-emerald-500"/>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-white">極速運算中 (Headless Mode)</h3>
                                <p className="text-sm">畫面渲染已停用以最大化訓練速度</p>
                                <p className="text-xs font-mono mt-2 text-emerald-400">FPS: UNLIMITED</p>
                            </div>
                        </div>
                    ) : displayState ? (
                        <div className="flex-1 p-4 relative">
                            <div className="absolute top-2 right-2 text-xs text-slate-500 font-mono bg-black/50 px-2 py-1 rounded">Turn: {displayState.turn} | Phase: {displayState.turnPhase}</div>
                            
                            <div className="flex flex-wrap gap-4 justify-center mt-12">
                                {displayState.players.map(p => (
                                    <div key={p.id} className={`w-36 p-3 rounded-xl border flex flex-col gap-2 transition-all ${displayState.currentPlayerIndex === displayState.players.indexOf(p) ? 'scale-105 border-yellow-500 shadow-lg shadow-yellow-900/20 bg-slate-900' : 'border-slate-700 bg-slate-900/50 opacity-80'}`}>
                                        <div className="flex justify-between items-center">
                                            <div className={`text-xs font-bold ${NATION_CONFIG[p.nation].color}`}>{p.name}</div>
                                            {p.isDead && <Skull size={14} className="text-red-600"/>}
                                        </div>
                                        
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[9px] text-slate-400">
                                                <span>HP</span> <span className={p.hp < 30 ? 'text-red-400' : 'text-white'}>{p.hp}/{p.maxHp}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-red-500 transition-all duration-300" style={{width: `${Math.max(0, (p.hp/p.maxHp)*100)}%`}}></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 text-[10px] text-slate-400 gap-y-1 bg-black/20 p-2 rounded">
                                            <div className="flex items-center gap-1"><Zap size={10} className="text-blue-400"/> {p.mana}</div>
                                            <div className="flex items-center gap-1"><Coins size={10} className="text-yellow-400"/> {p.gold}</div>
                                            <div className="col-span-2 mt-1 pt-1 border-t border-white/10 flex justify-between">
                                                <span>Soul: <span className={p.soul > 0 ? 'text-yellow-400' : p.soul < 0 ? 'text-purple-400' : 'text-slate-400'}>{p.soul}</span></span>
                                                <span>Hand: {p.hand.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Center Event */}
                            <div className="mt-12 text-center min-h-[80px] flex items-center justify-center">
                                {displayState.lastAction && (
                                    <div className="inline-block bg-slate-900/80 backdrop-blur px-6 py-3 rounded-2xl border border-slate-700 animate-bounce-in shadow-xl">
                                        <div className="text-[10px] text-slate-500 mb-1 font-bold tracking-widest uppercase">Last Action</div>
                                        <div className="text-white font-bold text-sm flex items-center gap-2 justify-center">
                                            {displayState.lastAction.type} 
                                            {displayState.lastAction.totalValue ? <span className="text-yellow-400 font-mono text-lg">{displayState.lastAction.totalValue}</span> : ''}
                                        </div>
                                        {displayState.lastAction.comboName && (
                                            <div className="text-xs text-indigo-300 mt-1 font-bold animate-pulse">{displayState.lastAction.comboName}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
                            <Brain size={48} className="opacity-20"/>
                            <p>Press START to initialize simulation</p>
                        </div>
                    )}
                </div>

                {/* Logs */}
                <div className="lg:col-span-3 bg-black border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-xl">
                    <div className="p-3 bg-slate-900 border-b border-slate-800 font-bold text-xs text-slate-400 flex items-center justify-between">
                        <div className="flex items-center gap-2"><Terminal size={14}/> SYSTEM LOGS</div>
                        {isHeadless && <span className="text-[10px] text-yellow-500 flex items-center gap-1"><EyeOff size={10}/> HIDDEN</span>}
                    </div>
                    <div ref={logContainerRef} className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-1.5 text-slate-300 scroll-smooth">
                        {logs.length === 0 && <span className="text-slate-700 italic">...waiting for logs...</span>}
                        {logs.map((l, i) => (
                            <div key={i} className="border-b border-slate-900/50 pb-0.5 break-words hover:bg-slate-900/30 transition-colors">
                                <span className="text-slate-600 mr-2">[{i+1}]</span>
                                {l}
                            </div>
                        ))}
                        <div className="h-4"></div> {/* Spacer for auto-scroll */}
                    </div>
                </div>

            </div>
        </div>
    );
};
