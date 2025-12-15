
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Card, CardType, Language, GameSettings, RoomPlayer, MAX_LAND_SIZE, ChatMessage, MAX_ARTIFACT_SIZE, ElementType, PLAYS_PER_TURN, AlignmentType, StanceType } from './types';
import { createInitialState, nextTurn, executeCardEffect, executeAttackAction, resolveAttack, buyCard, sellCard, replaceLand } from './services/gameEngine';
import { socketService } from './services/socketService';
import { StartScreen } from './components/StartScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { CardGallery } from './components/CardGallery';
import { GameGuide } from './components/GameGuide';
import { Card as CardComponent } from './components/Card';
import { DebugConsole } from './components/DebugConsole';
import { AdminPanel } from './components/AdminPanel';
import { NATION_CONFIG, ELEMENT_CONFIG, ALIGNMENT_CONFIG, getComplexElementName } from './constants';
import { TRANSLATIONS } from './locales';
import { getIconComponent } from './utils/iconMap';
import * as Icons from 'lucide-react';
import { Coins, Heart, Zap, ShoppingBag, Crown, History, ShieldAlert, Crosshair, Skull, Sword, Shield, MessageSquare, Send, XCircle, Target, Hexagon, HelpCircle, Anchor, Power, BookOpen, Factory, Info, BellRing, User, LayoutGrid, List, TrendingUp, Sun, Moon, X, AlertTriangle, Terminal, Menu, Scale, Flame, Droplets, Mountain, Wind, Gem, Sparkles, Wifi, AlertCircle, ChevronUp, ChevronDown, Repeat, Eye, LayoutTemplate } from 'lucide-react';

