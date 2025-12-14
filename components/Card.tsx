
import React from 'react';
import { Card as CardModel, CardType, Language, ElementType, Rarity, AlignmentType } from '../types';
import { getIconForType, ELEMENT_CONFIG, RARITY_CONFIG, ALIGNMENT_CONFIG } from '../constants';
import { TRANSLATIONS } from '../locales';
import { Coins, Zap, Sword, Shield, Heart, TrendingUp, Skull, Target, Hexagon, Droplets, Anchor } from 'lucide-react';

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
  // @ts-ignore
  const typeName = t.types[card.type] || card.type;

  // Type specific color themes (Base gradients)
  const typeStyles = {
    [CardType.INDUSTRY]: 'bg-gradient-to-b from-emerald-900 to-emerald-950 text-emerald-100',
    [CardType.ATTACK]: 'bg-gradient-to-b from-red-900 to-red-950 text-red-100',
    [CardType.MAGIC_ATTACK]: 'bg-gradient-to-b from-purple-900 to-purple-950 text-purple-100',
    [CardType.HEAL]: 'bg-gradient-to-b from-teal-900 to-teal-950 text-teal-100',
    [CardType.SPECIAL]: 'bg-gradient-to-b from-fuchsia-900 to-fuchsia-950 text-fuchsia-100',
    [CardType.CONTRACT]: 'bg-gradient-to-b from-yellow-950 to-black text-yellow-100',
    [CardType.RUNE]: 'bg-gradient-to-b from-pink-900 to-pink-950 text-pink-100',
    [CardType.RITUAL]: 'bg-black text-rose-100',
    [CardType.ARTIFACT]: 'bg-gradient-to-b from-amber-900 to-amber-950 text-amber-100',
  };

  const elementStyles = {
    [ElementType.NEUTRAL]: typeStyles[card.type] || 'bg-slate-800 text-slate-100',
    [ElementType.FIRE]: 'bg-gradient-to-b from-orange-900 to-orange-950 text-orange-50',
    [ElementType.WATER]: 'bg-gradient-to-b from-blue-900 to-blue-950 text-blue-50',
    [ElementType.EARTH]: 'bg-gradient-to-b from-amber-900 to-amber-950 text-amber-50',
    [ElementType.AIR]: 'bg-gradient-to-b from-sky-900 to-sky-950 text-sky-50',
  };

  const baseStyle = elementStyles[card.element || ElementType.NEUTRAL];
  const borderStyle = rarityConfig.border; 
  const shadowStyle = rarityConfig.shadow;

  const renderCardStat = () => {
    if (card.value === undefined || card.value === 0) {
        if (!card.runeLevel) return null;
    }

    let StatIcon = Zap;
    let colorClass = "text-white";
    let displayValue: string | number = card.value || 0;

    if (card.effectType === 'damage') { StatIcon = Sword; colorClass="text-red-200"; }
    else if (card.effectType === 'heal') { StatIcon = Heart; colorClass="text-green-200"; }
    else if (card.effectType === 'income') { StatIcon = TrendingUp; colorClass="text-emerald-200"; }
    else if (card.effectType === 'gold_gain') { StatIcon = Coins; colorClass="text-yellow-200"; }
    else if (card.type === CardType.RUNE) { 
        StatIcon = Zap; 
        colorClass="text-pink-200"; 
        displayValue = `+${card.value}`;
    }
    else if (card.type === CardType.SPECIAL) { StatIcon = Skull; colorClass="text-fuchsia-200"; }
    else if (card.type === CardType.ARTIFACT) { StatIcon = Anchor; colorClass="text-amber-200"; }

    return (
        <div className={`flex items-center gap-1 ${colorClass} font-bold text-sm bg-black/40 px-2 py-0.5 rounded-full border border-white/10 shadow-sm`}>
            <StatIcon size={12} />
            <span>{displayValue}</span>
        </div>
    );
  };

  const descriptionText = card.type === CardType.INDUSTRY && card.value 
    ? `${trans.desc} (Income: +${card.value})` 
    : trans.desc;

  const alignmentHint = card.alignment === AlignmentType.HOLY 
    ? "觸發 [光之姿態] & [秩序/聖戰] 連擊" 
    : "觸發 [影之姿態] & [混沌/聖戰] 連擊";

  return (
    <div 
      className="group relative select-none"
      onMouseEnter={(e) => onMouseEnter?.(card, e)}
      onMouseLeave={onMouseLeave}
    >
        <div 
          onClick={!disabled ? onClick : undefined}
          className={`
            relative flex flex-col rounded-lg transition-all duration-200 overflow-hidden
            ${baseStyle} ${borderStyle} ${shadowStyle}
            ${!disabled && onClick ? 'cursor-pointer hover:-translate-y-2 hover:shadow-2xl' : ''}
            ${disabled ? 'opacity-60 grayscale cursor-not-allowed' : ''}
            ${compact ? 'w-36 h-52 text-xs' : 'w-40 h-64 text-sm'}
          `}
        >
          {/* Header Area (Name & Cost) */}
          <div className={`
                p-2 flex flex-col gap-1 border-b border-white/10 h-16 justify-center relative
                ${rarityConfig.bg}
          `}>
             <div className="w-full flex justify-between items-start leading-tight relative z-10">
                 <span className={`font-bold drop-shadow-md break-words w-full ${compact ? 'text-[10px]' : 'text-sm'} ${rarityConfig.color}`}>{trans.name}</span>
             </div>
             {showCost && (
                 <div className="flex gap-1 mt-auto relative z-10">
                     {card.cost > 0 && (
                        <div className="flex items-center bg-black/60 px-1.5 py-0.5 rounded text-yellow-300 gap-1 border border-white/10">
                            <span className="text-[10px] font-mono">{card.cost}</span>
                            <Coins size={8} />
                        </div>
                     )}
                     {(card.hpCost || 0) > 0 && (
                        <div className="flex items-center bg-red-900/80 px-1.5 py-0.5 rounded text-red-300 gap-1 border border-red-500/50">
                            <span className="text-[10px] font-mono">{card.hpCost}</span>
                            <Droplets size={8} />
                        </div>
                     )}
                     {card.manaCost > 0 && (
                        <div className="flex items-center bg-blue-900/80 px-1.5 py-0.5 rounded text-blue-300 gap-1 border border-blue-500/50">
                            <span className="text-[10px] font-mono">{card.manaCost}</span>
                            <Zap size={8} />
                        </div>
                     )}
                 </div>
             )}
          </div>

          {/* Image/Icon Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative p-2">
             {/* Background glow */}
             {card.element && card.element !== ElementType.NEUTRAL && (
                 <div className={`absolute inset-0 opacity-30 ${elementConfig.bg} blur-xl rounded-full scale-75`}></div>
             )}
             
             <Icon size={compact ? 32 : 40} className={`drop-shadow-lg opacity-90 relative z-10 ${rarityConfig.color}`} />
             
             {!compact && <div className="mt-2 relative z-10">{renderCardStat()}</div>}

             {/* Element & Alignment Icons Overlay */}
             <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                 {card.element && card.element !== ElementType.NEUTRAL && (
                    <div className={`p-1 rounded-full bg-black/60 ${elementConfig.color} border border-white/10`} title={elementConfig.name}>
                        <elementConfig.icon size={compact ? 12 : 14} />
                    </div>
                 )}
             </div>

             {/* Explicit Alignment Badge on Card Face */}
             {alignmentConfig && (
                 <div 
                    title={alignmentHint}
                    className={`absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/70 border ${compact ? 'text-[9px]' : 'text-[10px]'} font-bold uppercase tracking-wider ${alignmentConfig.color} border-current z-20 cursor-help hover:scale-110 transition-transform`}
                 >
                     <alignmentConfig.icon size={compact ? 10 : 10} />
                     <span>{alignmentConfig.name}</span>
                 </div>
             )}
             
             {/* Rune Level Badge */}
             {card.runeLevel && (
                 <div className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center rounded-full bg-pink-900 border border-pink-500 text-pink-200 text-[10px] font-bold z-20">
                     {card.runeLevel}
                 </div>
             )}
          </div>

          {/* Footer Area (Description & Type) */}
          <div className="bg-black/30 p-2 text-center border-t border-white/10 flex flex-col justify-end min-h-[3rem]">
             <div className={`
                font-medium opacity-90 leading-tight mb-1
                ${compact ? 'text-[9px] line-clamp-2' : 'text-[10px] line-clamp-3'}
             `}>
                {descriptionText}
             </div>
             
             <div className="flex justify-between items-center w-full">
                 <div className={`uppercase tracking-widest font-bold opacity-60 ${compact ? 'text-[9px]' : 'text-[9px]'}`}>
                    {typeName}
                 </div>
                 {!compact && <div className={`text-[8px] ${rarityConfig.color} font-bold opacity-80 uppercase`}>{rarityConfig.name}</div>}
             </div>
          </div>
        </div>
    </div>
  );
};
