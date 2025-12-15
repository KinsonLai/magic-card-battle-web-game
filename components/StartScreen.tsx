
import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../locales';
import { Swords, Image, Sparkles, HelpCircle, Brain, Code, User } from 'lucide-react';

interface StartScreenProps {
  onHost: () => void;
  onGallery: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  onGuide: () => void;
  onSim: () => void;
  onAdmin: () => void; // New prop
}

export const StartScreen: React.FC<StartScreenProps> = ({ onHost, onGallery, lang, onGuide, onSim, onAdmin }) => {
  const t = TRANSLATIONS['zh-TW']; 
  const [name, setName] = useState('');

  useEffect(() => {
      // Load name from cookie
      const savedName = document.cookie.split('; ').find(row => row.startsWith('player_name='))?.split('=')[1];
      if (savedName) setName(savedName);
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = e.target.value;
      setName(newVal);
      // Save to cookie (1 year expiry)
      document.cookie = `player_name=${newVal}; path=/; max-age=31536000`;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black flex flex-col items-center justify-center p-6 text-white relative overflow-hidden font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/30 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-10 text-center relative z-10 flex flex-col items-center">
        
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

        {/* Name Input */}
        <div className="w-full relative group">
            <User className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20}/>
            <input 
                value={name} 
                onChange={handleNameChange}
                placeholder="請輸入你的名字..." 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-center text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
        </div>

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

            <button 
                onClick={onAdmin} // Changed from onSim to onAdmin trigger logic (Admin login)
                className="w-full py-3 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-600 hover:text-red-400 hover:border-red-500/30 transition-all text-[10px] font-mono tracking-widest flex items-center justify-center gap-2"
            >
                <Code size={12}/> ADMIN_PANEL
            </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 flex flex-col items-center gap-2 text-slate-600">
          <div className="flex items-center gap-2 text-xs font-medium opacity-60">
              <Code size={12}/>
              <span>Created by <span className="text-slate-400 font-bold">KinsonLai</span></span>
          </div>
          <div className="text-[10px] font-mono opacity-40">v2.1.0 | Mobile Enhanced</div>
      </div>
    </div>
  );
};
