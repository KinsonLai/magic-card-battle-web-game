
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../locales';
import { Swords, Image, Sparkles, HelpCircle, Brain, Lock } from 'lucide-react';

interface StartScreenProps {
  onHost: () => void;
  onGallery: () => void;
  lang: Language;
  setLang: (l: Language) => void;
  onGuide: () => void;
  onSim: () => void;
  onAdmin: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onHost, onGallery, lang, onGuide, onSim, onAdmin }) => {
  const t = TRANSLATIONS['zh-TW']; 

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-black flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl w-full space-y-16 text-center relative z-10">
        <div className="space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-4">
              <Sparkles className="text-yellow-400 mr-2" size={20}/>
              <span className="text-xs uppercase tracking-[0.3em] text-slate-300 font-bold">Magic Card Battle Strategy</span>
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-indigo-200 cinzel tracking-wider drop-shadow-2xl">
            {t.title}
          </h1>
          <p className="text-slate-400 text-xl md:text-2xl font-light tracking-wide max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-8">
            <button
                onClick={onHost}
                className="group relative px-10 py-6 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-300 border border-white/10"
            >
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-4 text-2xl font-bold text-white">
                    <Swords size={32} className="group-hover:rotate-12 transition-transform"/>
                    {t.host}
                </div>
            </button>

            <button
                onClick={onGallery}
                className="group relative px-10 py-6 bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl hover:bg-slate-800 hover:scale-105 transition-all duration-300 border border-slate-700"
            >
                <div className="flex items-center gap-4 text-2xl font-bold text-slate-200">
                    <Image size={32} />
                    {t.gallery}
                </div>
            </button>
        </div>
        
        <div className="flex justify-center pt-4">
            <button 
                onClick={onSim}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 border border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500 transition-all text-xs font-mono tracking-widest"
            >
                <Brain size={14}/> AI_BATTLE_SIMULATION (MCTS)
            </button>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2">
           <button onClick={onGuide} className="p-3 bg-indigo-900 rounded-full text-white hover:bg-indigo-800 shadow-lg font-bold flex items-center gap-2 px-6"><HelpCircle size={20}/> 指南</button>
      </div>

      <div className="absolute bottom-4 text-slate-600 text-xs font-mono w-full flex flex-col justify-center items-center gap-2">
          <div className="flex items-center gap-4">
              <span>v1.4.0 | AI Update</span>
              <button onClick={onAdmin} className="opacity-30 hover:opacity-100 transition-opacity p-1"><Lock size={12}/></button>
          </div>
          <div className="opacity-50">Created by KinsonLai</div>
      </div>
    </div>
  );
};
