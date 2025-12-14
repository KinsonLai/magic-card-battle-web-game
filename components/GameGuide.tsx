
import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Shield, Sword, Zap, Flame, Droplets, Mountain, Wind, Skull, ShoppingBag, Clock, Coins, Layers, Target, Sun, Moon, Ghost, Scroll, Scale, Swords, Map, Crown, Sparkles, AlertCircle, ChevronRight, Gem, Hammer, Factory, PlayCircle, Heart, Check, X } from 'lucide-react';

interface GameGuideProps {
    onBack: () => void;
}

type SectionType = 'lore' | 'nations' | 'flow' | 'economy' | 'cards' | 'elements' | 'soul';

export const GameGuide: React.FC<GameGuideProps> = ({ onBack }) => {
    const [activeSection, setActiveSection] = useState<SectionType>('lore');

    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const NavItem = ({ id, label, icon }: { id: SectionType, label: string, icon: React.ReactNode }) => (
        <button 
            onClick={() => { setActiveSection(id); scrollTo(`section-${id}`); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${activeSection === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 ring-1 ring-indigo-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 overflow-hidden flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-3 sticky top-0 z-50 flex flex-col gap-3 shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-700 transition-colors group">
                            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform"/>
                        </button>
                        <h1 className="text-lg md:text-xl font-black cinzel text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-white to-slate-200 flex items-center gap-2">
                            <BookOpen className="text-indigo-500" size={20}/> 冒險者手冊
                        </h1>
                    </div>
                </div>
                {/* Scrollable Nav */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mask-fade-right">
                    <NavItem id="lore" label="背景故事" icon={<Scroll size={14}/>} />
                    <NavItem id="nations" label="四大國度" icon={<Map size={14}/>} />
                    <NavItem id="flow" label="回合流程" icon={<Clock size={14}/>} />
                    <NavItem id="economy" label="經濟系統" icon={<Coins size={14}/>} />
                    <NavItem id="cards" label="卡牌機制" icon={<Layers size={14}/>} />
                    <NavItem id="elements" label="元素反應" icon={<Flame size={14}/>} />
                    <NavItem id="soul" label="靈魂天平" icon={<Scale size={14}/>} />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 relative">
                {/* Background Ambience */}
                <div className="fixed inset-0 pointer-events-none opacity-10">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(76,29,149,0.2),_transparent_70%)]"></div>
                    <div className="absolute top-20 left-10 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"></div>
                </div>

                <div className="max-w-4xl mx-auto space-y-24 relative z-10 pb-32">

                    {/* 1. LORE */}
                    <section id="section-lore" className="animate-fade-in-up space-y-6 text-center py-10">
                        <div className="inline-block p-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-4">
                            <Sparkles className="text-indigo-400" size={32} />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black cinzel text-white drop-shadow-lg">艾瑟嘉德的崩壞</h2>
                        <div className="max-w-2xl mx-auto text-slate-400 leading-relaxed space-y-4">
                            <p>
                                在古老的艾瑟嘉德大陸 (Aethelgard)，元素平衡曾是維繫世界的基石。然而，隨著<span className="text-indigo-400 font-bold">「虛空之門」</span>的意外開啟，魔法能量開始失控，世界分裂為四個相互對立的陣營。
                            </p>
                            <p>
                                為了爭奪日益枯竭的資源與重塑世界秩序的主導權，<span className="text-red-400 font-bold">鬥士</span>、<span className="text-yellow-400 font-bold">神聖</span>、<span className="text-emerald-400 font-bold">商業</span>與<span className="text-purple-400 font-bold">魔法</span>四大國度展開了無休止的戰爭。
                            </p>
                            <p className="italic text-slate-500 border-t border-slate-800 pt-4 mt-4">
                                "誰能掌握靈魂的天平，誰就能主宰這片破碎的大地。"
                            </p>
                        </div>
                    </section>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>

                    {/* 2. NATIONS */}
                    <section id="section-nations" className="space-y-8">
                        <SectionHeader title="四大國度 (The Four Nations)" icon={<Map/>} subtitle="選擇你的陣營，利用先天優勢征服對手。" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NationCard 
                                name="鬥士之國 (Fighter)" 
                                color="red" 
                                icon={<Sword size={24}/>} 
                                bonus="HP +50"
                                desc="為戰鬥而生的民族。擁有最高的初始生命值，適合持久戰與肉搏。"
                            />
                            <NationCard 
                                name="神聖之國 (Holy)" 
                                color="yellow" 
                                icon={<Sun size={24}/>} 
                                bonus="HP +30, Mana +20"
                                desc="受到光之庇護。擁有均衡的生命與魔力，擅長恢復與防禦。"
                            />
                            <NationCard 
                                name="商業之國 (Commercial)" 
                                color="emerald" 
                                icon={<Coins size={24}/>} 
                                bonus="Gold +150, Income +10"
                                desc="金錢主宰一切。擁有巨額初始資金與更高的被動收入，依靠經濟優勢壓垮敵人。"
                            />
                            <NationCard 
                                name="魔法之國 (Magic)" 
                                color="purple" 
                                icon={<Zap size={24}/>} 
                                bonus="Mana +60, Gold +20, HP -10"
                                desc="奧術的極致追求者。擁有龐大的魔力池，能頻繁施放法術，但身體較為孱弱。"
                            />
                        </div>
                    </section>

                    {/* 3. TURN FLOW */}
                    <section id="section-flow" className="space-y-8">
                        <SectionHeader title="回合流程 (Turn Flow)" icon={<Clock/>} subtitle="運籌帷幄，步步為營。" />

                        <div className="relative border-l-2 border-slate-800 ml-4 md:ml-8 space-y-8 py-4">
                            <TimelineItem 
                                step="1" 
                                title="準備階段 (Preparation)" 
                                icon={<Coins size={18}/>}
                                desc="回合開始時，你將自動獲得【產業收入】與【魔力回復】。同時，如果你處於特殊狀態，也會在此時結算獎勵。"
                            />
                            <TimelineItem 
                                step="2" 
                                title="抽牌階段 (Draw)" 
                                icon={<Layers size={18}/>}
                                desc="從牌庫中抽取卡牌。預設每回合抽取 2 張。神器效果（如赫爾墨斯之靴）可增加抽牌數。"
                            />
                            <TimelineItem 
                                step="3" 
                                title="行動階段 (Action)" 
                                icon={<PlayCircle size={18}/>}
                                active
                                desc={
                                    <ul className="list-disc list-inside space-y-1 mt-2 text-slate-400">
                                        <li><span className="text-white font-bold">出牌：</span>每回合預設可打出 <span className="text-yellow-400">3 張</span> 卡牌。</li>
                                        <li><span className="text-white font-bold">交易：</span>在商店購買卡牌或出售手牌（不消耗行動次數）。</li>
                                    </ul>
                                }
                            />
                            <TimelineItem 
                                step="4" 
                                title="結束/防禦 (End/Defense)" 
                                icon={<Shield size={18}/>}
                                desc="當你點擊「結束回合」後，若其他玩家對你發動攻擊，你將進入防禦階段。此時只能使用【攻擊卡】進行反擊 (Repel)。"
                            />
                        </div>
                    </section>

                    {/* 4. ECONOMY & SHOP */}
                    <section id="section-economy" className="space-y-8">
                        <SectionHeader title="經濟與商店 (Economy)" icon={<ShoppingBag/>} subtitle="金錢是戰爭的命脈。" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2"><Coins/> 獲取金錢</h3>
                                <ul className="space-y-3 text-sm text-slate-300">
                                    <li className="flex items-start gap-2"><span className="text-green-400">1.</span> 建造 <span className="text-white">產業卡 (Industry)</span> 增加每回合被動收入。</li>
                                    <li className="flex items-start gap-2"><span className="text-green-400">2.</span> 使用 <span className="text-white">契約卡 (Contract)</span> 犧牲生命換取現金。</li>
                                    <li className="flex items-start gap-2"><span className="text-green-400">3.</span> 出售不需要的手牌 (半價回收)。</li>
                                </ul>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
                                <h3 className="text-xl font-bold text-indigo-400 mb-4 flex items-center gap-2"><ShoppingBag/> 商店系統</h3>
                                <p className="text-sm text-slate-300 mb-4">
                                    商店每回合會刷新隨機卡牌。你可以花費金幣購買強力卡牌強化牌組。
                                </p>
                                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                                    <Sparkles className="text-yellow-400 shrink-0" size={14}/>
                                    <div>
                                        <span className="text-yellow-400 font-bold">提示：</span> 當靈魂達到【極致光明 (+3)】時，下一回合商店首次購買享有 <span className="text-white">50% 折扣</span>。
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 5. CARD TYPES */}
                    <section id="section-cards" className="space-y-8">
                        <SectionHeader title="卡牌機制 (Cards)" icon={<Layers/>} subtitle="認識你的武器庫。" />

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <CardTypeBox title="產業 (Industry)" icon={<Factory/>} desc="增加每回合收入。" color="bg-emerald-900/30 text-emerald-400 border-emerald-500/30" />
                            <CardTypeBox title="攻擊 (Attack)" icon={<Sword/>} desc="物理/魔法傷害。可用於攻擊或反擊。" color="bg-red-900/30 text-red-400 border-red-500/30" />
                            <CardTypeBox title="治療 (Heal)" icon={<Heart/>} desc="恢復生命值。" color="bg-green-900/30 text-green-400 border-green-500/30" />
                            <CardTypeBox title="導彈 (Missile)" icon={<Target/>} desc="直接摧毀敵方產業，削減經濟來源。" color="bg-orange-900/30 text-orange-400 border-orange-500/30" />
                            <CardTypeBox title="護盾 (Shield)" icon={<Shield/>} desc="抵擋一次導彈的破壞效果。" color="bg-cyan-900/30 text-cyan-400 border-cyan-500/30" />
                            <CardTypeBox title="聖物 (Artifact)" icon={<Gem/>} desc="提供永久被動加成 (裝備)。" color="bg-amber-900/30 text-amber-400 border-amber-500/30" />
                            <CardTypeBox title="符文 (Rune)" icon={<Zap/>} desc="強化攻擊卡的數值與屬性。" color="bg-pink-900/30 text-pink-400 border-pink-500/30" />
                            <CardTypeBox title="儀式 (Ritual)" icon={<BookOpen/>} desc="觸發全域事件 (需特定靈魂狀態)。" color="bg-indigo-900/30 text-indigo-400 border-indigo-500/30" />
                        </div>
                    </section>

                    {/* 6. ELEMENTS */}
                    <section id="section-elements" className="space-y-8">
                        <SectionHeader title="元素反應 (Reactions)" icon={<Flame/>} subtitle="利用「掛載」與「引爆」機制創造連鎖。" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5 relative overflow-hidden">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Target className="text-blue-400"/> 步驟 1: 掛載印記 (Prime)</h3>
                                <p className="text-slate-400 text-sm">
                                    使用元素攻擊命中敵人時，會在敵人身上留下該元素的<span className="text-blue-300 font-bold">「印記」</span>。
                                </p>
                            </div>
                            <div className="bg-slate-900/60 border border-slate-700 rounded-2xl p-5 relative overflow-hidden">
                                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2"><Zap className="text-red-400"/> 步驟 2: 引爆反應 (Detonate)</h3>
                                <p className="text-slate-400 text-sm">
                                    對<span className="text-white font-bold">已有印記</span>的敵人使用<span className="text-red-300 font-bold">不同元素</span>攻擊，觸發強力反應。
                                </p>
                            </div>
                        </div>

                        {/* Reaction Formulas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ReactionCard 
                                title="擴散 (Spread)" 
                                color="orange" 
                                formula={['fire', 'air']} 
                                icon={<Flame/>} 
                                desc="造成流血狀態，並隨機摧毀敵方一座產業。"
                            />
                            <ReactionCard 
                                title="泥沼 (Mire)" 
                                color="emerald" 
                                formula={['earth', 'water']} 
                                icon={<Mountain/>} 
                                desc="賦予緩速，敵方下回合行動力 (Max Plays) 減少。"
                            />
                            <ReactionCard 
                                title="湮滅 (Annihilation)" 
                                color="purple" 
                                formula={['opposing']} 
                                subtext="對立元素 (水火 / 地風)"
                                icon={<Ghost/>} 
                                desc="造成 150% 爆發傷害，但自身受到 25% 真實傷害反噬。"
                            />
                            <ReactionCard 
                                title="過載 (Overload)" 
                                color="blue" 
                                formula={['complementary']} 
                                subtext="其他組合 (如火地 / 水風)"
                                icon={<Zap/>} 
                                desc="造成 125% 傷害，並恢復自身 10 HP。"
                            />
                        </div>
                    </section>

                    {/* 7. SOUL SCALE & COMBAT */}
                    <section id="section-soul" className="space-y-8">
                        <SectionHeader title="靈魂與戰鬥 (Soul & Combat)" icon={<Scale/>} subtitle="在光與暗之間尋找平衡。" />

                        {/* Visual Scale Meter */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-yellow-900/20 pointer-events-none"></div>
                            
                            {/* Scale Bar */}
                            <div className="relative h-4 bg-slate-800 rounded-full mb-12 mt-4 mx-4">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-slate-700 to-yellow-500 opacity-50 rounded-full"></div>
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full flex justify-between px-1">
                                    {[-3, -2, -1, 0, 1, 2, 3].map(val => (
                                        <div key={val} className="relative group">
                                            <div className={`w-4 h-4 rounded-full border-2 ${val === 0 ? 'bg-slate-500 border-white' : val > 0 ? 'bg-yellow-500 border-yellow-200' : 'bg-purple-600 border-purple-300'} z-10 relative shadow-[0_0_10px_rgba(255,255,255,0.3)]`}></div>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 font-mono">{val > 0 ? `+${val}` : val}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-xl">
                                    <h4 className="text-purple-300 font-bold mb-2 flex items-center gap-2"><Moon size={16}/> 暗黑側 (-1 ~ -3)</h4>
                                    <ul className="text-xs text-slate-300 space-y-2">
                                        <li>● 邪惡卡傷害 + (靈魂值 x 2)</li>
                                        <li>● -3 解鎖：災難儀式卡（新！）</li>
                                        <li>● 懲罰：打出神聖卡扣血 (Mana x 25%)</li>
                                    </ul>
                                </div>
                                <div className="bg-yellow-950/40 border border-yellow-500/30 p-4 rounded-xl">
                                    <h4 className="text-yellow-300 font-bold mb-2 flex items-center gap-2"><Sun size={16}/> 光明側 (+1 ~ +3)</h4>
                                    <ul className="text-xs text-slate-300 space-y-2">
                                        <li>● 神聖卡傷害 + (靈魂值 x 2)</li>
                                        <li>● +3 解鎖：祝福儀式卡（新！）</li>
                                        <li>● +3 效果：商店首次購買 50% 折扣</li>
                                        <li>● 懲罰：打出邪惡卡扣血 (Mana x 25%)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Stacking & Repel */}
                        <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl relative">
                            <div className="absolute -top-3 -left-3 bg-indigo-600 text-white px-4 py-1 rounded-full font-bold text-sm shadow-lg">堆疊與反擊</div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-white mb-2">堆疊限制 (Stacking)</h4>
                                    <p className="text-slate-400 text-xs mb-2">一次打出多張牌需滿足所有條件：</p>
                                    <div className="bg-black/30 p-3 rounded text-xs space-y-1 text-slate-300">
                                        <div className="flex items-center gap-2"><Check size={12} className="text-green-400"/> 物理攻擊：只能出一張武器卡 (核心)</div>
                                        <div className="flex items-center gap-2"><Check size={12} className="text-green-400"/> 符文：必須搭配武器卡，且屬性/陣營需一致</div>
                                        <div className="flex items-center gap-2"><Check size={12} className="text-green-400"/> 魔法攻擊：可多張同屬性堆疊，不可接符文</div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-2">反擊機制 (Repel)</h4>
                                    <p className="text-slate-400 text-xs mb-2">被攻擊時，只能用攻擊卡對撞：</p>
                                    <ul className="text-xs text-slate-300 space-y-2">
                                        <li className="flex gap-2"><span className="text-green-400 font-bold flex items-center gap-1"><Check size={12}/> 贏:</span> 我方傷害 {'>'} 敵方，無傷並反彈差額。</li>
                                        <li className="flex gap-2"><span className="text-red-400 font-bold flex items-center gap-1"><X size={12}/> 輸:</span> 我方傷害 {'<'} 敵方，承受差額，可能觸發反應。</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="text-center pt-8">
                        <button onClick={onBack} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-lg shadow-indigo-900/50 transition-all hover:scale-105 active:scale-95 text-lg flex items-center gap-2 mx-auto">
                            準備戰鬥 <Swords size={20}/>
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Sub-components for Cleaner Code ---

const SectionHeader = ({ title, icon, subtitle }: { title: string, icon: React.ReactNode, subtitle: string }) => (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-4">
        <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <span className="bg-slate-800 p-2 rounded-xl text-indigo-400">{icon}</span>
            {title}
        </h2>
        <p className="text-slate-400 text-sm md:text-base pl-1">{subtitle}</p>
    </div>
);

const NationCard = ({ name, color, icon, bonus, desc }: { name: string, color: string, icon: React.ReactNode, bonus: string, desc: string }) => {
    const colorClasses = {
        red: 'border-red-500/50 bg-red-950/20 text-red-100',
        yellow: 'border-yellow-500/50 bg-yellow-950/20 text-yellow-100',
        emerald: 'border-emerald-500/50 bg-emerald-950/20 text-emerald-100',
        purple: 'border-purple-500/50 bg-purple-950/20 text-purple-100',
    }[color] || 'border-slate-500 bg-slate-900 text-white';

    const iconColor = {
        red: 'bg-red-500', yellow: 'bg-yellow-500', emerald: 'bg-emerald-500', purple: 'bg-purple-500'
    }[color] || 'bg-slate-500';

    return (
        <div className={`p-5 rounded-2xl border ${colorClasses} relative overflow-hidden group hover:scale-[1.02] transition-transform`}>
            <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg">{name}</h3>
                <div className={`p-2 rounded-full text-white ${iconColor} shadow-lg`}>{icon}</div>
            </div>
            <div className="text-xs font-mono bg-black/30 p-2 rounded mb-3 inline-block border border-white/10">
                起始加成: {bonus}
            </div>
            <p className="text-sm opacity-80 leading-relaxed">{desc}</p>
        </div>
    );
};

const TimelineItem = ({ step, title, desc, icon, active }: { step: string, title: string, desc: React.ReactNode, icon: React.ReactNode, active?: boolean }) => (
    <div className={`relative pl-8 ${active ? 'opacity-100' : 'opacity-80'}`}>
        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${active ? 'bg-indigo-500 border-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-900 border-slate-600'}`}></div>
        <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400">Step {step}</span>
            <h4 className={`font-bold text-lg ${active ? 'text-indigo-300' : 'text-slate-200'}`}>{title}</h4>
        </div>
        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed">
            <div className="float-right ml-4 mb-1 p-2 bg-slate-800 rounded-lg text-slate-400">{icon}</div>
            {desc}
        </div>
    </div>
);

const CardTypeBox = ({ title, icon, desc, color }: { title: string, icon: React.ReactNode, desc: string, color: string }) => (
    <div className={`p-3 rounded-xl border flex flex-col gap-2 ${color} transition-all hover:brightness-110`}>
        <div className="flex items-center gap-2 font-bold">
            {icon} {title}
        </div>
        <p className="text-[10px] opacity-80 leading-tight">{desc}</p>
    </div>
);

const ReactionCard = ({ title, color, formula, icon, desc, subtext }: { title: string, color: string, formula: string[], icon: React.ReactNode, desc: string, subtext?: string }) => {
    const getColorClass = (c: string) => {
        if (c === 'orange') return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
        if (c === 'emerald') return 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30';
        if (c === 'purple') return 'text-purple-400 bg-purple-900/20 border-purple-500/30';
        if (c === 'blue') return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
        return 'text-slate-400 bg-slate-800 border-slate-700';
    };

    const getIcon = (type: string) => {
        if (type === 'fire') return <Flame size={16} className="text-orange-500"/>;
        if (type === 'air') return <Wind size={16} className="text-sky-400"/>;
        if (type === 'earth') return <Mountain size={16} className="text-amber-500"/>;
        if (type === 'water') return <Droplets size={16} className="text-blue-500"/>;
        if (type === 'opposing') return <div className="flex"><Flame size={12} className="text-orange-500"/><span className="mx-1">/</span><Droplets size={12} className="text-blue-500"/></div>;
        if (type === 'complementary') return <div className="flex"><Flame size={12} className="text-orange-500"/><span className="mx-1">+</span><Mountain size={12} className="text-amber-500"/></div>;
        return null;
    };

    return (
        <div className={`border rounded-xl p-4 flex flex-col gap-3 transition-all hover:scale-[1.02] hover:shadow-xl ${getColorClass(color)}`}>
            <div className="flex justify-between items-start">
                <h4 className="font-black text-lg">{title}</h4>
                <div className="p-2 bg-black/20 rounded-full">{icon}</div>
            </div>
            <div className="bg-black/30 rounded-lg p-2 flex items-center justify-center gap-3 text-sm font-mono">
                {formula.map((f, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span className="text-slate-500">+</span>}
                        <div className="bg-slate-800 p-1.5 rounded-md border border-slate-600 shadow-inner">
                            {getIcon(f)}
                        </div>
                    </React.Fragment>
                ))}
            </div>
            {subtext && <div className="text-[10px] text-center opacity-60 -mt-2">{subtext}</div>}
            <p className="text-xs font-bold leading-relaxed opacity-90 border-t border-current/10 pt-2 mt-auto">
                {desc}
            </p>
        </div>
    );
};