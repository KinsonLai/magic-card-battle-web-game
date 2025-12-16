
import React, { useState, useEffect, useRef } from 'react';
import { GameSettings, RoomPlayer, ChatMessage, NationType } from '../types';
import { NATION_CONFIG } from '../constants';
import { DEFAULT_SETTINGS } from '../services/gameEngine';
import { socketService } from '../services/socketService';
import { TRANSLATIONS } from '../locales';
import { Crown, Users, ArrowLeft, Bot, Trash2, Shield, Settings, CheckCircle, MessageSquare, Send, Copy, Play, Mic, MicOff } from 'lucide-react';

interface RoomScreenProps {
  onBack: () => void;
}

export const RoomScreen: React.FC<RoomScreenProps> = ({ onBack }) => {
  const t = TRANSLATIONS['zh-TW'];
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  
  const [myId, setMyId] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'settings' | 'chat'>('chat');

  useEffect(() => {
      setMyId(socketService.getId() || '');

      socketService.onRoomUpdate(({ players, settings }) => {
          setPlayers(players);
          setSettings(settings);
      });

      socketService.onChatMessage((msg) => {
          setChat(prev => [...prev, msg]);
      });

      socketService.onKicked(() => {
          alert("你已被踢出房間");
          onBack();
      });

      return () => {
          // Cleanup handled by socket service logic ideally
      }
  }, []);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, activeTab]);

  const amIHost = players.find(p => p.id === myId)?.isHost;
  const myPlayer = players.find(p => p.id === myId);

  const handleSendMessage = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputMsg.trim()) return;
      socketService.sendChat(inputMsg);
      setInputMsg('');
  };

  const updateSetting = (key: keyof GameSettings, value: any) => {
      if (!amIHost) return;
      const newSettings = { ...settings, [key]: value };
      socketService.updateSettings(newSettings);
  };

  const handleCopyId = () => {
      if (settings.roomCode) navigator.clipboard.writeText(settings.roomCode);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 text-white font-sans">
        
        {/* Header */}
        <div className="w-full max-w-7xl flex items-center justify-between mb-6 pt-2">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-slate-900 rounded-full hover:bg-slate-800 border border-slate-700">
                    <ArrowLeft size={20}/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold cinzel text-slate-100">準備室</h1>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-2">
                            ID: {settings.roomCode}
                            <button onClick={handleCopyId} className="hover:text-white"><Copy size={10}/></button>
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {!myPlayer?.isReady ? (
                    <button onClick={() => socketService.toggleReady()} className="px-6 py-2 bg-slate-700 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                        <CheckCircle size={18}/> 準備
                    </button>
                ) : (
                    <button onClick={() => socketService.toggleReady()} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                        <CheckCircle size={18} fill="currentColor" className="text-white"/> 已準備
                    </button>
                )}
            </div>
        </div>

        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 h-[calc(100vh-120px)]">
            
            {/* Left: Players */}
            <div className="lg:col-span-8 flex flex-col gap-6 h-full">
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex-1 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                        <h3 className="font-bold flex items-center gap-2 text-slate-300"><Users size={18}/> 玩家列表 ({players.length}/{settings.maxPlayers})</h3>
                        {amIHost && players.length < settings.maxPlayers && (
                            <button onClick={() => socketService.addBot()} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded flex items-center gap-2 font-bold border border-slate-700">
                                <Bot size={14}/> 加入電腦
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {players.map(p => {
                            const conf = NATION_CONFIG[p.nation];
                            return (
                                <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${p.id === myId ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-950 border-slate-800'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-lg ${conf.bgColor} ${conf.borderColor} relative`}>
                                            <span className={`font-bold ${conf.color}`}>{t.nations[p.nation].name[0]}</span>
                                            {p.isReady && <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-slate-900"><CheckCircle size={12}/></div>}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">{p.name}</span>
                                                {p.isHost && <Crown size={14} className="text-yellow-400 fill-yellow-400"/>}
                                                {p.isBot && <Bot size={14} className="text-cyan-400"/>}
                                            </div>
                                            <div className={`text-xs ${conf.color} font-bold`}>{t.nations[p.nation].name}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {amIHost && p.id !== myId && (
                                            <>
                                                <button onClick={() => socketService.transferHost(p.id)} className="p-2 text-slate-500 hover:text-yellow-400" title="移交房主"><Shield size={16}/></button>
                                                <button onClick={() => socketService.mutePlayer(p.id)} className={`p-2 ${p.isMuted ? 'text-red-400' : 'text-slate-500 hover:text-white'}`} title="禁言"><MicOff size={16}/></button>
                                                <button onClick={() => socketService.kickPlayer(p.id)} className="p-2 text-slate-500 hover:text-red-400" title="踢出"><Trash2 size={16}/></button>
                                            </>
                                        )}
                                        {p.isMuted && !amIHost && <MicOff size={16} className="text-red-500"/>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {amIHost && (
                    <button 
                        onClick={() => socketService.startGame()}
                        disabled={players.some(p => !p.isReady)}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                    >
                        <Play size={24} fill="currentColor"/> 開始遊戲
                    </button>
                )}
                {!amIHost && (
                    <div className="w-full py-4 bg-slate-900 text-slate-500 font-bold rounded-2xl text-center border border-slate-800 flex items-center justify-center gap-2">
                        <Crown size={18}/> 等待房主開始...
                    </div>
                )}
            </div>

            {/* Right: Settings & Chat */}
            <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden h-full shadow-xl">
                <div className="flex border-b border-slate-800">
                    <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}>
                        <MessageSquare size={16}/> 聊天
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800/50'}`}>
                        <Settings size={16}/> 設定
                    </button>
                </div>

                {activeTab === 'chat' ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {chat.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : ''}`}>
                                    {msg.isSystem ? (
                                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{msg.text}</span>
                                    ) : (
                                        <>
                                            <span className="text-[10px] text-slate-500 font-bold mb-0.5">{msg.sender}</span>
                                            <div className="bg-slate-800 p-2 rounded-lg text-sm text-slate-200 break-words">{msg.text}</div>
                                        </>
                                    )}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                            <input 
                                value={inputMsg} 
                                onChange={e => setInputMsg(e.target.value)} 
                                placeholder="輸入訊息..." 
                                disabled={myPlayer?.isMuted}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 disabled:opacity-50"
                            />
                            <button type="submit" disabled={!inputMsg.trim() || myPlayer?.isMuted} className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-lg text-white disabled:opacity-50">
                                <Send size={18}/>
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                        <div className={`space-y-4 ${!amIHost ? 'opacity-60 pointer-events-none' : ''}`}>
                             <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      初始金錢 <span className="text-white">{settings.initialGold}</span>
                                  </label>
                                  <input type="range" min="50" max="500" step="50" value={settings.initialGold} onChange={e => updateSetting('initialGold', parseInt(e.target.value))} className="w-full accent-emerald-500"/>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      每回合抽卡 <span className="text-white">{settings.cardsDrawPerTurn}</span>
                                  </label>
                                  <input type="range" min="1" max="5" value={settings.cardsDrawPerTurn} onChange={e => updateSetting('cardsDrawPerTurn', parseInt(e.target.value))} className="w-full accent-purple-500"/>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      手牌上限 <span className="text-white">{settings.maxHandSize}</span>
                                  </label>
                                  <input type="range" min="5" max="20" value={settings.maxHandSize} onChange={e => updateSetting('maxHandSize', parseInt(e.target.value))} className="w-full accent-emerald-500"/>
                              </div>
                              <div>
                                  <label className="text-xs text-slate-500 font-bold flex justify-between mb-1">
                                      玩家人數 <span className="text-white">{settings.maxPlayers}</span>
                                  </label>
                                  <input type="range" min="2" max="8" value={settings.maxPlayers} onChange={e => updateSetting('maxPlayers', parseInt(e.target.value))} className="w-full accent-emerald-500"/>
                              </div>
                        </div>
                        {!amIHost && <div className="text-center text-xs text-slate-500 italic">僅房主可修改設定</div>}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
