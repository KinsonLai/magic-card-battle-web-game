import React, { useState } from 'react';
import { CARDS } from '../constants';
import { Card as CardComponent } from './Card';
import { Language, CardType } from '../types';
import { TRANSLATIONS } from '../locales';
import { ArrowLeft } from 'lucide-react';

interface CardGalleryProps {
  lang: Language;
  onBack: () => void;
}

export const CardGallery: React.FC<CardGalleryProps> = ({ lang, onBack }) => {
  const t = TRANSLATIONS[lang];
  const [filter, setFilter] = useState<CardType | 'ALL'>('ALL');

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
                    <ArrowLeft />
                </button>
                <h1 className="text-4xl font-bold cinzel">{t.gallery}</h1>
            </div>
            
            <div className="flex gap-2 flex-wrap">
                <button 
                    onClick={() => setFilter('ALL')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                    {t.filterAll}
                </button>
                {Object.values(CardType).map(type => (
                    <button 
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === type ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {/* @ts-ignore */}
                        {t.types[type]}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 pb-20">
            {CARDS.filter(c => filter === 'ALL' || c.type === filter).map(card => (
                <div key={card.id} className="group relative flex justify-center">
                    <div className="transition-transform duration-300 group-hover:scale-110 group-hover:z-10">
                         <CardComponent card={card} disabled lang={lang} />
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};
