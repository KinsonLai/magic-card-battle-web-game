import React, { useState, useEffect } from 'react';
import { GameState, NationType, Card, CardType, Language, GameSettings } from './types';
import { createInitialState, nextTurn, executeCardEffect, buyCard, handleBankTransaction } from './services/gameEngine';
import { StartScreen } from './components/StartScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { CardGallery } from './components/CardGallery';
import { Card as CardComponent } from './components/Card';
import { NATION_CONFIG } from './constants';
import { TRANSLATIONS } from './locales';
import { Coins, Heart, Zap, Landmark, Building2, ShoppingBag, Lock, Crown, Swords, TrendingUp, History } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'start' | 'lobby' | 'gallery' | 'game'>('start');
  const [lang, setLang] = useState<Language>('zh-TW'); // Default Chinese
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // UI State for Game
  const [showShop, setShowShop] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<{msg: string, sourceId: string, targetId: string | null} | null>(null);

  const t = TRANSLATIONS[lang];

  // AI Logic
  useEffect(() => {
    if (!gameState || gameState.winnerId || screen !== 'game') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer.isHuman) {
      const delayMap = { 'easy': 2000, 'normal': 1500, 'hard': 1000 };
      const delay = delayMap[gameState.settings.botDifficulty];

      const timer = setTimeout(() => {
        let newState = { ...gameState };
        
        // 1. Shop (Rich AI buys cards)
        if (currentPlayer.gold > 150 && newState.shopCards.some(c => c.cost <= currentPlayer.gold)) {
             const affordable = newState.shopCards.filter(c => c.cost <= currentPlayer.gold);
             if (affordable.length > 0) newState = buyCard(newState, affordable[0]);
        }

        // 2. Play Cards
        const playable = currentPlayer.hand.filter(c => c.manaCost <= currentPlayer.mana);
        let plays = 0;
        let playedTypes: CardType[] = [];

        for (const card of playable) {
            if (plays >= 2) break;
            if (playedTypes.includes(card.type)) continue;

            const enemies = newState.players.filter(p => p.id !== currentPlayer.id && !p.isDead);
            let target = enemies[0];
            if (gameState.settings.botDifficulty === 'hard') {
                target = enemies.sort((a,b) => a.hp - b.hp)[0];
            } else {
                target = enemies[Math.floor(Math.random() * enemies.length)];
            }
            
            newState = executeCardEffect(newState, card, target?.id);
            playedTypes.push(card.type);
            plays++;
        }

        setGameState(nextTurn(newState));
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [gameState, screen]);

  // Animation Trigger
  useEffect(() => {
      if (gameState?.lastAction) {
          const act = gameState.lastAction;
          // @ts-ignore
          const cardName = t.cards[act.cardId]?.name || '卡牌';
          const sourceName = gameState.players.find(p => p.id === act.sourceId)?.name;
          const msg = `${sourceName} 使用了 ${cardName}!`;
          
          setAnimationData({ msg, sourceId: act.sourceId, targetId: act.targetId });
          
          const timer = setTimeout(() => setAnimationData(null), 1500);
          return () => clearTimeout(timer);
      }
  }, [gameState?.lastAction]);


  const handleStartGame = (name: string, nation: NationType, settings: GameSettings) => {
    setGameState(createInitialState(nation, name, settings));
    setScreen('game');
  };

  const handleEndTurn = () => {
    if (!gameState) return;
    setGameState(nextTurn(gameState));
    setSelectedCardId(null);
  };

  const handlePlayCard = (card: Card) => {
     if (!gameState) return;
     
     // Determine if card needs target based on generic effect type or card type
     // Damage and Gold Steal always need targets
     const isTargetEffect = ['damage', 'gold_steal'].includes(card.effectType || '');
     const isMissile = card.type === CardType.MISSILE; 
     
     // Missile without target is random, with target is specific (if supported)
     // Let's enforce targeting for damage/steal effects except if it's a random-only card (like stray_arrow, handled by engine if no target)
     // For simplicity in UI, if it can take a target, we select.
     
     const needsTarget = isTargetEffect && !isMissile; // Missiles can be auto-random, but let's allow targeting for "Guided" logic? 
     // Actually, let's keep it simple: Attack/Magic(Damage)/Contract(Steal) = Target. Missile = Auto Random (no target needed in UI usually, or optional).
     // Updated Logic:
     const explicitTargetTypes = [CardType.ATTACK, CardType.CONTRACT];
     const explicitTargetEffects = ['damage', 'gold_steal'];
     
     // If it's Magic/Missile but has damage effect, we might want target. 
     // But some magic is AOE or Random? Engine handles random if target missing for Missile.
     // Let's require target for Attack and Contract(Steal). 
     // For Magic(Damage), let's require target.
     
     const requiresTarget = (
         (card.type === CardType.ATTACK) || 
         (card.type === CardType.MAGIC && card.effectType === 'damage') ||
         (card.type === CardType.CONTRACT && card.effectType === 'gold_steal') ||
         (card.type === CardType.MISSILE && card.id.includes('guided')) // Special case for guided
     );

     if (requiresTarget) {
         setSelectedCardId(selectedCardId === card.id ? null : card.id);
     } else {
         setGameState(executeCardEffect(gameState, card));
     }
  };

  const handleTargetClick = (targetId: string) => {
      if (!gameState || !selectedCardId) return;
      const card = gameState.players[gameState.currentPlayerIndex].hand.find(c => c.id === selectedCardId);
      if (card) {
          setGameState(executeCardEffect(gameState, card, targetId));
          setSelectedCardId(null);
      }
  };

  // --- RENDER ---

  if (screen === 'start') {
      return <StartScreen onHost={() => setScreen('lobby')} onGallery={() => setScreen('gallery')} lang={lang} setLang={setLang} />;
  }

  if (screen === 'gallery') {
      return <CardGallery lang={lang} onBack={() => setScreen('start')} />;
  }

  if (screen === 'lobby') {
      return <LobbyScreen lang={lang} onStart={handleStartGame} onBack={() => setScreen('start')} />;
  }

  if (!gameState) return null; 

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const humanPlayer = gameState.players.find(p => p.isHuman)!;
  const isHumanTurn = currentPlayer.id === humanPlayer.id;

  return (
    <div className="h-screen w-screen bg-slate-900 text-slate-200 overflow-hidden flex flex-col font-sans">
      
      {/* Top Bar: Opponents */}
      <div className="h-28 bg-slate-950 border-b border-slate-800 flex items-center justify-center gap-2 px-4 overflow-x-auto">
        {gameState.players.filter(p => !p.isHuman).map(bot => (
            <div 
                key={bot.id}
                onClick={() => selectedCardId && isHumanTurn && handleTargetClick(bot.id)}
                className={`
                    relative w-48 lg:w-64 h-24 rounded-lg border-2 p-2 transition-all shrink-0
                    ${bot.isDead ? 'opacity-40 grayscale border-slate-800' : 
                      selectedCardId && isHumanTurn ? 'border-red-500 cursor-crosshair bg-red-900/10 hover:bg-red-900/30' : 
                      gameState.currentPlayerIndex === gameState.players.indexOf(bot) ? 'border-yellow-400 bg-slate-800 scale-105 shadow-yellow-500/20 shadow-lg' : 'border-slate-700 bg-slate-900'}
                    ${animationData?.targetId === bot.id ? 'animate-pulse ring-4 ring-red-500' : ''}
                `}
            >
                <div className="flex justify-between items-start">
                    <span className={`font-bold text-sm truncate ${NATION_CONFIG[bot.nation].color}`}>
                        {/* @ts-ignore */}
                        {t.nations[bot.nation].name}
                    </span>
                    <span className="text-xs text-slate-500">{bot.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                    <div className="flex items-center gap-1 text-red-400"><Heart size={12}/> {bot.hp}</div>
                    <div className="flex items-center gap-1 text-blue-400"><Zap size={12}/> {bot.mana}</div>
                    <div className="flex items-center gap-1 text-yellow-400"><Coins size={12}/> {bot.gold}</div>
                    <div className="flex items-center gap-1 text-emerald-400"><Building2 size={12}/> {bot.lands.length}</div>
                </div>
                {/* Visual Projectile Impact */}
                {animationData?.targetId === bot.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-4xl animate-ping">💥</div>
                    </div>
                )}
                {bot.isDead && <div className="absolute inset-0 flex items-center justify-center font-bold text-red-600 bg-black/50 rounded-lg cinzel">{t.defeated}</div>}
            </div>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Game Log */}
        <div className="hidden md:block w-64 bg-slate-900/90 border-r border-slate-800 p-4 overflow-y-auto scrollbar-hide text-sm space-y-2">
            <h3 className="text-slate-500 font-bold uppercase text-xs flex items-center gap-2 mb-4">
                <History size={14}/> {t.logs}
            </h3>
            {gameState.gameLog.map(log => (
                <div key={log.id} className={`p-2 rounded border-l-2 text-xs ${
                    log.type === 'combat' ? 'border-red-500 bg-red-900/10' :
                    log.type === 'event' ? 'border-purple-500 bg-purple-900/10 font-bold text-purple-200' :
                    log.type === 'economy' ? 'border-yellow-500 bg-yellow-900/10' :
                    'border-slate-500 bg-slate-800/50'
                }`}>
                    {log.message}
                </div>
            ))}
        </div>

        {/* Center: Battlefield */}
        <div className="flex-1 relative bg-[url('https://images.unsplash.com/photo-1634978836611-38290e2b95b8?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px]"></div>
            
            {/* Animation Overlay */}
            {animationData && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 bg-black/60 px-6 py-3 rounded-full border border-white/20 animate-bounce">
                    <div className="flex items-center gap-3 text-xl font-bold text-white shadow-black drop-shadow-md">
                        <Swords className="text-red-500"/>
                        {animationData.msg}
                    </div>
                </div>
            )}

            {/* Event Overlay */}
            {gameState.eventMessage && (
                <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-8 py-4 rounded-xl shadow-2xl animate-bounce">
                    <h2 className="text-2xl font-bold cinzel flex items-center gap-2"><Zap /> EVENT</h2>
                    <p>{gameState.eventMessage}</p>
                </div>
            )}

            {/* Game Over */}
            {gameState.winnerId && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
                     <div className="text-center space-y-6 animate-fade-in-up">
                         <Crown size={64} className="mx-auto text-yellow-400 mb-4" />
                         <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-600 cinzel">
                             {gameState.players.find(p => p.id === gameState.winnerId)?.name} {t.wins}
                         </h1>
                         <button onClick={() => setScreen('start')} className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold">{t.playAgain}</button>
                     </div>
                </div>
            )}

            {/* Human Lands */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                 <div className="text-center w-full max-w-2xl">
                    <h3 className="text-xs uppercase tracking-widest text-slate-400 mb-2">{t.lands}</h3>
                    <div className="flex justify-center flex-wrap gap-2 min-h-[80px] border-2 border-dashed border-slate-700 rounded-xl p-2 bg-slate-900/60">
                        {humanPlayer.lands.length === 0 && <span className="text-slate-500 my-auto text-xs">{t.buildHere}</span>}
                        {humanPlayer.lands.map((card, i) => (
                            <CardComponent key={i} card={card} compact showCost={false} lang={lang} />
                        ))}
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Bottom: Player Dashboard */}
      <div className="h-64 bg-slate-950 border-t border-slate-800 grid grid-cols-[200px_1fr_140px] md:grid-cols-[280px_1fr_200px] gap-2 md:gap-4 p-2 md:p-4">
         {/* Stats Panel */}
         <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 flex flex-col justify-between text-xs md:text-sm">
            <div className="flex items-center gap-2 mb-1">
                 <div className={`p-1.5 rounded ${NATION_CONFIG[humanPlayer.nation].bgColor}`}>
                    <Crown size={16} className={NATION_CONFIG[humanPlayer.nation].color} />
                 </div>
                 <div className="overflow-hidden">
                     <div className="font-bold truncate">{humanPlayer.name}</div>
                     {/* @ts-ignore */}
                     <div className="text-[10px] text-slate-500">{t.nations[humanPlayer.nation].name}</div>
                 </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1 text-red-400"><Heart size={14}/> {humanPlayer.hp}/{humanPlayer.maxHp}</div>
                <div className="flex items-center gap-1 text-blue-400"><Zap size={14}/> {humanPlayer.mana}/{humanPlayer.maxMana}</div>
                <div className="flex items-center gap-1 text-yellow-400"><Coins size={14}/> {humanPlayer.gold}</div>
                <div className="flex items-center gap-1 text-emerald-400"><TrendingUp size={14}/> +{humanPlayer.income}</div>
                <div className="col-span-2 flex items-center gap-1 text-slate-400 border-t border-slate-800 pt-1 mt-1">
                    <Landmark size={14} /> {humanPlayer.bankDeposit} <span className="text-[10px] ml-auto text-emerald-500">+10%</span>
                </div>
            </div>
         </div>

         {/* Hand */}
         <div className="relative bg-slate-900/50 rounded-xl border border-slate-800 p-2 flex items-center justify-start gap-2 overflow-x-auto">
             {humanPlayer.isDead ? (
                 <div className="w-full text-center text-red-500 font-bold cinzel text-xl my-auto">{t.defeated}</div>
             ) : (
                humanPlayer.hand.map((card) => {
                    const isTypePlayed = gameState.playedCardTypesThisTurn.includes(card.type);
                    const canAffordMana = humanPlayer.mana >= card.manaCost;
                    const limitReached = gameState.playedCardTypesThisTurn.length >= 2;
                    const isPlayable = isHumanTurn && !isTypePlayed && canAffordMana && !limitReached;
                    
                    return (
                        <div key={card.id} className={`shrink-0 transform transition-all ${selectedCardId === card.id ? '-translate-y-4 z-10' : 'hover:-translate-y-2'}`}>
                            <CardComponent 
                                card={card} 
                                lang={lang}
                                onClick={() => isPlayable && handlePlayCard(card)}
                                disabled={!isPlayable}
                            />
                            {selectedCardId === card.id && (
                                <div className="absolute -top-8 left-0 right-0 text-center text-[10px] bg-black text-white px-1 py-1 rounded animate-bounce">
                                    {t.selectTarget}
                                </div>
                            )}
                        </div>
                    );
                })
             )}
         </div>

         {/* Controls */}
         <div className="flex flex-col gap-2">
            <button 
                onClick={() => handleEndTurn()}
                disabled={!isHumanTurn}
                className={`flex-1 rounded-xl font-bold text-lg md:text-xl flex items-center justify-center gap-2 transition-all ${!isHumanTurn ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'}`}
            >
                {isHumanTurn ? <>{t.endTurn}</> : <><Lock size={16}/> {t.wait}</>}
            </button>
            <div className="grid grid-cols-2 gap-2 h-1/2">
                <button 
                    onClick={() => setShowShop(true)}
                    disabled={!isHumanTurn}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex flex-col items-center justify-center text-xs font-bold"
                >
                    <ShoppingBag size={20} className="mb-1"/> {t.shop}
                </button>
                <button 
                     onClick={() => setShowBank(true)}
                     disabled={!isHumanTurn}
                     className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex flex-col items-center justify-center text-xs font-bold"
                >
                    <Landmark size={20} className="mb-1"/> {t.bank}
                </button>
            </div>
         </div>
      </div>

      {/* Modals */}
      {showShop && isHumanTurn && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="text-indigo-400"/> {t.shop}</h2>
                      <div className="text-yellow-400 flex items-center gap-2 font-bold"><Coins/> {humanPlayer.gold}</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                      {gameState.shopCards.map((card, i) => (
                          <div key={i} className="flex flex-col gap-2">
                              <CardComponent card={card} showCost={false} lang={lang} />
                              <button 
                                onClick={() => {
                                    setGameState(buyCard(gameState!, card));
                                }}
                                disabled={humanPlayer.gold < card.cost || humanPlayer.hand.length >= 12}
                                className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 rounded font-bold text-xs flex items-center justify-center gap-1"
                              >
                                  {card.cost} <Coins size={12}/> {t.buy}
                              </button>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setShowShop(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg">{t.close}</button>
              </div>
          </div>
      )}

      {showBank && isHumanTurn && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-6">
                 <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold flex items-center gap-2"><Landmark className="text-emerald-400"/> {t.bank}</h2>
                      <button onClick={() => setShowBank(false)} className="text-slate-400 hover:text-white">✕</button>
                 </div>
                 
                 <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                     <div className="flex justify-between text-sm">
                         <span>Cash:</span>
                         <span className="text-yellow-400 font-bold">{humanPlayer.gold}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                         <span>Deposit:</span>
                         <span className="text-emerald-400 font-bold">{humanPlayer.bankDeposit}</span>
                     </div>
                     <div className="text-xs text-center text-slate-500 pt-2">{t.interestRate}</div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                         <h4 className="font-bold text-center text-emerald-400">{t.deposit}</h4>
                         <button onClick={() => setGameState(handleBankTransaction(gameState!, 10))} disabled={humanPlayer.gold < 10} className="w-full py-2 bg-emerald-900/50 border border-emerald-700 hover:bg-emerald-900 rounded text-sm">+10</button>
                         <button onClick={() => setGameState(handleBankTransaction(gameState!, 50))} disabled={humanPlayer.gold < 50} className="w-full py-2 bg-emerald-900/50 border border-emerald-700 hover:bg-emerald-900 rounded text-sm">+50</button>
                         <button onClick={() => setGameState(handleBankTransaction(gameState!, humanPlayer.gold))} disabled={humanPlayer.gold <= 0} className="w-full py-2 bg-emerald-900/50 border border-emerald-700 hover:bg-emerald-900 rounded text-sm">{t.all}</button>
                     </div>
                     <div className="space-y-2">
                         <h4 className="font-bold text-center text-yellow-400">{t.withdraw}</h4>
                         <button onClick={() => setGameState(handleBankTransaction(gameState!, -10))} disabled={humanPlayer.bankDeposit < 10} className="w-full py-2 bg-yellow-900/50 border border-yellow-700 hover:bg-yellow-900 rounded text-sm">-10</button>
                         <button onClick={() => setGameState(handleBankTransaction(gameState!, -50))} disabled={humanPlayer.bankDeposit < 50} className="w-full py-2 bg-yellow-900/50 border border-yellow-700 hover:bg-yellow-900 rounded text-sm">-50</button>
                         <button onClick={() => setGameState(handleBankTransaction(gameState!, -humanPlayer.bankDeposit))} disabled={humanPlayer.bankDeposit <= 0} className="w-full py-2 bg-yellow-900/50 border border-yellow-700 hover:bg-yellow-900 rounded text-sm">{t.all}</button>
                     </div>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};

export default App;