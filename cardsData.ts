
export const cardsData = [
  // --- INDUSTRY (Neutral, No Alignment) ---
  { "id": "small_shop", "name": "市場攤位", "type": "INDUSTRY", "rarity": "COMMON", "cost": 30, "manaCost": 0, "value": 5, "effectType": "income", "description": "每回合獲得少量收入", "element": "NEUTRAL" },
  { "id": "farm", "name": "小麥農場", "type": "INDUSTRY", "rarity": "COMMON", "cost": 50, "manaCost": 0, "value": 8, "effectType": "income", "description": "穩定的食物供應，增加收入", "element": "NEUTRAL" },
  { "id": "logging_camp", "name": "伐木場", "type": "INDUSTRY", "rarity": "COMMON", "cost": 40, "manaCost": 0, "value": 6, "effectType": "income", "description": "開採木材資源，增加基礎收入", "element": "NEUTRAL" },
  { "id": "fishery", "name": "近海漁場", "type": "INDUSTRY", "rarity": "COMMON", "cost": 45, "manaCost": 0, "value": 7, "effectType": "income", "description": "捕撈海產，增加收入", "element": "NEUTRAL" },
  { "id": "workshop", "name": "工坊", "type": "INDUSTRY", "rarity": "RARE", "cost": 80, "manaCost": 0, "value": 12, "effectType": "income", "description": "生產工具，增加收入", "element": "NEUTRAL" },
  { "id": "foundry", "name": "鋼鐵鑄造廠", "type": "INDUSTRY", "rarity": "RARE", "cost": 90, "manaCost": 0, "value": 14, "effectType": "income", "description": "冶煉鋼鐵，顯著增加收入", "element": "NEUTRAL" },
  { "id": "mine", "name": "金礦", "type": "INDUSTRY", "rarity": "EPIC", "cost": 120, "manaCost": 0, "value": 18, "effectType": "income", "description": "挖掘黃金，大幅增加收入", "element": "NEUTRAL" },
  { "id": "mint", "name": "皇家造幣廠", "type": "INDUSTRY", "rarity": "EPIC", "cost": 180, "manaCost": 0, "value": 28, "effectType": "income", "description": "發行貨幣，巨額收入來源", "element": "NEUTRAL" },
  { "id": "bank", "name": "銀行總部", "type": "INDUSTRY", "rarity": "LEGENDARY", "cost": 250, "manaCost": 0, "value": 35, "effectType": "income", "description": "金融中心，巨額收入", "element": "NEUTRAL" },
  { "id": "stock_exchange", "name": "證券交易所", "type": "INDUSTRY", "rarity": "LEGENDARY", "cost": 300, "manaCost": 0, "value": 45, "effectType": "income", "description": "掌控全球經濟命脈，極致收入", "element": "NEUTRAL" },
  
  // --- SUPPORT ---
  { "id": "minor_heal", "name": "輕微治療", "type": "HEAL", "rarity": "COMMON", "cost": 20, "manaCost": 15, "value": 20, "effectType": "heal", "description": "恢復少量生命值", "element": "WATER", "alignment": "HOLY" },
  { "id": "holy_light", "name": "聖光術", "type": "HEAL", "rarity": "RARE", "cost": 60, "manaCost": 40, "value": 50, "effectType": "heal", "description": "恢復大量生命值", "element": "NEUTRAL", "alignment": "HOLY" },
  { "id": "regeneration", "name": "再生", "type": "HEAL", "rarity": "EPIC", "cost": 150, "manaCost": 80, "value": 100, "effectType": "heal", "description": "極大幅度恢復生命值", "element": "EARTH", "alignment": "HOLY" },
  
  { "id": "meditation", "name": "冥想", "type": "SPECIAL", "rarity": "COMMON", "cost": 20, "manaCost": 0, "value": 30, "effectType": "mana", "description": "集中精神，恢復魔力", "element": "AIR", "alignment": "HOLY" },
  { "id": "mana_burn", "name": "魔力燃燒", "type": "SPECIAL", "rarity": "RARE", "cost": 80, "manaCost": 30, "value": 40, "effectType": "mana_burn", "description": "燒毀敵方 40 點魔力", "element": "FIRE", "alignment": "EVIL" },
  { "id": "stun_spell", "name": "時間靜止", "type": "SPECIAL", "rarity": "EPIC", "cost": 150, "manaCost": 80, "value": 1, "effectType": "stun", "description": "使敵方下回合無法行動", "element": "WATER", "alignment": "EVIL" },
  { "id": "mind_rot", "name": "心靈腐敗", "type": "SPECIAL", "rarity": "RARE", "cost": 100, "manaCost": 40, "value": 2, "effectType": "discard_opponent", "description": "隨機棄掉敵方 2 張手牌", "element": "AIR", "alignment": "EVIL" },
  
  { "id": "pickpocket", "name": "鮮血契約: 扒竊", "type": "CONTRACT", "rarity": "COMMON", "cost": 0, "manaCost": 0, "value": 20, "hpCost": 10, "effectType": "gold_steal", "description": "犧牲 10HP 偷取少量金錢", "element": "AIR", "alignment": "EVIL" },
  { "id": "investment", "name": "鮮血契約: 投資", "type": "CONTRACT", "rarity": "RARE", "cost": 0, "manaCost": 0, "value": 100, "hpCost": 25, "effectType": "gold_gain", "description": "犧牲 25HP 獲得一筆投資回報", "element": "EARTH", "alignment": "EVIL" },
  { "id": "dark_ritual", "name": "黑暗儀式", "type": "CONTRACT", "rarity": "EPIC", "cost": 0, "manaCost": 0, "value": 200, "hpCost": 50, "effectType": "gold_gain", "description": "犧牲 50HP 獲得巨額財富", "element": "FIRE", "alignment": "EVIL" },
  
  // --- PHYSICAL ATTACKS (DUAL EFFECTS, NEUTRAL) ---
  // Common
  { "id": "wpn_iron_sword", "name": "鐵製長劍", "type": "ATTACK", "rarity": "COMMON", "cost": 20, "manaCost": 0, "value": 10, "holyBonus": 5, "evilBonus": 5, "effectType": "damage", "description": "基礎 10 / [光] +5 / [暗] +5", "element": "NEUTRAL" },
  { "id": "wpn_oak_staff", "name": "橡木棍", "type": "ATTACK", "rarity": "COMMON", "cost": 15, "manaCost": 0, "value": 8, "holyBonus": 6, "evilBonus": 2, "effectType": "damage", "description": "基礎 8 / [光] +6 / [暗] +2", "element": "NEUTRAL" },
  { "id": "wpn_rusty_dagger", "name": "生鏽匕首", "type": "ATTACK", "rarity": "COMMON", "cost": 15, "manaCost": 0, "value": 8, "holyBonus": 2, "evilBonus": 6, "effectType": "damage", "description": "基礎 8 / [光] +2 / [暗] +6", "element": "NEUTRAL" },
  { "id": "wpn_spear", "name": "士兵長矛", "type": "ATTACK", "rarity": "COMMON", "cost": 25, "manaCost": 0, "value": 12, "holyBonus": 4, "evilBonus": 4, "effectType": "damage", "description": "基礎 12 / [光] +4 / [暗] +4", "element": "NEUTRAL" },
  { "id": "wpn_axe", "name": "伐木斧", "type": "ATTACK", "rarity": "COMMON", "cost": 25, "manaCost": 0, "value": 12, "holyBonus": 3, "evilBonus": 5, "effectType": "damage", "description": "基礎 12 / [光] +3 / [暗] +5", "element": "NEUTRAL" },
  { "id": "wpn_mace", "name": "釘頭錘", "type": "ATTACK", "rarity": "COMMON", "cost": 30, "manaCost": 0, "value": 14, "holyBonus": 6, "evilBonus": 4, "effectType": "damage", "description": "基礎 14 / [光] +6 / [暗] +4", "element": "NEUTRAL" },
  { "id": "wpn_crossbow", "name": "十字弓", "type": "ATTACK", "rarity": "COMMON", "cost": 30, "manaCost": 0, "value": 14, "holyBonus": 5, "evilBonus": 5, "effectType": "damage", "description": "基礎 14 / [光] +5 / [暗] +5", "element": "NEUTRAL" },
  { "id": "wpn_scimitar", "name": "彎刀", "type": "ATTACK", "rarity": "COMMON", "cost": 35, "manaCost": 5, "value": 16, "holyBonus": 4, "evilBonus": 8, "effectType": "damage", "description": "基礎 16 / [光] +4 / [暗] +8", "element": "NEUTRAL" },
  { "id": "wpn_broadsword", "name": "闊劍", "type": "ATTACK", "rarity": "COMMON", "cost": 35, "manaCost": 5, "value": 16, "holyBonus": 8, "evilBonus": 4, "effectType": "damage", "description": "基礎 16 / [光] +8 / [暗] +4", "element": "NEUTRAL" },
  { "id": "wpn_knuckles", "name": "鐵指虎", "type": "ATTACK", "rarity": "COMMON", "cost": 20, "manaCost": 0, "value": 10, "holyBonus": 5, "evilBonus": 5, "effectType": "damage", "description": "基礎 10 / [光] +5 / [暗] +5", "element": "NEUTRAL" },

  // Rare
  { "id": "wpn_silver_lance", "name": "銀白長槍", "type": "ATTACK", "rarity": "RARE", "cost": 60, "manaCost": 5, "value": 20, "holyBonus": 15, "evilBonus": 5, "effectType": "damage", "description": "基礎 20 / [光] +15 / [暗] +5", "element": "NEUTRAL" },
  { "id": "wpn_blood_scythe", "name": "飲血鐮刀", "type": "ATTACK", "rarity": "RARE", "cost": 60, "manaCost": 5, "value": 20, "holyBonus": 5, "evilBonus": 15, "effectType": "damage", "description": "基礎 20 / [光] +5 / [暗] +15", "element": "NEUTRAL" },
  { "id": "wpn_warhammer", "name": "審判之錘", "type": "ATTACK", "rarity": "RARE", "cost": 70, "manaCost": 10, "value": 24, "holyBonus": 12, "evilBonus": 8, "effectType": "damage", "description": "基礎 24 / [光] +12 / [暗] +8", "element": "NEUTRAL" },
  { "id": "wpn_poison_fang", "name": "毒蛇之牙", "type": "ATTACK", "rarity": "RARE", "cost": 65, "manaCost": 5, "value": 22, "holyBonus": 5, "evilBonus": 15, "effectType": "damage", "description": "基礎 22 / [光] +5 / [暗] +15", "element": "NEUTRAL" },
  { "id": "wpn_blessed_blade", "name": "祝福之刃", "type": "ATTACK", "rarity": "RARE", "cost": 65, "manaCost": 5, "value": 22, "holyBonus": 15, "evilBonus": 5, "effectType": "damage", "description": "基礎 22 / [光] +15 / [暗] +5", "element": "NEUTRAL" },
  { "id": "wpn_nightmare_edge", "name": "夢魘之鋒", "type": "ATTACK", "rarity": "RARE", "cost": 75, "manaCost": 10, "value": 26, "holyBonus": 4, "evilBonus": 16, "effectType": "damage", "description": "基礎 26 / [光] +4 / [暗] +16", "element": "NEUTRAL" },
  { "id": "wpn_light_axe", "name": "光輝巨斧", "type": "ATTACK", "rarity": "RARE", "cost": 75, "manaCost": 10, "value": 26, "holyBonus": 16, "evilBonus": 4, "effectType": "damage", "description": "基礎 26 / [光] +16 / [暗] +4", "element": "NEUTRAL" },
  { "id": "wpn_katanas", "name": "雙刀流", "type": "ATTACK", "rarity": "RARE", "cost": 80, "manaCost": 15, "value": 28, "holyBonus": 10, "evilBonus": 10, "effectType": "damage", "description": "基礎 28 / [光] +10 / [暗] +10", "element": "NEUTRAL" },
  { "id": "wpn_halberd", "name": "皇家長戟", "type": "ATTACK", "rarity": "RARE", "cost": 70, "manaCost": 10, "value": 24, "holyBonus": 12, "evilBonus": 8, "effectType": "damage", "description": "基礎 24 / [光] +12 / [暗] +8", "element": "NEUTRAL" },
  { "id": "wpn_whip", "name": "痛苦之鞭", "type": "ATTACK", "rarity": "RARE", "cost": 60, "manaCost": 5, "value": 20, "holyBonus": 8, "evilBonus": 12, "effectType": "damage", "description": "基礎 20 / [光] +8 / [暗] +12", "element": "NEUTRAL" },

  // Epic
  { "id": "wpn_seraph_blade", "name": "熾天使之刃", "type": "ATTACK", "rarity": "EPIC", "cost": 150, "manaCost": 20, "value": 40, "holyBonus": 30, "evilBonus": 10, "effectType": "damage", "description": "基礎 40 / [光] +30 / [暗] +10", "element": "NEUTRAL" },
  { "id": "wpn_soul_reaper", "name": "靈魂收割者", "type": "ATTACK", "rarity": "EPIC", "cost": 150, "manaCost": 20, "value": 40, "holyBonus": 10, "evilBonus": 30, "effectType": "damage", "description": "基礎 40 / [光] +10 / [暗] +30", "element": "NEUTRAL" },
  { "id": "wpn_paladin_hammer", "name": "聖騎士戰錘", "type": "ATTACK", "rarity": "EPIC", "cost": 160, "manaCost": 25, "value": 45, "holyBonus": 35, "evilBonus": 5, "effectType": "damage", "description": "基礎 45 / [光] +35 / [暗] +5", "element": "NEUTRAL" },
  { "id": "wpn_chaos_blade", "name": "混沌巨劍", "type": "ATTACK", "rarity": "EPIC", "cost": 160, "manaCost": 25, "value": 45, "holyBonus": 5, "evilBonus": 35, "effectType": "damage", "description": "基礎 45 / [光] +5 / [暗] +35", "element": "NEUTRAL" },
  { "id": "wpn_dawn_guard", "name": "黎明守護者", "type": "ATTACK", "rarity": "EPIC", "cost": 170, "manaCost": 20, "value": 42, "holyBonus": 38, "evilBonus": 2, "effectType": "damage", "description": "基礎 42 / [光] +38 / [暗] +2", "element": "NEUTRAL" },
  { "id": "wpn_abyss_touch", "name": "深淵之觸", "type": "ATTACK", "rarity": "EPIC", "cost": 170, "manaCost": 20, "value": 42, "holyBonus": 2, "evilBonus": 38, "effectType": "damage", "description": "基礎 42 / [光] +2 / [暗] +38", "element": "NEUTRAL" },

  // Legendary (Mana Cap Applied 80->80, 100->100)
  { "id": "wpn_excalibur", "name": "王者之劍", "type": "ATTACK", "rarity": "LEGENDARY", "cost": 350, "manaCost": 80, "value": 70, "holyBonus": 80, "evilBonus": 20, "effectType": "damage", "description": "基礎 70 / [光] +80 / [暗] +20", "element": "NEUTRAL" },
  { "id": "wpn_godslayer", "name": "弒神者", "type": "ATTACK", "rarity": "LEGENDARY", "cost": 350, "manaCost": 80, "value": 70, "holyBonus": 20, "evilBonus": 80, "effectType": "damage", "description": "基礎 70 / [光] +20 / [暗] +80", "element": "NEUTRAL" },
  { "id": "wpn_trinity", "name": "三位一體", "type": "ATTACK", "rarity": "LEGENDARY", "cost": 320, "manaCost": 60, "value": 80, "holyBonus": 40, "evilBonus": 40, "effectType": "damage", "description": "基礎 80 / [光] +40 / [暗] +40", "element": "NEUTRAL" },
  { "id": "wpn_ragnarok", "name": "諸神黃昏", "type": "ATTACK", "rarity": "LEGENDARY", "cost": 400, "manaCost": 100, "value": 100, "holyBonus": 50, "evilBonus": 50, "effectType": "damage", "description": "基礎 100 / [光] +50 / [暗] +50", "element": "NEUTRAL" },

  // --- ARTIFACTS ---
  { "id": "ancient_coin", "name": "古老錢幣", "type": "ARTIFACT", "rarity": "COMMON", "cost": 150, "manaCost": 0, "value": 5, "effectType": "equip_artifact", "description": "每回合額外 +5 金錢", "element": "NEUTRAL", "alignment": "HOLY" },
  { "id": "mana_crystal", "name": "魔力水晶", "type": "ARTIFACT", "rarity": "RARE", "cost": 200, "manaCost": 0, "value": 10, "effectType": "equip_artifact", "description": "每回合額外 +10 魔力", "element": "WATER", "alignment": "HOLY" },
  { "id": "warriors_flag", "name": "戰士旗幟", "type": "ARTIFACT", "rarity": "RARE", "cost": 300, "manaCost": 0, "value": 15, "effectType": "equip_artifact", "description": "攻擊力 +15", "element": "FIRE", "alignment": "HOLY" },
  { "id": "lucky_charm", "name": "幸運護符", "type": "ARTIFACT", "rarity": "COMMON", "cost": 100, "manaCost": 0, "value": 0, "effectType": "equip_artifact", "description": "抵擋一次神器破壞 (消耗品)", "element": "NEUTRAL", "alignment": "HOLY" },
  { "id": "vampire_fang", "name": "吸血鬼之牙", "type": "ARTIFACT", "rarity": "EPIC", "cost": 250, "manaCost": 0, "value": 0, "effectType": "equip_artifact", "description": "造成傷害時恢復 10% 生命 (未實裝)", "element": "FIRE", "alignment": "EVIL" },
  { "id": "midas_hand", "name": "點石成金手", "type": "ARTIFACT", "rarity": "LEGENDARY", "cost": 400, "manaCost": 0, "value": 30, "effectType": "equip_artifact", "description": "每回合額外 +30 金錢", "element": "NEUTRAL", "alignment": "EVIL" },
  { "id": "philosopher_stone", "name": "賢者之石", "type": "ARTIFACT", "rarity": "LEGENDARY", "cost": 500, "manaCost": 0, "value": 25, "effectType": "equip_artifact", "description": "每回合額外 +25 魔力", "element": "WATER", "alignment": "HOLY" },
  { "id": "hermes_boots", "name": "赫爾墨斯之靴", "type": "ARTIFACT", "rarity": "EPIC", "cost": 200, "manaCost": 0, "value": 0, "effectType": "equip_artifact", "description": "回合抽牌數 +1 (需實裝)", "element": "AIR", "alignment": "HOLY" },
  { "id": "phoenix_feather", "name": "鳳凰羽毛", "type": "ARTIFACT", "rarity": "LEGENDARY", "cost": 350, "manaCost": 0, "value": 0, "effectType": "equip_artifact", "description": "抵擋一次致命傷害 (需實裝)", "element": "FIRE", "alignment": "HOLY" },
  { "id": "dragon_scale", "name": "龍之鱗片", "type": "ARTIFACT", "rarity": "EPIC", "cost": 300, "manaCost": 0, "value": 20, "effectType": "equip_artifact", "description": "防禦力 +20 (需實裝)", "element": "EARTH", "alignment": "HOLY" },
  { "id": "thief_glove", "name": "盜賊手套", "type": "ARTIFACT", "rarity": "RARE", "cost": 200, "manaCost": 0, "value": 0, "effectType": "equip_artifact", "description": "每回合偷取對手 5 金錢 (需實裝)", "element": "AIR", "alignment": "EVIL" },
  { "id": "royal_crown", "name": "王權皇冠", "type": "ARTIFACT", "rarity": "LEGENDARY", "cost": 600, "manaCost": 0, "value": 50, "effectType": "equip_artifact", "description": "收入增加 50%", "element": "NEUTRAL", "alignment": "HOLY" },
  { "id": "book_of_truth", "name": "真理之書", "type": "ARTIFACT", "rarity": "EPIC", "cost": 450, "manaCost": 0, "value": 0, "effectType": "equip_artifact", "description": "所有魔法消耗 -10 (需實裝)", "element": "NEUTRAL", "alignment": "HOLY" },
  { "id": "cursed_idol", "name": "詛咒雕像", "type": "ARTIFACT", "rarity": "RARE", "cost": 150, "manaCost": 0, "value": 0, "effectType": "equip_artifact", "description": "每回合對所有敵人造成 5 點傷害 (需實裝)", "element": "EARTH", "alignment": "EVIL" },
  
  // --- RITUALS (Added Missing Events) ---
  { "id": "ritual_doom", "name": "末日儀式", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 50, "effectType": "trigger_event", "description": "【暗黑限定】召喚「魔力異常」災難", "element": "FIRE", "alignment": "EVIL", "eventPayload": "evt_mana_void" },
  { "id": "ritual_plague", "name": "瘟疫儀式", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 50, "effectType": "trigger_event", "description": "【暗黑限定】召喚「大規模天災」", "element": "WATER", "alignment": "EVIL", "eventPayload": "evt_plague" },
  { "id": "ritual_inflation", "name": "通膨詛咒", "type": "RITUAL", "rarity": "RARE", "cost": 150, "manaCost": 80, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【暗黑限定】召喚「供應鏈破裂」", "element": "AIR", "alignment": "EVIL", "eventPayload": "evt_inflation" },
  { "id": "ritual_desert", "name": "荒漠化", "type": "RITUAL", "rarity": "RARE", "cost": 150, "manaCost": 80, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【暗黑限定】召喚「沙漠化」災難", "element": "EARTH", "alignment": "EVIL", "eventPayload": "evt_desert" },
  { "id": "ritual_taxes", "name": "暴政契約", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 40, "effectType": "trigger_event", "description": "【暗黑限定】召喚「苛政重稅」", "element": "NEUTRAL", "alignment": "EVIL", "eventPayload": "evt_taxes" },
  { "id": "ritual_earthquake", "name": "地裂儀式", "type": "RITUAL", "rarity": "EPIC", "cost": 250, "manaCost": 100, "value": 0, "hpCost": 50, "effectType": "trigger_event", "description": "【暗黑限定】召喚「大地震」", "element": "EARTH", "alignment": "EVIL", "eventPayload": "evt_earthquake" },
  { "id": "ritual_silence", "name": "禁魔結界", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 40, "effectType": "trigger_event", "description": "【暗黑限定】召喚「禁魔領域」", "element": "AIR", "alignment": "EVIL", "eventPayload": "evt_silence" },
  { "id": "ritual_rust", "name": "腐蝕詛咒", "type": "RITUAL", "rarity": "RARE", "cost": 150, "manaCost": 80, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【暗黑限定】召喚「裝備鏽蝕」", "element": "WATER", "alignment": "EVIL", "eventPayload": "evt_rust" },
  { "id": "ritual_drought", "name": "枯萎儀式", "type": "RITUAL", "rarity": "RARE", "cost": 150, "manaCost": 80, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【暗黑限定】召喚「乾旱」", "element": "FIRE", "alignment": "EVIL", "eventPayload": "evt_drought" },
  { "id": "ritual_meteor", "name": "隕石召喚", "type": "RITUAL", "rarity": "LEGENDARY", "cost": 300, "manaCost": 100, "value": 0, "hpCost": 50, "effectType": "trigger_event", "description": "【暗黑限定】召喚「火山爆發」災難", "element": "FIRE", "alignment": "EVIL", "eventPayload": "evt_volcano" },
  { "id": "ritual_curse", "name": "衰弱詛咒", "type": "RITUAL", "rarity": "RARE", "cost": 200, "manaCost": 80, "value": 0, "hpCost": 40, "effectType": "trigger_event", "description": "【暗黑限定】召喚「虛弱詛咒」災難", "element": "WATER", "alignment": "EVIL", "eventPayload": "evt_curse" },
  { "id": "ritual_war", "name": "全面戰爭", "type": "RITUAL", "rarity": "EPIC", "cost": 250, "manaCost": 100, "value": 0, "hpCost": 40, "effectType": "trigger_event", "description": "【暗黑限定】召喚「戰爭」封鎖商店", "element": "FIRE", "alignment": "EVIL", "eventPayload": "evt_war" },
  { "id": "ritual_chaos", "name": "混沌降臨", "type": "RITUAL", "rarity": "LEGENDARY", "cost": 400, "manaCost": 100, "value": 0, "hpCost": 50, "effectType": "trigger_event", "description": "【暗黑限定】召喚「市場崩盤」災難", "element": "FIRE", "alignment": "EVIL", "eventPayload": "evt_market_crash" },

  { "id": "ritual_blessing", "name": "魔神賜福", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【光明限定】召喚「魔神的祝福」", "element": "NEUTRAL", "alignment": "HOLY", "eventPayload": "evt_blessing" },
  { "id": "ritual_guardian", "name": "守護天使", "type": "RITUAL", "rarity": "RARE", "cost": 150, "manaCost": 80, "value": 0, "hpCost": 20, "effectType": "trigger_event", "description": "【光明限定】召喚「守護神降臨」", "element": "NEUTRAL", "alignment": "HOLY", "eventPayload": "evt_guardian" },
  { "id": "ritual_economy", "name": "繁榮儀式", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【光明限定】召喚「經濟發達」", "element": "EARTH", "alignment": "HOLY", "eventPayload": "evt_economy" },
  { "id": "ritual_wealth", "name": "財富儀式", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 50, "effectType": "trigger_event", "description": "【光明限定】召喚「大豐收」祝福", "element": "NEUTRAL", "alignment": "HOLY", "eventPayload": "evt_harvest" },
  { "id": "ritual_rain", "name": "祈雨儀式", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【光明限定】召喚「生命之雨」祝福", "element": "WATER", "alignment": "HOLY", "eventPayload": "evt_regenerate" },
  { "id": "ritual_inspiration", "name": "靈感之光", "type": "RITUAL", "rarity": "RARE", "cost": 150, "manaCost": 80, "value": 0, "hpCost": 20, "effectType": "trigger_event", "description": "【光明限定】召喚「靈感湧現」", "element": "AIR", "alignment": "HOLY", "eventPayload": "evt_inspiration" },
  { "id": "ritual_peace", "name": "和平禱告", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【光明限定】召喚「和平條約」", "element": "WATER", "alignment": "HOLY", "eventPayload": "evt_peace" },
  { "id": "ritual_treasure", "name": "尋寶儀式", "type": "RITUAL", "rarity": "EPIC", "cost": 250, "manaCost": 100, "value": 0, "hpCost": 40, "effectType": "trigger_event", "description": "【光明限定】召喚「發現寶藏」", "element": "EARTH", "alignment": "HOLY", "eventPayload": "evt_treasure" },
  { "id": "ritual_wisdom", "name": "智慧啟蒙", "type": "RITUAL", "rarity": "RARE", "cost": 150, "manaCost": 80, "value": 0, "hpCost": 20, "effectType": "trigger_event", "description": "【光明限定】召喚「古老智慧」", "element": "AIR", "alignment": "HOLY", "eventPayload": "evt_wisdom" },
  { "id": "ritual_reinforce", "name": "堡壘加護", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【光明限定】召喚「城牆加固」", "element": "EARTH", "alignment": "HOLY", "eventPayload": "evt_reinforce" },
  { "id": "ritual_bloodlust", "name": "戰神祭典", "type": "RITUAL", "rarity": "EPIC", "cost": 250, "manaCost": 100, "value": 0, "hpCost": 40, "effectType": "trigger_event", "description": "【光明限定】召喚「戰神降臨」", "element": "FIRE", "alignment": "HOLY", "eventPayload": "evt_bloodlust" },
  { "id": "ritual_knowledge", "name": "真理追求", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 20, "effectType": "trigger_event", "description": "【光明限定】召喚「學者來訪」祝福", "element": "AIR", "alignment": "HOLY", "eventPayload": "evt_scholar" },
  { "id": "ritual_trade", "name": "貿易風", "type": "RITUAL", "rarity": "EPIC", "cost": 200, "manaCost": 100, "value": 0, "hpCost": 30, "effectType": "trigger_event", "description": "【光明限定】召喚「新貿易線」", "element": "WATER", "alignment": "HOLY", "eventPayload": "evt_trade_route" },
  
  // --- MAGIC ATTACKS ---
  { "id": "FIRE_atk_1", "name": "烈焰飛彈", "type": "MAGIC_ATTACK", "rarity": "COMMON", "cost": 40, "manaCost": 15, "value": 15, "effectType": "damage", "description": "初級元素攻擊", "element": "FIRE", "alignment": "HOLY" },
  { "id": "FIRE_atk_2", "name": "燃燒爆裂", "type": "MAGIC_ATTACK", "rarity": "RARE", "cost": 80, "manaCost": 35, "value": 30, "effectType": "damage", "description": "中級元素魔法", "element": "FIRE", "alignment": "EVIL" },
  { "id": "FIRE_atk_3", "name": "地獄風暴", "type": "MAGIC_ATTACK", "rarity": "EPIC", "cost": 150, "manaCost": 70, "value": 60, "effectType": "damage", "description": "強大的元素衝擊", "element": "FIRE", "alignment": "HOLY" },
  { "id": "FIRE_atk_4", "name": "赤紅審判", "type": "MAGIC_ATTACK", "rarity": "LEGENDARY", "cost": 300, "manaCost": 100, "value": 100, "effectType": "damage", "description": "毀滅性的終極魔法", "element": "FIRE", "alignment": "EVIL" },
  
  { "id": "WATER_atk_1", "name": "冰霜飛彈", "type": "MAGIC_ATTACK", "rarity": "COMMON", "cost": 40, "manaCost": 15, "value": 15, "effectType": "damage", "description": "初級元素攻擊", "element": "WATER", "alignment": "HOLY" },
  { "id": "WATER_atk_2", "name": "潮汐爆裂", "type": "MAGIC_ATTACK", "rarity": "RARE", "cost": 80, "manaCost": 35, "value": 30, "effectType": "damage", "description": "中級元素魔法", "element": "WATER", "alignment": "EVIL" },
  { "id": "WATER_atk_3", "name": "深海風暴", "type": "MAGIC_ATTACK", "rarity": "EPIC", "cost": 150, "manaCost": 70, "value": 60, "effectType": "damage", "description": "強大的元素衝擊", "element": "WATER", "alignment": "HOLY" },
  { "id": "WATER_atk_4", "name": "湛藍審判", "type": "MAGIC_ATTACK", "rarity": "LEGENDARY", "cost": 300, "manaCost": 100, "value": 100, "effectType": "damage", "description": "毀滅性的終極魔法", "element": "WATER", "alignment": "EVIL" },
  
  { "id": "EARTH_atk_1", "name": "岩石飛彈", "type": "MAGIC_ATTACK", "rarity": "COMMON", "cost": 40, "manaCost": 15, "value": 15, "effectType": "damage", "description": "初級元素攻擊", "element": "EARTH", "alignment": "HOLY" },
  { "id": "EARTH_atk_2", "name": "大地爆裂", "type": "MAGIC_ATTACK", "rarity": "RARE", "cost": 80, "manaCost": 35, "value": 30, "effectType": "damage", "description": "中級元素魔法", "element": "EARTH", "alignment": "EVIL" },
  { "id": "EARTH_atk_3", "name": "鋼鐵風暴", "type": "MAGIC_ATTACK", "rarity": "EPIC", "cost": 150, "manaCost": 70, "value": 60, "effectType": "damage", "description": "強大的元素衝擊", "element": "EARTH", "alignment": "HOLY" },
  { "id": "EARTH_atk_4", "name": "泰坦審判", "type": "MAGIC_ATTACK", "rarity": "LEGENDARY", "cost": 300, "manaCost": 100, "value": 100, "effectType": "damage", "description": "毀滅性的終極魔法", "element": "EARTH", "alignment": "EVIL" },
  
  { "id": "AIR_atk_1", "name": "狂風飛彈", "type": "MAGIC_ATTACK", "rarity": "COMMON", "cost": 40, "manaCost": 15, "value": 15, "effectType": "damage", "description": "初級元素攻擊", "element": "AIR", "alignment": "HOLY" },
  { "id": "AIR_atk_2", "name": "雷霆爆裂", "type": "MAGIC_ATTACK", "rarity": "RARE", "cost": 80, "manaCost": 35, "value": 30, "effectType": "damage", "description": "中級元素魔法", "element": "AIR", "alignment": "EVIL" },
  { "id": "AIR_atk_3", "name": "天空風暴", "type": "MAGIC_ATTACK", "rarity": "EPIC", "cost": 150, "manaCost": 70, "value": 60, "effectType": "damage", "description": "強大的元素衝擊", "element": "AIR", "alignment": "HOLY" },
  { "id": "AIR_atk_4", "name": "無形審判", "type": "MAGIC_ATTACK", "rarity": "LEGENDARY", "cost": 300, "manaCost": 100, "value": 100, "effectType": "damage", "description": "毀滅性的終極魔法", "element": "AIR", "alignment": "EVIL" },
  
  // --- RUNES (Nerfed Values) ---
  { "id": "FIRE_rune_1", "name": "烈焰符文 I", "type": "RUNE", "rarity": "COMMON", "cost": 50, "manaCost": 10, "value": 5, "effectType": "buff_damage", "description": "賦予物理卡 烈焰 屬性，傷害 +5", "element": "FIRE", "alignment": undefined, "runeLevel": 1 },
  { "id": "FIRE_rune_2", "name": "燃燒符文 II", "type": "RUNE", "rarity": "RARE", "cost": 120, "manaCost": 30, "value": 12, "effectType": "buff_damage", "description": "賦予物理卡 烈焰 屬性，傷害 +12", "element": "FIRE", "alignment": undefined, "runeLevel": 2 },
  { "id": "FIRE_rune_3", "name": "地獄符文 III", "type": "RUNE", "rarity": "EPIC", "cost": 250, "manaCost": 60, "value": 25, "effectType": "buff_damage", "description": "賦予物理卡 烈焰 屬性，傷害 +25", "element": "FIRE", "alignment": undefined, "runeLevel": 3 },
  
  { "id": "WATER_rune_1", "name": "冰霜符文 I", "type": "RUNE", "rarity": "COMMON", "cost": 50, "manaCost": 10, "value": 5, "effectType": "buff_damage", "description": "賦予物理卡 冰霜 屬性，傷害 +5", "element": "WATER", "alignment": undefined, "runeLevel": 1 },
  { "id": "WATER_rune_2", "name": "潮汐符文 II", "type": "RUNE", "rarity": "RARE", "cost": 120, "manaCost": 30, "value": 12, "effectType": "buff_damage", "description": "賦予物理卡 冰霜 屬性，傷害 +12", "element": "WATER", "alignment": undefined, "runeLevel": 2 },
  { "id": "WATER_rune_3", "name": "深海符文 III", "type": "RUNE", "rarity": "EPIC", "cost": 250, "manaCost": 60, "value": 25, "effectType": "buff_damage", "description": "賦予物理卡 冰霜 屬性，傷害 +25", "element": "WATER", "alignment": undefined, "runeLevel": 3 },
  
  { "id": "EARTH_rune_1", "name": "岩石符文 I", "type": "RUNE", "rarity": "COMMON", "cost": 50, "manaCost": 10, "value": 5, "effectType": "buff_damage", "description": "賦予物理卡 岩石 屬性，傷害 +5", "element": "EARTH", "alignment": undefined, "runeLevel": 1 },
  { "id": "EARTH_rune_2", "name": "大地符文 II", "type": "RUNE", "rarity": "RARE", "cost": 120, "manaCost": 30, "value": 12, "effectType": "buff_damage", "description": "賦予物理卡 岩石 屬性，傷害 +12", "element": "EARTH", "alignment": undefined, "runeLevel": 2 },
  { "id": "EARTH_rune_3", "name": "鋼鐵符文 III", "type": "RUNE", "rarity": "EPIC", "cost": 250, "manaCost": 60, "value": 25, "effectType": "buff_damage", "description": "賦予物理卡 岩石 屬性，傷害 +25", "element": "EARTH", "alignment": undefined, "runeLevel": 3 },
  
  { "id": "AIR_rune_1", "name": "狂風符文 I", "type": "RUNE", "rarity": "COMMON", "cost": 50, "manaCost": 10, "value": 5, "effectType": "buff_damage", "description": "賦予物理卡 狂風 屬性，傷害 +5", "element": "AIR", "alignment": undefined, "runeLevel": 1 },
  { "id": "AIR_rune_2", "name": "雷霆符文 II", "type": "RUNE", "rarity": "RARE", "cost": 120, "manaCost": 30, "value": 12, "effectType": "buff_damage", "description": "賦予物理卡 狂風 屬性，傷害 +12", "element": "AIR", "alignment": undefined, "runeLevel": 2 },
  { "id": "AIR_rune_3", "name": "天空符文 III", "type": "RUNE", "rarity": "EPIC", "cost": 250, "manaCost": 60, "value": 25, "effectType": "buff_damage", "description": "賦予物理卡 狂風 屬性，傷害 +25", "element": "AIR", "alignment": undefined, "runeLevel": 3 },

  { "id": "RUNE_HOLY_1", "name": "光之刻印 I", "type": "RUNE", "rarity": "COMMON", "cost": 80, "manaCost": 0, "value": 5, "effectType": "buff_damage", "description": "賦予物理卡 [神聖] 屬性，傷害 +5", "element": "NEUTRAL", "alignment": "HOLY", "runeLevel": 1 },
  { "id": "RUNE_HOLY_2", "name": "神聖幾何 II", "type": "RUNE", "rarity": "RARE", "cost": 150, "manaCost": 0, "value": 12, "effectType": "buff_damage", "description": "賦予物理卡 [神聖] 屬性，傷害 +12", "element": "NEUTRAL", "alignment": "HOLY", "runeLevel": 2 },
  { "id": "RUNE_HOLY_3", "name": "神之本源 III", "type": "RUNE", "rarity": "EPIC", "cost": 300, "manaCost": 0, "value": 25, "effectType": "buff_damage", "description": "賦予物理卡 [神聖] 屬性，傷害 +25", "element": "NEUTRAL", "alignment": "HOLY", "runeLevel": 3 },

  { "id": "RUNE_EVIL_1", "name": "暗之刻印 I", "type": "RUNE", "rarity": "COMMON", "cost": 80, "manaCost": 0, "value": 5, "effectType": "buff_damage", "description": "賦予物理卡 [邪惡] 屬性，傷害 +5", "element": "NEUTRAL", "alignment": "EVIL", "runeLevel": 1 },
  { "id": "RUNE_EVIL_2", "name": "虛空核心 II", "type": "RUNE", "rarity": "RARE", "cost": 150, "manaCost": 0, "value": 12, "effectType": "buff_damage", "description": "賦予物理卡 [邪惡] 屬性，傷害 +12", "element": "NEUTRAL", "alignment": "EVIL", "runeLevel": 2 },
  { "id": "RUNE_EVIL_3", "name": "深淵本源 III", "type": "RUNE", "rarity": "EPIC", "cost": 300, "manaCost": 0, "value": 25, "effectType": "buff_damage", "description": "賦予物理卡 [邪惡] 屬性，傷害 +25", "element": "NEUTRAL", "alignment": "EVIL", "runeLevel": 3 }
];
