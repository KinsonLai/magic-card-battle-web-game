
import React from 'react';
import { Card as CardModel, CardType, Language, ElementType, Rarity, AlignmentType } from '../types';
import { getIconForType, getIconComponent } from '../utils/iconMap';
import { ELEMENT_CONFIG, RARITY_CONFIG, ALIGNMENT_CONFIG } from '../constants';
import { TRANSLATIONS } from '../locales';
import { Coins, Zap, Sword, Shield, Heart, TrendingUp, Skull, Anchor } from 'lucide-react';

interface CardProps {
  card: CardModel;
  onClick?: () => void;
  disabled?: boolean;
  compact?: boolean; 
  showCost?: boolean;
  lang?: Language; 
  onMouseEnter?: (card: CardModel, e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, compact, showCost = true, lang = 'zh-TW', onMouseEnter, onMouseLeave }) => {
  const Icon = getIconForType(card.type);
  const elementConfig = ELEMENT_CONFIG[card.element || ElementType.NEUTRAL];
  const rarityConfig = RARITY_CONFIG[card.rarity || Rarity.COMMON];
  const alignmentConfig = card.alignment ? ALIGNMENT_CONFIG[card.alignment] : null;
  const t = TRANSLATIONS[lang];
  
  // @ts-ignore
  const trans = t.cards[card.id] || { name: card.name, desc: card.description };

  // Theme Gradients
  const elementStyles = {
    [ElementType.NEUTRAL]: 'bg-slate-800 text-slate-200 border-slate-600',
    [ElementType.FIRE]: 'bg-gradient-to-br from-orange-950 via-red-900 to-orange-950 text-orange-100 border-orange-700',
    [ElementType.WATER]: 'bg-gradient-to-br from-blue-950 via-indigo-900 to-blue-950 text-blue-100 border-blue-700',
    [ElementType.EARTH]: 'bg-gradient-to-br from-stone-950 via-amber-900 to-stone-950 text-amber-100 border-amber-700',
    [ElementType.AIR]: 'bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 text-sky-100 border-sky-700',
  };

  const baseStyle = elementStyles[card.element || ElementType.NEUTRAL];
  const glowColor = rarityConfig.shadow; 

  const renderStat = () => {
    if ((card.value === undefined || card.value === 0) && !card.runeLevel) return null;

    let StatIcon = Zap;
    let valClass = "text-white";
    let val: string | number = card.value || 0;

    if (card.effectType === 'damage') { StatIcon = Sword; valClass="text-red-300"; }
    else if (card.effectType === 'heal') { StatIcon = Heart; valClass="text-green-300"; }
    else if (card.effectType === 'income') { StatIcon = TrendingUp; valClass="text-emerald-300"; }
    else if (card.effectType === 'gold_gain') { StatIcon = Coins; valClass="text-yellow-300"; }
    else if (card.type === CardType.RUNE) { val = `+${card.value}`; valClass="text-pink-300"; }
    else if (card.type === CardType.ARTIFACT) { StatIcon = Anchor; valClass="text-amber-300"; }

    return (
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10 shadow-lg">
            <StatIcon size={12} className={valClass} />
            <span className={`font-black text-xs ${valClass}`}>{val}</span>
        </div>
    );
  };

  return (
    <div 
      className="group relative select-none touch-manipulation"
      onMouseEnter={(e) => onMouseEnter?.(card, e)}
      onMouseLeave={onMouseLeave}
    >
        <div 
          onClick={!disabled ? onClick : undefined}
          className={`
            relative flex flex-col rounded-xl transition-all duration-300 overflow-hidden border
            ${baseStyle} ${glowColor}
            ${!disabled && onClick ? 'active:scale-95' : ''}
            ${disabled ? 'opacity-50 grayscale' : ''}
            ${compact ? 'w-[6.5rem] h-[9.5rem]' : 'w-44 h-64'} 
            shadow-xl
          `}
        >
          {/* Top Bar: Cost & Type Icon */}
          <div className="flex justify-between items-start p-1.5 relative z-10">
             {/* Cost Bubble */}
             <div className="flex flex-col gap-1">
                 {card.manaCost > 0 && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow border border-blue-400">
                        {card.manaCost}
                    </div>
                 )}
                 {(card.cost > 0 && card.manaCost === 0) && (
                    <div className="w-5 h-5 rounded-full bg-yellow-600 flex items-center justify-center text-[10px] font-bold text-white shadow border border-yellow-400">
                        {card.cost > 99 ? '99+' : card.cost}
                    </div>
                 )}
                 {(card.hpCost || 0) > 0 && (
                    <div className="w-5 h-5 rounded-full bg-red-700 flex items-center justify-center text-[10px] font-bold text-white shadow border border-red-500">
                        {card.hpCost}
                    </div>
                 )}
             </div>

             {/* Rarity Dot */}
             <div className={`w-2 h-2 rounded-full ${rarityConfig.bg.replace('/30','')} shadow-[0_0_5px_currentColor] ${rarityConfig.color}`}></div>
          </div>

          {/* Center Art (Simplified for UI cleanliness) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <Icon size={compact ? 64 : 96} />
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-2 space-y-1">
             <Icon size={compact ? 32 : 48} className={`drop-shadow-lg ${rarityConfig.color}`} />
             {renderStat()}
          </div>

          {/* Bottom Info */}
          <div className="relative z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-4 flex flex-col items-center text-center">
             <div className={`font-bold leading-tight ${compact ? 'text-[10px]' : 'text-sm'} text-white drop-shadow-md line-clamp-2`}>
                {trans.name}
             </div>
             
             {/* Element/Align Badges */}
             <div className="flex gap-1 mt-1 justify-center opacity-80">
                 {card.element && card.element !== ElementType.NEUTRAL && (
                     // @ts-ignore
                     <div className={`w-2 h-2 rounded-full ${ELEMENT_CONFIG[card.element].bg.replace('bg-', 'bg-')}`}></div>
                 )}
                 {card.alignment && (
                     // @ts-ignore
                     <div className={`w-2 h-2 rounded-full ${ALIGNMENT_CONFIG[card.alignment].bg.replace('bg-', 'bg-')}`}></div>
                 )}
             </div>
          </div>
          
          {/* Selected Overlay Border */}
          {/* Handled by parent container usually, but internal highlight: */}
          <div className="absolute inset-0 border-2 border-white/0 transition-colors duration-200 group-hover:border-white/10 rounded-xl pointer-events-none"></div>
        </div>
    </div>
  );
};
