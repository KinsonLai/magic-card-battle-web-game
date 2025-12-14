
import React, { useState, useEffect, useRef } from 'react';
import { NationType, GameSettings, Language, RoomPlayer, ChatMessage, RoomInfo } from '../types';
import { NATION_CONFIG } from '../constants';
import { DEFAULT_SETTINGS } from '../services/gameEngine';
import { socketService } from '../services/socketService';
import { TRANSLATIONS } from '../locales';
import { Crown, Users, TrendingUp, Zap, Settings, ArrowLeft, Bot, User, Copy, Play, Gem, ShoppingBag, RotateCcw, Shield, Trash2, Globe, Wifi, WifiOff, Loader2, Key, Server, Lock, Unlock, Search, Plus, Eye, EyeOff, LayoutList, LogOut } from 'lucide-react';

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
  
  // Online Browser State
  const [onlineRooms, setOnlineRooms] = useState<RoomInfo[]>([]);
  const [browserSearch, setBrowserSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null); // Room ID to join
  const [passwordInput, setPasswordInput] = useState('');
  
  // Create Room Form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomIsPublic, setNewRoomIsPublic] = useState(true);

  const [serverUrl, setServerUrl] = useState('');
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);

  // Local/Room State
  const [roomCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [isCopied, setIsCopied] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false); // Mobile drawer for settings
  
  // User State
  const [myName, setMyName] = useState('玩家 1');
  const [myNation, setMyNation] = useState<NationType>(NationType.FIGHTER);

  // Players State
  const [players, setPlayers] = useState<RoomPlayer[]>([
      { id: 'host_user', name: '玩家 1', nation: NationType.FIGHTER, isHost: true, isBot: false, isReady: true }
  ]);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS, roomCode });
  const [hostId, setHostId] = useState<string>('host_user');

  // Helper for safe translation
  const getNationName = (key: string) => {
      // @ts-ignore
      return t.nations[key]?.name || NATION_CONFIG[key]?.name || key;
  };

  // --- Handlers for Socket Events ---

  useEffect(() => {
      if (mode === 'online' && isConnected) {
          socketService.onRoomUpdate((updatedPlayers, newHostId) => {
              setPlayers(updatedPlayers);
              setHostId(newHostId);
          });
          
          socketService.onRoomsChanged(() => {
              refreshRoomList();
          });

          socketService.onSettingsUpdate((newSettings) => {
              setSettings(newSettings);
          });

          // Initial Fetch
          refreshRoomList();
      }
      return () => {}
  }, [mode, isConnected]);

  useEffect(() => {
      if (mode === 'online' && !isConnected && !isConnecting) {
          handleConnect();
      }
  }, [mode]);

  useEffect(() => {
      if (mode === 'local') {
        setPlayers(prev => prev.map(p => p.id === 'host_user' ? { ...p, name: myName, nation: myNation } : p));
      }
  }, [myName, myNation, mode]);

  const handleConnect = async () => {
      setIsConnecting(true);
      try {
          await socketService.connect(serverUrl || undefined);
          setIsConnected(true);
          setHostId(''); // Reset until joined
      } catch (e) {
          console.error("Connection failed", e);
          setIsConnected(false);
      } finally {
          setIsConnecting(false);
      }
  };

  const refreshRoomList = () => {
      socketService.getRooms((rooms) => {
          setOnlineRooms(rooms);
      });
  };

  const handleCreateOnlineRoom = () => {
      if (!isConnected) return;
      if (!newRoomName.trim()) { alert("請輸入房間名稱"); return; }

      socketService.createRoom({ 
          player: { name: myName, nation: myNation },
          roomName: newRoomName,
          password: newRoomPassword,
          isPublic: newRoomIsPublic
      }, (rid) => {
          setOnlineRoomId(rid);
          setShowCreateModal(false);
      });
  };

  const handleJoinAttempt = (room: RoomInfo) => {
      if (room.hasPassword) {
          setShowPasswordModal(room.id);
          setPasswordInput('');
      } else {
          executeJoin(room.id);
      }
  };

  const executeJoin = (rid: string, password?: string) => {
      socketService.joinRoom(rid, { name: myName, nation: myNation }, password, (success, msg, needsPassword) => {
          if (success) {
              setOnlineRoomId(rid);
              setShowPasswordModal(null);
          } else {
              if (needsPassword) {
                  alert("密碼錯誤");
              } else {
                  alert(msg || "加入失敗");
                  if (msg?.includes('不存在')) refreshRoomList();
              }
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

  const handleUpdateSettings = (newSettings: GameSettings) => {
      setSettings(newSettings);
      if (mode === 'online') {
          socketService.updateSettings(newSettings);
      }
  };

  // Local bot logic omitted for brevity (same as before)
  const handleAddBot = () => {
      if (mode === 'online') return;
      if (players.length >= settings.maxPlayers) return;
      const botId = `bot_${Date.now()}`;
      const botNames = ['電腦甲', '電腦乙', '電腦丙', '電腦丁'];
      const randomNation = Object.values(NationType)[Math.floor(Math.random() * 4)];
      setPlayers([...players, { id: botId, name: botNames[players.filter(p=>p.isBot).length % 4], nation: randomNation, isHost: false, isBot: true, isReady: true, botDifficulty: 'normal' }]);
  };
  const handleKick = (pid: string) => { if (mode !== 'online') setPlayers(players.filter(p => p.id !== pid)); };
  const handleChangeBotNation = (bid: string, n: NationType) => setPlayers(players.map(p => p.id === bid ? {...p, nation: n} : p));
  const handleChangeBotDifficulty = (bid: string, d: any) => setPlayers(players.map(p => p.id === bid ? {...p, botDifficulty: d} : p));

  const myId = mode === 'online' ? socketService.getId() : 'host_user';
  // Check if I am host based on Server Authority (hostId)
  const amIHost = mode === 'local' ? true : (myId === hostId);

  // Render Logic
  
  // 1. Online Browser View
  if (mode === 'online' && isConnected && !onlineRoomId) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col p-4 text-white font-sans">
               {/* Header */}
               <div className="w-full max-w-6xl mx-auto flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                      <button onClick={() => { socketService.disconnect(); setIsConnected(false); setMode('local'); }} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 border border-slate-700">
                          <ArrowLeft size={20}/>
                      </button>
                      <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="text-indigo-400"/> 線上大廳</h1>
                  </div>
                  <div className="flex gap-4 items-center">
                       {/* Profile Mini Edit */}
                       <div className="hidden md:flex items-center gap-2 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                            <input value={myName} onChange={e => setMyName(e.target.value)} className="bg-transparent border-none outline-none text-right text-sm w-24 focus:w-32 transition-all" placeholder="你的名字" />
                            <div className="h-4 w-px bg-slate-700"></div>
                            <select value={myNation} onChange={e => setMyNation(e.target.value as any)} className="bg-transparent text-xs font-bold outline-none text-indigo-400">
                                {Object.keys(NATION_CONFIG).map(k => <option key={k} value={k}>{getNationName(k)}</option>)}
                            </select>
                       </div>
                       <button onClick={() => { setNewRoomName(`${myName}的房間`); setShowCreateModal(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/50">
                           <Plus size={18}/> 建立房間
                       </button>
                  </div>
               </div>

               {/* Room List */}
               <div className="w-full max-w-6xl mx-auto bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[70vh]">
                    <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/50">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                            <input 
                                value={browserSearch}
                                onChange={e => setBrowserSearch(e.target.value)}
                                placeholder="搜尋房間..." 
                                className="w-full bg-slate-950 border border-slate-700 rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500"
                            />
                        </div>
                        <button onClick={refreshRoomList} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm"><RotateCcw size={14}/> 重新整理</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                        {onlineRooms.filter(r => r.name.toLowerCase().includes(browserSearch.toLowerCase())).map(room => (
                            <div key={room.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 transition-all group flex flex-col gap-3 relative overflow-hidden">
                                <div className="flex justify-between items-start z-10">
                                    <div className="font-bold text-lg truncate pr-2">{room.name}</div>
                                    {room.hasPassword ? <Lock size={16} className="text-yellow-500 shrink-0"/> : <Unlock size={16} className="text-emerald-500 shrink-0 opacity-50"/>}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-400 z-10">
                                    <span className="flex items-center gap-1"><User size={12}/> {room.hostName}</span>
                                    <span className="flex items-center gap-1"><Users size={12}/> {room.playerCount}/{room.maxPlayers}</span>
                                </div>
                                <div className="mt-auto pt-2 z-10">
                                    <button 
                                        onClick={() => handleJoinAttempt(room)}
                                        disabled={room.playerCount >= room.maxPlayers}
                                        className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${room.playerCount >= room.maxPlayers ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-indigo-600 text-white'}`}
                                    >
                                        {room.playerCount >= room.maxPlayers ? '已滿' : '加入'}
                                    </button>
                                </div>
                                {/* Background deco */}
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
                            </div>
                        ))}
                        {onlineRooms.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-500">
                                <Globe size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>目前沒有公開房間，建立一個吧！</p>
                            </div>
                        )}
                    </div>
               </div>

               {/* Create Room Modal */}
               {showCreateModal && (
                   <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                       <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                           <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus className="text-indigo-500"/> 建立新房間</h3>
                           
                           <div className="space-y-4">
                               <div>
                                   <label className="text-xs text-slate-500 font-bold mb-1 block">房間名稱</label>
                                   <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none"/>
                               </div>
                               <div>
                                   <label className="text-xs text-slate-500 font-bold mb-1 block">密碼 (選填)</label>
                                   <input value={newRoomPassword} onChange={e => setNewRoomPassword(e.target.value)} placeholder="留空則為公開無鎖" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none"/>
                               </div>
                               <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                                    <button onClick={() => setNewRoomIsPublic(!newRoomIsPublic)} className={`w-10 h-6 rounded-full p-1 transition-colors ${newRoomIsPublic ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${newRoomIsPublic ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </button>
                                    <span className="text-sm font-bold text-slate-300">{newRoomIsPublic ? '公開顯示 (在大廳可見)' : '私人 (只能透過代碼加入)'}</span>
                               </div>
                           </div>

                           <div className="flex gap-3 mt-8">
                               <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400 hover:text-white">取消</button>
                               <button onClick={handleCreateOnlineRoom} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg">建立</button>
                           </div>
                       </div>
                   </div>
               )}

               {/* Password Modal */}
               {showPasswordModal && (
                   <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPasswordModal(null)}>
                       <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                           <Lock size={48} className="mx-auto mb-4 text-yellow-500"/>
                           <h3 className="text-lg font-bold mb-2">此房間需要密碼</h3>
                           <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center text-lg tracking-widest mb-6 focus:border-indigo-500 outline-none" autoFocus/>
                           <button onClick={() => executeJoin(showPasswordModal, passwordInput)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white">確認</button>
                       </div>
                   </div>
               )}
          </div>
      );
  }

  // 2. Waiting Lobby (Local or Online Joined)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 text-white font-sans">
      
      {/* Header */}
      <div className="w-full max-w-7xl flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => { 
                    if(mode === 'online') { 
                        socketService.disconnect(); 
                        setOnlineRoomId(null); 
                        setIsConnected(false); // Reset to force re-listing if wanted, or just back to browser
                        setMode('online'); // Keep in online mode but go back to browser
                    } else {
                        onBack();
                    }
                }} 
                className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 border border-slate-700"
            >
                {mode === 'online' ? <LogOut size={20} className="text-red-400"/> : <ArrowLeft size={20}/>}
            </button>
            <div>
                <h1 className="text-2xl font-bold cinzel text-slate-100">{mode === 'online' ? '線上房間' : '準備大廳'}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className={`px-2 py-0.5 rounded border border-slate-700 font-mono tracking-wider ${mode === 'online' ? 'bg-indigo-900/30 text-indigo-400' : 'bg-slate-800'}`}>
                        {mode === 'online' ? (onlineRoomId || '---') : 'LOCAL MODE'}
                    </span>
                    {mode === 'online' && !isConnected && <span className="text-red-500 flex items-center gap-1"><WifiOff size={10}/> Disconnected</span>}
                </div>
            </div>
          </div>
          
          <div className="flex gap-2">
              {/* Settings Toggle for Mobile */}
              <button onClick={() => setShowSettingsDrawer(!showSettingsDrawer)} className="lg:hidden p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300">
                  <Settings size={20}/>
              </button>
          </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 lg:pb-12 relative">
          
          {/* LEFT: Player List */}
          <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col shadow-xl h-fit min-h-[500px]">
              
              {/* Room Info Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-bold flex items-center gap-2"><Users size={18}/> 玩家列表 ({players.length}/{settings.maxPlayers})</h3>
                  {mode === 'online' && (
                      <div className="flex items-center gap-3">
                          <div className="hidden md:flex items-center gap-2 bg-indigo-500/20 px-4 py-1.5 rounded-lg border border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                              <span className="text-lg font-mono font-black text-indigo-300 tracking-[0.15em]">{onlineRoomId}</span>
                              <button onClick={() => {navigator.clipboard.writeText(onlineRoomId!); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000)}} className="text-indigo-400 hover:text-white p-1 hover:bg-indigo-500/20 rounded transition-colors" title="複製代碼">
                                  {isCopied ? <span className="text-green-400 text-xs font-bold">OK</span> : <Copy size={16}/>}
                              </button>
                          </div>
                      </div>
                  )}
              </div>
              
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                  {players.map(player => {
                      const nationConfig = NATION_CONFIG[player.nation];
                      const isMe = mode === 'online' ? player.id === socketService.getId() : player.id === 'host_user';
                      
                      return (
                          <div key={player.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${isMe ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-950 border-slate-800'}`}>
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
                                      
                                      {mode === 'local' && isMe && player.isBot ? (
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
                                  {/* Host Controls for Local Bots */}
                                  {mode === 'local' && player.isBot && (
                                      <select 
                                          value={player.botDifficulty} 
                                          onChange={(e) => handleChangeBotDifficulty(player.id, e.target.value as any)}
                                          className="bg-slate-800 text-xs rounded border border-slate-700 px-2 py-1 outline-none focus:border-indigo-500 hidden md:block"
                                      >
                                          <option value="easy">簡單</option>
                                          <option value="normal">普通</option>
                                          <option value="hard">困難</option>
                                      </select>
                                  )}

                                  {/* Kick Button (Local Host Only) */}
                                  {mode === 'local' && !isMe && (
                                      <button onClick={() => handleKick(player.id)} className="p-2 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded-lg">
                                          <Trash2 size={16}/>
                                      </button>
                                  )}

                                  <div className={`w-3 h-3 rounded-full ${player.isReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                              </div>
                          </div>
                      );
                  })}
                  
                  {mode === 'local' && players.length < settings.maxPlayers && (
                      <button 
                        onClick={handleAddBot}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300 hover:bg-slate-900/50 transition-all flex items-center justify-center gap-2 font-bold"
                      >
                          <Bot size={18}/> 加入電腦玩家 (AI)
                      </button>
                  )}
              </div>
          </div>

          {/* RIGHT: Settings Panel (Drawer on Mobile, Sidebar on Desktop) */}
          <div className={`
              lg:col-span-4 flex flex-col gap-6 h-fit
              fixed lg:static inset-y-0 right-0 w-80 lg:w-auto bg-slate-950 lg:bg-transparent z-50 p-6 lg:p-0 border-l border-slate-800 lg:border-none transition-transform duration-300
              ${showSettingsDrawer ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
              <div className="flex justify-between items-center lg:hidden mb-4">
                  <h3 className="font-bold text-lg">房間設定</h3>
                  <button onClick={() => setShowSettingsDrawer(false)} className="p-2 bg-slate-800 rounded-full"><ArrowLeft size={16}/></button>
              </div>

              {/* My Profile (Edit in Lobby) */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
                  <h3 className="font-bold flex items-center gap-2 mb-4 text-indigo-400"><User size={18}/> 個人設定</h3>
                  <div className="space-y-4">
                      {mode === 'local' && (
                          <div>
                            <label className="text-xs text-slate-500 font-bold mb-1 block">暱稱</label>
                            <input value={myName} onChange={(e) => setMyName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"/>
                          </div>
                      )}
                      <div>
                          <label className="text-xs text-slate-500 font-bold mb-1 block">選擇國家</label>
                          <div className="grid grid-cols-2 gap-2">
                             {Object.entries(NATION_CONFIG).map(([key, config]) => (
                                 <button
                                    key={key}
                                    onClick={() => {
                                        setMyNation(key as NationType);
                                        // If local, update immediately. If online, TODO: implement update player packet
                                        if(mode === 'local') setPlayers(prev => prev.map(p => p.id === 'host_user' ? {...p, nation: key as NationType} : p));
                                    }}
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

              {/* Game Settings */}
              <div className={`bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col overflow-hidden ${(!amIHost) ? 'opacity-70 pointer-events-none' : ''}`}>
                  <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                     <h3 className="font-bold flex items-center gap-2 text-emerald-400"><Settings size={18}/> 規則設定 {!amIHost && '(房主專用)'}</h3>
                  </div>

                  <div className="flex border-b border-slate-800">
                      <button onClick={() => setActiveTab('basic')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'basic' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}>基礎</button>
                      <button onClick={() => setActiveTab('advanced')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'advanced' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}>進階</button>
                  </div>
                  
                  <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto">
                      {/* Simplified Settings Controls calling handleUpdateSettings */}
                      {activeTab === 'basic' ? (
                          <>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">人數上限 <span className="text-white">{settings.maxPlayers}</span></label>
                                  <input type="range" min="2" max="8" value={settings.maxPlayers} onChange={e => handleUpdateSettings({...settings, maxPlayers: parseInt(e.target.value)})} className="w-full accent-emerald-500"/>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">初始金錢 <span className="text-white">{settings.initialGold}</span></label>
                                  <input type="range" min="50" max="500" step="50" value={settings.initialGold} onChange={e => handleUpdateSettings({...settings, initialGold: parseInt(e.target.value)})} className="w-full accent-emerald-500"/>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">手牌上限 <span className="text-white">{settings.maxHandSize}</span></label>
                                  <input type="range" min="5" max="20" value={settings.maxHandSize} onChange={e => handleUpdateSettings({...settings, maxHandSize: parseInt(e.target.value)})} className="w-full accent-emerald-500"/>
                              </div>
                          </>
                      ) : (
                          <>
                              {/* Advanced settings... simplified for brevity, using same pattern */}
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">傷害倍率 <span className="text-red-400">x{settings.damageMultiplier}</span></label>
                                  <input type="range" min="0.5" max="3" step="0.5" value={settings.damageMultiplier} onChange={e => handleUpdateSettings({...settings, damageMultiplier: parseFloat(e.target.value)})} className="w-full accent-red-500"/>
                              </div>
                               <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">收入倍率 <span className="text-emerald-400">x{settings.incomeMultiplier}</span></label>
                                  <input type="range" min="0.5" max="3" step="0.5" value={settings.incomeMultiplier} onChange={e => handleUpdateSettings({...settings, incomeMultiplier: parseFloat(e.target.value)})} className="w-full accent-emerald-500"/>
                              </div>
                          </>
                      )}
                  </div>
              </div>
          </div>
          
          {/* Overlay for Mobile Drawer */}
          {showSettingsDrawer && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSettingsDrawer(false)}></div>}
      </div>

      {/* Footer Start Button */}
      <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 p-4 z-30 flex justify-center lg:static lg:bg-transparent lg:border-none lg:p-0">
          <div className="w-full max-w-7xl lg:grid lg:grid-cols-12 lg:gap-6">
              <div className="lg:col-span-8 lg:col-start-1">
                  {amIHost ? (
                      <button 
                        onClick={handleStartGame}
                        disabled={players.length < 2}
                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform active:scale-95 text-lg"
                      >
                          <Play size={24} fill="currentColor"/> 開始遊戲
                      </button>
                  ) : (
                      <div className="w-full py-4 bg-slate-800 text-slate-400 font-bold rounded-2xl text-center animate-pulse border border-slate-700">
                          等待房主開始...
                      </div>
                  )}
              </div>
          </div>
      </div>

    </div>
  );
};