
import React, { useState, useEffect } from 'react';
import { NationType, GameSettings, Language, RoomPlayer, RoomInfo } from '../types';
import { NATION_CONFIG } from '../constants';
import { DEFAULT_SETTINGS } from '../services/gameEngine';
import { socketService } from '../services/socketService';
import { TRANSLATIONS } from '../locales';
import { Crown, Users, TrendingUp, Zap, Settings, ArrowLeft, Bot, User, Copy, Play, RotateCcw, Trash2, Globe, Lock, Search, Plus, CheckCircle, AlertCircle, LogOut, ChevronRight, UserPlus, Server, Monitor, ShieldAlert, Check, X, Sliders } from 'lucide-react';

interface LobbyScreenProps {
  onStart: (players: RoomPlayer[], settings: GameSettings, isOnline?: boolean) => void;
  onBack: () => void;
  lang: Language;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStart, onBack, lang }) => {
  const t = TRANSLATIONS['zh-TW']; 
  
  // State
  const [mode, setMode] = useState<'local' | 'online'>('online'); 
  const [view, setView] = useState<'browser' | 'room'>('browser');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineRooms, setOnlineRooms] = useState<RoomInfo[]>([]);
  const [browserSearch, setBrowserSearch] = useState('');
  
  // Modals & Inputs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null); 
  const [showNationModal, setShowNationModal] = useState<{show: boolean, targetId: string | null}>({show: false, targetId: null}); 
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [newRoomIsPublic, setNewRoomIsPublic] = useState(true);

  // Room State
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [roomCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());
  const [notification, setNotification] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  
  // Local Player Info
  const [myName, setMyName] = useState('Player 1');
  const [myNation, setMyNation] = useState<NationType>(NationType.FIGHTER);
  
  // Players List
  const [players, setPlayers] = useState<RoomPlayer[]>([
      { id: 'host_user', name: 'Player 1', nation: NationType.FIGHTER, isHost: true, isBot: false, isReady: true }
  ]);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_SETTINGS, roomCode });
  const [hostId, setHostId] = useState<string>('host_user');

  // Computed
  const myId = mode === 'online' ? socketService.getId() : 'host_user';
  const amIHost = mode === 'local' ? true : (myId === hostId);
  const amIReady = players.find(p => p.id === myId)?.isReady || false;
  const allReady = players.every(p => p.isReady);
  const me = players.find(p => p.id === myId);

  // --- Effects ---

  // Load Name from Cookie
  useEffect(() => {
      const savedName = document.cookie.split('; ').find(row => row.startsWith('player_name='))?.split('=')[1];
      if (savedName) setMyName(savedName);
  }, []);

  // Local Mode Sync: Keep 'host_user' synced with local inputs
  useEffect(() => {
      if (mode === 'local') {
        setPlayers(prev => prev.map(p => p.id === 'host_user' ? { ...p, name: myName, nation: myNation } : p));
      }
  }, [myName, myNation, mode]);

  // Online Connection
  useEffect(() => {
      if (mode === 'online') {
          if (!isConnected && !isConnecting) {
              handleConnect();
          }
      }
  }, [mode]);

  // Socket Listeners
  useEffect(() => {
      if (mode === 'online' && isConnected) {
          const unsubRoom = socketService.onRoomUpdate((updatedPlayers, newHostId) => {
              setPlayers(updatedPlayers);
              setHostId(newHostId);
              
              // Only sync nation from server if it exists to avoid overwriting local selection before join
              const myP = updatedPlayers.find(p => p.id === socketService.getId());
              if (myP) setMyNation(myP.nation);

              if (view === 'browser' && updatedPlayers.length > 0) {
                  setView('room');
              }
          });
          
          const unsubRooms = socketService.onRoomsChanged(() => refreshRoomList());
          const unsubSettings = socketService.onSettingsUpdate((newSettings) => setSettings(newSettings));
          
          const unsubKicked = socketService.onKicked(() => {
              showToast("你被踢出了房間", 'error');
              setOnlineRoomId(null);
              setView('browser');
              setPlayers([]);
          });

          refreshRoomList();

          return () => {
              unsubRoom();
              unsubRooms();
              unsubSettings();
              unsubKicked();
          };
      }
  }, [mode, isConnected, view]);

  // --- Actions ---

  const getNationName = (key: string) => {
      // @ts-ignore
      return t.nations[key]?.name || NATION_CONFIG[key]?.name || key;
  };

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const handleConnect = async () => {
      setIsConnecting(true);
      try {
          await socketService.connect();
          setIsConnected(true);
      } catch (e) {
          console.error("Connection failed", e);
          setIsConnected(false);
          showToast("無法連接伺服器", 'error');
      } finally {
          setIsConnecting(false);
      }
  };

  const refreshRoomList = () => {
      socketService.getRooms((rooms) => {
          setOnlineRooms(rooms);
      });
  };

  const switchToLocal = () => {
      setMode('local');
      setView('room');
      if (isConnected) {
          socketService.disconnect();
          setIsConnected(false);
      }
      setPlayers([{ id: 'host_user', name: myName, nation: myNation, isHost: true, isBot: false, isReady: true }]);
      setOnlineRoomId(null);
  };

  const handleCreateOnlineRoom = () => {
      if (!isConnected) return;
      if (!newRoomName.trim()) { showToast("請輸入房間名稱", 'error'); return; }

      const savedName = document.cookie.split('; ').find(row => row.startsWith('player_name='))?.split('=')[1];
      const finalName = savedName || myName;

      socketService.createRoom({ 
          player: { name: finalName, nation: myNation },
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
      const savedName = document.cookie.split('; ').find(row => row.startsWith('player_name='))?.split('=')[1];
      const finalName = savedName || myName;

      socketService.joinRoom(rid, { name: finalName, nation: myNation }, password, (success, msg, needsPassword) => {
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

  const handleBack = () => {
      if (mode === 'online' && view === 'room') {
          socketService.disconnect(); 
          setIsConnected(false);
          setOnlineRoomId(null);
          setMode('online'); // Trigger reconnect for browser
          setView('browser');
      } else {
          onBack();
      }
  };

  const handleToggleReady = () => {
      if (mode === 'online') {
          socketService.toggleReady();
      }
  };

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

  const changePlayerNation = (targetId: string, nation: NationType) => {
      if (mode === 'online') {
          // Send request to server to update nation
          // @ts-ignore
          socketService.socket?.emit('update_player_nation', targetId, nation);
          
          if (targetId === myId) setMyNation(nation);
      } else {
          setPlayers(prev => prev.map(p => p.id === targetId ? { ...p, nation: nation } : p));
          if (targetId === 'host_user') setMyNation(nation);
      }
      setShowNationModal({ show: false, targetId: null });
  };

  const handleStartGame = () => {
      if (mode === 'online') {
          if (!allReady) {
              showToast("還有玩家未準備", 'error');
              return;
          }
          setIsStarting(true);
          const timeout = setTimeout(() => {
              if (isStarting) {
                  setIsStarting(false);
                  showToast("伺服器回應超時，請重試", 'error');
              }
          }, 5000);

          socketService.startGame((res) => {
              if (!res.success) {
                  clearTimeout(timeout);
                  showToast(res.message || "無法開始遊戲", 'error');
                  setIsStarting(false);
              }
          });
      } else {
          onStart(players, settings, false);
      }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
        
        {notification && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 animate-fade-in ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                {notification.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
                {notification.message}
            </div>
        )}

        {/* --- Header --- */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-700 group">
                        {mode === 'online' && view === 'room' ? <LogOut size={20} className="text-red-400"/> : <ArrowLeft size={20}/>}
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            {mode === 'local' ? <Monitor className="text-emerald-400"/> : <Globe className="text-indigo-400"/>}
                            {mode === 'local' ? '單人練習' : (view === 'room' ? '多人房間' : '線上大廳')}
                        </h1>
                        {mode === 'online' && view === 'room' && onlineRoomId && (
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                                <span>ID: {onlineRoomId}</span>
                                <button onClick={() => {navigator.clipboard.writeText(onlineRoomId); showToast("已複製", 'success')}} className="hover:text-white"><Copy size={12}/></button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Action Buttons */}
                {view === 'browser' && mode === 'online' && (
                    <div className="flex gap-3">
                        <button onClick={switchToLocal} className="px-4 py-2 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                            <Monitor size={16}/> 單人練習
                        </button>
                        <button onClick={() => { setNewRoomName(`${myName}的房間`); setShowCreateModal(true); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                            <Plus size={16}/> 建立房間
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* --- Content --- */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                
                {/* BROWSER VIEW */}
                {mode === 'online' && view === 'browser' && (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 animate-fade-in">
                        {/* Room List */}
                        <div className="lg:col-span-8 flex flex-col gap-4">
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                    <input value={browserSearch} onChange={e => setBrowserSearch(e.target.value)} placeholder="搜尋房間..." className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 text-white"/>
                                </div>
                                <button onClick={refreshRoomList} className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800"><RotateCcw size={18}/></button>
                            </div>

                            <div className="grid gap-3">
                                {onlineRooms.filter(r => r.name.toLowerCase().includes(browserSearch.toLowerCase())).map(room => (
                                    <div key={room.id} className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl flex items-center justify-between transition-all hover:shadow-lg relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex flex-col gap-1 z-10">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-base text-slate-200 group-hover:text-white">{room.name}</h3>
                                                {room.hasPassword && <Lock size={14} className="text-yellow-500"/>}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                                                <span className="flex items-center gap-1"><User size={12}/> {room.hostName}</span>
                                                <span className="flex items-center gap-1"><Server size={12}/> {room.id}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 z-10">
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Players</div>
                                                <div className={`font-mono font-bold text-sm ${room.playerCount >= room.maxPlayers ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {room.playerCount} / {room.maxPlayers}
                                                </div>
                                            </div>
                                            <button onClick={() => handleJoinAttempt(room)} disabled={room.playerCount >= room.maxPlayers} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${room.playerCount >= room.maxPlayers ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg'}`}>
                                                {room.playerCount >= room.maxPlayers ? '滿員' : '加入'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {onlineRooms.length === 0 && (
                                    <div className="text-center py-20 opacity-30 flex flex-col items-center border-2 border-dashed border-slate-800 rounded-xl">
                                        <Server size={48} className="mb-4"/>
                                        <p>沒有發現公開房間</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Profile */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                <h3 className="font-bold text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-wider"><User size={16} className="text-indigo-400"/> 玩家設定</h3>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${NATION_CONFIG[myNation].bgColor} border ${NATION_CONFIG[myNation].borderColor}`}>
                                        <User size={24} className={NATION_CONFIG[myNation].color}/>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-white font-bold text-lg">{myName}</div>
                                        <div className="text-xs text-slate-500">Rank: Novice</div>
                                    </div>
                                </div>
                                
                                <div 
                                    onClick={() => setShowNationModal({ show: true, targetId: myId })} 
                                    className="w-full bg-slate-950 border border-slate-700 hover:border-slate-500 rounded-xl p-3 cursor-pointer transition-all group relative overflow-hidden"
                                >
                                    <div className={`absolute inset-0 opacity-10 ${NATION_CONFIG[myNation].bgColor}`}></div>
                                    <div className="relative flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">已選陣營</span>
                                            <span className={`font-bold ${NATION_CONFIG[myNation].color}`}>{getNationName(myNation)}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-500 group-hover:text-white transition-colors"/>
                                    </div>
                                </div>
                            </div>

                            {/* Join Code */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                                <h3 className="font-bold text-white flex items-center gap-2 mb-4 text-sm uppercase tracking-wider"><Lock size={16} className="text-emerald-400"/> 私人代碼</h3>
                                <div className="flex gap-2">
                                    <input value={joinCodeInput} onChange={e => setJoinCodeInput(e.target.value.toUpperCase())} placeholder="ROOM ID" className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-center font-mono tracking-widest text-white outline-none focus:border-indigo-500 uppercase" maxLength={6}/>
                                    <button onClick={handleJoinByCode} className="px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"><ChevronRight size={18}/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ROOM VIEW */}
                {((mode === 'local') || (mode === 'online' && view === 'room')) && (
                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in min-h-0">
                        {/* Players Area */}
                        <div className="lg:col-span-8 overflow-y-auto custom-scrollbar pr-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[...Array(settings.maxPlayers)].map((_, i) => {
                                    const player = players[i];
                                    const isHost = player?.isHost;
                                    const isMe = mode === 'online' ? player?.id === myId : player?.id === 'host_user';
                                    const isEmpty = !player;

                                    return (
                                        <div key={i} className={`relative h-40 rounded-2xl border-2 transition-all group ${isEmpty ? 'border-slate-800 bg-slate-900/20 border-dashed hover:border-slate-700' : 'bg-slate-900 border-slate-700 shadow-xl'}`}>
                                            {isEmpty ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                                                    {amIHost ? (
                                                        <button onClick={handleAddBot} className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                                            <div className="p-3 rounded-full bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-900/20 transition-colors">
                                                                <Bot size={24}/>
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-indigo-400">加入 AI</span>
                                                        </button>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                                            <UserPlus size={24}/>
                                                            <span className="text-xs font-bold uppercase">等待加入...</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="p-4 flex flex-col justify-between h-full relative overflow-hidden">
                                                    <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 ${NATION_CONFIG[player.nation].bgColor} blur-2xl`}></div>
                                                    
                                                    {/* Ready Badge */}
                                                    {mode === 'online' && (
                                                        <div className={`absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${player.isReady ? 'bg-green-900/50 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-500 border-slate-600'}`}>
                                                            {player.isReady ? <><Check size={10}/> Ready</> : 'Not Ready'}
                                                        </div>
                                                    )}

                                                    {player.isAdmin && (
                                                        <div className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border bg-red-900/50 text-red-400 border-red-500/30 animate-pulse">
                                                            ⚡ ADMIN
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between items-start z-10 mt-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center border shadow-lg ${NATION_CONFIG[player.nation].bgColor} ${NATION_CONFIG[player.nation].borderColor}`}>
                                                                {player.nation === NationType.FIGHTER && <Crown size={20} className={NATION_CONFIG[player.nation].color} />}
                                                                {player.nation === NationType.HOLY && <Users size={20} className={NATION_CONFIG[player.nation].color} />}
                                                                {player.nation === NationType.COMMERCIAL && <TrendingUp size={20} className={NATION_CONFIG[player.nation].color} />}
                                                                {player.nation === NationType.MAGIC && <Zap size={20} className={NATION_CONFIG[player.nation].color} />}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white text-base flex items-center gap-2">
                                                                    {player.name}
                                                                    {isMe && <span className="bg-indigo-600 text-[10px] px-1.5 py-0.5 rounded text-white shadow">YOU</span>}
                                                                </div>
                                                                <div className={`text-[10px] font-bold uppercase tracking-wider ${NATION_CONFIG[player.nation].color}`}>
                                                                    {getNationName(player.nation)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-2">
                                                            {isHost && <Crown size={14} className="text-yellow-500 drop-shadow-lg"/>}
                                                            {player.isBot && <Bot size={14} className="text-cyan-400 drop-shadow-lg"/>}
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-between items-end z-10 pt-2">
                                                        {((mode === 'local' && amIHost) || (mode === 'online' && (isMe || amIHost))) ? (
                                                            <div className="flex gap-2 items-center">
                                                                {(isMe || (amIHost && player.isBot) || (me?.isAdmin)) && (
                                                                    <button 
                                                                        onClick={() => setShowNationModal({ show: true, targetId: player.id })}
                                                                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 hover:border-white/30 hover:text-white flex items-center gap-1 transition-colors"
                                                                    >
                                                                        <Settings size={10}/> 變更國度
                                                                    </button>
                                                                )}
                                                                
                                                                {player.isBot && amIHost && (
                                                                    <select 
                                                                        value={player.botDifficulty} 
                                                                        onChange={(e) => setPlayers(prev => prev.map(p => p.id === player.id ? {...p, botDifficulty: e.target.value as any} : p))}
                                                                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-slate-300 outline-none hover:border-white/30 cursor-pointer"
                                                                    >
                                                                        <option value="easy">簡單</option>
                                                                        <option value="normal">普通</option>
                                                                        <option value="hard">困難</option>
                                                                        <option value="mcts">AI (MCTS)</option>
                                                                    </select>
                                                                )}
                                                            </div>
                                                        ) : <div/>}
                                                        
                                                        {(amIHost || me?.isAdmin) && !isMe && (
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

                        {/* Control Panel */}
                        <div className="lg:col-span-4 flex flex-col gap-4">
                            {/* Rules */}
                            <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden ${!amIHost ? 'opacity-80 pointer-events-none' : ''}`}>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider"><Settings size={16} className="text-emerald-400"/> 遊戲規則</h3>
                                    <button onClick={() => setShowSettingsModal(true)} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1">
                                        <Sliders size={12}/> 進階設定
                                    </button>
                                </div>
                                
                                <div className="space-y-5">
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>玩家上限</span><span className="text-white">{settings.maxPlayers}</span></div>
                                        <input type="range" min="2" max="8" value={settings.maxPlayers} onChange={e => handleUpdateSettings({...settings, maxPlayers: parseInt(e.target.value)})} className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none"/>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">初始金錢</label>
                                            <input type="number" value={settings.initialGold} onChange={e => handleUpdateSettings({...settings, initialGold: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white outline-none"/>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">初始魔力</label>
                                            <input type="number" value={settings.initialMana} onChange={e => handleUpdateSettings({...settings, initialMana: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white outline-none"/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3">
                                {amIHost ? (
                                    <button 
                                        onClick={handleStartGame} 
                                        disabled={(mode === 'online' && !allReady) || isStarting || players.length < 2} 
                                        className={`w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-3 transform transition-all hover:scale-[1.02] active:scale-95 text-lg ${((mode === 'online' && !allReady) || isStarting || players.length < 2) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                    >
                                        {isStarting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Play size={20} fill="currentColor"/>} 
                                        {mode === 'online' && !allReady ? '等待全員準備...' : isStarting ? '啟動中...' : '開始遊戲'}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleToggleReady}
                                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${amIReady ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/30'}`}
                                    >
                                        {amIReady ? <><CheckCircle size={20}/> 取消準備</> : <><CheckCircle size={20}/> 準備完成</>}
                                    </button>
                                )}
                                
                                {!amIHost && (
                                    <div className="text-center text-xs text-slate-500 font-bold animate-pulse mt-2">
                                        等待房主開始遊戲...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* --- MODALS --- */}
        
        {/* Settings Modal (Extended) */}
        {showSettingsModal && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowSettingsModal(false)}>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-y-auto max-h-[80vh]" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><Sliders className="text-emerald-500"/> 進階房間設定</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">手牌上限</label>
                            <input type="number" value={settings.maxHandSize} onChange={e => handleUpdateSettings({...settings, maxHandSize: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">每回合抽牌</label>
                            <input type="number" value={settings.cardsDrawPerTurn} onChange={e => handleUpdateSettings({...settings, cardsDrawPerTurn: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">商店數量</label>
                            <input type="number" value={settings.shopSize} onChange={e => handleUpdateSettings({...settings, shopSize: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">事件頻率 (回合)</label>
                            <input type="number" value={settings.eventFrequency} onChange={e => handleUpdateSettings({...settings, eventFrequency: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">生命倍率</label>
                            <input type="number" step="0.1" value={settings.healthMultiplier} onChange={e => handleUpdateSettings({...settings, healthMultiplier: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">價格倍率</label>
                            <input type="number" step="0.1" value={settings.priceMultiplier} onChange={e => handleUpdateSettings({...settings, priceMultiplier: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white"/>
                        </div>
                    </div>
                    <div className="mt-8">
                        <button onClick={() => setShowSettingsModal(false)} className="w-full py-3 bg-indigo-600 rounded-xl font-bold text-white">確認</button>
                    </div>
                </div>
            </div>
        )}

        {/* Nation Selector Modal (New Visual Design) */}
        {showNationModal.show && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowNationModal({show: false, targetId: null})}>
                <div className="bg-slate-900/90 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative" onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Globe className="text-indigo-500"/> 選擇國度
                        </h2>
                        <button onClick={() => setShowNationModal({show: false, targetId: null})} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                            <X size={24}/>
                        </button>
                    </div>

                    {/* Nation Grid */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(NATION_CONFIG).map(([key, config]) => {
                                const targetP = players.find(p => p.id === showNationModal.targetId);
                                const isSelected = targetP ? targetP.nation === key : myNation === key;
                                const nKey = key as NationType;
                                
                                return (
                                    <div 
                                        key={key} 
                                        onClick={() => {
                                            if (showNationModal.targetId) {
                                                changePlayerNation(showNationModal.targetId, nKey);
                                            }
                                        }}
                                        className={`relative group rounded-2xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col ${isSelected ? `border-white ${config.bgColor} scale-[1.02] shadow-2xl` : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-900'}`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-3 right-3 bg-white text-black rounded-full p-1 shadow-lg z-10">
                                                <Check size={16} strokeWidth={4}/>
                                            </div>
                                        )}
                                        
                                        <div className="p-6 flex gap-5 items-start">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 ${isSelected ? 'border-white bg-black/20' : 'border-slate-700 bg-slate-800'} ${config.color}`}>
                                                {nKey === NationType.FIGHTER && <Crown size={32}/>}
                                                {nKey === NationType.HOLY && <Users size={32}/>}
                                                {nKey === NationType.COMMERCIAL && <TrendingUp size={32}/>}
                                                {nKey === NationType.MAGIC && <Zap size={32}/>}
                                            </div>
                                            <div>
                                                <h3 className={`text-xl font-bold mb-1 ${isSelected ? 'text-white' : 'text-slate-200'}`}>{config.name}</h3>
                                                <p className={`text-xs leading-relaxed ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{config.description}</p>
                                            </div>
                                        </div>

                                        {/* Stats Bar */}
                                        <div className="mt-auto bg-black/20 p-4 border-t border-white/5 flex justify-between text-xs font-mono">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`${config.hpBonus > 0 ? 'text-green-400' : config.hpBonus < 0 ? 'text-red-400' : 'text-slate-500'} font-bold`}>
                                                    {config.hpBonus > 0 ? '+' : ''}{config.hpBonus}
                                                </span>
                                                <span className="text-[10px] uppercase text-slate-500">HP</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/10"></div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`${config.manaBonus > 0 ? 'text-blue-400' : 'text-slate-500'} font-bold`}>
                                                    {config.manaBonus > 0 ? '+' : ''}{config.manaBonus}
                                                </span>
                                                <span className="text-[10px] uppercase text-slate-500">Mana</span>
                                            </div>
                                            <div className="w-px h-8 bg-white/10"></div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`${config.goldBonus > 0 ? 'text-yellow-400' : 'text-slate-500'} font-bold`}>
                                                    {config.goldBonus > 0 ? '+' : ''}{config.goldBonus}
                                                </span>
                                                <span className="text-[10px] uppercase text-slate-500">Gold</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showCreateModal && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><Plus className="text-indigo-500"/> 建立新房間</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">房間名稱</label>
                            <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none text-white"/>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 font-bold mb-1 block uppercase">密碼 (選填)</label>
                            <input value={newRoomPassword} onChange={e => setNewRoomPassword(e.target.value)} placeholder="留空則為公開無鎖" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:border-indigo-500 outline-none text-white"/>
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

        {showPasswordModal && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPasswordModal(null)}>
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
};
