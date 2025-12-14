
import React, { useState, useEffect } from 'react';
import { NationType, GameSettings, Language, RoomPlayer, RoomInfo } from '../types';
import { NATION_CONFIG } from '../constants';
import { DEFAULT_SETTINGS } from '../services/gameEngine';
import { socketService } from '../services/socketService';
import { TRANSLATIONS } from '../locales';
import { Crown, Users, TrendingUp, Zap, Settings, ArrowLeft, Bot, User, Copy, Play, RotateCcw, Trash2, Globe, Wifi, WifiOff, Lock, Unlock, Search, Plus, CheckCircle, AlertCircle, LogOut, ChevronRight, X, UserPlus, Server, Monitor, Laptop } from 'lucide-react';

interface LobbyScreenProps {
  onStart: (players: RoomPlayer[], settings: GameSettings, isOnline?: boolean) => void;
  onBack: () => void;
  lang: Language;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStart, onBack, lang }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW']; 
  
  // --- High Level State ---
  const [mode, setMode] = useState<'local' | 'online'>('local'); 
  const [view, setView] = useState<'browser' | 'room'>('room'); // Default to room for local
  
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

  // Room State (Shared)
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

  // --- Effects ---

  // Mode Switch Effect
  useEffect(() => {
      if (mode === 'online') {
          setView('browser');
          if (!isConnected && !isConnecting) {
              handleConnect();
          }
      } else {
          // Switch to Local
          setView('room');
          if (isConnected) {
              socketService.disconnect();
              setIsConnected(false);
          }
          // Reset local players
          setPlayers([{ id: 'host_user', name: myName, nation: myNation, isHost: true, isBot: false, isReady: true }]);
          setOnlineRoomId(null);
      }
  }, [mode]);

  // Socket Events
  useEffect(() => {
      if (mode === 'online' && isConnected) {
          socketService.onRoomUpdate((updatedPlayers, newHostId) => {
              setPlayers(updatedPlayers);
              setHostId(newHostId);
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
          setMode('local'); // Fallback
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
          // Leave room but stay in online browser
          // Currently simple way is disconnect and reconnect logic or custom 'leave' event
          // For now, disconnect works to clear server state
          socketService.disconnect(); 
          setIsConnected(false);
          setOnlineRoomId(null);
          // Re-trigger connect via effect
          setMode('online'); 
          setView('browser');
      } else {
          onBack();
      }
  };

  // --- Room Management ---

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

  // --- RENDER ---

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-4 md:p-6 font-sans text-slate-200">
        
        {/* Toast */}
        {notification && (
            <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2 animate-fade-in ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                {notification.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
                {notification.message}
            </div>
        )}

        {/* --- Top Navigation & Mode Switcher --- */}
        <div className="w-full max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 self-start md:self-auto">
                <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-700">
                    <ArrowLeft size={20}/>
                </button>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    {mode === 'local' ? <Monitor className="text-emerald-400"/> : <Globe className="text-indigo-400"/>}
                    {mode === 'local' ? '單人練習' : '多人連線'}
                </h1>
            </div>

            {/* Mode Toggle */}
            <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex shadow-inner">
                <button 
                    onClick={() => setMode('local')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'local' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                    <Monitor size={16}/> Local
                </button>
                <button 
                    onClick={() => setMode('online')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'online' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                >
                    <Globe size={16}/> Online
                </button>
            </div>
        </div>

        {/* --- VIEW: BROWSER (Online Only) --- */}
        {mode === 'online' && view === 'browser' && (
            <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col min-h-0 animate-fade-in">
                
                {/* Profile Bar */}
                <div className="mb-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${NATION_CONFIG[myNation].bgColor} border ${NATION_CONFIG[myNation].borderColor}`}>
                            <User size={20} className={NATION_CONFIG[myNation].color}/>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] text-slate-500 font-bold uppercase">Your Identity</label>
                            <div className="flex items-center gap-2">
                                <input value={myName} onChange={e => setMyName(e.target.value)} className="bg-transparent border-b border-slate-700 focus:border-indigo-500 outline-none text-white font-bold w-32" placeholder="Name" />
                                <select value={myNation} onChange={e => setMyNation(e.target.value as any)} className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-indigo-400 outline-none">
                                    {Object.keys(NATION_CONFIG).map(k => <option key={k} value={k}>{getNationName(k)}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 text-xs font-bold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isConnected ? <Wifi size={14}/> : <WifiOff size={14}/>}
                            {isConnected ? 'Connected' : 'Connecting...'}
                        </div>
                        <button onClick={() => { setNewRoomName(`${myName}的房間`); setShowCreateModal(true); }} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                            <Plus size={18}/> 建立房間
                        </button>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                    {/* Server List */}
                    <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-2xl flex flex-col overflow-hidden backdrop-blur-sm shadow-xl min-h-[400px]">
                        <div className="p-4 border-b border-slate-800 flex gap-3 bg-slate-900/80">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                <input 
                                    value={browserSearch}
                                    onChange={e => setBrowserSearch(e.target.value)}
                                    placeholder="搜尋房間名稱..." 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                            <button onClick={refreshRoomList} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700">
                                <RotateCcw size={18}/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {onlineRooms.filter(r => r.name.toLowerCase().includes(browserSearch.toLowerCase())).map(room => (
                                <div key={room.id} className="group bg-slate-950 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl flex items-center justify-between transition-all hover:shadow-lg relative overflow-hidden">
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
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95 ${room.playerCount >= room.maxPlayers ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg'}`}
                                        >
                                            {room.playerCount >= room.maxPlayers ? 'FULL' : 'JOIN'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {onlineRooms.length === 0 && (
                                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                                    <Server size={48} className="mb-4"/>
                                    <p>沒有發現公開房間</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Join by Code */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
                            <h3 className="font-bold text-white flex items-center gap-2 mb-4"><Lock size={18} className="text-indigo-400"/> 私人代碼</h3>
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
                            <h3 className="font-bold text-indigo-300 mb-2">v1.5 更新公告</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                現在房主可以在線上對戰中加入 AI 電腦玩家填補空位！創造屬於你的混戰局吧。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- VIEW: ROOM (Local & Online) --- */}
        {((mode === 'local') || (mode === 'online' && view === 'room')) && (
            <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col animate-fade-in">
                {/* Room Info */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded text-sm font-mono font-bold border ${mode === 'online' ? 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30' : 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30'}`}>
                            {mode === 'online' ? onlineRoomId : 'LOCAL_MODE'}
                        </div>
                        {mode === 'online' && (
                            <button onClick={() => {navigator.clipboard.writeText(onlineRoomId || ''); showToast("已複製房間代碼", 'success')}} className="text-slate-500 hover:text-white transition-colors" title="複製代碼">
                                <Copy size={16}/>
                            </button>
                        )}
                    </div>
                    {mode === 'online' && (
                        <button onClick={handleLeaveRoom} className="px-4 py-2 bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-300 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors">
                            <LogOut size={14}/> 離開房間
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
                    {/* Players Grid */}
                    <div className="lg:col-span-8 overflow-y-auto custom-scrollbar pr-2 max-h-[calc(100vh-200px)]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[...Array(settings.maxPlayers)].map((_, i) => {
                                const player = players[i];
                                const isHost = player?.isHost;
                                const isMe = mode === 'online' ? player?.id === myId : player?.id === 'host_user';
                                const isEmpty = !player;

                                return (
                                    <div key={i} className={`relative h-44 rounded-2xl border-2 transition-all group ${isEmpty ? 'border-slate-800 bg-slate-900/20 border-dashed hover:border-slate-700' : 'bg-slate-900 border-slate-700 shadow-xl'}`}>
                                        {isEmpty ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
                                                {amIHost ? (
                                                    <button onClick={handleAddBot} className="flex flex-col items-center gap-2 group-hover:scale-110 transition-transform">
                                                        <div className="p-4 rounded-full bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-900/20 transition-colors">
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
                                            <div className="p-5 flex flex-col justify-between h-full relative overflow-hidden">
                                                <div className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-10 ${NATION_CONFIG[player.nation].bgColor} blur-2xl`}></div>
                                                
                                                {/* Header */}
                                                <div className="flex justify-between items-start z-10">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg ${NATION_CONFIG[player.nation].bgColor} ${NATION_CONFIG[player.nation].borderColor}`}>
                                                            {player.nation === NationType.FIGHTER && <Crown size={22} className={NATION_CONFIG[player.nation].color} />}
                                                            {player.nation === NationType.HOLY && <Users size={22} className={NATION_CONFIG[player.nation].color} />}
                                                            {player.nation === NationType.COMMERCIAL && <TrendingUp size={22} className={NATION_CONFIG[player.nation].color} />}
                                                            {player.nation === NationType.MAGIC && <Zap size={22} className={NATION_CONFIG[player.nation].color} />}
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

                                                {/* Controls */}
                                                <div className="flex justify-between items-end z-10 pt-4">
                                                    <div className="flex items-center gap-2">
                                                        {/* Local: Host can edit everyone. Online: Only Self can edit Self */}
                                                        {((mode === 'local' && amIHost) || (mode === 'online' && isMe)) && (
                                                            <select 
                                                                value={player.nation} 
                                                                onChange={(e) => {
                                                                    if(mode === 'local') setPlayers(prev => prev.map(p => p.id === player.id ? {...p, nation: e.target.value as any} : p));
                                                                    if(mode === 'online' && isMe) setMyNation(e.target.value as any); 
                                                                }}
                                                                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 outline-none hover:border-white/30 cursor-pointer"
                                                            >
                                                                {Object.keys(NATION_CONFIG).map(k => <option key={k} value={k}>{getNationName(k)}</option>)}
                                                            </select>
                                                        )}
                                                        
                                                        {/* AI Difficulty (Local Only for now or Host Online if extended) */}
                                                        {player.isBot && amIHost && mode === 'local' && (
                                                            <select 
                                                                value={player.botDifficulty} 
                                                                onChange={(e) => {
                                                                    setPlayers(prev => prev.map(p => p.id === player.id ? {...p, botDifficulty: e.target.value as any} : p));
                                                                }}
                                                                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 outline-none hover:border-white/30 cursor-pointer"
                                                            >
                                                                <option value="easy">Easy</option>
                                                                <option value="normal">Normal</option>
                                                                <option value="hard">Hard</option>
                                                                <option value="mcts">MCTS AI</option>
                                                            </select>
                                                        )}
                                                    </div>

                                                    {/* Kick */}
                                                    {amIHost && !isMe && (
                                                        <button onClick={() => handleKick(player.id)} className="p-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors" title="Kick">
                                                            <Trash2 size={16}/>
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

                    {/* Settings Panel */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl ${!amIHost ? 'opacity-80 pointer-events-none' : ''}`}>
                            <h3 className="font-bold text-white flex items-center gap-2 mb-6"><Settings size={18} className="text-emerald-400"/> 遊戲規則</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>玩家上限</span><span className="text-white">{settings.maxPlayers}</span></div>
                                    <input type="range" min="2" max="8" value={settings.maxPlayers} onChange={e => handleUpdateSettings({...settings, maxPlayers: parseInt(e.target.value)})} className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none"/>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>初始金錢</span><span className="text-white">{settings.initialGold} G</span></div>
                                    <input type="range" min="50" max="500" step="50" value={settings.initialGold} onChange={e => handleUpdateSettings({...settings, initialGold: parseInt(e.target.value)})} className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none"/>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2"><span>手牌上限</span><span className="text-white">{settings.maxHandSize} 張</span></div>
                                    <input type="range" min="5" max="20" value={settings.maxHandSize} onChange={e => handleUpdateSettings({...settings, maxHandSize: parseInt(e.target.value)})} className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg appearance-none"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">傷害倍率</label>
                                        <select value={settings.damageMultiplier} onChange={e => handleUpdateSettings({...settings, damageMultiplier: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option value="0.5">0.5x</option><option value="1">1.0x</option><option value="1.5">1.5x</option><option value="2">2.0x</option></select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">收入倍率</label>
                                        <select value={settings.incomeMultiplier} onChange={e => handleUpdateSettings({...settings, incomeMultiplier: parseFloat(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white outline-none"><option value="0.5">0.5x</option><option value="1">1.0x</option><option value="1.5">1.5x</option><option value="2">2.0x</option></select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Start Button */}
                        {amIHost ? (
                            <button onClick={handleStartGame} disabled={players.length < 2} className="w-full py-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.02] active:scale-95 text-xl">
                                <Play size={24} fill="currentColor"/> 開始遊戲
                            </button>
                        ) : (
                            <div className="w-full py-5 bg-slate-900 text-slate-500 font-bold rounded-2xl text-center border-2 border-dashed border-slate-800 animate-pulse flex items-center justify-center gap-3">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div> 等待房主開始...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- Modals --- */}
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
};
