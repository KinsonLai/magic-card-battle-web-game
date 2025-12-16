
import React, { useState, useEffect } from 'react';
import { NationType, RoomInfo, Language } from '../types';
import { NATION_CONFIG } from '../constants';
import { socketService } from '../services/socketService';
import { TRANSLATIONS } from '../locales';
import { Crown, Users, ArrowLeft, RefreshCw, Lock, Unlock, Search, Plus, Loader2, Wifi, WifiOff, Server } from 'lucide-react';

interface LobbyScreenProps {
  onJoinRoom: (roomId: string) => void;
  onBack: () => void;
  lang: Language;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onJoinRoom, onBack, lang }) => {
  const t = TRANSLATIONS['zh-TW'];
  
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [isConnecting, setIsConnecting] = useState(false);

  // User Profile
  const [myName, setMyName] = useState('Player');
  const [myNation, setMyNation] = useState<NationType>(NationType.FIGHTER);

  // Rooms Data
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [search, setSearch] = useState('');
  const [filterPrivate, setFilterPrivate] = useState<'ALL'|'PUBLIC'|'PRIVATE'>('ALL');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState<string | null>(null); // holds roomId to join

  // Create Room Form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [newRoomPassword, setNewRoomPassword] = useState('');

  // Join Room Password
  const [joinPassword, setJoinPassword] = useState('');

  useEffect(() => {
      // Attempt Auto Connect
      handleConnect();
      
      socketService.onRoomListUpdate((list) => {
          setRooms(list);
      });

      return () => {
          // Cleanup
      }
  }, []);

  const handleConnect = async () => {
      if (isConnected) return;
      setIsConnecting(true);
      try {
          await socketService.connect(serverUrl);
          setIsConnected(true);
          socketService.getRooms();
      } catch (e) {
          console.error("Connection failed", e);
      } finally {
          setIsConnecting(false);
      }
  };

  const handleCreateRoom = () => {
      if (!newRoomName) return;
      socketService.createRoom({
          player: { name: myName, nation: myNation },
          roomName: newRoomName,
          isPrivate: newRoomPrivate,
          password: newRoomPrivate ? newRoomPassword : undefined
      }, (res) => {
          if (res.roomId) {
              onJoinRoom(res.roomId);
          }
      });
  };

  const handleJoinClick = (room: RoomInfo) => {
      if (room.isPrivate) {
          setJoinPassword('');
          setShowPasswordModal(room.id);
      } else {
          doJoin(room.id);
      }
  };

  const doJoin = (roomId: string, password?: string) => {
      socketService.joinRoom({
          roomId,
          player: { name: myName, nation: myNation },
          password
      }, (res) => {
          if (res.success) {
              onJoinRoom(roomId);
          } else {
              alert(res.message);
          }
      });
  };

  const filteredRooms = rooms.filter(r => {
      if (filterPrivate === 'PUBLIC' && r.isPrivate) return false;
      if (filterPrivate === 'PRIVATE' && !r.isPrivate) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 text-white font-sans">
      {/* Header */}
      <div className="w-full max-w-6xl flex items-center justify-between mb-8 pt-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-slate-900 rounded-full hover:bg-slate-800 border border-slate-700 transition-colors">
                <ArrowLeft size={20}/>
            </button>
            <div>
                <h1 className="text-3xl font-bold cinzel text-slate-100">多人大廳</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className={`flex items-center gap-1 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isConnected ? <Wifi size={12}/> : <WifiOff size={12}/>}
                        {isConnected ? '伺服器已連線' : '未連線'}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span>{rooms.length} 個房間在線</span>
                </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800">
              <div className="flex flex-col px-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">暱稱</span>
                  <input value={myName} onChange={e => setMyName(e.target.value)} className="bg-transparent border-b border-slate-700 text-sm w-24 outline-none focus:border-indigo-500"/>
              </div>
              <div className="flex flex-col px-2 border-l border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">國家</span>
                  <select value={myNation} onChange={e => setMyNation(e.target.value as NationType)} className="bg-transparent text-sm outline-none cursor-pointer">
                      {Object.entries(NATION_CONFIG).map(([k,v]) => (
                          // @ts-ignore
                          <option key={k} value={k} className="bg-slate-900 text-slate-200">{t.nations[k].name}</option>
                      ))}
                  </select>
              </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left: Filters & Actions */}
          <div className="lg:col-span-1 space-y-6">
              <button 
                onClick={() => { setNewRoomName(`${myName}的房間`); setShowCreateModal(true); }}
                disabled={!isConnected}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                  <Plus size={20}/> 建立新房間
              </button>

              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-4">
                  <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                      <input 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="搜尋房間 ID 或名稱..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                      <label className="text-xs text-slate-500 font-bold uppercase">篩選</label>
                      <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                          <button onClick={() => setFilterPrivate('ALL')} className={`flex-1 py-1.5 text-xs rounded font-bold transition-colors ${filterPrivate === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>全部</button>
                          <button onClick={() => setFilterPrivate('PUBLIC')} className={`flex-1 py-1.5 text-xs rounded font-bold transition-colors ${filterPrivate === 'PUBLIC' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>公開</button>
                          <button onClick={() => setFilterPrivate('PRIVATE')} className={`flex-1 py-1.5 text-xs rounded font-bold transition-colors ${filterPrivate === 'PRIVATE' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>私人</button>
                      </div>
                  </div>

                  <button onClick={() => socketService.getRooms()} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm rounded-lg font-bold flex items-center justify-center gap-2 border border-slate-700">
                      <RefreshCw size={14}/> 重新整理
                  </button>
              </div>

              {!isConnected && (
                  <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-center space-y-3">
                      <p className="text-red-400 text-sm flex items-center justify-center gap-2"><WifiOff size={16}/> 無法連接伺服器</p>
                      
                      <div className="text-left">
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Server URL</label>
                          <div className="flex gap-2">
                              <input 
                                value={serverUrl} 
                                onChange={e => setServerUrl(e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-500"
                              />
                          </div>
                      </div>

                      <button onClick={handleConnect} disabled={isConnecting} className="w-full text-xs bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2">
                          {isConnecting ? <Loader2 className="animate-spin" size={12}/> : <RefreshCw size={12}/>}
                          {isConnecting ? '連線中...' : '重試連線'}
                      </button>
                  </div>
              )}
          </div>

          {/* Right: Room List */}
          <div className="lg:col-span-3 bg-slate-900/50 rounded-2xl border border-slate-800 min-h-[500px] flex flex-col overflow-hidden">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
                  <div className="w-16">狀態</div>
                  <div className="flex-1 px-4">房間名稱</div>
                  <div className="w-24 text-center">人數</div>
                  <div className="w-24 text-center">權限</div>
                  <div className="w-24"></div>
              </div>

              <div className="flex-1 overflow-y-auto">
                  {filteredRooms.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                          <Users size={48} className="opacity-20"/>
                          <p>沒有找到房間，建立一個吧！</p>
                      </div>
                  ) : (
                      filteredRooms.map(room => (
                          <div key={room.id} className="group p-4 border-b border-slate-800/50 hover:bg-slate-800 transition-colors flex items-center text-sm">
                              <div className="w-16">
                                  {room.status === 'WAITING' ? (
                                      <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold border border-emerald-500/30">等待中</span>
                                  ) : (
                                      <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] font-bold border border-red-500/30">進行中</span>
                                  )}
                              </div>
                              <div className="flex-1 px-4">
                                  <div className="font-bold text-white mb-0.5">{room.name}</div>
                                  <div className="text-xs text-slate-500">Host: {room.hostName} <span className="mx-1">•</span> ID: {room.id}</div>
                              </div>
                              <div className="w-24 text-center font-mono text-slate-300">
                                  {room.playerCount}/{room.maxPlayers}
                              </div>
                              <div className="w-24 flex justify-center text-slate-500">
                                  {room.isPrivate ? <Lock size={16} className="text-yellow-500"/> : <Unlock size={16}/>}
                              </div>
                              <div className="w-24 flex justify-end">
                                  <button 
                                    onClick={() => handleJoinClick(room)}
                                    disabled={room.status === 'PLAYING' || room.playerCount >= room.maxPlayers}
                                    className="px-4 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg font-bold text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                      加入
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Crown size={24} className="text-yellow-400"/> 建立房間</h2>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">房間名稱</label>
                          <input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-indigo-500"/>
                      </div>
                      
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setNewRoomPrivate(!newRoomPrivate)}>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${newRoomPrivate ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-700'}`}>
                              {newRoomPrivate && <Users size={12} className="text-white"/>}
                          </div>
                          <span className="text-sm text-slate-300">設為私人房間 (需要密碼)</span>
                      </div>

                      {newRoomPrivate && (
                           <div>
                              <label className="text-xs text-slate-500 font-bold uppercase mb-1 block">設定密碼</label>
                              <input type="password" value={newRoomPassword} onChange={e => setNewRoomPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-indigo-500"/>
                          </div>
                      )}
                  </div>

                  <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300">取消</button>
                      <button onClick={handleCreateRoom} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg">建立</button>
                  </div>
              </div>
          </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Lock size={20} className="text-yellow-400"/> 私人房間</h2>
                  <p className="text-sm text-slate-400">此房間需要密碼才能加入。</p>
                  
                  <input type="password" placeholder="輸入密碼" value={joinPassword} onChange={e => setJoinPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 outline-none focus:border-indigo-500"/>

                  <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowPasswordModal(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-300">取消</button>
                      <button onClick={() => doJoin(showPasswordModal!, joinPassword)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg">加入</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
