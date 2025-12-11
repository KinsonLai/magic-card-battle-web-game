import React from 'react';
import { Card as CardModel, CardType, Language } from '../types';
import { getIconForType } from '../constants';
import { TRANSLATIONS } from '../locales';
import { Coins, Zap } from 'lucide-react';

interface CardProps {
  card: CardModel;
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean; 
  showCost?: boolean;
  lang?: Language; 
}

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, compact, showCost = true, lang = 'zh-TW' }) => {
  const Icon = getIconForType(card.type);
  const t = TRANSLATIONS[lang];
  
  // @ts-ignore
  const trans = t.cards[card.id] || { name: card.name, desc: card.description };
  // @ts-ignore
  const typeName = t.types[card.type] || card.type;

  const typeColor = {
    [CardType.INDUSTRY]: 'border-emerald-500 bg-emerald-950/40 text-emerald-200',
    [CardType.ATTACK]: 'border-red-500 bg-red-950/40 text-red-200',
    [CardType.DEFENSE]: 'border-blue-500 bg-blue-950/40 text-blue-200',
    [CardType.MISSILE]: 'border-orange-500 bg-orange-950/40 text-orange-200',
    [CardType.MAGIC]: 'border-purple-500 bg-purple-950/40 text-purple-200',
    [CardType.CONTRACT]: 'border-yellow-500 bg-yellow-950/40 text-yellow-200',
    [CardType.ENCHANTMENT]: 'border-pink-500 bg-pink-950/40 text-pink-200',
  }[card.type];

  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`
        relative flex flex-col items-center justify-between
        border-2 rounded-lg p-2 shadow-lg transition-all duration-200
        ${typeColor}
        ${!disabled && onClick ? 'cursor-pointer hover:scale-105 hover:shadow-xl hover:brightness-110' : ''}
        ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}
        ${compact ? 'w-28 h-40 text-xs' : 'w-36 h-52 text-sm'}
        bg-opacity-90 backdrop-blur-sm
      `}
    >
      <div className="w-full flex justify-between items-start font-bold">
         <span className="truncate max-w-[70%]">{trans.name}</span>
         {showCost && (
             <div className="flex items-center text-yellow-400 gap-0.5">
                 <span className="text-xs">{card.cost}</span>
                 <Coins size={10} />
             </div>
         )}
      </div>

      <div className="my-2 p-2 rounded-full bg-slate-900/50">
        <Icon size={compact ? 20 : 32} />
      </div>

      <p className="text-center opacity-90 leading-tight text-xs h-9 flex items-center justify-center">
        {trans.desc}
      </p>
      
      {card.manaCost > 0 && (
        <div className="w-full mt-2 flex justify-center items-center text-blue-300 font-bold text-xs gap-1 bg-slate-900/60 rounded py-1">
             <Zap size={10} />
             <span>{card.manaCost}</span>
        </div>
      )}
      
      <div className="absolute -bottom-2 px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 uppercase tracking-wider text-slate-400">
        {typeName}
      </div>
    </div>
  );
};
