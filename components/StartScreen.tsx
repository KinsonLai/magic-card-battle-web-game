import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../locales';
import { Swords, Image } from 'lucide-react';

interface StartScreenProps {
  onHost: () => void;
  onGallery: () => void;
  lang: Language;
  setLang: (l: Language) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onHost, onGallery, lang }) => {
  const t = TRANSLATIONS['zh-TW']; // Force Chinese

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black relative">
      
      <div className="max-w-4xl w-full space-y-12 text-center">
        <div className="space-y-4 animate-fade-in-up">
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 cinzel tracking-wider drop-shadow-lg">
            {t.title}
          </h1>
          <p className="text-slate-400 text-2xl font-light">{t.subtitle}</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
            <button
                onClick={onHost}
                className="group relative px-8 py-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl hover:scale-105 transition-all duration-300"
            >
                <div className="flex items-center gap-3 text-xl font-bold text-white">
                    <Swords size={28} className="group-hover:rotate-12 transition-transform"/>
                    {t.host}
                </div>
                <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
            </button>

            <button
                onClick={onGallery}
                className="group relative px-8 py-5 bg-slate-800 rounded-2xl shadow-xl hover:bg-slate-700 hover:scale-105 transition-all duration-300"
            >
                <div className="flex items-center gap-3 text-xl font-bold text-slate-200">
                    <Image size={28} />
                    {t.gallery}
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};
