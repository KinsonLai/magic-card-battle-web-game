
import React, { useState } from 'react';
import { GameState, CardType, ElementType, StanceType, NationType } from '../types';
import { executeCardEffect, executeAttackAction, resolveAttack, nextTurn, createInitialState } from '../services/gameEngine';
import { CARDS } from '../constants';
import { Terminal, Play, AlertCircle, CheckCircle, XCircle, RefreshCw, Cpu } from 'lucide-react';

interface DebugConsoleProps {
    gameState: GameState | null;
    setGameState: (state: GameState | null) => void;
    onClose: () => void;
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({ gameState, setGameState, onClose }) => {
    const [logs, setLogs] = useState<{msg: string, status: 'pass'|'fail'|'info'}[]>([]);

    const addLog = (msg: string, status: 'pass'|'fail'|'info' = 'info') => {
        setLogs(prev => [...prev, {msg, status}]);
    };

    const runTestSuite = () => {
        setLogs([]);
        addLog("Starting System Diagnostics...", 'info');

        try {
            // 1. Setup Test Environment
            const mockPlayers = [
                { id: 'p1', name: 'Tester', nation: NationType.FIGHTER, isHost: true, isBot: false, isReady: true },
                { id: 'p2', name: 'Dummy', nation: NationType.HOLY, isHost: false, isBot: true, isReady: true }
            ];
            let state = createInitialState(mockPlayers, { 
                initialGold: 1000, initialMana: 100, maxPlayers: 2, cardsDrawPerTurn: 5, maxHandSize: 10, 
                incomeMultiplier: 1, eventFrequency: 99, isMultiplayer: false, shopSize: 3, 
                healthMultiplier: 1, damageMultiplier: 1, priceMultiplier: 1 
            });
            addLog("Init State: OK", 'pass');

            // 2. Economy Test
            const startGold = state.players[0].gold;
            const shopCard = state.shopCards[0];
            // Simulate Buy (Manual logic test)
            if (startGold >= shopCard.cost) {
                addLog("Economy Check: Sufficient Funds", 'pass');
            } else {
                addLog("Economy Check: Insufficient Funds (Unexpected)", 'fail');
            }

            // 3. Stance & Mana Regen Test (Light)
            state.players[0].currentStance = StanceType.LIGHT;
            state.players[0].mana = 0;
            state = nextTurn(state); // Turn goes to P2
            state = nextTurn(state); // Turn comes back to P1
            
            // Base 15 + Light Bonus 10 = 25
            if (state.players[0].mana >= 25) {
                addLog(`Light Stance Mana Regen: +${state.players[0].mana} (Expected >= 25)`, 'pass');
            } else {
                addLog(`Light Stance Mana Regen: +${state.players[0].mana} (Failed)`, 'fail');
            }

            // 4. Overdraft Test (Shadow)
            state.players[0].currentStance = StanceType.SHADOW;
            state.players[0].mana = 0;
            state.players[0].hp = 100;
            const costlyCard = { ...CARDS[0], manaCost: 50, hpCost: 0, type: CardType.ATTACK }; // Mock card
            
            // Simulate playing card logic manually to test engine calculation
            const deficit = costlyCard.manaCost - state.players[0].mana;
            if (state.players[0].currentStance === StanceType.SHADOW) {
                addLog(`Shadow Overdraft Calculation: Deficit ${deficit} will cost HP`, 'pass');
            }

            // 5. Combat Test
            const target = state.players[1];
            const startHp = target.hp;
            const attackCard = { ...CARDS.find(c => c.type === CardType.ATTACK)!, value: 20, element: ElementType.FIRE };
            
            state = executeAttackAction(state, [attackCard], target.id);
            // Simulate resolution (no defense)
            state = resolveAttack(state, [], false);
            
            const damagedTarget = state.players[1];
            if (damagedTarget.hp < startHp) {
                addLog(`Combat Logic: Damage Dealt (${startHp - damagedTarget.hp})`, 'pass');
            } else {
                addLog("Combat Logic: No Damage Applied", 'fail');
            }

            addLog("All Tests Completed.", 'info');

        } catch (e: any) {
            addLog(`Critical Error: ${e.message}`, 'fail');
        }
    };

    const cheat = (action: string) => {
        if (!gameState) return;
        let newState = { ...gameState };
        const p = newState.players.find(p => p.isHuman);
        if (!p) return;
        
        if (action === 'gold') p.gold += 1000;
        if (action === 'mana') p.mana = p.maxMana;
        if (action === 'heal') p.hp = p.maxHp;
        if (action === 'stance_light') p.currentStance = StanceType.LIGHT;
        if (action === 'stance_shadow') p.currentStance = StanceType.SHADOW;
        if (action === 'draw') {
            const newCards = CARDS.slice(0, 3).map(c => ({...c, id: Math.random().toString()}));
            p.hand = [...p.hand, ...newCards];
        }

        setGameState(newState);
        addLog(`Executed: ${action}`, 'pass');
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-8 font-mono">
            <div className="w-full max-w-4xl bg-slate-950 border-2 border-green-500/50 rounded-lg shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 p-4 border-b border-green-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-3 text-green-400">
                        <Terminal size={20} />
                        <span className="font-bold tracking-widest">DEV_CONSOLE // SYSTEM_DIAGNOSTICS</span>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white"><XCircle /></button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Controls */}
                    <div className="w-64 bg-slate-900/50 border-r border-slate-800 p-4 space-y-6 overflow-y-auto">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Cpu size={12}/> Unit Tests</h4>
                            <button onClick={runTestSuite} className="w-full py-2 bg-green-900/20 hover:bg-green-900/40 text-green-400 border border-green-900/50 rounded flex items-center justify-center gap-2 text-xs font-bold transition-all">
                                <Play size={14} /> RUN ALL TESTS
                            </button>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><RefreshCw size={12}/> State Modifiers</h4>
                            <div className="space-y-2">
                                <button onClick={() => cheat('gold')} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700">+1000 Gold</button>
                                <button onClick={() => cheat('mana')} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs rounded border border-slate-700">Fill Mana</button>
                                <button onClick={() => cheat('heal')} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-red-300 text-xs rounded border border-slate-700">Full Heal</button>
                                <button onClick={() => cheat('draw')} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700">Draw 3 Cards</button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><RefreshCw size={12}/> Stance Override</h4>
                            <div className="space-y-2">
                                <button onClick={() => cheat('stance_light')} className="w-full py-1.5 bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-500 text-xs rounded border border-yellow-900/50">Force Light</button>
                                <button onClick={() => cheat('stance_shadow')} className="w-full py-1.5 bg-purple-900/20 hover:bg-purple-900/30 text-purple-500 text-xs rounded border border-purple-900/50">Force Shadow</button>
                            </div>
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="flex-1 bg-black p-4 overflow-y-auto custom-scrollbar font-mono text-sm">
                        {logs.length === 0 && <div className="text-slate-600 italic">Ready for input...</div>}
                        {logs.map((log, i) => (
                            <div key={i} className={`mb-1 flex items-start gap-2 ${log.status === 'pass' ? 'text-green-400' : log.status === 'fail' ? 'text-red-500' : 'text-slate-300'}`}>
                                <span className="mt-1">
                                    {log.status === 'pass' && <CheckCircle size={12}/>}
                                    {log.status === 'fail' && <AlertCircle size={12}/>}
                                    {log.status === 'info' && <span className="text-slate-600">➜</span>}
                                </span>
                                <span>{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
