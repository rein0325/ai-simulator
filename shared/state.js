const StateManager = {
  defaults: {
    player_id: '',
    simulator_id: '',
    name: '',
    gender: '',
    weapon_type: '',
    hp: 100,
    max_hp: 100,
    copper: 0,
    silver: 0,
    gold: 0,
    location: '橡木鎮',
    inventory: [],
    lv: 1,
    exp: 0,
    exp_next: 100,
    guild_rank: 'E',
    reputation: 0,
    main_quests: [],
    side_quests: [],
    extra: {}
  },

  current: {},

  init(overrides = {}) {
    this.current = { ...this.defaults, ...overrides };
    this.render();
  },

  loadFromDB(dbData) {
    if (!dbData) return false;
    const extra = dbData.extra_json || {};
    this.current = {
      player_id:    dbData.player_id,
      simulator_id: dbData.simulator_id,
      name:         dbData.name,
      gender:       dbData.gender,
      weapon_type:  dbData.weapon_type,
      hp:           dbData.hp,
      max_hp:       dbData.max_hp,
      copper:       extra.copper       ?? 0,
      silver:       extra.silver       ?? 0,
      gold:         extra.gold         ?? 0,
      location:     dbData.location,
      inventory:    dbData.inventory_json || [],
      lv:           extra.lv            ?? 1,
      exp:          extra.exp           ?? 0,
      exp_next:     extra.exp_next      ?? 100,
      guild_rank:   extra.guild_rank    ?? 'E',
      reputation:   extra.reputation    ?? 0,
      main_quests:  extra.main_quests   ?? [],
      side_quests:  extra.side_quests   ?? [],
      extra:        {}
    };
    this.render();
    return true;
  },

  applyDelta(delta) {
    if (!delta || Object.keys(delta).length === 0) return;

    if (delta.hp_delta)         this.current.hp = Math.min(this.current.max_hp, Math.max(0, this.current.hp + delta.hp_delta));
    if (delta.copper_delta)     this.current.copper = Math.max(0, this.current.copper + delta.copper_delta);
    if (delta.silver_delta)     this.current.silver = Math.max(0, this.current.silver + delta.silver_delta);
    if (delta.gold_delta)       this.current.gold = Math.max(0, this.current.gold + delta.gold_delta);
    if (delta.exp_delta)        this.applyExp(delta.exp_delta);
    if (delta.reputation_delta) this.current.reputation = Math.max(0, this.current.reputation + delta.reputation_delta);
    if (delta.location)         this.current.location = delta.location;
    if (delta.guild_rank)       this.current.guild_rank = delta.guild_rank;

    if (delta.col_delta)    this.current.copper = Math.max(0, (this.current.copper || 0) + delta.col_delta);
    if (delta.floor_delta)  this.current.extra.floor = (this.current.extra.floor || 1) + delta.floor_delta;
    if (delta.skill_up) {
    if (!this.current.extra.skills) this.current.extra.skills = {};
    Object.entries(delta.skill_up).forEach(([skill, val]) => {
        this.current.extra.skills[skill] = (this.current.extra.skills[skill] || 0) + val;
    });
    }

    if (delta.add_items) {
      delta.add_items.forEach(item => {
        if (!this.current.inventory.includes(item)) {
          this.current.inventory.push(item);
        }
      });
    }
    if (delta.remove_items) {
      this.current.inventory = this.current.inventory.filter(i => !delta.remove_items.includes(i));
    }

    // 任務管理
    if (delta.add_main_quest && !this.current.main_quests.includes(delta.add_main_quest)) {
      this.current.main_quests.push(delta.add_main_quest);
    }
    if (delta.complete_main_quest) {
      this.current.main_quests = this.current.main_quests.filter(q => q !== delta.complete_main_quest);
    }
    if (delta.add_side_quest) {
      if (this.current.side_quests.length < 3 && !this.current.side_quests.includes(delta.add_side_quest)) {
        this.current.side_quests.push(delta.add_side_quest);
      }
    }
    if (delta.complete_side_quest) {
      this.current.side_quests = this.current.side_quests.filter(q => q !== delta.complete_side_quest);
    }

    this.render();
    this.saveToDB();
  },

  applyExp(expDelta) {
    this.current.exp += expDelta;
    // 升級檢查
    while (this.current.exp >= this.current.exp_next) {
      this.current.exp -= this.current.exp_next;
      this.current.lv++;
      this.current.max_hp += 10;
      this.current.hp = this.current.max_hp;
      this.current.exp_next = Math.floor(this.current.exp_next * 1.2);
    }
  },

  async saveToDB() {
    if (!this.current.player_id) return;
    try {
      await DB.savePlayer({
        player_id:      this.current.player_id,
        simulator_id:   this.current.simulator_id,
        name:           this.current.name,
        gender:         this.current.gender,
        weapon_type:    this.current.weapon_type,
        hp:             this.current.hp,
        max_hp:         this.current.max_hp,
        gold:           this.current.gold,
        location:       this.current.location,
        inventory_json: this.current.inventory,
        extra_json: {
          copper:      this.current.copper,
          silver:      this.current.silver,
          gold:        this.current.gold,
          lv:          this.current.lv,
          exp:         this.current.exp,
          exp_next:    this.current.exp_next,
          guild_rank:  this.current.guild_rank,
          reputation:  this.current.reputation,
          main_quests: this.current.main_quests,
          side_quests: this.current.side_quests
        }
      });
    } catch (err) {
      console.warn('儲存玩家狀態失敗：', err.message);
    }
  },

  render() {
    const s = this.current;
    const el = (id) => document.getElementById(id);

    if (el('stat-name'))       el('stat-name').textContent = s.name || '???';
    if (el('stat-lv'))         el('stat-lv').textContent = `Lv.${s.lv}`;
    if (el('stat-guild'))      el('stat-guild').textContent = `${s.guild_rank} 級`;
    if (el('stat-hp'))         el('stat-hp').textContent = `${s.hp} / ${s.max_hp}`;
    if (el('stat-hp-bar'))     el('stat-hp-bar').style.width = `${(s.hp / s.max_hp) * 100}%`;
    if (el('stat-exp-bar'))    el('stat-exp-bar').style.width = `${(s.exp / s.exp_next) * 100}%`;
    if (el('stat-exp'))        el('stat-exp').textContent = `${s.exp} / ${s.exp_next}`;
    if (el('stat-money'))      el('stat-money').textContent = `${s.gold}金 ${s.silver}銀 ${s.copper}銅`;
    if (el('stat-location'))   el('stat-location').textContent = s.location;
    if (el('stat-reputation')) el('stat-reputation').textContent = s.reputation;
    if (el('stat-weapon'))     el('stat-weapon').textContent = s.weapon_type || '（無）';
    if (el('stat-inventory'))  el('stat-inventory').textContent = s.inventory.length > 0 ? s.inventory.join('、') : '（空）';
    if (el('stat-floor')) el('stat-floor').textContent = `${this.current.extra?.floor || 1}F`;
    if (el('stat-col'))   el('stat-col').textContent = this.current.copper || 0;
  }
};