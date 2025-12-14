
import * as Icons from 'lucide-react';
import { CardType } from '../types';

export const getIcon = (name: string, size = 16, className = '') => {
    // @ts-ignore
    const Icon = Icons[name] || Icons.HelpCircle;
    return React.createElement(Icon, { size, className });
};

export const getIconComponent = (name: string) => {
    // @ts-ignore
    return Icons[name] || Icons.HelpCircle;
};

export const getIconForType = (type: CardType) => {
  switch (type) {
    case CardType.INDUSTRY: return Icons.Factory;
    case CardType.ATTACK: return Icons.Sword;
    case CardType.MAGIC_ATTACK: return Icons.Flame;
    case CardType.HEAL: return Icons.Heart;
    case CardType.SPECIAL: return Icons.Skull;
    case CardType.CONTRACT: return Icons.Scroll;
    case CardType.RUNE: return Icons.Zap;
    case CardType.RITUAL: return Icons.Book;
    case CardType.ARTIFACT: return Icons.Anchor;
    default: return Icons.Sparkles;
  }
};

import React from 'react';
