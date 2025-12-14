
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Card, CardType, Language, GameSettings, RoomPlayer, MAX_LAND_SIZE, ChatMessage, MAX_ARTIFACT_SIZE, ElementType, PLAYS_PER_TURN, AlignmentType, StanceType } from './types';
import { createInitialState, nextTurn, executeCardEffect, executeAttackAction, resolveAttack, buyCard, sellCard } from './services/gameEngine';
import { StartScreen } from './components/StartScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { CardGallery } from './components/CardGallery';
import { GameGuide } from './components/GameGuide';
import { Card as CardComponent } from './components/Card';
import { DebugConsole } from './components/DebugConsole';
import { SimulationScreen } from './components/SimulationScreen';
import { NATION_CONFIG, ELEMENT_CONFIG, ALIGNMENT_CONFIG, getComplexElementName } from './constants';
import { TRANSLATIONS } from './locales';
import * as Icons from 'lucide-react';
import { Coins, Heart, Zap, ShoppingBag, Crown, History, ShieldAlert, Crosshair, Skull, Sword, Shield, MessageSquare, Send, XCircle, Target, Hexagon, HelpCircle, Anchor, Power, BookOpen, Factory, Info, BellRing, User, LayoutGrid, List, TrendingUp, Sun, Moon, X, AlertTriangle, Terminal, Menu, Scale, Flame, Droplets, Mountain, Wind, Gem, Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'start' | 'lobby' | 'gallery' | 'guide' | 'game' | 'simulation'>('start');
  const [previousScreen, setPreviousScreen] = useState<'start' | 'game'>('start'); 
  const [lang, setLang] = useState<Language>('zh-TW'); 
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // UI State
  const [showShop, setShowShop] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<'log'|'chat'>('log');
  const [chatInput, setChatInput] = useState('');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<{type: 'attack'|'defense'|'repel'|'normal', value: number, msg: string, sourceName?: string, targetName?: string, cardName?: string, comboName?: string} | null>(null);
  const [hoveredCard, setHoveredCard] = useState<{ card: Card, x: number, y: number } | null>(null);
  const [topNotification, setTopNotification] = useState<{message: string, type: 'event'|'artifact'|'info'} | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  // --- Helpers ---
  const getPreviewStats = () => {
      if (!gameState || selectedCardIds.length === 0) return null;
      const humanPlayer = gameState.players.find(p => p.isHuman);
      if (!humanPlayer) return null;
      const cards = humanPlayer.hand.filter(c => selectedCardIds.includes(c.id));
      if (cards.length === 0) return null;

      let damage = 0;
      let cost = 0;
      let hpCost = 0;
      let element = ElementType.NEUTRAL;
      let alignment: AlignmentType | undefined = undefined;
      let comboName = undefined;
      let reactionBonusText = '';

      const isMagic = cards.some(c => c.type === CardType.MAGIC_ATTACK);
      const isPhysical = cards.some(c => c.type === CardType.ATTACK);
      const runes = cards.filter(c => c.type === CardType.RUNE);
      const weapon = cards.find(c => c.type === CardType.ATTACK);

      const elements: ElementType[] = [];

      // Calculate Basics
      cards.forEach(c => {
          cost += c.manaCost;
          hpCost += (c.hpCost || 0);
          if (c.element && c.element !== ElementType.NEUTRAL) elements.push(c.element);
      });

      // Calculate Damage Preview based on Stack Type
      if (isMagic) {
          // Magic Stack: Sum of card values
          damage = cards.reduce((sum, c) => sum + (c.value || 0), 0);
      } else if (weapon) {
          // Physical Stack: Weapon Base + Weapon Bonus (based on Soul) + Rune Values
          damage = (weapon.value || 0);
          
          if (humanPlayer.soul > 0 && weapon.holyBonus) damage += weapon.holyBonus;
          else if (humanPlayer.soul < 0 && weapon.evilBonus) damage += weapon.evilBonus;

          damage += runes.reduce((sum, r) => sum + (r.value || 0), 0);
      }

      if (elements.length > 0) {
          element = elements[0]; 
      }
      
      // Calculate Potential Reaction if Target Selected
      if ((isMagic || isPhysical) && targetId) {
          const target = gameState.players.find(p => p.id === targetId);
          if (target && target.elementMark && element !== ElementType.NEUTRAL && element !== target.elementMark) {
              const reaction = getComplexElementName(element, target.elementMark);
              if (reaction) {
                  comboName = reaction;
                  if (reaction.includes("擴散")) reactionBonusText = "流血 + 破壞";
                  if (reaction.includes("泥沼")) reactionBonusText = "緩速 (行動力-1)";
                  if (reaction.includes("湮滅")) reactionBonusText = "傷害 x1.5 (反噬)";
                  if (reaction.includes("過載")) reactionBonusText = "傷害 x1.25 (治療)";
              }
          }
      }
      
      // Apply Multipliers
      if (isMagic || isPhysical) {
          if (gameState.currentEvent?.globalModifier?.damageMultiplier) damage = Math.floor(damage * gameState.currentEvent.globalModifier.damageMultiplier);
          damage = Math.floor(damage * gameState.settings.damageMultiplier);
          damage += humanPlayer.damageBonus;
      }

      const isDefensePhase = gameState.turnPhase === 'DEFENSE';

      return { damage, defense: isDefensePhase ? damage : 0, cost, hpCost, element, alignment, comboName, reactionBonusText, isAttack: isMagic || isPhysical, isDefensePhase };
  };

  const preview = getPreviewStats();

  // --- Effects ---
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameState?.gameLog]);
  useEffect(() => { if (activeTab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameState?.chat, activeTab]);

  useEffect(() => {
      if (gameState?.topNotification) {
          setTopNotification(gameState.topNotification);
          const timer = setTimeout(() => setTopNotification(null), 5000);
          return () => clearTimeout(timer);
      }
  }, [gameState?.topNotification]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === '`' || e.key === '~') {
              setShowDebug(prev => !prev);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (hoveredCard) {
              setHoveredCard(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
          }
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [hoveredCard]);

  // AI & Game Loop
  useEffect(() => {
    if (!gameState || gameState.winnerId || screen !== 'game' || gameState.isDisconnected) return;

    if (gameState.turnPhase === 'ACTION') {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        if (!currentPlayer.isHuman) {
          const delay = 1500;
          const timer = setTimeout(() => {
            let newState = { ...gameState };
            if (!currentPlayer.hasPurchasedInShop && currentPlayer.gold > 150) {
                const available = newState.shopCards.filter(c => !c.purchasedByPlayerIds?.includes(currentPlayer.id));
                const affordable = available.filter(c => c.cost <= currentPlayer.gold);
                if (affordable.length > 0) newState = buyCard(newState, affordable[0]);
            }
            if (currentPlayer.playsUsed < currentPlayer.maxPlays) {
                const playable = currentPlayer.hand.filter(c => c.manaCost <= currentPlayer.mana && (!c.hpCost || c.hpCost < currentPlayer.hp));
                if (playable.length > 0) {
                     const card = playable[Math.floor(Math.random() * playable.length)];
                     const enemies = newState.players.filter(p => p.id !== currentPlayer.id && !p.isDead);
                     let target = enemies[Math.floor(Math.random() * enemies.length)];
                     if (card.type === CardType.ATTACK || card.type === CardType.MAGIC_ATTACK) {
                          if (target) newState = executeAttackAction(newState, [card], target.id);
                     } else {
                         if (['heal', 'mana', 'full_restore_hp', 'buff_damage'].includes(card.effectType || '') || card.type === CardType.HEAL || card.type === CardType.ARTIFACT) {
                             newState = executeCardEffect(newState, card, currentPlayer.id);
                         } else if (card.type === CardType.RITUAL) {
                             newState = executeCardEffect(newState, card); // Global
                         } else {
                             newState = executeCardEffect(newState, card, target?.id);
                         }
                     }
                } else {
                     setGameState(nextTurn(newState));
                }
            } else {
                 setGameState(nextTurn(newState));
            }
            if (newState.turnPhase === 'ACTION' && newState !== gameState) {
                 setGameState(nextTurn(newState));
            } else {
                 setGameState(newState);
            }
          }, delay);
          return () => clearTimeout(timer);
        }
    }

    if (gameState.turnPhase === 'DEFENSE' && gameState.pendingAttack) {
        const targetPlayer = gameState.players.find(p => p.id === gameState.pendingAttack!.targetId);
        if (targetPlayer && !targetPlayer.isHuman) {
             const delay = 1000;
             const timer = setTimeout(() => {
                 // AI now only tries to REPEL with matching attack type
                 const incomingType = gameState.pendingAttack!.attackType;
                 const repelCards = targetPlayer.hand.filter(c => c.type === incomingType);
                 
                 repelCards.sort((a,b) => (b.value || 0) - (a.value || 0));
                 const cardsToUse = repelCards.slice(0, 2);
                 setGameState(resolveAttack(gameState, cardsToUse, false));
             }, delay);
             return () => clearTimeout(timer);
        }
    }
  }, [gameState, screen]);

  // Action Animation
  useEffect(() => {
      if (gameState?.lastAction) {
          const act = gameState.lastAction;
          const sourceName = gameState.players.find(p => p.id === act.sourceId)?.name;
          const targetName = gameState.players.find(p => p.id === act.targetId)?.name;
          
          let cardName = 'Unknown Card';
          const played = act.cardsPlayed?.[0];
          
          if (played) {
              if (act.type === 'REPEL') {
                  // @ts-ignore
                  const elemName = ELEMENT_CONFIG[played.element || ElementType.NEUTRAL].name;
                  cardName = `${elemName} 反擊`;
              } else {
                  cardName = played.name;
              }
          }

          let type: 'attack'|'defense'|'repel'|'normal' = 'normal';
          let msg = '';
          let value = 0;
          let comboName = act.comboName;

          if (act.type === CardType.ATTACK || act.type === CardType.MAGIC_ATTACK) {
              type = 'attack';
              msg = act.cardsPlayed ? act.cardsPlayed.map(c => c.name).join(' + ') : t.attackExcl;
              value = act.totalValue || 0;
          } else if (act.type === 'REPEL') {
              type = 'repel';
              msg = '反擊！';
              value = act.totalValue || 0;
          } else {
              msg = `${t.cardUsed} ${cardName}`;
          }
          setAnimationData({ type, value, msg, sourceName, targetName, cardName, comboName });
          const timer = setTimeout(() => setAnimationData(null), 2500);
          return () => clearTimeout(timer);
      }
  }, [gameState?.lastAction]);

  // --- Handlers ---
  const handleStartGame = (players: RoomPlayer[], settings: GameSettings) => {
    setGameState(createInitialState(players, settings));
    setScreen('game');
  };
  
  const handleEndTurn = () => {
    if (!gameState) return;
    setGameState(nextTurn(gameState));
    setSelectedCardIds([]);
    setTargetId(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !gameState) return;
      const player = gameState.players.find(p => p.isHuman);
      const msg: ChatMessage = {
          id: Date.now().toString(),
          sender: player?.name || 'Unknown',
          text: chatInput
      };
      setGameState({ ...gameState, chat: [...gameState.chat, msg] });
      setChatInput('');
  };

  const toggleSelectCard = (card: Card) => {
      const isDefensePhase = gameState?.turnPhase === 'DEFENSE';
      
      // Defense Phase: Strict Matching Logic
      if (isDefensePhase) {
          const incomingType = gameState?.pendingAttack?.attackType;
          if (incomingType) {
              // Physical Attack requires Physical OR Rune
              if (incomingType === CardType.ATTACK) {
                  if (card.type !== CardType.ATTACK && card.type !== CardType.RUNE) return;
              } 
              // Magic Attack requires Magic (no runes)
              else if (incomingType === CardType.MAGIC_ATTACK) {
                  if (card.type !== CardType.MAGIC_ATTACK) return;
              }
          }
      }
      
      if (selectedCardIds.includes(card.id)) {
          setSelectedCardIds(prev => prev.filter(id => id !== card.id));
      } else {
          // --- Stacking Rules Implementation ---
          const humanPlayer = gameState!.players.find(p => p.isHuman)!;
          const currentSelected = humanPlayer.hand.filter(c => selectedCardIds.includes(c.id));
          
          let canSelect = false;

          if (currentSelected.length === 0) {
              // First card selection
              if (card.type === CardType.RUNE) {
                  alert(t.cantUseAlone); // Warn but maybe don't select? Or select and wait for weapon.
                  // Allow selecting rune first, but execution will fail if no weapon
                  canSelect = true; 
              } else {
                  canSelect = true;
              }
          } else {
              const hasWeapon = currentSelected.some(c => c.type === CardType.ATTACK);
              const hasMagic = currentSelected.some(c => c.type === CardType.MAGIC_ATTACK);
              const runes = currentSelected.filter(c => c.type === CardType.RUNE);
              
              // 1. Magic Stacking: Only same element Magic
              if (hasMagic) {
                  if (card.type === CardType.MAGIC_ATTACK && card.element === currentSelected[0].element) {
                      canSelect = true;
                  }
              }
              // 2. Physical Stacking: Weapon + Runes
              else {
                  if (card.type === CardType.MAGIC_ATTACK) {
                      // Cannot mix Magic with Physical/Runes
                      canSelect = false;
                  } else if (card.type === CardType.ATTACK) {
                      // Already has weapon?
                      if (hasWeapon) canSelect = false; // Only 1 weapon allowed
                      else canSelect = true; // Adding weapon to existing runes
                  } else if (card.type === CardType.RUNE) {
                      // Adding Rune
                      // Check Element Constraint: Must match existing elemental runes (if any)
                      const existingEleRune = runes.find(r => r.element !== ElementType.NEUTRAL);
                      if (existingEleRune && card.element !== ElementType.NEUTRAL && card.element !== existingEleRune.element) {
                          canSelect = false;
                      } 
                      // Check Alignment Constraint: Must match existing alignment runes (if any)
                      else if (runes.length > 0) {
                          const existingAlignRune = runes.find(r => r.alignment !== undefined);
                          if (existingAlignRune && card.alignment && card.alignment !== existingAlignRune.alignment) {
                              canSelect = false;
                          } else {
                              canSelect = true;
                          }
                      } else {
                          canSelect = true;
                      }
                  }
              }
          }

          if (canSelect) {
              setSelectedCardIds(prev => [...prev, card.id]);
          }
      }
  };

  const handleExecutePlay = () => {
      if (!gameState || selectedCardIds.length === 0) return;
      const humanPlayer = gameState.players.find(p => p.isHuman)!;
      const selectedCards = humanPlayer.hand.filter(c => selectedCardIds.includes(c.id));
      if (selectedCards.length === 0) return;

      const types = selectedCards.map(c => c.type);
      const hasAttack = types.includes(CardType.ATTACK);
      const hasMagic = types.includes(CardType.MAGIC_ATTACK);
      const isRuneOnly = selectedCards.every(c => c.type === CardType.RUNE);

      if (gameState.turnPhase === 'DEFENSE') {
           if (isRuneOnly) {
              alert(t.cantUseAlone);
              return;
           }
           if (hasAttack || hasMagic || (types.includes(CardType.RUNE) && hasAttack)) {
             setGameState(resolveAttack(gameState, selectedCards, true));
             setSelectedCardIds([]);
             return;
           }
          return;
      }

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      if (hasAttack || hasMagic) {
          // Attack execution
          if (!targetId) {
             alert(t.selectTargetHint);
             return;
          }
          setGameState(executeAttackAction(gameState, selectedCards, targetId));
      } else if (isRuneOnly) {
          alert(t.cantUseAlone);
          return;
      } else if (['heal', 'mana', 'full_restore_hp', 'buff_damage', 'equip_artifact'].includes(selectedCards[0].effectType || '') || selectedCards[0].type === CardType.HEAL || selectedCards[0].type === CardType.ARTIFACT) {
          if (selectedCards.length > 1) { alert(t.notStackable); return; }
          setGameState(executeCardEffect(gameState, selectedCards[0], currentPlayer.id));
      } else if (selectedCards[0].type === CardType.RITUAL) {
          setGameState(executeCardEffect(gameState, selectedCards[0]));
      } else {
          if (selectedCards.length > 1) { alert(t.notStackable); return; }
          setGameState(executeCardEffect(gameState, selectedCards[0], targetId || undefined));
      }
      setSelectedCardIds([]);
      setTargetId(null);
  };

  const handleSell = () => {
      if (!gameState || selectedCardIds.length !== 1) return;
      const humanPlayer = gameState.players.find(p => p.isHuman)!;
      const card = humanPlayer.hand.find(c => c.id === selectedCardIds[0]);
      if (card) {
          setGameState(sellCard(gameState, card));
          setSelectedCardIds([]);
      }
  };

  const handleBuy = (card: Card) => {
      if (!gameState) return;
      setGameState(buyCard(gameState, card));
  };

  const handleSkipDefense = () => {
      if (!gameState) return;
      setGameState(resolveAttack(gameState, [], false));
  };

  const handleLeaveGame = () => {
      setShowQuitModal(true);
  };

  const confirmLeaveGame = () => {
      setGameState(null); 
      setScreen('start');
      setShowQuitModal(false);
  };

  const handleCardMouseEnter = (card: Card, e: React.MouseEvent) => {
      setHoveredCard({ card, x: e.clientX, y: e.clientY });
  };
  
  const handleCardMouseLeave = () => {
      setHoveredCard(null);
  };

  // --- Render Sub-Components ---

  if (screen === 'start') {
      return (
        <div className="relative">
            <StartScreen 
                onHost={() => setScreen('lobby')} 
                onGallery={() => setScreen('gallery')} 
                onGuide={() => { setPreviousScreen('start'); setScreen('guide'); }} 
                onSim={() => setScreen('simulation')}
                lang={lang} 
                setLang={setLang} 
            />
        </div>
      );
  }

  if (screen === 'gallery') return <CardGallery lang={lang} onBack={() => setScreen('start')} />;
  if (screen === 'guide') return <GameGuide onBack={() => setScreen(previousScreen)} />;
  if (screen === 'simulation') return <SimulationScreen onBack={() => setScreen('start')} />;
  if (screen === 'lobby') return <LobbyScreen lang={lang} onStart={handleStartGame} onBack={() => setScreen('start')} />;
  if (!gameState) return null; 

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const humanPlayer = gameState.players.find(p => p.isHuman)!;
  const isHumanTurn = currentPlayer.id === humanPlayer.id && gameState.turnPhase === 'ACTION';
  const isDefensePhase = gameState.turnPhase === 'DEFENSE';
  const amIBeingAttacked = isDefensePhase && gameState.pendingAttack?.targetId === humanPlayer.id;
  const canPlay = selectedCardIds.length > 0;
  const selectedCards = humanPlayer.hand.filter(c => selectedCardIds.includes(c.id));
  const totalCost = selectedCards.reduce((sum, c) => sum + c.manaCost, 0);
  const totalHpCost = selectedCards.reduce((sum, c) => sum + (c.hpCost || 0), 0) + (preview?.hpCost || 0);
  const isRuneOnly = selectedCards.length > 0 && selectedCards.every(c => c.type === CardType.RUNE);
  
  const canAffordMana = humanPlayer.mana >= totalCost;
  const canAffordHp = humanPlayer.hp > totalHpCost;
  const canAfford = canAffordMana && canAffordHp;

  // Calculate incomes
  const landIncome = humanPlayer.lands.reduce((sum, l) => sum + (l.value || 0), 0) * gameState.settings.incomeMultiplier;
  let totalIncome = humanPlayer.income + landIncome;
  if (gameState.currentEvent?.globalModifier?.incomeMultiplier !== undefined) totalIncome *= gameState.currentEvent.globalModifier.incomeMultiplier;
  
  // @ts-ignore
  const EventIcon = gameState.currentEvent ? Icons[gameState.currentEvent.icon] || Icons.Zap : Icons.Zap;

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 font-sans text-slate-200 selection:bg-indigo-500/30 overflow-hidden flex flex-col lg:grid lg:grid-cols-[280px_1fr]">
      
      {/* Debug Console Overlay */}
      {showDebug && <DebugConsole gameState={gameState} setGameState={setGameState} onClose={() => setShowDebug(false)} />}

      {/* 1. SIDEBAR (Log/Chat) - Desktop Fixed, Mobile Drawer */}
      <div className={`
          fixed inset-0 z-50 bg-black/80 lg:hidden transition-opacity duration-300 
          ${showSidebar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setShowSidebar(false)}></div>

      <div className={`
          fixed inset-y-0 left-0 z-[60] w-[280px] bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-10 h-full
          ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
      `}>
            <div className="flex border-b border-slate-800 shrink-0">
                <button onClick={() => setActiveTab('log')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'log' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}><History size={14} className="inline mr-2"/> {t.logs}</button>
                <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}><MessageSquare size={14} className="inline mr-2"/> Chat</button>
            </div>
            {activeTab === 'log' ? (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide min-h-0">
                    {gameState.gameLog.map(log => (
                        <div key={log.id} className={`p-2.5 rounded-lg text-xs leading-relaxed border border-slate-800 ${log.type === 'combat' ? 'bg-red-950/20 text-red-200 border-red-900/30' : 'bg-slate-800/30 text-slate-400'}`}>
                            <div className="mb-1 opacity-40 text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
                            {log.message}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">{gameState.chat.map(msg => <div key={msg.id} className="text-xs break-words"><span className="font-bold text-indigo-400">{msg.sender}:</span> <span className="text-slate-300">{msg.text}</span></div>)}<div ref={chatEndRef} /></div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2"><input value={chatInput} onChange={e => setChatInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs outline-none text-slate-200 focus:border-slate-600" placeholder={t.chatPlaceholder}/><button type="submit" className="bg-indigo-600 p-1.5 rounded text-white hover:bg-indigo-500"><Send size={14}/></button></form>
                </div>
            )}
      </div>

      {/* 2. MAIN AREA: Game Board */}
      <div className="flex-1 h-full flex flex-col relative bg-slate-950 overflow-hidden">
          
          {/* Top Status Bar */}
          <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50 shrink-0">
              <div className="flex items-center gap-4">
                  <button onClick={() => setShowSidebar(true)} className="lg:hidden p-2 text-slate-400 hover:text-white"><Menu size={20}/></button>
                  <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Turn</span>
                      <span className="font-mono font-bold text-white text-lg">{gameState.turn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm truncate max-w-[80px] sm:max-w-none ${currentPlayer.id === humanPlayer.id ? 'text-green-400' : 'text-slate-300'}`}>
                              {currentPlayer.name}
                          </span>
                      </div>
                  </div>
              </div>
              
              {gameState.currentEvent && (
                  <div className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-fade-in ${gameState.currentEvent.type === 'DISASTER' ? 'bg-red-900/80 text-red-100 border border-red-700' : 'bg-yellow-900/80 text-yellow-100 border border-yellow-700'}`}>
                      <EventIcon size={16} /> {gameState.currentEvent.name}
                  </div>
              )}

              <div className="flex items-center gap-2">
                  <button onClick={() => setShowDebug(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-green-400 transition-colors" title="Debug Console (~)"><Terminal size={16}/></button>
                  <button onClick={() => setShowGuideModal(true)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors" title="指南"><BookOpen size={20}/></button>
                  <div className="h-6 w-px bg-slate-700 mx-2 hidden sm:block"></div>
                  <button onClick={handleLeaveGame} className="p-2 bg-red-900/10 hover:bg-red-900/40 rounded-lg text-red-400 hover:text-red-300 transition-colors border border-red-900/20" title="離開"><Power size={20}/></button>
              </div>
          </div>

          {/* Top Notification Overlay */}
          {topNotification && (
              <div className={`absolute top-14 left-0 w-full z-[90] p-2 flex items-center justify-center shadow-lg transition-transform animate-slide-down ${topNotification.type === 'event' ? 'bg-indigo-600' : topNotification.type === 'artifact' ? 'bg-amber-600' : 'bg-slate-700'}`}>
                  <BellRing size={20} className="mr-2 text-white"/>
                  <span className="font-bold text-white tracking-wide">{topNotification.message}</span>
              </div>
          )}

          {/* Middle: Arena (Opponents) */}
          <div className="flex-1 relative flex flex-col items-center p-4 bg-slate-950 overflow-y-auto overflow-x-hidden min-h-0">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-black pointer-events-none fixed"></div>

                <div className="w-full flex-1 flex flex-col justify-center min-h-min">
                    <div className="w-full flex flex-nowrap lg:flex-wrap gap-4 items-center justify-start lg:justify-center z-10 overflow-x-auto lg:overflow-visible py-4 px-2 snap-x">
                        {gameState.players.filter(p => p.id !== humanPlayer.id).map(opp => (
                            <div key={opp.id} onClick={() => canPlay && setTargetId(opp.id)} className={`relative group w-36 sm:w-52 shrink-0 bg-slate-900 border transition-all cursor-pointer rounded-2xl p-2 sm:p-4 flex flex-col gap-2 shadow-xl snap-center ${targetId === opp.id ? 'border-red-500 ring-2 ring-red-500/50 bg-red-950/10' : 'border-slate-700 hover:border-slate-500 hover:-translate-y-1'}`}>
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                    <div className="font-bold text-xs sm:text-sm text-slate-200 truncate max-w-[80px] sm:max-w-[100px]" title={opp.name}>{opp.name}</div>
                                    <div className="flex gap-1 items-center">
                                        {/* Soul Mini Indicator */}
                                        <div className={`w-3 h-3 rounded-full ${opp.soul > 0 ? 'bg-yellow-400' : opp.soul < 0 ? 'bg-purple-500' : 'bg-slate-600'}`}></div>
                                        {/* Element Mark */}
                                        {opp.elementMark && (
                                            <div className="bg-black rounded-full p-0.5 border border-white/20">
                                                {/* @ts-ignore */}
                                                {ELEMENT_CONFIG[opp.elementMark] && React.createElement(ELEMENT_CONFIG[opp.elementMark].icon, {size: 10, className: ELEMENT_CONFIG[opp.elementMark].color})}
                                            </div>
                                        )}
                                        {opp.isStunned && <Zap size={12} className="text-yellow-500 fill-yellow-500 animate-pulse"/>}
                                        {opp.isDead && <Skull size={12} className="text-slate-500"/>}
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[8px] sm:text-[10px] text-slate-400 font-bold"><span>HP</span> <span>{opp.hp}/{opp.maxHp}</span></div>
                                    <div className="w-full bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden"><div className="bg-red-500 h-full transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${Math.min(100, (opp.hp/opp.maxHp)*100)}%` }}></div></div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[8px] sm:text-[10px] text-slate-400 bg-black/20 p-2 rounded-lg">
                                    <div className="flex items-center gap-1"><Zap size={10} className="text-blue-400"/> {opp.mana}</div>
                                    <div className="flex items-center gap-1"><Coins size={10} className="text-yellow-400"/> {opp.gold}</div>
                                </div>

                                <div className="flex flex-wrap gap-1 justify-center pt-1">
                                    {[...Array(MAX_LAND_SIZE)].map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-sm overflow-hidden bg-slate-800">
                                            {opp.lands[i] && (
                                                <div 
                                                    className="w-full h-full bg-emerald-500 cursor-help" 
                                                    onMouseEnter={(e) => handleCardMouseEnter(opp.lands[i], e)} 
                                                    onMouseLeave={handleCardMouseLeave}
                                                ></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {targetId === opp.id && <div className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-lg animate-pulse z-20 border-2 border-slate-900"><Crosshair size={16}/></div>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Animation Overlay */}
                {animationData && (
                    <div className="absolute z-30 animate-fade-in flex flex-col items-center gap-2 pointer-events-none inset-0 justify-center bg-black/40 backdrop-blur-[2px]">
                         <div className={`px-12 py-8 rounded-3xl text-2xl font-black shadow-2xl border-4 backdrop-blur-md flex flex-col items-center gap-4 relative overflow-hidden ${animationData.type === 'attack' ? 'bg-red-900/90 border-red-500 text-white shadow-red-900/50' : animationData.type === 'defense' ? 'bg-blue-900/90 border-blue-500 text-white shadow-blue-900/50' : 'bg-slate-800/90 border-slate-500 text-white'}`}>
                             {/* Combo Animation Background */}
                             {animationData.comboName && (
                                <div className={`absolute inset-0 opacity-30 animate-pulse ${animationData.comboName.includes('湮滅') ? 'bg-purple-600' : animationData.comboName.includes('過載') ? 'bg-blue-600' : 'bg-yellow-600'}`}></div>
                             )}

                             {animationData.type === 'attack' && <Sword size={56} className="mb-2 relative z-10"/>}
                             {animationData.type === 'defense' && <Shield size={56} className="mb-2 relative z-10"/>}
                             
                             <div className="text-sm font-bold opacity-80 uppercase tracking-[0.2em] relative z-10">{animationData.sourceName}</div>
                             
                             <div className="flex flex-col items-center relative z-10">
                                 <div className="text-3xl md:text-5xl font-black leading-none drop-shadow-xl my-2 text-center whitespace-nowrap px-4">
                                     {animationData.cardName}
                                 </div>
                                 {animationData.comboName && (
                                     <div className="text-2xl font-bold text-yellow-300 animate-bounce mt-2 uppercase tracking-widest drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]">
                                         ✦ {animationData.comboName} ✦
                                     </div>
                                 )}
                                 {animationData.value > 0 && (
                                     <div className="flex items-center gap-2 text-4xl font-mono mt-2 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                         <span className="text-xl opacity-60 font-bold">POWER</span>
                                         {animationData.value}
                                     </div>
                                 )}
                             </div>

                             <div className="text-base font-normal opacity-70 mt-2 bg-black/30 px-4 py-1 rounded-full border border-white/10 relative z-10">
                                 {animationData.msg}
                             </div>
                         </div>
                    </div>
                )}

                {/* Turn Reminder */}
                {isHumanTurn && !amIBeingAttacked && (
                    <div className="absolute bottom-4 z-10 pointer-events-none w-full flex justify-center">
                        <div className="bg-green-600/80 backdrop-blur-sm text-white px-6 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(22,163,74,0.5)] border border-green-400 text-sm md:text-base animate-pulse">
                            你的回合 - 請出牌或結束
                        </div>
                    </div>
                )}
                
                {(amIBeingAttacked) && (
                    <div className="absolute z-20 bg-slate-950/80 backdrop-blur-sm p-1 rounded-3xl shadow-2xl animate-fade-in border border-slate-700 bottom-8">
                        <div className={`w-80 md:w-96 rounded-2xl p-4 md:p-6 text-center border-2 ${amIBeingAttacked ? 'bg-red-950/90 border-red-500' : 'bg-orange-950/90 border-orange-500'}`}>
                            <div className="mb-4 flex justify-center">
                                <ShieldAlert size={48} className="text-red-500 animate-pulse"/>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white mb-1">{t.enemyDamage}</h2>
                            <div className="text-4xl md:text-5xl font-black text-white mb-4 font-mono">
                                {gameState.pendingAttack?.damage}
                            </div>
                            
                            {amIBeingAttacked && (
                                <div className="mb-4 text-sm text-red-300 bg-red-900/30 p-2 rounded-lg border border-red-500/20">
                                    {gameState.pendingAttack?.attackType === CardType.ATTACK ? 
                                        "敵方為【物理攻擊】，請使用【物理攻擊卡】反擊" : 
                                        "敵方為【魔法攻擊】，請使用【魔法攻擊卡】反擊"}
                                </div>
                            )}

                            <div className="space-y-2">
                                <button onClick={handleExecutePlay} disabled={selectedCardIds.length === 0} className={`w-full py-3 font-bold rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${amIBeingAttacked ? 'bg-orange-600 hover:bg-orange-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white`}>
                                    '反擊 (Counter)'
                                </button>
                                <button onClick={handleSkipDefense} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white/70 font-bold rounded-xl text-sm">
                                    {t.takeDamage}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
          </div>

          {/* Bottom Area: Player Dashboard & Hand */}
          <div className="h-auto min-h-[160px] md:min-h-[300px] bg-slate-900 border-t border-slate-800 flex flex-col z-40 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] shrink-0">
              
              {/* Player Dashboard Stats */}
              <div className="bg-slate-900/50 flex flex-col md:flex-row items-start md:items-center px-4 py-2 gap-4 border-b border-slate-800">
                    <div className="flex w-full md:w-auto items-center gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border-2 shadow-lg ${NATION_CONFIG[humanPlayer.nation].bgColor} ${NATION_CONFIG[humanPlayer.nation].borderColor} relative shrink-0`}>
                            <Crown size={20} className={NATION_CONFIG[humanPlayer.nation].color} />
                            
                            {/* Player Element Mark */}
                            {humanPlayer.elementMark && (
                                <div className="absolute -top-2 -right-2 bg-black rounded-full p-1 border-2 border-white shadow-lg animate-pulse" title="元素印記">
                                    {/* @ts-ignore */}
                                    {ELEMENT_CONFIG[humanPlayer.elementMark] && React.createElement(ELEMENT_CONFIG[humanPlayer.elementMark].icon, {size: 12, className: ELEMENT_CONFIG[humanPlayer.elementMark].color})}
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1">
                            <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">HP <span className="text-white">{humanPlayer.hp}/{humanPlayer.maxHp}</span></div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden w-24 md:w-32"><div className="h-full bg-red-500 transition-all" style={{ width: `${Math.min(100, (humanPlayer.hp/humanPlayer.maxHp)*100)}%` }}></div></div>
                            </div>
                            <div className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400">Mana <span className="text-white">{humanPlayer.mana}/{humanPlayer.maxMana}</span></div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden w-24 md:w-32"><div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (humanPlayer.mana/humanPlayer.maxMana)*100)}%` }}></div></div>
                            </div>
                        </div>
                    </div>

                    {/* SOUL METER */}
                    <div className="flex-1 flex flex-col items-center">
                        <div className="flex justify-between w-full max-w-[200px] text-[9px] font-bold uppercase mb-1">
                            <span className="text-purple-400">Darkness</span>
                            <span className="text-slate-500">Soul</span>
                            <span className="text-yellow-400">Light</span>
                        </div>
                        <div className="relative w-full max-w-[200px] h-2 bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="flex-1 bg-gradient-to-l from-slate-800 to-purple-600 opacity-50"></div>
                            <div className="flex-1 bg-gradient-to-r from-slate-800 to-yellow-500 opacity-50"></div>
                            
                            {/* Indicator */}
                            <div 
                                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] transition-all duration-500"
                                style={{ left: `${((humanPlayer.soul + 3) / 6) * 100}%` }}
                            ></div>
                        </div>
                        <div className="text-[10px] font-mono mt-1 text-slate-400">
                            {humanPlayer.soul === 3 ? <span className="text-yellow-400 font-bold animate-pulse">LIGHT STATE (+3)</span> : humanPlayer.soul === -3 ? <span className="text-purple-400 font-bold animate-pulse">DARK STATE (-3)</span> : `Level ${humanPlayer.soul}`}
                        </div>
                    </div>

                    {/* Display Own Element Mark */}
                    <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-lg border border-slate-700">
                        {humanPlayer.elementMark ? (
                            <div className="flex items-center gap-2">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Mark</div>
                                {/* @ts-ignore */}
                                <div className={`flex items-center gap-1 text-xs font-bold ${ELEMENT_CONFIG[humanPlayer.elementMark].color}`}>
                                    {/* @ts-ignore */}
                                    {React.createElement(ELEMENT_CONFIG[humanPlayer.elementMark].icon, {size: 14})}
                                    {/* @ts-ignore */}
                                    {ELEMENT_CONFIG[humanPlayer.elementMark].name}
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] text-slate-600 font-bold px-2">NO MARK</div>
                        )}
                    </div>

                    <div className="flex w-full md:w-auto items-center justify-between gap-4">
                        <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/5">
                            <div className="flex flex-col items-center min-w-[40px]">
                                <span className="text-[9px] text-slate-500 font-bold uppercase">Gold</span>
                                <div className="flex items-center gap-1 text-yellow-400 font-bold text-xs"><Coins size={12}/> {humanPlayer.gold}</div>
                            </div>
                            <div className="h-6 w-px bg-white/10"></div>
                            <div className="flex flex-col items-center min-w-[40px]">
                                <span className="text-[9px] text-slate-500 font-bold uppercase">Income</span>
                                <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs"><TrendingUp size={12}/> +{totalIncome}</div>
                            </div>
                        </div>
                    </div>
              </div>

              {/* NEW: Artifacts & Lands Bar */}
              <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/50">
                          <span className="text-emerald-500 font-bold flex items-center gap-1"><Factory size={10}/> Lands ({humanPlayer.lands.length}/{MAX_LAND_SIZE})</span>
                          <div className="flex gap-1">
                              {humanPlayer.lands.map((l, i) => (
                                  <div key={i} className="w-4 h-4 bg-emerald-600 rounded-sm shadow border border-emerald-400 flex items-center justify-center cursor-help" onMouseEnter={(e) => handleCardMouseEnter(l, e)} onMouseLeave={handleCardMouseLeave}>
                                      <Factory size={8} className="text-white"/>
                                  </div>
                              ))}
                              {[...Array(Math.max(0, MAX_LAND_SIZE - humanPlayer.lands.length))].map((_, i) => (
                                  <div key={`empty-land-${i}`} className="w-4 h-4 bg-slate-800 rounded-sm border border-slate-700/50"></div>
                              ))}
                          </div>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-amber-900/20 px-2 py-1 rounded border border-amber-900/50">
                          <span className="text-amber-500 font-bold flex items-center gap-1"><Anchor size={10}/> Artifacts ({humanPlayer.artifacts.length}/{MAX_ARTIFACT_SIZE})</span>
                          <div className="flex gap-1">
                              {humanPlayer.artifacts.map((a, i) => (
                                  <div key={i} className="w-4 h-4 bg-amber-600 rounded-sm shadow border border-amber-400 flex items-center justify-center cursor-help" onMouseEnter={(e) => handleCardMouseEnter(a, e)} onMouseLeave={handleCardMouseLeave}>
                                      <Gem size={8} className="text-white"/>
                                  </div>
                              ))}
                              {[...Array(Math.max(0, MAX_ARTIFACT_SIZE - humanPlayer.artifacts.length))].map((_, i) => (
                                  <div key={`empty-art-${i}`} className="w-4 h-4 bg-slate-800 rounded-sm border border-slate-700/50"></div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Hand Controls Bar */}
              <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 overflow-x-auto scrollbar-hide">
                  <div className="flex items-center gap-2">
                      <button onClick={() => setShowShop(true)} className="flex items-center gap-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/30 text-xs whitespace-nowrap">
                          <ShoppingBag size={14}/> {t.shop}
                      </button>
                      {isHumanTurn && selectedCardIds.length === 1 && (
                          <button onClick={handleSell} className="flex items-center gap-1 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 font-bold px-3 py-1.5 rounded-lg transition-colors border border-yellow-700/30 text-xs whitespace-nowrap">
                              <XCircle size={14}/> {t.sell} <span className="text-[10px] bg-black/40 px-1 py-0.5 rounded ml-1">+{Math.floor((humanPlayer.hand.find(c => c.id === selectedCardIds[0])?.cost || 0) / 2)}G</span>
                          </button>
                      )}
                  </div>

                  <div className="flex items-center gap-2">
                      {/* Reaction Preview Bar */}
                      {preview?.comboName && (
                          <div className="flex items-center gap-2 bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-500/50 text-xs font-bold animate-pulse mr-2 whitespace-nowrap text-indigo-200">
                              <Sparkles size={12} className="text-indigo-400"/>
                              <span>觸發: {preview.comboName}</span>
                              {preview.reactionBonusText && <span className="text-yellow-300 ml-1">({preview.reactionBonusText})</span>}
                          </div>
                      )}

                      {preview && (
                          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 text-xs font-bold animate-fade-in mr-2 whitespace-nowrap">
                              {preview.damage > 0 && <div className="flex items-center gap-1 text-red-400"><Sword size={12}/> {preview.damage}</div>}
                              
                              {(preview.isAttack || preview.isDefensePhase) && (
                                  <div className="flex items-center gap-2 px-2 border-l border-r border-slate-600">
                                      {/* @ts-ignore */}
                                      {ELEMENT_CONFIG[preview.element] && React.createElement(ELEMENT_CONFIG[preview.element].icon, {size: 14, className: ELEMENT_CONFIG[preview.element].color})}
                                      {/* @ts-ignore */}
                                      {preview.alignment && ALIGNMENT_CONFIG[preview.alignment] && React.createElement(ALIGNMENT_CONFIG[preview.alignment].icon, {size: 14, className: ALIGNMENT_CONFIG[preview.alignment].color})}
                                  </div>
                              )}

                              {(preview.cost > 0 || preview.hpCost > 0) && <div className="flex items-center gap-1 text-slate-400 ml-2 pl-2 border-l border-slate-600">
                                  <span className={`${!canAffordMana ? 'text-red-400 line-through opacity-50' : 'text-blue-300'}`}>{preview.cost}MP</span> 
                                  <span className="text-red-300 ml-1">
                                      {preview.hpCost > 0 ? `${preview.hpCost} HP` : ''}
                                  </span>
                              </div>}
                          </div>
                      )}
                      
                      {isHumanTurn && canPlay && (
                          <button 
                            onClick={handleExecutePlay} 
                            disabled={!canAfford || (preview?.isAttack && !targetId && !isRuneOnly) || (isRuneOnly && !selectedCards.some(c=>c.type === CardType.ATTACK || c.type === CardType.MAGIC_ATTACK)) || humanPlayer.playsUsed >= humanPlayer.maxPlays}
                            className={`px-4 py-1.5 rounded-lg font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 text-xs whitespace-nowrap ${isRuneOnly || humanPlayer.playsUsed >= humanPlayer.maxPlays || !canAfford ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'}`}
                          >
                              {isRuneOnly ? t.cantUseAlone : 
                               (preview?.comboName ? `${t.combo}!` : 
                                t.playSelected)}
                          </button>
                      )}
                      
                      <button onClick={() => handleEndTurn()} disabled={!isHumanTurn} className={`px-4 py-1.5 rounded-lg font-bold border transition-colors text-xs whitespace-nowrap ${!isHumanTurn ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' : 'bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border-red-600'}`}>
                          {isHumanTurn ? t.endTurn : t.wait}
                      </button>
                  </div>
              </div>

              {/* Scrollable Hand Area */}
              <div className="flex-1 p-4 overflow-x-auto flex items-center gap-4 px-6 custom-scrollbar-gold bg-slate-950/50">
                 {humanPlayer.isDead ? (
                     <div className="w-full text-center text-red-500 font-bold cinzel text-3xl opacity-50">{t.defeated}</div>
                 ) : (
                    humanPlayer.hand.map((card) => {
                        const isSelected = selectedCardIds.includes(card.id);
                        const isActionPhase = isHumanTurn;
                        const isReactionPhase = amIBeingAttacked;
                        const canInteract = isActionPhase || isReactionPhase;
                        
                        let isDisabled = !canInteract;
                        // Logic filtering for Reaction Phase
                        if (amIBeingAttacked) {
                             const incomingType = gameState.pendingAttack?.attackType;
                             const isMatch = card.type === incomingType;
                             const isRune = card.type === CardType.RUNE;
                             if (!isMatch && !isRune) isDisabled = true;
                        }

                        return (
                            <div key={card.id} className={`relative shrink-0 transition-all duration-300 transform origin-bottom md:scale-100 scale-90 ${isSelected ? '-translate-y-4 z-20 scale-105 md:scale-110' : 'hover:-translate-y-2 hover:scale-105'} ${isDisabled && !isSelected ? 'opacity-40 grayscale pointer-events-none scale-95' : ''}`}>
                                <CardComponent 
                                    card={card} 
                                    lang={lang} 
                                    onClick={() => !isDisabled && toggleSelectCard(card)} 
                                    disabled={isDisabled} 
                                    onMouseEnter={handleCardMouseEnter} 
                                    onMouseLeave={handleCardMouseLeave} 
                                    compact={true} 
                                />
                                {isSelected && <div className="absolute -top-2 right-0 bg-green-500 text-white rounded-full p-0.5 shadow-lg border-2 border-slate-900 z-30"><Icons.Check size={16} /></div>}
                            </div>
                        );
                    })
                 )}
              </div>
          </div>
      </div>

      {/* Global Tooltip */}
      {hoveredCard && (
          <div className="fixed z-[100] pointer-events-none bg-slate-900/95 backdrop-blur border border-slate-600 p-4 rounded-xl shadow-2xl w-64 animate-fade-in" style={{ top: Math.min(window.innerHeight - 300, hoveredCard.y - 150), left: Math.min(window.innerWidth - 270, hoveredCard.x + 20) }}>
              <div className="flex justify-between items-start mb-2">
                  {/* @ts-ignore */}
                  <h4 className="font-bold text-white text-lg leading-tight">{t.cards[hoveredCard.card.id]?.name || hoveredCard.card.name}</h4>
                  <div className="flex gap-1">
                      {hoveredCard.card.cost > 0 && <span className="text-[10px] bg-yellow-900/50 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-700 font-mono">{hoveredCard.card.cost}G</span>}
                      {hoveredCard.card.manaCost > 0 && <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded border border-blue-700 font-mono">{hoveredCard.card.manaCost}MP</span>}
                  </div>
              </div>
              {/* @ts-ignore */}
              <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-2">{t.types[hoveredCard.card.type]}</p>
              
              <div className="flex gap-1 mb-2">
                  {hoveredCard.card.element && hoveredCard.card.element !== ElementType.NEUTRAL && (
                      // @ts-ignore
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${ELEMENT_CONFIG[hoveredCard.card.element].color} bg-slate-800 border border-current`}>{ELEMENT_CONFIG[hoveredCard.card.element].name}</span>
                  )}
                  {hoveredCard.card.alignment && (
                      // @ts-ignore
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${ALIGNMENT_CONFIG[hoveredCard.card.alignment].color} bg-slate-800 border border-current`}>{ALIGNMENT_CONFIG[hoveredCard.card.alignment].name}</span>
                  )}
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-sm text-slate-300 leading-snug">
                  {/* @ts-ignore */}
                  {t.cards[hoveredCard.card.id]?.desc || hoveredCard.card.description}
                  {hoveredCard.card.type === CardType.INDUSTRY && hoveredCard.card.value && (
                      <div className="mt-1 text-emerald-400 font-bold">Income: +{hoveredCard.card.value}</div>
                  )}
              </div>
          </div>
      )}

      {/* Guide Modal */}
      {showGuideModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowGuideModal(false)}>
              <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-2xl shadow-2xl relative max-h-[80vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowGuideModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full"><X size={20}/></button>
                  <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2"><HelpCircle/> 簡易規則 (v3.0)</h2>
                  <div className="text-sm text-slate-300 space-y-4 bg-slate-800 p-6 rounded-xl border border-slate-700 leading-relaxed">
                      <p>1. <b>元素反應</b>: 攻擊會對敵人掛載「印記」。用不同元素攻擊「有印記」的敵人會引爆反應。</p>
                      <p>2. <b>靈魂天平</b>: 
                         <br/>打出神聖卡+1，邪惡卡-1。
                         <br/>靈魂值越高，同陣營卡牌傷害越強。
                         <br/>打出相反陣營卡牌會扣除 HP。
                      </p>
                      <p>3. <b>光之恩惠</b>: 
                         <br/>當靈魂達到 <span className="text-yellow-400 font-bold">+3 (極致光明)</span> 時，下回合商店首購 <span className="text-white font-bold">50% OFF</span>。
                      </p>
                  </div>
                  <div className="mt-4 text-center">
                      <button onClick={() => {setShowGuideModal(false); setPreviousScreen('game'); setScreen('guide');}} className="text-indigo-400 hover:text-indigo-300 font-bold underline">查看完整指南</button>
                  </div>
              </div>
          </div>
      )}

      {/* Quit Modal */}
      {showQuitModal && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowQuitModal(false)}>
              <div className="bg-slate-900 border-2 border-red-900/50 p-8 rounded-3xl w-full max-w-sm shadow-2xl relative text-center" onClick={e => e.stopPropagation()}>
                  <div className="bg-red-900/20 p-4 rounded-full inline-block mb-4">
                      <AlertTriangle size={48} className="text-red-500"/>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-white">確定要離開嗎？</h2>
                  <p className="text-slate-400 text-sm mb-8">目前的遊戲進度將不會保存，您將返回主選單。</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowQuitModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors">
                          取消
                      </button>
                      <button onClick={confirmLeaveGame} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-900/30">
                          確定離開
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Shop Modal */}
      {showShop && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowShop(false)}>
              <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-5xl h-[80vh] shadow-2xl relative flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-3xl">
                      <div>
                          <h2 className="text-3xl font-bold text-white flex items-center gap-3"><ShoppingBag className="text-yellow-400"/> 商店</h2>
                          <div className="text-slate-400 text-sm mt-1 flex items-center gap-4">
                              <span>花費金錢購買強力卡牌。剩餘金錢: <span className="text-yellow-400 font-bold text-lg">{humanPlayer.gold} G</span></span>
                          </div>
                      </div>
                      <button onClick={() => setShowShop(false)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                  </div>

                  {/* Discount Banner */}
                  <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-2 text-center text-xs font-bold border-b border-white/5">
                        <span className="text-yellow-400">提示：</span> 當靈魂達到【極致光明 (+3)】時，下一回合商店首次購買享有 <span className="text-white">50% 折扣</span>。
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 bg-slate-950/50">
                      {gameState.shopCards.map((card) => {
                          const isPurchased = card.purchasedByPlayerIds?.includes(humanPlayer.id);
                          
                          let cost = card.cost;
                          let originalCost = card.cost;
                          let hasDiscount = false;
                          
                          if (humanPlayer.shopDiscount && !humanPlayer.hasPurchasedInShop) {
                              cost = Math.floor(cost * 0.5);
                              hasDiscount = true;
                          }

                          const canAfford = humanPlayer.gold >= cost;
                          const isMyTurn = isHumanTurn; 
                          
                          return (
                              <div key={card.id} className="flex flex-col gap-3 group relative items-center">
                                  <div className={`relative transition-all duration-300 ${isPurchased ? 'opacity-30 grayscale pointer-events-none' : 'hover:scale-105'}`}>
                                      <CardComponent card={card} lang={lang} onMouseEnter={handleCardMouseEnter} onMouseLeave={handleCardMouseLeave} />
                                      {isPurchased && (
                                          <div className="absolute inset-0 flex items-center justify-center z-10">
                                              <div className="bg-green-600 text-white font-bold px-4 py-2 rounded-lg transform -rotate-12 border-2 border-white shadow-xl">已購買</div>
                                          </div>
                                      )}
                                      {!isPurchased && hasDiscount && (
                                          <div className="absolute -top-2 -right-2 z-20 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce">
                                              -50%
                                          </div>
                                      )}
                                  </div>
                                  <button 
                                    onClick={() => handleBuy(card)}
                                    disabled={isPurchased || !canAfford || !isMyTurn}
                                    className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                                        isPurchased ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 
                                        !isMyTurn ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' :
                                        canAfford ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg' : 'bg-slate-800 text-red-400 border border-slate-700 cursor-not-allowed'
                                    }`}
                                    title={!isMyTurn ? "非您的回合無法購買" : ""}
                                  >
                                      {isPurchased ? '已擁有' : !isMyTurn ? '非回合行動' : canAfford ? (
                                          hasDiscount ? <span className="flex gap-1"><s>{originalCost}G</s> {cost}G</span> : `購買 (${cost}G)`
                                      ) : `資金不足 (${cost}G)`}
                                  </button>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default App;