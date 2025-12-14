
import React, { useState, useMemo, useRef } from 'react';
import { CARDS, ELEMENT_CONFIG, GAME_EVENTS, ALIGNMENT_CONFIG } from '../constants';
import { Card as CardComponent } from './Card';
import { Language, CardType, Card, ElementType, AlignmentType } from '../types';
import { TRANSLATIONS } from '../locales';
import { ArrowLeft, Coins, Zap, Search, ZapOff, Cross, Ghost } from 'lucide-react';
import * as Icons from 'lucide-react';

interface CardGalleryProps {
  lang: Language;
  onBack: () => void;
}

export const CardGallery: React.FC<CardGalleryProps> = ({ lang, onBack }) => {
  const t = TRANSLATIONS[lang];
  const [filterType, setFilterType] = useState<CardType | 'ALL'>('ALL');
  const [filterElement, setFilterElement] = useState<ElementType | 'ALL'>('ALL');
  const [filterAlignment, setFilterAlignment] = useState<AlignmentType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [hoveredCard, setHoveredCard] = useState<{ card: Card, x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'events'>('cards');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredCards = useMemo(() => {
      return CARDS.filter(c => {
          if (filterType !== 'ALL' && c.type !== filterType) return false;
          // Ensure c.element exists, default to NEUTRAL for comparison
          const cardEl = c.element || ElementType.NEUTRAL;
          if (filterElement !== 'ALL' && cardEl !== filterElement) return false;
          if (filterAlignment !== 'ALL' && c.alignment !== filterAlignment) return false;
          if (search && !c.name.includes(search)) return false;
          return true;
      });
  }, [filterType, filterElement, filterAlignment, search]);

  const handleMouseMove = (e: React.MouseEvent) => {
      if (hoveredCard) {
          setHoveredCard(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      }
  };

  const getTooltipStyle = () => {
      if (!hoveredCard) return {};
      const { x, y } = hoveredCard;
      const tooltipWidth = 280; 
      const tooltipHeight = 350; 
      const padding = 20;

      let left = x + 20;
      let top = y + 20;

      if (left + tooltipWidth > window.innerWidth) {
          left = x - tooltipWidth - 20;
      }

      if (top + tooltipHeight > window.innerHeight) {
          top = y - tooltipHeight - 20;
      }
      
      left = Math.max(padding, left);
      top = Math.max(padding, top);

      return { left, top };
  };

  return (
    <div 
        ref={containerRef}
        className="min-h-screen bg-slate-950 p-8 text-white overflow-y-auto" 
        onMouseMove={handleMouseMove}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-700">
                    <ArrowLeft />
                </button>
                <h1 className="text-4xl font-bold cinzel">{t.gallery}</h1>
            </div>
            
            <div className="flex gap-4">
                <button 
                    onClick={() => setActiveTab('cards')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'cards' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                    卡牌
                </button>
                <button 
                    onClick={() => setActiveTab('events')}
                    className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'events' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                >
                    事件
                </button>
            </div>
        </div>

        {activeTab === 'cards' ? (
            <>
                <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="搜尋卡牌..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-full focus:border-indigo-500 outline-none w-full text-sm"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-4 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <div className="flex gap-2 flex-wrap items-center">
                        <span className="text-slate-500 text-xs font-bold uppercase mr-2 tracking-widest">類型</span>
                        <button 
                            onClick={() => setFilterType('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterType === 'ALL' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                            {t.filterAll}
                        </button>
                        {Object.values(CardType).map(type => (
                            <button 
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterType === type ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                            >
                                {/* @ts-ignore */}
                                {t.types[type]}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2 flex-wrap items-center">
                        <span className="text-slate-500 text-xs font-bold uppercase mr-2 tracking-widest">屬性</span>
                        <button 
                            onClick={() => setFilterElement('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterElement === 'ALL' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                            {t.filterAll}
                        </button>
                        {Object.values(ElementType).map(elm => {
                            const conf = ELEMENT_CONFIG[elm];
                            const isActive = filterElement === elm;
                            return (
                                <button 
                                    key={elm}
                                    onClick={() => setFilterElement(elm)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${isActive ? `bg-slate-100 text-slate-900 border-white shadow-lg` : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <conf.icon size={12} className={isActive ? 'text-slate-900' : conf.color} /> {conf.name}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex gap-2 flex-wrap items-center">
                        <span className="text-slate-500 text-xs font-bold uppercase mr-2 tracking-widest">陣營</span>
                        <button 
                            onClick={() => setFilterAlignment('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${filterAlignment === 'ALL' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/50' : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                        >
                            {t.filterAll}
                        </button>
                        {Object.values(AlignmentType).map(align => {
                            const conf = ALIGNMENT_CONFIG[align];
                            const isActive = filterAlignment === align;
                            return (
                                <button 
                                    key={align}
                                    onClick={() => setFilterAlignment(align)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${isActive ? `bg-slate-100 text-slate-900 border-white shadow-lg` : 'bg-slate-950 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                                >
                                    <conf.icon size={12} className={isActive ? 'text-slate-900' : conf.color} /> {conf.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-20">
                    {filteredCards.map(card => (
                        <div key={card.id} className="group relative flex justify-center perspective-1000">
                            <div className="transition-transform duration-300 group-hover:scale-105 group-hover:z-10 group-hover:-translate-y-2 cursor-help">
                                <CardComponent 
                                    card={card} 
                                    lang={lang} 
                                    onMouseEnter={(c, e) => setHoveredCard({ card: c, x: e.clientX, y: e.clientY })}
                                    onMouseLeave={() => setHoveredCard(null)}
                                />
                            </div>
                        </div>
                    ))}
                    {filteredCards.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-500 text-xl font-light border-2 border-dashed border-slate-800 rounded-xl">
                            沒有找到符合條件的卡牌
                        </div>
                    )}
                </div>
            </>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {GAME_EVENTS.map(evt => {
                    // @ts-ignore
                    const Icon = Icons[evt.icon] || ZapOff;
                    return (
                        <div key={evt.id} className={`p-6 rounded-2xl border flex flex-col gap-4 ${evt.type === 'DISASTER' ? 'bg-red-950/20 border-red-900/50' : 'bg-yellow-950/20 border-yellow-900/50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${evt.type === 'DISASTER' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>
                                    <Icon size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">{evt.name}</h3>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${evt.type === 'DISASTER' ? 'bg-red-900/50 text-red-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                                        {evt.type === 'DISASTER' ? '災難' : '祝福'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{evt.description}</p>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Global Tooltip */}
      {hoveredCard && (
          <div 
            className="fixed z-[100] pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-600 p-5 rounded-2xl shadow-2xl w-72 animate-fade-in"
            style={getTooltipStyle()}
          >
              <div className="flex justify-between items-start mb-3">
                {/* @ts-ignore */}
                <h4 className="font-bold text-white text-xl leading-tight">{t.cards[hoveredCard.card.id]?.name || hoveredCard.card.name}</h4>
                {hoveredCard.card.element && hoveredCard.card.element !== ElementType.NEUTRAL && (
                    <div className={`text-[10px] px-2 py-1 rounded-full font-bold border flex items-center gap-1 bg-black/50 ${ELEMENT_CONFIG[hoveredCard.card.element].color} border-current`}>
                        {ELEMENT_CONFIG[hoveredCard.card.element].name}
                    </div>
                )}
              </div>
              
              <div className="flex gap-2 mb-4">
                  {/* @ts-ignore */}
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-bold uppercase tracking-wider">{t.types[hoveredCard.card.type]}</span>
              </div>
              
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed mb-4 shadow-inner">
                  {/* @ts-ignore */}
                  {t.cards[hoveredCard.card.id]?.desc}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="flex flex-col">
                        <span className="text-slate-500 font-bold uppercase text-[10px] mb-0.5">Cost</span>
                        <div className="text-yellow-400 font-mono font-bold text-sm flex items-center gap-1">{hoveredCard.card.cost} <Coins size={10}/></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-slate-500 font-bold uppercase text-[10px] mb-0.5">Mana</span>
                        <div className="text-blue-400 font-mono font-bold text-sm flex items-center gap-1">{hoveredCard.card.manaCost} <Zap size={10}/></div>
                    </div>
                    {(hoveredCard.card.hpCost || 0) > 0 && (
                         <div className="flex flex-col">
                            <span className="text-slate-500 font-bold uppercase text-[10px] mb-0.5">HP Cost</span>
                            <div className="text-red-400 font-mono font-bold text-sm">{hoveredCard.card.hpCost}</div>
                        </div>
                    )}
                    {!!hoveredCard.card.value && hoveredCard.card.value > 0 && (
                    <div className="flex flex-col pt-1 border-t border-slate-800 col-span-2 mt-1">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Base Power</span>
                        <span className="text-emerald-400 font-black text-xl">{hoveredCard.card.value}</span>
                    </div>
                    )}
                </div>
          </div>
      )}
    </div>
  );
};
