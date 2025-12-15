
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../locales';
import { Swords, Image, Sparkles, HelpCircle, User, Save, Lock, ShieldAlert } from 'lucide-react';

interface StartScreenProps {
  onHost: () => void;
  onGallery: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  onGuide: () => void;
  onSim: () => void; // Kept for type compatibility but button moved/hidden based on requirement
  onAdmin: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onHost, onGallery, lang, onGuide, onSim, onAdmin }) => {
  const t = TRANSLATIONS['zh-TW']; 
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState('');

  useEffect(() => {
      const savedName = document.cookie.split('; ').find(row => row.startsWith('player_name='))?.split('=')[1];
      if (!savedName) {
          setShowNameModal(true);
      } else {
          setPlayerName(savedName);
      }
  }, []);

  const saveName = () => {
      if (!playerName.trim()) return;
      document.cookie = `player_name=${playerName}; max-age=2592000; path=/`; // 30 days
      setShowNameModal(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-white relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-12 text-center relative z-10 flex flex-col items-center">
        
        {/* Title Section */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full mb-2 shadow-lg">
              <Sparkles className="text-yellow-400 mr-2 animate-pulse" size={14}/>
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-300 font-bold">Strategy Card Battle</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-indigo-300 cinzel tracking-wider drop-shadow-2xl leading-tight">
            {t.title}
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-light tracking-wide max-w-xs mx-auto leading-relaxed">{t.subtitle}</p>
        </div>

        {/* Player Greeting */}
        {!showNameModal && (
            <div className="animate-fade-in flex items-center gap-2 text-slate-400 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setShowNameModal(true)}>
                <User size={14}/> 
                <span className="text-sm">歡迎, <span className="text-white font-bold">{playerName}</span></span>
            </div>
        )}

        {/* Main Actions */}
        <div className="w-full space-y-4">
            <button
                onClick={onHost}
                className="w-full group relative px-8 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl shadow-xl shadow-indigo-900/40 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-300 border border-white/10 overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                <div className="flex items-center justify-center gap-3 text-xl font-bold text-white relative z-10">
                    <Swords size={24} className="group-hover:rotate-12 transition-transform"/>
                    {t.host}
                </div>
            </button>

            <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={onGallery}
                    className="group px-4 py-4 bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700 hover:bg-slate-700/50 hover:border-slate-500 transition-all active:scale-95 flex flex-col items-center justify-center gap-2"
                >
                    <Image size={24} className="text-slate-300 group-hover:text-white transition-colors" />
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white">{t.gallery}</span>
                </button>
                
                <button
                    onClick={onGuide}
                    className="group px-4 py-4 bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700 hover:bg-slate-700/50 hover:border-slate-500 transition-all active:scale-95 flex flex-col items-center justify-center gap-2"
                >
                    <HelpCircle size={24} className="text-slate-300 group-hover:text-white transition-colors" />
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white">指南</span>
                </button>
            </div>
        </div>
      </div>
      
      {/* Footer / Admin Entry */}
      <div className="absolute bottom-6 flex flex-col items-center gap-2 text-slate-600">
          <button onClick={onAdmin} className="opacity-30 hover:opacity-100 transition-opacity p-2">
              <ShieldAlert size={16}/>
          </button>
          <div className="text-[10px] font-mono opacity-40">v2.1.0 | Admin System</div>
      </div>

      {/* Name Entry Modal */}
      {showNameModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-sm text-center shadow-2xl animate-fade-in-up">
                  <User size={48} className="mx-auto text-indigo-500 mb-4"/>
                  <h2 className="text-2xl font-bold text-white mb-2">{t.enterName}</h2>
                  <p className="text-slate-400 text-xs mb-6">請輸入您在遊戲中顯示的名稱</p>
                  
                  <input 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="例如: 魔法學徒"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-white mb-4 focus:border-indigo-500 outline-none transition-colors"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  />
                  
                  <button 
                    onClick={saveName}
                    disabled={!playerName.trim()}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${playerName.trim() ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                  >
                      <Save size={18}/> 確認
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};