const App: React.FC = () => {
  const [screen, setScreen] = useState<'start' | 'lobby' | 'gallery' | 'guide' | 'game'>('start');
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
  
  // Mobile UI State
  const [mobileTab, setMobileTab] = useState<'hand' | 'board'>('hand');
  const [inspectPlayerId, setInspectPlayerId] = useState<string | null>(null);

  // Admin State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('');

  // Interaction State
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [shopSelectedCardId, setShopSelectedCardId] = useState<string | null>(null); // For detailed view in shop
  const [targetId, setTargetId] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<{type: 'attack'|'defense'|'repel'|'normal', value: number, msg: string, sourceName?: string, targetName?: string, cardName?: string, comboName?: string} | null>(null);
  const [showReplaceModal, setShowReplaceModal] = useState<string | null>(null); // Stores cardId pending replacement
  
  // Notification System
  const [topNotification, setTopNotification] = useState<{message: string, type: 'event'|'artifact'|'info'|'warning'|'error'} | null>(null);

  const logEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  // Helper to show non-blocking warnings
  const showWarning = (message: string) => {
      setTopNotification({ message, type: 'warning' });
  };

  // --- Route Check for Admin ---
  useEffect(() => {
      const checkRoute = () => {
          if (window.location.pathname === '/admin') {
              setShowAdminLogin(true);
          }
      };
      checkRoute();
      window.addEventListener('popstate', checkRoute);
      return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Socket Integration Hook
  useEffect(() => {
      console.log("Registering Socket Listeners...");
      
      const cleanupStart = socketService.onGameStart((initialState) => {
          console.log("Game Start Event Received!", initialState);
          setGameState({ ...initialState, isMultiplayer: true });
          setScreen('game');
      });

      const cleanupUpdate = socketService.onStateUpdate((newState) => {
          setGameState({ ...newState, isMultiplayer: true });
          // Reset selections on update to prevent stale data (but keep careful not to disrupt ongoing interactions if possible)
          // Only clear if critical phase change
          if (newState.turn !== gameState?.turn || newState.turnPhase !== gameState?.turnPhase) {
              setSelectedCardIds([]);
              setTargetId(null);
          }
          
          if (newState.lastAction && newState.lastAction.timestamp > (gameState?.lastAction?.timestamp || 0)) {
              if (newState.lastAction.type === 'REPEL') {
                  setTimeout(() => setAnimationData(null), 1500); 
              }
          }
      });

      const cleanupLog = socketService.onLog((msg) => {
          setTopNotification({ message: msg, type: 'info' });
      });

      return () => {
          console.log("Cleaning up Socket Listeners...");
          cleanupStart();
          cleanupUpdate();
          cleanupLog();
      }
  }, [gameState]);

  // --- Helpers ---
  const getPreviewStats = () => {
      if (!gameState || selectedCardIds.length === 0) return null;
      const socketId = socketService.getId();
      const humanPlayer = gameState.isMultiplayer 
          ? gameState.players.find(p => p.id === socketId) || gameState.players[gameState.currentPlayerIndex]
          : gameState.players.find(p => p.isHuman);
      
      if (!humanPlayer) return null;
      const cards = humanPlayer.hand.filter(c => selectedCardIds.includes(c.id));
      if (cards.length === 0) return null;

      let damage = 0;
      let cost = 0;
      let hpCost = 0;
      let element = ElementType.NEUTRAL;
      let comboName = undefined;
      let reactionBonusText = '';

      const isMagic = cards.some(c => c.type === CardType.MAGIC_ATTACK);
      const isPhysical = cards.some(c => c.type === CardType.ATTACK);
      const runes = cards.filter(c => c.type === CardType.RUNE);
      const weapon = cards.find(c => c.type === CardType.ATTACK);

      const elements: ElementType[] = [];

      cards.forEach(c => {
          cost += c.manaCost;
          hpCost += (c.hpCost || 0);
          if (c.element && c.element !== ElementType.NEUTRAL) elements.push(c.element);
      });

      if (isMagic) {
          damage = cards.reduce((sum, c) => sum + (c.value || 0), 0);
      } else if (weapon) {
          damage = (weapon.value || 0);
          if (humanPlayer.soul > 0 && weapon.holyBonus) damage += weapon.holyBonus;
          else if (humanPlayer.soul < 0 && weapon.evilBonus) damage += weapon.evilBonus;
          damage += runes.reduce((sum, r) => sum + (r.value || 0), 0);
      }

      if (elements.length > 0) element = elements[0]; 
      
      if ((isMagic || isPhysical) && targetId) {
          const target = gameState.players.find(p => p.id === targetId);
          if (target && target.elementMark && element !== ElementType.NEUTRAL && element !== target.elementMark) {
              const reaction = getComplexElementName(element, target.elementMark);
              if (reaction) {
                  comboName = reaction;
                  if (reaction.includes("擴散")) reactionBonusText = "流血 + 破壞";
                  if (reaction.includes("泥沼")) reactionBonusText = "緩速";
                  if (reaction.includes("湮滅")) reactionBonusText = "傷害 x1.5";
                  if (reaction.includes("過載")) reactionBonusText = "傷害 x1.25";
              }
          }
      }
      
      if (isMagic || isPhysical) {
          if (gameState.currentEvent?.globalModifier?.damageMultiplier) damage = Math.floor(damage * gameState.currentEvent.globalModifier.damageMultiplier);
          damage = Math.floor(damage * gameState.settings.damageMultiplier);
          damage += humanPlayer.damageBonus;
      }

      const isDefensePhase = gameState.turnPhase === 'DEFENSE';
      return { damage, defense: isDefensePhase ? damage : 0, cost, hpCost, element, comboName, reactionBonusText, isAttack: isMagic || isPhysical, isDefensePhase };
  };

  const preview = getPreviewStats();

  // --- Effects ---
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameState?.gameLog, showSidebar]);
  useEffect(() => { if (activeTab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [gameState?.chat, activeTab, showSidebar]);

  useEffect(() => {
      if (gameState?.topNotification) {
          setTopNotification(gameState.topNotification);
      }
  }, [gameState?.topNotification]);

  useEffect(() => {
      if (topNotification) {
          const timer = setTimeout(() => setTopNotification(null), 4000);
          return () => clearTimeout(timer);
      }
  }, [topNotification]);

  // Clean Notification on Defense Phase (Urgent)
  useEffect(() => {
      if (gameState?.turnPhase === 'DEFENSE') {
          // If the notification is about playing a card, clear it to not obstruct
          if (topNotification?.type === 'info' && topNotification.message.includes('使用了')) {
              setTopNotification(null);
          }
      }
  }, [gameState?.turnPhase]);

  useEffect(() => {
      if (animationData) {
          const timer = setTimeout(() => setAnimationData(null), 2500);
          return () => clearTimeout(timer);
      }
  }, [animationData]);

  // AI & Game Loop
  useEffect(() => {
    if (!gameState || gameState.winnerId || screen !== 'game' || gameState.isDisconnected || gameState.isMultiplayer) return;

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
                     
                     // Check Land Replacement for AI (Simple: Replace oldest)
                     if (card.type === CardType.INDUSTRY && currentPlayer.lands.length >= MAX_LAND_SIZE) {
                         newState = replaceLand(newState, card.id, 0); // Always replace first slot for AI
                     } else {
                         if (card.type === CardType.ATTACK || card.type === CardType.MAGIC_ATTACK) {
                              if (target) newState = executeAttackAction(newState, [card], target.id);
                         } else {
                             if (['heal', 'mana', 'full_restore_hp', 'buff_damage'].includes(card.effectType || '') || card.type === CardType.HEAL || card.type === CardType.ARTIFACT) {
                                 newState = executeCardEffect(newState, card, currentPlayer.id);
                             } else if (card.type === CardType.RITUAL) {
                                 newState = executeCardEffect(newState, card); 
                             } else {
                                 newState = executeCardEffect(newState, card, target?.id);
                             }
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
          let msg = act.message || '';
          let value = 0;
          let comboName = act.comboName;

          if (act.type === CardType.ATTACK || act.type === CardType.MAGIC_ATTACK) {
              type = 'attack';
              if (!msg) msg = act.cardsPlayed ? act.cardsPlayed.map(c => c.name).join(' + ') : t.attackExcl;
              value = act.totalValue || 0;
          } else if (act.type === 'REPEL') {
              type = 'repel';
              if (!msg) msg = '反擊！';
              value = act.totalValue || 0;
          } else {
              if (!msg) msg = `${t.cardUsed} ${cardName}`;
          }
          setAnimationData({ type, value, msg, sourceName, targetName, cardName, comboName });
      }
  }, [gameState?.lastAction]);

  // --- Handlers ---
  const sha256 = async (str: string) => {
      const enc = new TextEncoder();
      const hash = await crypto.subtle.digest('SHA-256', enc.encode(str));
      return Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const hash = await sha256(adminPass);
      socketService.loginAdmin(adminUser, hash, (success) => {
          if (success) {
              setShowAdminLogin(false);
              setShowAdminPanel(true);
              setAdminPass('');
          } else {
              alert('Login Failed (密碼錯誤或伺服器未響應)');
          }
      });
  };

  const handleStartGame = (players: RoomPlayer[], settings: GameSettings, isOnline: boolean = false) => {
    if (isOnline) {
    } else {
        setGameState(createInitialState(players, settings));
        setScreen('game');
    }
  };
  
  const handleEndTurn = () => {
    if (!gameState) return;
    if (gameState.isMultiplayer) {
        socketService.emitAction({ type: 'END_TURN' });
    } else {
        setGameState(nextTurn(gameState));
    }
    setSelectedCardIds([]);
    setTargetId(null);
  };

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !gameState) return;
      const player = gameState.players.find(p => p.isHuman);
      
      if (gameState.isMultiplayer) {
          socketService.emitAction({ type: 'SEND_CHAT', message: chatInput });
      } else {
          const msg: ChatMessage = {
              id: Date.now().toString(),
              sender: player?.name || 'Unknown',
              text: chatInput
          };
          setGameState({ ...gameState, chat: [...gameState.chat, msg] });
      }
      setChatInput('');
  };

  const toggleSelectCard = (card: Card) => {
      const isDefensePhase = gameState?.turnPhase === 'DEFENSE';
      
      if (isDefensePhase) {
          const incomingType = gameState?.pendingAttack?.attackType;
          if (incomingType) {
              if (incomingType === CardType.ATTACK) {
                  if (card.type !== CardType.ATTACK && card.type !== CardType.RUNE) return;
              } 
              else if (incomingType === CardType.MAGIC_ATTACK) {
                  if (card.type !== CardType.MAGIC_ATTACK) return;
              }
          }
      }
      
      if (selectedCardIds.includes(card.id)) {
          setSelectedCardIds(prev => prev.filter(id => id !== card.id));
      } else {
          const socketId = socketService.getId();
          const humanPlayer = gameState!.isMultiplayer 
            ? gameState!.players.find(p => p.id === socketId)! 
            : gameState!.players.find(p => p.isHuman)!;

          const currentSelected = humanPlayer.hand.filter(c => selectedCardIds.includes(c.id));
          let canSelect = false;

          if (currentSelected.length === 0) {
              canSelect = true;
          } else {
              const hasWeapon = currentSelected.some(c => c.type === CardType.ATTACK);
              const hasMagic = currentSelected.some(c => c.type === CardType.MAGIC_ATTACK);
              const runes = currentSelected.filter(c => c.type === CardType.RUNE);
              
              if (hasMagic) {
                  if (card.type === CardType.MAGIC_ATTACK && card.element === currentSelected[0].element) {
                      canSelect = true;
                  }
              }
              else {
                  if (card.type === CardType.MAGIC_ATTACK) {
                      canSelect = false;
                  } else if (card.type === CardType.ATTACK) {
                      if (hasWeapon) canSelect = false; 
                      else canSelect = true;
                  } else if (card.type === CardType.RUNE) {
                      const existingEleRune = runes.find(r => r.element !== ElementType.NEUTRAL);
                      if (existingEleRune && card.element !== ElementType.NEUTRAL && card.element !== existingEleRune.element) {
                          canSelect = false;
                      } 
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

  const executePlay = () => {
      if (!gameState || selectedCardIds.length === 0) return;
      const socketId = socketService.getId();
      const humanPlayer = gameState.isMultiplayer
        ? gameState.players.find(p => p.id === socketId)!
        : gameState.players.find(p => p.isHuman)!;

      const selectedCards = humanPlayer.hand.filter(c => selectedCardIds.includes(c.id));
      if (selectedCards.length === 0) return;

      if (selectedCards[0].type === CardType.INDUSTRY && humanPlayer.lands.length >= MAX_LAND_SIZE) {
          setShowReplaceModal(selectedCards[0].id);
          return;
      }

      const types = selectedCards.map(c => c.type);
      const hasAttack = types.includes(CardType.ATTACK);
      const hasMagic = types.includes(CardType.MAGIC_ATTACK);
      const isRuneOnly = selectedCards.every(c => c.type === CardType.RUNE);

      if (gameState.turnPhase === 'DEFENSE') {
           if (isRuneOnly) { showWarning(t.cantUseAlone); return; }
           if (hasAttack || hasMagic || (types.includes(CardType.RUNE) && hasAttack)) {
             if (gameState.isMultiplayer) {
                 socketService.emitAction({ type: 'REPEL', cardIds: selectedCardIds });
             } else {
                 setGameState(resolveAttack(gameState, selectedCards, true));
             }
             setSelectedCardIds([]);
             return;
           }
          return;
      }

      const currentPlayer = gameState.players[gameState.currentPlayerIndex];

      if (hasAttack || hasMagic) {
          if (!targetId) { showWarning(t.selectTargetHint); return; }
          if (gameState.isMultiplayer) {
              socketService.emitAction({ type: 'ATTACK', cardIds: selectedCardIds, targetId: targetId });
          } else {
              setGameState(executeAttackAction(gameState, selectedCards, targetId));
          }
      } 
      else {
          if (isRuneOnly) { showWarning(t.cantUseAlone); return; }
          if (selectedCards.length > 1) { showWarning(t.notStackable); return; }
          
          if (gameState.isMultiplayer) {
              socketService.emitAction({ type: 'PLAY_CARD', cardId: selectedCardIds[0], targetId: targetId || undefined });
          } else {
              if (['heal', 'mana', 'full_restore_hp', 'buff_damage', 'equip_artifact'].includes(selectedCards[0].effectType || '') || selectedCards[0].type === CardType.HEAL || selectedCards[0].type === CardType.ARTIFACT) {
                  setGameState(executeCardEffect(gameState, selectedCards[0], currentPlayer.id));
              } else if (selectedCards[0].type === CardType.RITUAL) {
                  setGameState(executeCardEffect(gameState, selectedCards[0]));
              } else {
                  setGameState(executeCardEffect(gameState, selectedCards[0], targetId || undefined));
              }
          }
      }
      setSelectedCardIds([]);
      setTargetId(null);
  };

  const handleLandReplace = (slotIndex: number) => {
      if (!gameState || !showReplaceModal) return;
      if (gameState.isMultiplayer) {
          socketService.emitAction({ type: 'REPLACE_LAND', cardId: showReplaceModal, slotIndex });
      } else {
          setGameState(replaceLand(gameState, showReplaceModal, slotIndex));
      }
      setShowReplaceModal(null);
      setSelectedCardIds([]);
  };

  const handleSell = () => {
      if (!gameState || selectedCardIds.length !== 1) return;
      
      if (gameState.isMultiplayer) {
          socketService.emitAction({ type: 'SELL_CARD', cardId: selectedCardIds[0] });
          setSelectedCardIds([]);
      } else {
          const humanPlayer = gameState.players.find(p => p.isHuman)!;
          const card = humanPlayer.hand.find(c => c.id === selectedCardIds[0]);
          if (card) {
              setGameState(sellCard(gameState, card));
              setSelectedCardIds([]);
          }
      }
  };

  const handleBuy = (card: Card) => {
      if (!gameState) return;
      if (gameState.isMultiplayer) {
          socketService.emitAction({ type: 'BUY_CARD', cardId: card.id });
      } else {
          setGameState(buyCard(gameState, card));
      }
      setShopSelectedCardId(null);
  };

  const handleSkipDefense = () => {
      if (!gameState) return;
      if (gameState.isMultiplayer) {
          socketService.emitAction({ type: 'TAKE_DAMAGE' });
      } else {
          setGameState(resolveAttack(gameState, [], false));
      }
  };

  const handleLeaveGame = () => {
      setShowQuitModal(true);
  };

  const confirmLeaveGame = () => {
      if (gameState?.isMultiplayer) {
          socketService.disconnect();
      }
      setGameState(null); 
      setScreen('start');
      setShowQuitModal(false);
  };

  // --- Render Sub-Components ---

  if (screen === 'start') {
      return (
        <div className="relative">
            <StartScreen 
                onHost={() => setScreen('lobby')} 
                onGallery={() => setScreen('gallery')} 
                onGuide={() => { setPreviousScreen('start'); setScreen('guide'); }} 
                onSim={() => {}} 
                onAdmin={() => setShowAdminLogin(true)}
                lang={lang} 
                setLang={setLang} 
            />
            {showAdminLogin && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleAdminLoginSubmit} className="bg-slate-900 border border-indigo-500 rounded-xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-2xl shadow-indigo-900/50" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Terminal size={20}/> 管理員登入</h2>
                        <input value={adminUser} onChange={e=>setAdminUser(e.target.value)} placeholder="Username" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"/>
                        <input value={adminPass} onChange={e=>setAdminPass(e.target.value)} type="password" placeholder="Password" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-white outline-none focus:border-indigo-500"/>
                        <div className="flex gap-2 pt-2">
                            <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded hover:bg-slate-700">取消</button>
                            <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 font-bold">登入</button>
                        </div>
                    </form>
                </div>
            )}
            {showAdminPanel && (
                <AdminPanel onClose={() => setShowAdminPanel(false)} />
            )}
        </div>
      );
  }

  if (screen === 'gallery') return <CardGallery lang={lang} onBack={() => setScreen('start')} />;
  if (screen === 'guide') return <GameGuide onBack={() => setScreen(previousScreen)} />;
  if (screen === 'lobby') return <LobbyScreen lang={lang} onStart={handleStartGame} onBack={() => setScreen('start')} />;
  if (!gameState) return null; 

  const socketId = socketService.getId();
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const humanPlayer = gameState.isMultiplayer
    ? (gameState.players.find(p => p.id === socketId) || gameState.players[0]) 
    : gameState.players.find(p => p.isHuman)!;

  const isHumanTurn = currentPlayer.id === humanPlayer.id && gameState.turnPhase === 'ACTION';
  const isDefensePhase = gameState.turnPhase === 'DEFENSE';
  const amIBeingAttacked = isDefensePhase && gameState.pendingAttack?.targetId === humanPlayer.id;
  
  // Selection Logic
  const canPlay = selectedCardIds.length > 0;
  const selectedCards = humanPlayer.hand.filter(c => selectedCardIds.includes(c.id));
  const totalCost = selectedCards.reduce((sum, c) => sum + c.manaCost, 0);
  const totalHpCost = selectedCards.reduce((sum, c) => sum + (c.hpCost || 0), 0) + (preview?.hpCost || 0);
  const isRuneOnly = selectedCards.length > 0 && selectedCards.every(c => c.type === CardType.RUNE);
  const canAffordMana = humanPlayer.mana >= totalCost;
  const canAffordHp = humanPlayer.hp > totalHpCost;
  const canAfford = canAffordMana && canAffordHp;

  // Active Card for Inspector
  const activeCard = selectedCardIds.length > 0 ? selectedCards[selectedCards.length - 1] : null;
  const shopActiveCard = gameState.shopCards.find(c => c.id === shopSelectedCardId);

  // Inspector Player (Mobile specific, or desktop sidebar)
  const inspectedPlayer = inspectPlayerId ? gameState.players.find(p => p.id === inspectPlayerId) : null;

  // @ts-ignore
  const EventIcon = gameState.currentEvent ? getIconComponent(gameState.currentEvent.icon) : Icons.Zap;

  return (
    <div className="h-[100dvh] w-screen bg-slate-950 font-sans text-slate-200 selection:bg-indigo-500/30 overflow-hidden flex flex-col relative md:flex-row">
      
      {/* Debug Console Overlay */}
      {showDebug && <DebugConsole gameState={gameState} setGameState={setGameState} onClose={() => setShowDebug(false)} />}

      {/* --- DESKTOP LEFT SIDEBAR (Log & Stats) --- */}
      <div className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0 z-20">
          <div className="p-4 border-b border-slate-800 bg-slate-950">
              <h1 className="text-lg font-bold text-white mb-2 cinzel">魔法對戰</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="bg-slate-800 px-2 py-0.5 rounded">Turn {gameState.turn}</span>
                  {gameState.currentEvent && <span className="bg-red-900/50 text-red-200 px-2 py-0.5 rounded flex items-center gap-1"><EventIcon size={10}/> {gameState.currentEvent.name}</span>}
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">戰鬥紀錄</div>
              {gameState.gameLog.map(log => (
                  <div key={log.id} className="text-xs text-slate-300 border-l-2 border-slate-700 pl-2 py-1">
                      {log.message}
                  </div>
              ))}
              <div ref={logEndRef} />
          </div>
          {/* Desktop Player Stats */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${NATION_CONFIG[humanPlayer.nation].bgColor} ${NATION_CONFIG[humanPlayer.nation].borderColor}`}>
                      <User className="text-white" size={20}/>
                  </div>
                  <div>
                      <div className={`font-bold text-sm ${humanPlayer.isAdmin ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-400 to-purple-500 animate-pulse' : 'text-white'}`}>
                          {humanPlayer.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{NATION_CONFIG[humanPlayer.nation].name}</div>
                  </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-800 rounded p-1"><div className="text-red-400 font-bold">{humanPlayer.hp}</div><div className="text-[10px] text-slate-500">HP</div></div>
                  <div className="bg-slate-800 rounded p-1"><div className="text-blue-400 font-bold">{humanPlayer.mana}</div><div className="text-[10px] text-slate-500">MP</div></div>
                  <div className="bg-slate-800 rounded p-1"><div className="text-yellow-400 font-bold">{humanPlayer.gold}</div><div className="text-[10px] text-slate-500">G</div></div>
              </div>
              {/* Admin Cheat Button */}
              {humanPlayer.isAdmin && gameState.isMultiplayer && (
                  <button onClick={() => setShowDebug(true)} className="mt-3 w-full bg-red-900/30 border border-red-500/30 text-red-400 text-xs py-1 rounded hover:bg-red-900/50 flex items-center justify-center gap-1">
                      <Terminal size={12}/> DEBUG CONSOLE
                  </button>
              )}
          </div>
      </div>

      {/* --- MAIN AREA --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
          
          {/* MOBILE HEADER */}
          <div className="md:hidden h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0">
              <div className="flex items-center gap-2">
                  <button onClick={() => setShowQuitModal(true)} className="p-1.5 bg-slate-800 rounded text-slate-400"><Power size={14}/></button>
                  <span className="text-xs font-bold text-slate-300">Turn {gameState.turn}</span>
                  {humanPlayer.isAdmin && <button onClick={() => setShowDebug(true)} className="ml-2 text-red-500"><Terminal size={14}/></button>}
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={() => setShowShop(true)} className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white"><ShoppingBag size={14}/></button>
                  <button onClick={handleEndTurn} disabled={!isHumanTurn} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isHumanTurn ? 'bg-green-600 border-green-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}><ChevronDown size={20}/></button>
              </div>
          </div>

          {/* Top Notification Overlay */}
          {topNotification && (
              <div className={`absolute top-16 left-0 right-0 z-[60] mx-4 p-3 rounded-xl shadow-2xl transition-transform animate-slide-down flex items-start gap-3 border ${topNotification.type === 'error' ? 'bg-red-950/90 border-red-500' : 'bg-slate-800/90 border-slate-600'}`}>
                  <BellRing size={20} className={topNotification.type === 'error' ? 'text-red-400' : 'text-indigo-400'}/>
                  <span className="text-sm font-bold text-white">{topNotification.message}</span>
              </div>
          )}

          {/* MIDDLE ARENA */}
          <div className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col md:p-8">
                {/* Background */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-black pointer-events-none"></div>

                {/* --- DESKTOP OPPONENT GRID --- */}
                <div className="hidden md:grid grid-cols-3 gap-6 w-full max-w-5xl mx-auto mb-auto">
                    {gameState.players.filter(p => p.id !== humanPlayer.id).map(opp => (
                        <div 
                            key={opp.id} 
                            onClick={() => canPlay && setTargetId(opp.id)}
                            className={`bg-slate-900/80 border-2 rounded-2xl p-4 transition-all hover:scale-105 cursor-pointer relative ${targetId === opp.id ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-slate-700 hover:border-slate-500'}`}
                        >
                            {opp.isAdmin && (
                                <div className="absolute top-3 left-3 bg-red-900/50 text-red-400 border border-red-500/30 text-[10px] px-2 rounded-full font-bold animate-pulse">ADMIN</div>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                                    {opp.isDead ? <Skull size={24}/> : <User size={24}/>}
                                </div>
                                <div>
                                    <div className={`font-bold ${opp.isAdmin ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-400 to-purple-500' : 'text-white'}`}>{opp.name}</div>
                                    <div className="flex gap-2 text-xs">
                                        <span className="text-red-400 flex items-center gap-1"><Heart size={10}/> {opp.hp}</span>
                                        <span className="text-blue-400 flex items-center gap-1"><Zap size={10}/> {opp.mana}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Desktop Opponent Board Preview */}
                            <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
                                {opp.lands.map((l, i) => <div key={i} className="w-2 h-2 rounded-full bg-emerald-500" title={l.name}></div>)}
                                {opp.artifacts.map((a, i) => <div key={i} className="w-2 h-2 rounded-full bg-amber-500" title={a.name}></div>)}
                            </div>
                            {targetId === opp.id && <div className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-1.5 shadow-lg animate-bounce"><Crosshair size={16}/></div>}
                        </div>
                    ))}
                </div>

                {/* --- MOBILE OPPONENT LIST (VERTICAL WIDE BARS) --- */}
                <div className="md:hidden flex flex-col gap-3 p-4 w-full">
                    {gameState.players.filter(p => p.id !== humanPlayer.id).map(opp => (
                        <div 
                            key={opp.id} 
                            onClick={() => canPlay && setTargetId(opp.id)} 
                            className={`relative w-full bg-slate-900 border-2 rounded-xl p-3 flex items-center justify-between shadow-lg active:scale-95 transition-all ${targetId === opp.id ? 'border-red-500 bg-red-950/20' : 'border-slate-700'}`}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border bg-slate-800 ${targetId === opp.id ? 'border-red-500' : 'border-slate-600'}`}>
                                    {opp.isDead ? <Skull size={20} className="text-slate-500"/> : <User size={20} className="text-slate-300"/>}
                                    {/* Mark */}
                                    {opp.elementMark && (
                                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-black rounded-full flex items-center justify-center border border-white z-10">
                                            {/* @ts-ignore */}
                                            {React.createElement(getIconComponent(ELEMENT_CONFIG[opp.elementMark].icon), {size: 8, className: ELEMENT_CONFIG[opp.elementMark].color})}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold truncate ${opp.isAdmin ? 'text-yellow-400' : 'text-white'}`}>{opp.name}</span>
                                        {opp.isAdmin && <Shield size={10} className="text-red-500"/>}
                                    </div>
                                    <div className="flex gap-3 mt-1">
                                        <div className="flex items-center gap-1 bg-black/40 px-1.5 rounded">
                                            <Heart size={10} className="text-red-500"/>
                                            <span className="text-xs font-mono font-bold text-red-100">{opp.hp}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-black/40 px-1.5 rounded">
                                            <Zap size={10} className="text-blue-500"/>
                                            <span className="text-xs font-mono font-bold text-blue-100">{opp.mana}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex gap-1">
                                    {opp.lands.length > 0 && <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-1.5 rounded border border-emerald-500/30 flex items-center gap-0.5"><Factory size={8}/> {opp.lands.length}</span>}
                                    {opp.artifacts.length > 0 && <span className="text-[10px] bg-amber-900/50 text-amber-400 px-1.5 rounded border border-amber-500/30 flex items-center gap-0.5"><Anchor size={8}/> {opp.artifacts.length}</span>}
                                </div>
                                <button onClick={(e) => {e.stopPropagation(); setInspectPlayerId(opp.id);}} className="p-1.5 bg-slate-800 rounded border border-slate-600 text-slate-400 hover:text-white">
                                    <Eye size={14}/>
                                </button>
                            </div>

                            {targetId === opp.id && <div className="absolute -top-2 right-1/2 translate-x-1/2 bg-red-600 text-white rounded-full px-3 py-0.5 text-[10px] font-bold shadow-lg animate-bounce z-20">LOCKED</div>}
                        </div>
                    ))}
                </div>

                {/* Animation Overlay */}
                {animationData && (
                    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[1px]">
                        <div className={`p-6 rounded-2xl border-2 backdrop-blur-md flex flex-col items-center gap-2 animate-fade-in-up ${animationData.type === 'attack' ? 'bg-red-900/80 border-red-500' : animationData.type === 'defense' ? 'bg-blue-900/80 border-blue-500' : 'bg-slate-800/80 border-slate-500'}`}>
                            <div className="text-4xl">{animationData.type === 'attack' ? '⚔️' : '🛡️'}</div>
                            <div className="text-2xl font-black text-white drop-shadow-md">{animationData.cardName}</div>
                            {animationData.value > 0 && <div className="text-3xl font-mono text-yellow-300 font-bold">{animationData.value}</div>}
                            <div className="text-sm opacity-80 bg-black/30 px-2 rounded">{animationData.msg}</div>
                        </div>
                    </div>
                )}
                
                {/* Context Messages */}
                <div className="mt-auto px-6 pb-4 flex justify-center pointer-events-none z-10 md:mb-8">
                    {isHumanTurn && !amIBeingAttacked && !selectedCardIds.length && (
                        <div className="bg-emerald-900/80 text-emerald-100 px-4 py-2 rounded-full text-xs font-bold shadow-lg border border-emerald-500/30 animate-pulse">
                            你的回合
                        </div>
                    )}
                    {amIBeingAttacked && (
                        <div className="bg-red-900/90 text-white px-6 py-3 rounded-2xl text-center shadow-2xl border border-red-500 animate-pulse pointer-events-auto">
                            <div className="text-xs font-bold uppercase text-red-300 mb-1">敵方攻擊</div>
                            <div className="text-3xl font-black font-mono">{gameState.pendingAttack?.damage}</div>
                            <div className="text-[10px] mt-1 opacity-80">請選擇對應攻擊卡反擊</div>
                            <button onClick={handleSkipDefense} className="mt-2 text-xs underline opacity-60 hover:opacity-100">直接承受</button>
                        </div>
                    )}
                </div>
          </div>

          {/* 3. PLAYER DASHBOARD & HAND (Fixed Bottom) */}
          <div className="bg-slate-900 border-t border-slate-800 relative z-50 pb-safe">
              
              {/* Active Card Inspector (Slide Up Panel) - MOBILE ONLY */}
              <div className={`
                  md:hidden absolute bottom-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out z-20 flex flex-col
                  ${activeCard ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}
              `} style={{ maxHeight: '60vh' }}>
                  
                  {activeCard && (
                      <div className="p-5 flex flex-col gap-4">
                          {/* Header info */}
                          <div className="flex justify-between items-start">
                              <div>
                                  <h3 className="text-xl font-bold text-white leading-none">{t.cards[activeCard.id]?.name || activeCard.name}</h3>
                                  <div className="flex gap-2 mt-2">
                                      {/* @ts-ignore */}
                                      <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-800 px-2 py-0.5 rounded text-slate-400">{t.types[activeCard.type]}</span>
                                      {activeCard.element && activeCard.element !== ElementType.NEUTRAL && (
                                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${ELEMENT_CONFIG[activeCard.element].color} bg-slate-800`}>
                                              {ELEMENT_CONFIG[activeCard.element].name}
                                          </span>
                                      )}
                                  </div>
                              </div>
                              <div className="text-right">
                                  <div className="text-2xl font-mono font-bold text-blue-400">{activeCard.manaCost} <span className="text-xs text-slate-500">MP</span></div>
                                  {activeCard.cost > 0 && <div className="text-xs text-yellow-500 font-mono">{activeCard.cost} G</div>}
                              </div>
                          </div>

                          {/* Description */}
                          <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-sm text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                              {/* @ts-ignore */}
                              {t.cards[activeCard.id]?.desc || activeCard.description}
                              {preview?.comboName && (
                                  <div className="mt-2 pt-2 border-t border-white/10 text-yellow-300 font-bold text-xs flex items-center gap-1">
                                      <Sparkles size={12}/> 連擊: {preview.comboName} {preview.reactionBonusText && `(${preview.reactionBonusText})`}
                                  </div>
                              )}
                          </div>

                          {/* Action Button */}
                          <div className="flex gap-3">
                              <button onClick={() => setSelectedCardIds([])} className="px-4 py-3 bg-slate-800 rounded-xl font-bold text-slate-400">取消</button>
                              
                              {/* Sell Button if single card */}
                              {isHumanTurn && selectedCardIds.length === 1 && (
                                  <button onClick={handleSell} className="px-4 py-3 bg-yellow-900/30 text-yellow-500 rounded-xl font-bold border border-yellow-700/50 flex flex-col items-center justify-center leading-none min-w-[80px]">
                                      <span className="text-xs">出售</span>
                                      <span className="text-[10px] opacity-70">+{Math.floor(activeCard.cost/2)}G</span>
                                  </button>
                              )}

                              <button 
                                  onClick={executePlay}
                                  disabled={!isHumanTurn && !amIBeingAttacked}
                                  className={`flex-1 py-3 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2
                                      ${isHumanTurn || amIBeingAttacked ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-900/50' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                  `}
                              >
                                  {amIBeingAttacked ? '反擊!' : '出牌'}
                                  {preview && preview.damage > 0 && <span className="bg-black/20 px-2 py-0.5 rounded text-sm font-mono">{preview.damage} DMG</span>}
                              </button>
                          </div>
                      </div>
                  )}
              </div>

              {/* Stats Bar (Mobile) & Desktop Toolbar */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-slate-800 bg-slate-950 relative z-30">
                  <div className="flex gap-3 md:hidden">
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">HP</span>
                          <div className="text-sm font-bold text-white flex items-center gap-1">
                              <Heart size={12} className="text-red-500"/> {humanPlayer.hp}
                          </div>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">MP</span>
                          <div className="text-sm font-bold text-white flex items-center gap-1">
                              <Zap size={12} className="text-blue-500"/> {humanPlayer.mana}
                          </div>
                      </div>
                      <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Gold</span>
                          <div className="text-sm font-bold text-white flex items-center gap-1">
                              <Coins size={12} className="text-yellow-500"/> {humanPlayer.gold}
                          </div>
                      </div>
                  </div>
                  
                  {/* Desktop Action Bar */}
                  <div className="hidden md:flex gap-4 items-center">
                      <button onClick={() => setShowShop(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-lg text-white font-bold hover:bg-indigo-500 transition-colors">
                          <ShoppingBag size={16}/> 商店
                      </button>
                      <button 
                          onClick={executePlay}
                          disabled={!canPlay || (!isHumanTurn && !amIBeingAttacked)}
                          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${canPlay && (isHumanTurn || amIBeingAttacked) ? 'bg-green-600 text-white hover:bg-green-500 shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                      >
                          {amIBeingAttacked ? '反擊!' : '出牌'} 
                          {preview && preview.damage > 0 && <span className="bg-black/20 px-2 rounded text-xs font-mono">{preview.damage}</span>}
                      </button>
                      {selectedCardIds.length === 1 && isHumanTurn && (
                          <button onClick={handleSell} className="text-yellow-500 text-xs font-bold hover:underline">出售卡牌</button>
                      )}
                      <button onClick={handleEndTurn} disabled={!isHumanTurn} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${isHumanTurn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-slate-900 text-slate-600'}`}>
                          結束回合
                      </button>
                  </div>

                  <div className="flex items-center gap-3">
                      {/* Soul Indicator */}
                      <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Soul</span>
                          <div className={`text-xs font-bold font-mono ${humanPlayer.soul > 0 ? 'text-yellow-400' : humanPlayer.soul < 0 ? 'text-purple-400' : 'text-slate-400'}`}>
                              {humanPlayer.soul > 0 ? '+' : ''}{humanPlayer.soul}
                          </div>
                      </div>
                      
                      {/* Mobile Tab Switcher */}
                      <div className="flex bg-slate-800 rounded-lg p-0.5 ml-2 md:hidden">
                          <button onClick={()=>setMobileTab('hand')} className={`p-1.5 rounded-md transition-colors ${mobileTab === 'hand' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><List size={16}/></button>
                          <button onClick={()=>setMobileTab('board')} className={`p-1.5 rounded-md transition-colors ${mobileTab === 'board' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><LayoutTemplate size={16}/></button>
                      </div>
                  </div>
              </div>

              {/* Bottom Content Area */}
              <div className="relative z-30 bg-slate-900 min-h-[160px] md:min-h-[220px]">
                  {mobileTab === 'hand' || window.innerWidth >= 768 ? (
                      // Hand View
                      <div className="p-3 overflow-x-auto flex items-center gap-3 px-4 scrollbar-hide h-full md:justify-center md:pb-8">
                         {humanPlayer.isDead ? (
                             <div className="w-full text-center text-red-500 font-bold py-8">已敗陣</div>
                         ) : (
                            humanPlayer.hand.map((card) => {
                                const isSelected = selectedCardIds.includes(card.id);
                                const isActionPhase = isHumanTurn;
                                const isReactionPhase = amIBeingAttacked;
                                const canInteract = isActionPhase || isReactionPhase;
                                
                                let isDisabled = !canInteract;
                                if (amIBeingAttacked) {
                                     const incomingType = gameState.pendingAttack?.attackType;
                                     const isMatch = card.type === incomingType;
                                     const isRune = card.type === CardType.RUNE;
                                     if (!isMatch && !isRune) isDisabled = true;
                                }

                                return (
                                    <div key={card.id} className={`relative shrink-0 transition-all duration-300 ${isSelected ? '-translate-y-4 z-40' : 'md:hover:-translate-y-2'}`}>
                                        <CardComponent 
                                            card={card} 
                                            lang={lang} 
                                            onClick={() => !isDisabled && toggleSelectCard(card)} 
                                            disabled={isDisabled} 
                                            compact={window.innerWidth < 768} 
                                        />
                                        {isSelected && <div className="absolute -top-2 right-0 bg-indigo-500 text-white rounded-full p-1 shadow-lg border-2 border-slate-900 z-50 animate-bounce"><Icons.Check size={12} strokeWidth={4} /></div>}
                                    </div>
                                );
                            })
                         )}
                         <div className="w-4 shrink-0"></div>
                      </div>
                  ) : (
                      // Mobile Board View (Lands & Artifacts)
                      <div className="p-4 grid grid-cols-1 gap-4 h-full overflow-y-auto md:hidden">
                          <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                              <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2 flex items-center gap-2"><Factory size={12}/> Lands ({humanPlayer.lands.length}/{MAX_LAND_SIZE})</h4>
                              <div className="flex gap-2 flex-wrap">
                                  {humanPlayer.lands.length > 0 ? humanPlayer.lands.map((land, i) => (
                                      <div key={i} className="bg-emerald-900/20 border border-emerald-500/30 p-2 rounded text-xs text-emerald-100 flex-1 min-w-[100px]">
                                          <div className="font-bold">{land.name}</div>
                                          <div className="text-[10px] opacity-70">+{land.value} Gold/Turn</div>
                                      </div>
                                  )) : <div className="text-xs text-slate-600 italic">No Lands</div>}
                              </div>
                          </div>
                          
                          <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                              <h4 className="text-xs font-bold text-amber-400 uppercase mb-2 flex items-center gap-2"><Anchor size={12}/> Artifacts ({humanPlayer.artifacts.length}/{MAX_ARTIFACT_SIZE})</h4>
                              <div className="flex gap-2 flex-wrap">
                                  {humanPlayer.artifacts.length > 0 ? humanPlayer.artifacts.map((art, i) => (
                                      <div key={i} className="bg-amber-900/20 border border-amber-500/30 p-2 rounded text-xs text-amber-100 flex-1 min-w-[100px]">
                                          <div className="font-bold">{art.name}</div>
                                          <div className="text-[10px] opacity-70">Effect Active</div>
                                      </div>
                                  )) : <div className="text-xs text-slate-600 italic">No Artifacts</div>}
                              </div>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* --- MODALS --- */}

      {/* Enemy Inspection Modal */}
      {inspectedPlayer && (
          <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setInspectPlayerId(null)}>
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setInspectPlayerId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full"><X size={20}/></button>
                  <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <User className="text-indigo-400"/> {inspectedPlayer.name} 的狀態
                  </h2>
                  <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                      <div className="bg-slate-800 p-2 rounded-lg">
                          <div className="text-[10px] text-slate-500 uppercase">HP</div>
                          <div className="font-mono text-red-400 font-bold">{inspectedPlayer.hp}</div>
                      </div>
                      <div className="bg-slate-800 p-2 rounded-lg">
                          <div className="text-[10px] text-slate-500 uppercase">Mana</div>
                          <div className="font-mono text-blue-400 font-bold">{inspectedPlayer.mana}</div>
                      </div>
                      <div className="bg-slate-800 p-2 rounded-lg">
                          <div className="text-[10px] text-slate-500 uppercase">Gold</div>
                          <div className="font-mono text-yellow-400 font-bold">{inspectedPlayer.gold}</div>
                      </div>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <h4 className="text-xs font-bold text-emerald-400 uppercase mb-2">Lands ({inspectedPlayer.lands.length})</h4>
                          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                              {inspectedPlayer.lands.map((l, i) => (
                                  <div key={i} className="bg-emerald-900/20 border border-emerald-500/30 px-3 py-2 rounded text-xs text-emerald-100 whitespace-nowrap">
                                      {l.name}
                                  </div>
                              ))}
                              {inspectedPlayer.lands.length === 0 && <span className="text-xs text-slate-600">無產業</span>}
                          </div>
                      </div>
                      <div>
                          <h4 className="text-xs font-bold text-amber-400 uppercase mb-2">Artifacts ({inspectedPlayer.artifacts.length})</h4>
                          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                              {inspectedPlayer.artifacts.map((a, i) => (
                                  <div key={i} className="bg-amber-900/20 border border-amber-500/30 px-3 py-2 rounded text-xs text-amber-100 whitespace-nowrap">
                                      {a.name}
                                  </div>
                              ))}
                              {inspectedPlayer.artifacts.length === 0 && <span className="text-xs text-slate-600">無神器</span>}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Guide Modal */}
      {showGuideModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowGuideModal(false)}>
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl w-full max-w-lg shadow-2xl relative max-h-[80vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowGuideModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full"><X size={20}/></button>
                  <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2"><HelpCircle/> 簡易規則</h2>
                  <div className="text-sm text-slate-300 space-y-3">
                      <p>1. <b>元素反應</b>: 攻擊會對敵人掛載「印記」。用不同元素攻擊「有印記」的敵人會引爆反應。</p>
                      <p>2. <b>靈魂天平</b>: 打出神聖卡+1，邪惡卡-1。數值越高，同陣營卡牌越強。</p>
                      <p>3. <b>光之恩惠</b>: 當靈魂達到 <span className="text-yellow-400 font-bold">+3</span> 時，商店首購 <span className="text-white font-bold">50% OFF</span>。</p>
                  </div>
                  <div className="mt-6 text-center">
                      <button onClick={() => {setShowGuideModal(false); setPreviousScreen('game'); setScreen('guide');}} className="w-full py-3 bg-indigo-600 rounded-xl text-white font-bold">查看完整指南</button>
                  </div>
              </div>
          </div>
      )}

      {/* Quit Modal */}
      {showQuitModal && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowQuitModal(false)}>
              <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative text-center" onClick={e => e.stopPropagation()}>
                  <h2 className="text-xl font-bold mb-2 text-white">確定要離開嗎？</h2>
                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowQuitModal(false)} className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold rounded-xl">取消</button>
                      <button onClick={confirmLeaveGame} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl">離開</button>
                  </div>
              </div>
          </div>
      )}

      {/* Land Replace Modal */}
      {showReplaceModal && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl w-full max-w-md shadow-2xl relative text-center">
                  <h2 className="text-xl font-bold text-white mb-4">產業欄位已滿！</h2>
                  <p className="text-sm text-slate-400 mb-6">請選擇一個現有產業進行替換 (舊產業將被拆除)：</p>
                  <div className="grid grid-cols-1 gap-3">
                      {humanPlayer.lands.map((land, i) => (
                          <button key={i} onClick={() => handleLandReplace(i)} className="bg-emerald-900/20 hover:bg-emerald-900/40 border border-emerald-500/30 p-3 rounded-xl text-left flex justify-between items-center transition-all group">
                              <span className="font-bold text-emerald-100">{land.name}</span>
                              <span className="text-xs bg-black/30 px-2 py-1 rounded text-emerald-400 group-hover:bg-red-900/50 group-hover:text-red-300">替換</span>
                          </button>
                      ))}
                  </div>
                  <button onClick={() => setShowReplaceModal(null)} className="mt-6 text-slate-500 text-sm hover:text-white underline">取消建造</button>
              </div>
          </div>
      )}

      {/* Shop Modal */}
      {showShop && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4 animate-fade-in" onClick={() => setShowShop(false)}>
              <div className="bg-slate-900 border-t md:border border-slate-700 rounded-t-3xl md:rounded-3xl w-full max-w-5xl h-[85vh] shadow-2xl relative flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900 rounded-t-3xl">
                      <div>
                          <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ShoppingBag className="text-yellow-400"/> 商店</h2>
                          <div className="text-yellow-400 font-bold text-sm mt-1">{humanPlayer.gold} G</div>
                      </div>
                      <button onClick={() => setShowShop(false)} className="p-2 bg-slate-800 rounded-full text-slate-400"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/50 pb-20 relative">
                      {gameState.shopCards.map((card) => {
                          const isPurchased = card.purchasedByPlayerIds?.includes(humanPlayer.id);
                          let cost = card.cost;
                          let hasDiscount = false;
                          
                          if (humanPlayer.shopDiscount && !humanPlayer.hasPurchasedInShop) {
                              cost = Math.floor(cost * 0.5);
                              hasDiscount = true;
                          }
                          const canAfford = humanPlayer.gold >= cost;
                          
                          return (
                              <div key={card.id} className="flex flex-col gap-2 relative items-center group">
                                  <div onClick={() => !isPurchased && setShopSelectedCardId(card.id)} className={`relative transition-all w-fit cursor-pointer ${isPurchased ? 'opacity-30 grayscale' : 'active:scale-95 hover:scale-105'}`}>
                                      <CardComponent card={card} lang={lang} compact={true} showCost={false} />
                                      {!isPurchased && hasDiscount && <div className="absolute -top-2 -right-2 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">-50%</div>}
                                  </div>
                                  
                                  {/* Mobile: Hidden buy button (must tap card first), Desktop: Visible buy button */}
                                  <button 
                                    onClick={() => handleBuy(card)}
                                    disabled={isPurchased || !canAfford || !isHumanTurn}
                                    className={`hidden md:block w-[6.5rem] py-2 rounded-lg font-bold text-xs transition-all shadow-lg ${isPurchased ? 'bg-slate-800 text-slate-500' : canAfford ? 'bg-yellow-600 text-white hover:bg-yellow-500' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                                  >
                                      {isPurchased ? '已擁有' : `${cost}G`}
                                  </button>
                              </div>
                          )
                      })}
                  </div>

                  {/* Shop Details Overlay (Mobile Focus, also works on desktop for detail view) */}
                  {shopActiveCard && (
                      <div className="absolute inset-0 bg-slate-900/95 backdrop-blur z-20 flex flex-col items-center justify-center p-6 animate-fade-in">
                          <button onClick={() => setShopSelectedCardId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full"><X size={20}/></button>
                          <div className="scale-125 mb-6">
                              <CardComponent card={shopActiveCard} lang={lang} />
                          </div>
                          <div className="text-center space-y-2 mb-6 max-w-sm">
                              <h3 className="text-xl font-bold text-white">{shopActiveCard.name}</h3>
                              <p className="text-slate-400 text-sm bg-black/30 p-3 rounded-lg border border-white/10">{shopActiveCard.description}</p>
                          </div>
                          
                          {(() => {
                              const isPurchased = shopActiveCard.purchasedByPlayerIds?.includes(humanPlayer.id);
                              let cost = shopActiveCard.cost;
                              let hasDiscount = false;
                              if (humanPlayer.shopDiscount && !humanPlayer.hasPurchasedInShop) {
                                  cost = Math.floor(cost * 0.5);
                                  hasDiscount = true;
                              }
                              const canAfford = humanPlayer.gold >= cost;

                              return (
                                  <button 
                                    onClick={() => handleBuy(shopActiveCard)}
                                    disabled={isPurchased || !canAfford || !isHumanTurn}
                                    className={`w-full max-w-xs py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${isPurchased ? 'bg-slate-800 text-slate-500' : canAfford ? 'bg-yellow-600 text-white shadow-xl shadow-yellow-900/20 hover:scale-105 transition-transform' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                                  >
                                      {isPurchased ? '已擁有' : canAfford ? (hasDiscount ? <span className="flex gap-2"><s>{shopActiveCard.cost}G</s> {cost}G</span> : `購買 ${cost}G`) : `資金不足 (${cost}G)`}
                                  </button>
                              );
                          })()}
                      </div>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

export default App;
