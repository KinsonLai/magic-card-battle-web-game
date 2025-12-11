import React, { useState } from 'react';
import { NationType, GameSettings, Language } from '../types';
import { NATION_CONFIG } from '../constants';
import { TRANSLATIONS } from '../locales';
import { Crown, Users, TrendingUp, Zap, Settings, ArrowLeft, Monitor } from 'lucide-react';

interface LobbyScreenProps {
  onStart: (name: string, nation: NationType, settings: GameSettings) => void;
  onBack: () => void;
  lang: Language;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onStart, onBack, lang }) => {
  const t = TRANSLATIONS['zh-TW']; // Force Chinese
  const [name, setName] = useState('玩家 1');
  const [selectedNation, setSelectedNation] = useState<NationType>(NationType.FIGHTER);
  
  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    initialGold: 100,
    maxPlayers: 4,
    botCount: 3,
    botDifficulty: 'normal',
    cardsDrawPerTurn: 1,
    incomeMultiplier: 1,
    eventFrequency: 5
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-4 text-white overflow-y-auto">
      <div className="max-w-5xl w-full my-8">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
                <ArrowLeft />
            </button>
            <h1 className="text-4xl font-bold cinzel">{t.settings}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Player Config */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Settings size={20}/> {t.host}</h2>
                    <div className="mb-6">
                        <label className="block text-sm text-slate-400 mb-1">{t.yourName}</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-3 focus:border-indigo-500 outline-none"
                            placeholder={t.enterName}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(NATION_CONFIG).map(([key, config]) => {
                            // @ts-ignore
                            const nationTrans = t.nations[key];
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedNation(key as NationType)}
                                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${selectedNation === key ? `${config.borderColor} ${config.bgColor}` : 'border-slate-800 bg-slate-800/50'}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {key === NationType.FIGHTER && <Crown size={16} className={config.color} />}
                                        {key === NationType.HOLY && <Users size={16} className={config.color} />}
                                        {key === NationType.COMMERCIAL && <TrendingUp size={16} className={config.color} />}
                                        {key === NationType.MAGIC && <Zap size={16} className={config.color} />}
                                        <span className={`font-bold ${config.color}`}>{nationTrans.name}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{nationTrans.desc}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right: Game Settings */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 h-fit space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-400"><Monitor size={18}/> {t.settings}</h3>
                
                <div>
                    <label className="text-xs text-slate-400 flex justify-between">{t.initialGold} <span className="text-white">{settings.initialGold}</span></label>
                    <input type="range" min="0" max="500" step="50" value={settings.initialGold} onChange={e => setSettings({...settings, initialGold: parseInt(e.target.value)})} className="w-full accent-indigo-500"/>
                </div>

                <div>
                    <label className="text-xs text-slate-400 flex justify-between">{t.botCount} <span className="text-white">{settings.botCount}</span></label>
                    <input type="range" min="1" max="7" value={settings.botCount} onChange={e => setSettings({...settings, botCount: parseInt(e.target.value)})} className="w-full accent-indigo-500"/>
                </div>

                <div>
                    <label className="text-xs text-slate-400">{t.botDifficulty}</label>
                    <div className="flex rounded bg-slate-800 mt-1">
                        {(['easy', 'normal', 'hard'] as const).map(d => (
                            <button 
                                key={d} 
                                onClick={() => setSettings({...settings, botDifficulty: d})}
                                className={`flex-1 py-1 text-xs capitalize rounded ${settings.botDifficulty === d ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                            >
                                {t[d]}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-400 flex justify-between">{t.drawPerTurn} <span className="text-white">{settings.cardsDrawPerTurn}</span></label>
                    <input type="range" min="1" max="5" value={settings.cardsDrawPerTurn} onChange={e => setSettings({...settings, cardsDrawPerTurn: parseInt(e.target.value)})} className="w-full accent-indigo-500"/>
                </div>

                <div>
                    <label className="text-xs text-slate-400 flex justify-between">{t.incomeMult} <span className="text-white">x{settings.incomeMultiplier}</span></label>
                    <input type="range" min="1" max="5" step="0.5" value={settings.incomeMultiplier} onChange={e => setSettings({...settings, incomeMultiplier: parseFloat(e.target.value)})} className="w-full accent-indigo-500"/>
                </div>
                
                <div>
                    <label className="text-xs text-slate-400 flex justify-between">{t.eventFreq} <span className="text-white">{settings.eventFrequency}</span></label>
                    <input type="range" min="1" max="20" value={settings.eventFrequency} onChange={e => setSettings({...settings, eventFrequency: parseInt(e.target.value)})} className="w-full accent-indigo-500"/>
                </div>

                <button
                    onClick={() => onStart(name, selectedNation, settings)}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transform transition-all active:scale-95"
                >
                    {t.startGame}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
