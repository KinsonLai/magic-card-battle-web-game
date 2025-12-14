
import React, { useState, useEffect, useRef } from 'react';
import { NationType, GameSettings, Language, RoomPlayer, ChatMessage } from '../types';
import { NATION_CONFIG } from '../constants';
import { DEFAULT_SETTINGS } from '../services/gameEngine';
import { socketService } from '../services/socketService';
import { TRANSLATIONS } from '../locales';
import { Crown, Users, TrendingUp, Zap, Settings, ArrowLeft, Bot, User, Copy, Play, Gem, ShoppingBag, RotateCcw, Shield, Trash2, Globe, Wifi, WifiOff, Loader2, Key, Server } from 'lucide-react';

interface LobbyScreenProps {
  onStart: (players: RoomPlayer[], settings: GameSettings, isOnline?: boolean) => void;
  onBack: () => void;
  lang: Language;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStart, onBack, lang }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW']; 
  const [mode, setMode] = useState<'local' | 'online'>('local');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  
  // Default to localhost for dev, but could be window.location.origin in prod
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);

  // Local Room State
  const [roomCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [isCopied, setIsCopied] = useState(false);
  
  // User State
  const [myName, setMyName] = useState('玩家 1');
  const [myNation, setMyNation] = useState<NationType>(NationType.FIGHTER);

  // Players State
  const [players, setPlayers] = useState<RoomPlayer[]>([
      { id: 'host_user', name: '玩家 1', nation: NationType.FIGHTER, isHost: true, isBot: false, isReady: true }
  ]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS, roomCode });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper for safe translation
  const getNationName = (key: string) => {
      // @ts-ignore
      return t.nations[key]?.name || NATION_CONFIG[key]?.name || key;
  };

  // Handle Socket Events for Online Mode
  useEffect(() => {
      if (mode === 'online' && isConnected) {
          socketService.onRoomUpdate((updatedPlayers, hostId) => {
              setPlayers(updatedPlayers);
          });

          return () => {
              // cleanup listeners if needed
          }
      }
  }, [mode, isConnected]);

  // Auto Connect when switching to Online Mode
  useEffect(() => {
      if (mode === 'online' && !isConnected && !isConnecting) {
          handleConnect();
      }
  }, [mode]);

  // Sync my local changes to player list (Local Mode Only)
  useEffect(() => {
      if (mode === 'local') {
        setPlayers(prev => prev.map(p => p.id === 'host_user' ? { ...p, name: myName, nation: myNation } : p));
      }
  }, [myName, myNation, mode]);

  // Scroll chat
  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleConnect = async () => {
      setIsConnecting(true);
      try {
          await socketService.connect(serverUrl);
          setIsConnected(true);
      } catch (e) {
          console.error("Connection failed", e);
          setIsConnected(false);
      } finally {
          setIsConnecting(false);
      }
  };

  const handleCreateOnlineRoom = () => {
      if (!isConnected) return;
      socketService.createRoom({ name: myName, nation: myNation }, (rid) => {
          setOnlineRoomId(rid);
          setChatMessages([{ id: 'sys', sender: 'System', text: `已建立房間: ${rid}`, isSystem: true }]);
      });
  };

  const handleJoinOnlineRoom = () => {
      if (!isConnected || !roomIdInput) return;
      socketService.joinRoom(roomIdInput, { name: myName, nation: myNation }, (success, msg) => {
          if (success) {
              setOnlineRoomId(roomIdInput);
              setChatMessages([{ id: 'sys', sender: 'System', text: `已加入房間: ${roomIdInput}`, isSystem: true }]);
          } else {
              alert(msg || "加入失敗");
          }
      });
  };

  const handleStartGame = () => {
      if (mode === 'online') {
          socketService.startGame();
      } else {
          onStart(players, settings, false);
      }
  };

  const handleAddBot = () => {
      if (mode === 'online') return;
      if (players.length >= settings.maxPlayers) return;
      const botId = `bot_${Date.now()}`;
      const botNames = ['電腦甲', '電腦乙', '電腦丙', '電腦丁', '電腦戊'];
      const nationKeys = Object.values(NationType);
      const randomNation = nationKeys[Math.floor(Math.random() * nationKeys.length)];
      
      const newBot: RoomPlayer = {
          id: botId,
          name: botNames[players.filter(p => p.isBot).length % botNames.length],
          nation: randomNation,
          isHost: false,
          isBot: true,
          isReady: true,
          botDifficulty: 'normal'
      };
      setPlayers([...players, newBot]);
  };

  const handleKick = (playerId: string) => {
      if (mode === 'online') return; 
      setPlayers(players.filter(p => p.id !== playerId));
  };

  const handlePassHost = (playerId: string) => {
      if (mode === 'online') return;
      setPlayers(players.map(p => ({
          ...p,
          isHost: p.id === playerId
      })));
  };

  const handleChangeBotDifficulty = (botId: string, diff: 'easy'|'normal'|'hard') => {
      setPlayers(players.map(p => p.id === botId ? { ...p, botDifficulty: diff } : p));
  };

  const handleChangeBotNation = (botId: string, nation: NationType) => {
      setPlayers(players.map(p => p.id === botId ? { ...p, nation: nation } : p));
  };

  const handleResetSettings = () => {
      setSettings({ ...DEFAULT_SETTINGS, roomCode });
  };

  const handleShare = () => {
      const code = mode === 'online' ? onlineRoomId : roomCode;
      if (code) {
        navigator.clipboard.writeText(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
  };

  const myId = mode === 'online' ? socketService.getId() : 'host_user';
  const isHost = players.find(p => p.id === myId)?.isHost ?? (mode === 'local');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 text-white font-sans">
      
      {/* Header */}
      <div className="w-full max-w-7xl flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-4">
            <button onClick={() => { socketService.disconnect(); onBack(); }} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 border border-slate-700">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-2xl font-bold cinzel text-slate-100">準備大廳</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className={`px-2 py-0.5 rounded border border-slate-700 font-mono tracking-wider ${mode === 'online' && isConnected ? 'bg-green-900/30 text-green-400' : 'bg-slate-800'}`}>
                        {mode === 'online' ? (onlineRoomId || 'LOBBY') : 'LOCAL'}
                    </span>
                </div>
            </div>
          </div>
          
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button 
                onClick={() => { setMode('local'); setIsConnected(false); socketService.disconnect(); setPlayers([{ id: 'host_user', name: myName, nation: myNation, isHost: true, isBot: false, isReady: true }]); }}
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'local' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  <Bot size={16}/> 單機 / AI
              </button>
              <button 
                onClick={() => { setMode('online'); setPlayers([]); setShowServerSettings(false); }}
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${mode === 'online' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  <Globe size={16}/> 線上連線
              </button>
          </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          
          {/* LEFT: Player List & Connection */}
          <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl h-fit min-h-[500px]">
              
              {/* Online Connection Panel */}
              {mode === 'online' && !onlineRoomId && (
                  <div className="p-8 flex flex-col items-center justify-center h-full space-y-8 animate-fade-in">
                      
                      {/* Connection Status */}
                      <div className="text-center space-y-2">
                          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                              {isConnecting ? <Loader2 className="animate-spin text-yellow-500"/> : isConnected ? <Wifi className="text-green-500"/> : <WifiOff className="text-red-500"/>}
                              {isConnecting ? '正在連接伺服器...' : isConnected ? '已連線至對戰伺服器' : '無法連接至伺服器'}
                          </h2>
                          {!isConnected && !isConnecting && <p className="text-red-400 text-sm">請檢查伺服器是否已啟動，或嘗試手動設定網址。</p>}
                      </div>

                      {/* Main Actions (Only when connected) */}
                      {isConnected && (
                          <div className="w-full max-w-md space-y-6">
                              
                              {/* My Profile Preview */}
                              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex gap-4 items-end">
                                  <div className="flex-1">
                                      <label className="text-xs text-slate-500 font-bold mb-1 block">你的暱稱</label>
                                      <input 
                                          value={myName}
                                          onChange={e => setMyName(e.target.value)}
                                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                          placeholder="輸入暱稱"
                                      />
                                  </div>
                                  <div className="flex-1">
                                      <label className="text-xs text-slate-500 font-bold mb-1 block">選擇勢力</label>
                                      <select 
                                          value={myNation}
                                          onChange={e => setMyNation(e.target.value as NationType)}
                                          className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                                      >
                                          {Object.entries(NATION_CONFIG).map(([k, v]) => (
                                              <option key={k} value={k}>{getNationName(k)}</option>
                                          ))}
                                      </select>
                                  </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Create Room Button */}
                                  <button 
                                    onClick={handleCreateOnlineRoom} 
                                    className="p-6 bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/50 hover:bg-emerald-600/30 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all group"
                                  >
                                      <div className="p-3 bg-emerald-500/20 rounded-full group-hover:scale-110 transition-transform">
                                        <Crown size={32} className="text-emerald-400"/>
                                      </div>
                                      <span className="font-bold text-lg text-emerald-100">建立房間 (Create)</span>
                                      <span className="text-xs text-emerald-300/60">生成一組新的房間代碼</span>
                                  </button>

                                  {/* Join Room Input */}
                                  <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-2xl flex flex-col gap-3">
                                      <div className="flex items-center gap-2 text-slate-300 font-bold justify-center">
                                          <Key size={18} /> 加入房間 (Join)
                                      </div>
                                      <div className="flex gap-2 mt-2">
                                          <input 
                                              value={roomIdInput}
                                              onChange={e => setRoomIdInput(e.target.value.toUpperCase())}
                                              placeholder="輸入代碼 (CODE)"
                                              className="w-full bg-slate-950 border border-slate-600 rounded-lg px-3 py-2 text-center font-mono text-sm tracking-widest uppercase focus:border-indigo-500 outline-none"
                                              maxLength={6}
                                          />
                                          <button 
                                            onClick={handleJoinOnlineRoom} 
                                            disabled={!roomIdInput}
                                            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg text-white transition-colors"
                                          >
                                              <ArrowLeft size={20} className="rotate-180"/>
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Retry / Server Settings Toggle */}
                      {!isConnected && !isConnecting && (
                          <div className="w-full max-w-md flex flex-col items-center gap-4">
                              <button 
                                onClick={handleConnect}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30 transition-all"
                              >
                                  <RotateCcw size={16}/> 重試連線
                              </button>
                              
                              <button onClick={() => setShowServerSettings(!showServerSettings)} className="text-xs text-slate-500 hover:text-slate-300 underline flex items-center gap-1">
                                  <Server size={12}/> 伺服器設定
                              </button>

                              {showServerSettings && (
                                  <div className="w-full bg-slate-950 border border-slate-800 p-4 rounded-lg animate-fade-in-up">
                                      <label className="text-xs text-slate-500 font-bold mb-1 block">Socket.IO Server URL</label>
                                      <div className="flex gap-2">
                                          <input 
                                              value={serverUrl} 
                                              onChange={(e) => setServerUrl(e.target.value)}
                                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-300"
                                          />
                                          <button onClick={handleConnect} className="text-xs bg-slate-800 px-3 py-1 rounded border border-slate-700 hover:bg-slate-700">Save & Connect</button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}

              {/* Player List (Local or Online Connected) */}
              {(mode === 'local' || onlineRoomId) && (
                <>
                  <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                      <h3 className="font-bold flex items-center gap-2"><Users size={18}/> 玩家列表 ({players.length}/{settings.maxPlayers})</h3>
                      {mode === 'online' && (
                          <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Room Code:</span>
                              <div className="flex items-center gap-2 bg-indigo-500/20 px-4 py-1.5 rounded-lg border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                                  <span className="text-lg font-mono font-black text-indigo-300 tracking-[0.15em]">{onlineRoomId}</span>
                                  <button onClick={handleShare} className="text-indigo-400 hover:text-white p-1 hover:bg-indigo-500/20 rounded transition-colors" title="複製代碼">
                                      {isCopied ? <span className="text-green-400 text-xs font-bold">COPIED</span> : <Copy size={16}/>}
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                      {players.map(player => {
                          const nationConfig = NATION_CONFIG[player.nation];
                          const isMe = player.id === myId;
                          return (
                              <div key={player.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${isMe ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}>
                                  <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg ${nationConfig.bgColor} ${nationConfig.borderColor}`}>
                                          {player.nation === NationType.FIGHTER && <Crown size={20} className={nationConfig.color} />}
                                          {player.nation === NationType.HOLY && <Users size={20} className={nationConfig.color} />}
                                          {player.nation === NationType.COMMERCIAL && <TrendingUp size={20} className={nationConfig.color} />}
                                          {player.nation === NationType.MAGIC && <Zap size={20} className={nationConfig.color} />}
                                      </div>
                                      
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <span className="font-bold text-lg">{player.name}</span>
                                              {player.isHost && <Crown size={14} className="text-yellow-400 fill-yellow-400"/>}
                                              {player.isBot && <Bot size={14} className="text-cyan-400"/>}
                                              {isMe && <span className="text-[10px] bg-indigo-600 px-1.5 rounded text-white">YOU</span>}
                                          </div>
                                          
                                          {mode === 'local' && isHost && player.isBot ? (
                                             <select 
                                                value={player.nation} 
                                                onChange={(e) => handleChangeBotNation(player.id, e.target.value as NationType)}
                                                className="bg-slate-900 text-xs font-bold uppercase tracking-wider rounded border border-slate-700 px-1 py-0.5 outline-none focus:border-indigo-500 mt-1"
                                             >
                                                {Object.entries(NATION_CONFIG).map(([k, v]) => (
                                                    <option key={k} value={k}>{getNationName(k)}</option>
                                                ))}
                                             </select>
                                          ) : (
                                            <div className={`text-xs ${nationConfig.color} font-bold uppercase tracking-wider mt-1`}>
                                                {getNationName(player.nation)}
                                            </div>
                                          )}
                                      </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                      {mode === 'local' && player.isBot && isHost && (
                                          <select 
                                              value={player.botDifficulty} 
                                              onChange={(e) => handleChangeBotDifficulty(player.id, e.target.value as any)}
                                              className="bg-slate-800 text-xs rounded border border-slate-700 px-2 py-1 outline-none focus:border-indigo-500"
                                          >
                                              <option value="easy">簡單</option>
                                              <option value="normal">普通</option>
                                              <option value="hard">困難</option>
                                          </select>
                                      )}

                                      {mode === 'local' && isHost && !isMe && (
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              {!player.isBot && (
                                                <button 
                                                    onClick={() => handlePassHost(player.id)}
                                                    className="p-2 hover:bg-yellow-900/30 text-slate-500 hover:text-yellow-400 rounded-lg tooltip"
                                                    title="移交房主"
                                                >
                                                    <Shield size={16}/>
                                                </button>
                                              )}
                                              <button 
                                                  onClick={() => handleKick(player.id)}
                                                  className="p-2 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-lg tooltip"
                                                  title="踢出"
                                              >
                                                  <Trash2 size={16}/>
                                              </button>
                                          </div>
                                      )}

                                      <div className={`w-3 h-3 rounded-full ${player.isReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                                  </div>
                              </div>
                          );
                      })}
                      
                      {mode === 'local' && isHost && players.length < settings.maxPlayers && (
                          <button 
                            onClick={handleAddBot}
                            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300 hover:bg-slate-900/50 transition-all flex items-center justify-center gap-2 font-bold"
                          >
                              <Bot size={18}/> 加入電腦玩家 (AI)
                          </button>
                      )}
                  </div>
                </>
              )}
          </div>

          {/* RIGHT: Settings & Profile */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-fit">
              
              {/* My Profile (Local Only - Online handles in connection panel) */}
              {mode === 'local' && (
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
                      <h3 className="font-bold flex items-center gap-2 mb-4 text-indigo-400"><User size={18}/> 個人設定</h3>
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs text-slate-500 font-bold mb-1 block">暱稱</label>
                              <input 
                                  type="text" 
                                  value={myName}
                                  onChange={(e) => setMyName(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                              />
                          </div>
                          <div>
                              <label className="text-xs text-slate-500 font-bold mb-1 block">選擇國家</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {Object.entries(NATION_CONFIG).map(([key, config]) => (
                                     <button
                                        key={key}
                                        onClick={() => setMyNation(key as NationType)}
                                        className={`p-2 rounded border text-xs text-left transition-all ${myNation === key ? `${config.bgColor} ${config.borderColor} shadow-lg` : 'bg-slate-950 border-slate-800 hover:bg-slate-800'}`}
                                     >
                                         <div className={`font-bold ${config.color}`}>
                                             {getNationName(key)}
                                         </div>
                                     </button>
                                 ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Game Settings */}
              <div className={`bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col overflow-hidden ${mode === 'online' ? 'opacity-70 pointer-events-none grayscale' : ''}`}>
                  <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                     <h3 className="font-bold flex items-center gap-2 text-emerald-400"><Settings size={18}/> 遊戲規則 {mode==='online' && '(由伺服器控制)'}</h3>
                     {isHost && mode === 'local' && <button onClick={handleResetSettings} className="text-xs text-slate-500 hover:text-white flex items-center gap-1" title="重置"><RotateCcw size={12}/> 默認</button>}
                  </div>

                  <div className="flex border-b border-slate-800">
                      <button onClick={() => setActiveTab('basic')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'basic' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}>基礎設定</button>
                      <button onClick={() => setActiveTab('advanced')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'advanced' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}>進階設定</button>
                  </div>
                  
                  <div className={`p-5 space-y-4 max-h-[400px] overflow-y-auto ${(!isHost || mode === 'online') ? 'opacity-70 pointer-events-none' : ''}`}>
                      {activeTab === 'basic' ? (
                          <>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      玩家人數上限 <span className="text-white">{settings.maxPlayers}</span>
                                  </label>
                                  <input type="range" min="2" max="8" value={settings.maxPlayers} onChange={e => setSettings({...settings, maxPlayers: parseInt(e.target.value)})} className="w-full accent-emerald-500"/>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      初始金錢 <span className="text-white">{settings.initialGold}</span>
                                  </label>
                                  <input type="range" min="50" max="500" step="50" value={settings.initialGold} onChange={e => setSettings({...settings, initialGold: parseInt(e.target.value)})} className="w-full accent-emerald-500"/>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      手牌上限 <span className="text-white">{settings.maxHandSize}</span>
                                  </label>
                                  <input type="range" min="5" max="20" value={settings.maxHandSize} onChange={e => setSettings({...settings, maxHandSize: parseInt(e.target.value)})} className="w-full accent-emerald-500"/>
                              </div>
                          </>
                      ) : (
                          <>
                               <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      每回合抽卡 <span className="text-white">{settings.cardsDrawPerTurn}</span>
                                  </label>
                                  <input type="range" min="1" max="5" value={settings.cardsDrawPerTurn} onChange={e => setSettings({...settings, cardsDrawPerTurn: parseInt(e.target.value)})} className="w-full accent-purple-500"/>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      商店卡牌數 <span className="text-white">{settings.shopSize}</span>
                                  </label>
                                  <input type="range" min="3" max="8" value={settings.shopSize} onChange={e => setSettings({...settings, shopSize: parseInt(e.target.value)})} className="w-full accent-purple-500"/>
                              </div>
                              <div className="pt-2 border-t border-slate-800">
                                  <label className="text-xs text-slate-400 font-bold block mb-2">數值倍率</label>
                                  <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1"><span>收入</span> <span className="text-emerald-400">x{settings.incomeMultiplier}</span></div>
                                        <input type="range" min="0.5" max="3" step="0.5" value={settings.incomeMultiplier} onChange={e => setSettings({...settings, incomeMultiplier: parseFloat(e.target.value)})} className="w-full accent-emerald-500"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1"><span>傷害</span> <span className="text-red-400">x{settings.damageMultiplier}</span></div>
                                        <input type="range" min="0.5" max="3" step="0.5" value={settings.damageMultiplier} onChange={e => setSettings({...settings, damageMultiplier: parseFloat(e.target.value)})} className="w-full accent-red-500"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1"><span>血量</span> <span className="text-green-400">x{settings.healthMultiplier}</span></div>
                                        <input type="range" min="0.5" max="3" step="0.5" value={settings.healthMultiplier} onChange={e => setSettings({...settings, healthMultiplier: parseFloat(e.target.value)})} className="w-full accent-green-500"/>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1"><span>物價</span> <span className="text-yellow-400">x{settings.priceMultiplier}</span></div>
                                        <input type="range" min="0.5" max="2" step="0.1" value={settings.priceMultiplier} onChange={e => setSettings({...settings, priceMultiplier: parseFloat(e.target.value)})} className="w-full accent-yellow-500"/>
                                    </div>
                                  </div>
                              </div>
                              <div className="pt-2 border-t border-slate-800">
                                  <label className="text-xs text-slate-500 font-bold flex items-center gap-1 mb-2">
                                      <Gem size={12}/> 卡牌稀有度權重
                                  </label>
                                  <div className="space-y-2">
                                      <div className="flex items-center text-xs gap-2"><span className="w-12 text-slate-400">Common</span><input type="range" min="0" max="100" value={settings.rarityWeights?.common} onChange={e => setSettings({...settings, rarityWeights: {...settings.rarityWeights!, common: parseInt(e.target.value)}})} className="flex-1 accent-slate-500"/></div>
                                      <div className="flex items-center text-xs gap-2"><span className="w-12 text-blue-400">Rare</span><input type="range" min="0" max="100" value={settings.rarityWeights?.rare} onChange={e => setSettings({...settings, rarityWeights: {...settings.rarityWeights!, rare: parseInt(e.target.value)}})} className="flex-1 accent-blue-500"/></div>
                                      <div className="flex items-center text-xs gap-2"><span className="w-12 text-purple-400">Epic</span><input type="range" min="0" max="100" value={settings.rarityWeights?.epic} onChange={e => setSettings({...settings, rarityWeights: {...settings.rarityWeights!, epic: parseInt(e.target.value)}})} className="flex-1 accent-purple-500"/></div>
                                      <div className="flex items-center text-xs gap-2"><span className="w-12 text-orange-400">Legend</span><input type="range" min="0" max="100" value={settings.rarityWeights?.legendary} onChange={e => setSettings({...settings, rarityWeights: {...settings.rarityWeights!, legendary: parseInt(e.target.value)}})} className="flex-1 accent-orange-500"/></div>
                                  </div>
                              </div>
                          </>
                      )}
                  </div>

                  {/* Start Button */}
                  <div className="p-4 border-t border-slate-800 bg-slate-900">
                      {isHost ? (
                          <button 
                            onClick={handleStartGame}
                            disabled={players.length < 2}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform active:scale-95"
                          >
                              <Play size={20} fill="currentColor"/> {mode === 'online' ? '要求開始遊戲' : '開始遊戲'}
                          </button>
                      ) : (
                          <div className="w-full py-3 bg-slate-800 text-slate-400 font-bold rounded-xl text-center animate-pulse">
                              等待房主開始...
                          </div>
                      )}
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};
