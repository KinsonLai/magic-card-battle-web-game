
import React, { useState, useEffect } from 'react';
import { NationType, GameSettings, Language, RoomPlayer, RoomInfo } from '../types';
import { NATION_CONFIG } from '../constants';
import { DEFAULT_SETTINGS } from '../services/gameEngine';
import { socketService } from '../services/socketService';
import { TRANSLATIONS } from '../locales';
import { Crown, Users, TrendingUp, Zap, Settings, ArrowLeft, Bot, User, Copy, Play, RotateCcw, Trash2, Globe, Wifi, WifiOff, Lock, Unlock, Search, Plus, CheckCircle, AlertCircle, LogOut, ChevronRight, X, UserPlus, Server } from 'lucide-react';

interface LobbyScreenProps {
  onStart: (players: RoomPlayer[], settings: GameSettings, isOnline?: boolean) => void;
  onBack: () => void;
  lang: Language;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStart, onBack, lang }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW']; 
  
  // High Level State
  const [mode, setMode] = useState<'local' | 'online'>('local'); // Default to local, user can switch
  const [view, setView] = useState<'browser' | 'room'>('browser'); // Browser list or Inside Room
  
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Online Browser State
  const [onlineRooms, setOnlineRooms] = useState<RoomInfo[]>([]);
  const [browserSearch, setBrowserSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null); 
  const [passwordInput, setPasswordInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  
  // Create Room Form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomIsPublic, setNewRoomIsPublic] = useState(true);

  // Room State (Shared for Local/Online)
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [roomCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase()); // Local code
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  // User/Player State
  const [myName, setMyName] = useState('Player 1');
  const [myNation, setMyNation] = useState<NationType>(NationType.FIGHTER);
  const [players, setPlayers] = useState<RoomPlayer[]>([
      { id: 'host_user', name: 'Player 1', nation: NationType.FIGHTER, isHost: true, isBot: false, isReady: true }
  ]);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS, roomCode });
  const [hostId, setHostId] = useState<string>('host_user');

  // Helpers
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const getNationName = (key: string) => {
      // @ts-ignore
      return t.nations[key]?.name || NATION_CONFIG[key]?.name || key;
  };

  const myId = mode === 'online' ? socketService.getId() : 'host_user';
  const amIHost = mode === 'local' ? true : (myId === hostId);

  // --- Socket Effects ---

  useEffect(() => {
      if (mode === 'online' && isConnected) {
          socketService.onRoomUpdate((updatedPlayers, newHostId) => {
              setPlayers(updatedPlayers);
              setHostId(newHostId);
              // If we are in browser view but get a room update (reconnect scenario?), switch to room
              if (view === 'browser' && updatedPlayers.length > 0) {
                  setView('room');
              }
          });
          
          socketService.onRoomsChanged(() => {
              refreshRoomList();
          });

          socketService.onSettingsUpdate((newSettings) => {
              setSettings(newSettings);
          });

          socketService.onKicked(() => {
              showToast("你被踢出了房間", 'error');
              setOnlineRoomId(null);
              setView('browser');
              setPlayers([]);
          });

          refreshRoomList();
      }
  }, [mode, isConnected, view]);

  // Auto-connect when switching to online mode
  useEffect(() => {
      if (mode === 'online' && !isConnected && !isConnecting) {
          handleConnect();
      }
      if (mode === 'local') {
          // Reset players for local
          setPlayers([{ id: 'host_user', name: myName, nation: myNation, isHost: true, isBot: false, isReady: true }]);
          setView('room'); // Local always starts in room view
      }
  }, [mode]);

  // Sync Local Player info
  useEffect(() => {
      if (mode === 'local') {
        setPlayers(prev => prev.map(p => p.id === 'host_user' ? { ...p, name: myName, nation: myNation } : p));
      }
  }, [myName, myNation, mode]);

  // --- Actions ---

  const handleConnect = async () => {
      setIsConnecting(true);
      try {
          await socketService.connect();
          setIsConnected(true);
      } catch (e) {
          console.error("Connection failed", e);
          setIsConnected(false);
          showToast("無法連接到伺服器", 'error');
          setMode('local');
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
      if (!newRoomName.trim()) { showToast("請輸入房間名稱", 'error'); return; }

      socketService.createRoom({ 
          player: { name: myName, nation: myNation },
          roomName: newRoomName,
          password: newRoomPassword,
          isPublic: newRoomIsPublic
      }, (rid) => {
          setOnlineRoomId(rid);
          setView('room');
          setShowCreateModal(false);
      });
  };

  const handleJoinByCode = () => {
      if (!joinCodeInput.trim()) return;
      executeJoin(joinCodeInput);
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
              setView('room');
          } else {
              if (needsPassword) {
                  showToast("密碼錯誤", 'error');
              } else {
                  showToast(msg || "加入失敗", 'error');
              }
          }
      });
  };

  const handleLeaveRoom = () => {
      if (mode === 'online') {
          // If we disconnect socket, we leave the room. 
          // Reconnecting keeps us in browser.
          socketService.disconnect();
          setIsConnected(false);
          setOnlineRoomId(null);
          setMode('online'); // Trigger reconnect logic which puts us in browser
          setView('browser');
      } else {
          onBack();
      }
  };

  // --- Room Management (Host) ---

  const handleAddBot = () => {
      if (players.length >= settings.maxPlayers) return;
      
      if (mode === 'online') {
          socketService.addBot();
      } else {
          const botId = `bot_${Date.now()}`;
          const botNames = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'];
          const randomNation = Object.values(NationType)[Math.floor(Math.random() * 4)];
          setPlayers([...players, { 
              id: botId, 
              name: botNames[players.filter(p=>p.isBot).length % 5], 
              nation: randomNation, 
              isHost: false, 
              isBot: true, 
              isReady: true, 
              botDifficulty: 'normal' 
          }]);
      }
  };

  const handleKick = (pid: string) => {
      if (mode === 'online') {
          socketService.kickPlayer(pid);
      } else {
          setPlayers(players.filter(p => p.id !== pid));
      }
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
      setSettings(newSettings);
      if (mode === 'online') socketService.updateSettings(newSettings);
  };

  const handleStartGame = () => {
      if (mode === 'online') {
          socketService.startGame();
      } else {
          onStart(players, settings, false);
      }
  };

  // --- RENDERERS ---

  // 1. Browser View
  if (mode === 'online' && view === 'browser') {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col p-4 md:p-8 font-sans text-slate-200">
                {notification && (
                   <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 animate-fade-in ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                       {notification.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
                       {notification.message}
                   </div>
               )}

               <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
                   {/* Top Bar */}
                   <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                       <div className="flex items-center gap-4 w-full md:w-auto">
                           <button onClick={() => { socketService.disconnect(); setIsConnected(false); setMode('local'); onBack(); }} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                               <ArrowLeft size={20}/>
                           </button>
                           <div>
                               <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                                   <Globe className="text-indigo-500"/> 多人連線大廳
                               </h1>
                               <div className="flex items-center gap-2 mt-1">
                                   <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-red-500'}`}></span>
                                   <span className="text-xs text-slate-400 font-mono">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                               </div>
                           </div>
                       </div>

                       <div className="flex gap-3 w-full md:w-auto">
                           {/* Profile Mini-Card */}
                           <div className="hidden md:flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 pr-4 rounded-xl shadow-lg">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${NATION_CONFIG[myNation].bgColor} border ${NATION_CONFIG[myNation].borderColor}`}>
                                   <User size={16} className={NATION_CONFIG[myNation].color}/>
                               </div>
                               <div className="flex flex-col">
                                   <input value={myName} onChange={e => setMyName(e.target.value)} className="bg-transparent text-sm font-bold w-24 outline-none text-white placeholder-slate-600" placeholder="Name" />
                                   <select value={myNation} onChange={e => setMyNation(e.target.value as any)} className="bg-transparent text-[10px] text-slate-400 outline-none uppercase font-bold tracking-wider -ml-1">
                                       {Object.keys(NATION_CONFIG).map(k => <option key={k} value={k}>{getNationName(k)}</option>)}
                                   </select>
                               </div>
                           </div>

                           <button onClick={() => { setNewRoomName(`${myName}的房間`); setShowCreateModal(true); }} className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 transition-transform active:scale-95">
                               <Plus size={18} strokeWidth={3}/> 建立房間
                           </button>
                       </div>
                   </div>

                   {/* Browser Area */}
                   <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                       
                       {/* Left: Server List */}
                       <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm shadow-xl">
                           <div className="p-4 border-b border-slate-800 flex gap-3 bg-slate-900/80">
                               <div className="relative flex-1">
                                   <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                   <input 
                                       value={browserSearch}
                                       onChange={e => setBrowserSearch(e.target.value)}
                                       placeholder="搜尋伺服器..." 
                                       className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                                   />
                               </div>
                               <button onClick={refreshRoomList} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700">
                                   <RotateCcw size={18}/>
                               </button>
                           </div>

                           <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                               {onlineRooms.filter(r => r.name.toLowerCase().includes(browserSearch.toLowerCase())).map(room => (
                                   <div key={room.id} className="group bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl flex items-center justify-between transition-all hover:shadow-lg hover:shadow-indigo-900/10 relative overflow-hidden">
                                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                       
                                       <div className="flex flex-col gap-1 z-10">
                                           <div className="flex items-center gap-2">
                                               <h3 className="font-bold text-lg text-slate-200 group-hover:text-white transition-colors">{room.name}</h3>
                                               {room.hasPassword && <Lock size={14} className="text-yellow-500"/>}
                                           </div>
                                           <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                                               <span className="flex items-center gap-1"><User size={12}/> {room.hostName}</span>
                                               <span className="flex items-center gap-1"><Server size={12}/> {room.id}</span>
                                           </div>
                                       </div>

                                       <div className="flex items-center gap-4 z-10">
                                           <div className="text-right">
                                               <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Players</div>
                                               <div className={`font-mono font-bold ${room.playerCount >= room.maxPlayers ? 'text-red-400' : 'text-emerald-400'}`}>
                                                   {room.playerCount} / {room.maxPlayers}
                                               </div>
                                           </div>
                                           <button 
                                               onClick={() => handleJoinAttempt(room)}
                                               disabled={room.playerCount >= room.maxPlayers}
                                               className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${room.playerCount >= room.maxPlayers ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/20'}`}
                                           >
                                               {room.playerCount >= room.maxPlayers ? 'FULL' : 'JOIN'}
                                           </button>
                                       </div>
                                   </div>
                               ))}
                               {onlineRooms.length === 0 && (
                                   <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                       <Server size={48} className="mb-4"/>
                                       <p>沒有發現公開伺服器</p>
                                   </div>
                               )}
                           </div>
                       </div>

                       {/* Right: Join Code */}
                       <div className="lg:col-span-4 space-y-6">
                           <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                               <h3 className="font-bold text-white flex items-center gap-2 mb-4"><Lock size={18} className="text-indigo-400"/> 私人連線</h3>
                               <p className="text-xs text-slate-400 mb-4">輸入 6 位數房間代碼以加入私人對戰。</p>
                               <div className="flex gap-2">
                                   <input 
                                       value={joinCodeInput} 
                                       onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                                       placeholder="ROOM ID" 
                                       className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-center font-mono tracking-widest text-white outline-none focus:border-indigo-500"
                                       maxLength={6}
                                   />
                                   <button onClick={handleJoinByCode} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors">
                                       <ChevronRight/>
                                   </button>
                               </div>
                           </div>

                           <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/20 rounded-2xl p-6">
                               <h3 className="font-bold text-indigo-300 mb-2">公告</h3>
                               <p className="text-xs text-slate-400 leading-relaxed">
                                   歡迎來到 v1.5 版本大廳。現在支援房主在線上模式加入 AI 對手進行混戰！
                               </p>
                           </div>
                       </div>
                   </div>
               </div>

               {/* Create Modal */}
               {showCreateModal && (
                   <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                       <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                           <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><Plus className="text-indigo-500"/> 建立新房間</h3>
                           <div className="space-y-4">
                               <div>
                                   <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">房間名稱</label>
                                   <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none text-white"/>
                               </div>
                               <div>
                                   <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">密碼 (選填)</label>
                                   <input value={newRoomPassword} onChange={e => setNewRoomPassword(e.target.value)} placeholder="留空則為公開無鎖" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none text-white"/>
                               </div>
                               <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-600 transition-colors" onClick={() => setNewRoomIsPublic(!newRoomIsPublic)}>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${newRoomIsPublic ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                                        {newRoomIsPublic && <CheckCircle size={14} className="text-white"/>}
                                    </div>
                                    <span className="text-sm font-bold text-slate-300 select-none">公開顯示 (在大廳列表可見)</span>
                               </div>
                           </div>
                           <div className="flex gap-3 mt-8">
                               <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">取消</button>
                               <button onClick={handleCreateOnlineRoom} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95">建立</button>
                           </div>
                       </div>
                   </div>
               )}

               {/* Password Modal */}
               {showPasswordModal && (
                   <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPasswordModal(null)}>
                       <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                           <Lock size={40} className="mx-auto mb-4 text-yellow-500"/>
                           <h3 className="text-lg font-bold mb-2 text-white">此房間需要密碼</h3>
                           <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center text-lg tracking-widest mb-6 focus:border-indigo-500 outline-none text-white" autoFocus/>
                           <button onClick={() => executeJoin(showPasswordModal, passwordInput)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white transition-transform active:scale-95">確認</button>
                       </div>
                   </div>
               )}
          </div>
      );
  }

  // 2. Room Waiting View (Combined Local/Online UI)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 text-slate-200 font-sans">
      
      {/* Toast */}
      {notification && (
           <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 animate-fade-in ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
               {notification.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
               {notification.message}
           </div>
      )}

      {/* Header */}
      <div className="w-full max-w-7xl flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={handleLeaveRoom} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 border border-slate-700 transition-colors">
                <LogOut size={20} className="text-red-400"/>
            </button>
            <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                    <span className="bg-slate-800 px-3 py-1 rounded text-lg font-mono text-indigo-400 border border-slate-700 tracking-wider">
                        {mode === 'online' ? onlineRoomId : 'LOCAL'}
                    </span>
                    準備大廳
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-bold mt-1 uppercase tracking-widest">
                    {mode === 'online' ? (isConnected ? <span className="text-emerald-500">Online</span> : <span className="text-red-500">Offline</span>) : 'Local Mode'}
                </div>
            </div>
          </div>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main: Player Slots */}
          <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Render 4 Slots fixed (or maxPlayers) */}
                  {[...Array(settings.maxPlayers)].map((_, i) => {
                      const player = players[i];
                      const isHost = player?.isHost;
                      const isMe = mode === 'online' ? player?.id === myId : player?.id === 'host_user';
                      const isEmpty = !player;

                      return (
                          <div key={i} className={`relative h-40 rounded-2xl border-2 transition-all group ${isEmpty ? 'border-slate-800 bg-slate-900/30 border-dashed hover:border-slate-700' : 'bg-slate-900 border-slate-700 shadow-xl'}`}>
                              {isEmpty ? (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                                      {amIHost ? (
                                          <button onClick={handleAddBot} className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                              <div className="p-3 rounded-full bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-900/20 transition-colors">
                                                  <Bot size={24}/>
                                              </div>
                                              <span className="text-xs font-bold uppercase tracking-wider group-hover:text-indigo-400">Add AI / Invite</span>
                                          </button>
                                      ) : (
                                          <div className="flex flex-col items-center gap-2 opacity-50">
                                              <UserPlus size={24}/>
                                              <span className="text-xs font-bold uppercase">Waiting...</span>
                                          </div>
                                      )}
                                  </div>
                              ) : (
                                  // Filled Slot
                                  <div className="p-5 flex flex-col justify-between h-full relative overflow-hidden">
                                      {/* Background Decoration */}
                                      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10 ${NATION_CONFIG[player.nation].bgColor} blur-xl`}></div>

                                      <div className="flex justify-between items-start z-10">
                                          <div className="flex items-center gap-3">
                                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-lg ${NATION_CONFIG[player.nation].bgColor} ${NATION_CONFIG[player.nation].borderColor}`}>
                                                  {player.nation === NationType.FIGHTER && <Crown size={18} className={NATION_CONFIG[player.nation].color} />}
                                                  {player.nation === NationType.HOLY && <Users size={18} className={NATION_CONFIG[player.nation].color} />}
                                                  {player.nation === NationType.COMMERCIAL && <TrendingUp size={18} className={NATION_CONFIG[player.nation].color} />}
                                                  {player.nation === NationType.MAGIC && <Zap size={18} className={NATION_CONFIG[player.nation].color} />}
                                              </div>
                                              <div>
                                                  <div className="font-bold text-white text-lg flex items-center gap-2">
                                                      {player.name}
                                                      {isMe && <span className="bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded text-white shadow">YOU</span>}
                                                  </div>
                                                  <div className={`text-xs font-bold uppercase tracking-wider ${NATION_CONFIG[player.nation].color}`}>
                                                      {getNationName(player.nation)}
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          <div className="flex gap-2">
                                              {isHost && <Crown size={16} className="text-yellow-500 drop-shadow-lg"/>}
                                              {player.isBot && <Bot size={16} className="text-cyan-400 drop-shadow-lg"/>}
                                          </div>
                                      </div>

                                      {/* Controls Area */}
                                      <div className="flex justify-between items-end z-10">
                                          {/* Editor logic */}
                                          {((mode === 'local' && amIHost) || (mode === 'online' && isMe)) ? (
                                              <div className="flex items-center gap-2">
                                                  <select 
                                                      value={player.nation} 
                                                      onChange={(e) => {
                                                          if(mode === 'local') setPlayers(prev => prev.map(p => p.id === player.id ? {...p, nation: e.target.value as any} : p));
                                                          if(mode === 'online' && isMe) setMyNation(e.target.value as any); // Online only update self, waiting for next socket sync to update list? Actually we need to emit update. 
                                                          // For simplicity in online mode, changing nation via Lobby UI might require a new socket event `update_player`. 
                                                          // Currently we only set initial nation on Join.
                                                          // Let's assume re-join or just stick to local editing for now. 
                                                          // Actually, let's allow editing strictly locally for now or add bot editing.
                                                      }}
                                                      className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 outline-none hover:border-white/30"
                                                  >
                                                      {Object.keys(NATION_CONFIG).map(k => <option key={k} value={k}>{getNationName(k)}</option>)}
                                                  </select>
                                                  
                                                  {player.isBot && amIHost && (
                                                      <select 
                                                          value={player.botDifficulty} 
                                                          onChange={(e) => {
                                                              // Only local for now unless we add socket event
                                                              if(mode==='local') setPlayers(prev => prev.map(p => p.id === player.id ? {...p, botDifficulty: e.target.value as any} : p));
                                                          }}
                                                          className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 outline-none hover:border-white/30"
                                                      >
                                                          <option value="easy">Easy</option>
                                                          <option value="normal">Normal</option>
                                                          <option value="hard">Hard</option>
                                                          <option value="mcts">MCTS AI</option>
                                                      </select>
                                                  )}
                                              </div>
                                          ) : (
                                              <div className="h-6"></div> // Spacer
                                          )}

                                          {/* Kick Button */}
                                          {amIHost && !isMe && (
                                              <button onClick={() => handleKick(player.id)} className="p-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors" title="Kick">
                                                  <Trash2 size={14}/>
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>

          {/* Right: Settings & Start */}
          <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Settings Panel */}
              <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl ${!amIHost ? 'opacity-70 pointer-events-none' : ''}`}>
                  <h3 className="font-bold text-white flex items-center gap-2 mb-6"><Settings size={18} className="text-emerald-400"/> 遊戲規則</h3>
                  
                  <div className="space-y-6">
                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                              <span>玩家上限</span>
                              <span className="text-white">{settings.maxPlayers}</span>
                          </div>
                          <input type="range" min="2" max="8" value={settings.maxPlayers} onChange={e => handleUpdateSettings({...settings, maxPlayers: parseInt(e.target.value)})} className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none"/>
                      </div>

                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                              <span>初始金錢</span>
                              <span className="text-white">{settings.initialGold} G</span>
                          </div>
                          <input type="range" min="50" max="500" step="50" value={settings.initialGold} onChange={e => handleUpdateSettings({...settings, initialGold: parseInt(e.target.value)})} className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none"/>
                      </div>

                      <div>
                          <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                              <span>手牌上限</span>
                              <span className="text-white">{settings.maxHandSize} 張</span>
                          </div>
                          <input type="range" min="5" max="20" value={settings.maxHandSize} onChange={e => handleUpdateSettings({...settings, maxHandSize: parseInt(e.target.value)})} className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none"/>
                      </div>
                      
                      <div className="pt-4 border-t border-slate-800">
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">傷害倍率</label>
                                  <select value={settings.damageMultiplier} onChange={e => handleUpdateSettings({...settings, damageMultiplier: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none">
                                      <option value="0.5">0.5x</option>
                                      <option value="1">1.0x</option>
                                      <option value="1.5">1.5x</option>
                                      <option value="2">2.0x</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">收入倍率</label>
                                  <select value={settings.incomeMultiplier} onChange={e => handleUpdateSettings({...settings, incomeMultiplier: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none">
                                      <option value="0.5">0.5x</option>
                                      <option value="1">1.0x</option>
                                      <option value="1.5">1.5x</option>
                                      <option value="2">2.0x</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Action Button */}
              {amIHost ? (
                  <button 
                    onClick={handleStartGame}
                    disabled={players.length < 2}
                    className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.02] active:scale-95 text-xl"
                  >
                      <Play size={24} fill="currentColor"/> 開始遊戲
                  </button>
              ) : (
                  <div className="w-full py-5 bg-slate-900 text-slate-500 font-bold rounded-2xl text-center border-2 border-dashed border-slate-800 animate-pulse flex items-center justify-center gap-3">
                      <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                      等待房主開始...
                  </div>
              )}
              
              {/* Copy Code (Online) */}
              {mode === 'online' && (
                  <div className="flex items-center justify-between bg-black/30 border border-slate-800 rounded-xl p-4">
                      <span className="text-xs font-bold text-slate-500 uppercase">Room ID</span>
                      <div className="flex items-center gap-3">
                          <span className="font-mono text-lg font-bold text-white tracking-widest">{onlineRoomId}</span>
                          <button onClick={() => {navigator.clipboard.writeText(onlineRoomId || ''); showToast("已複製房間代碼", 'success')}} className="text-slate-400 hover:text-white transition-colors">
                              <Copy size={16}/>
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};