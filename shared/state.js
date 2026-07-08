// shared/state.js
const StateManager = {
  defaults: {
    player_id: '',
    simulator_id: '',
    name: '',
    gender: '',
    weapon_type: '',
    hp: 100,
    max_hp: 100,
    gold: 0,
    location: '橡木鎮',
    inventory: [],
    extra: {}
  },

  current: {},

  init(overrides = {}) {
    this.current = { ...this.defaults, ...overrides };
    this.render();
  },

  // 從 DB 載入玩家資料
  loadFromDB(dbData) {
    if (!dbData) return false;
    this.current = {
      player_id:    dbData.player_id,
      simulator_id: dbData.simulator_id,
      name:         dbData.name,
      gender:       dbData.gender,
      weapon_type:  dbData.weapon_type,
      hp:           dbData.hp,
      max_hp:       dbData.max_hp,
      gold:         dbData.gold,
      location:     dbData.location,
      inventory:    dbData.inventory_json || [],
      extra:        dbData.extra_json || {}
    };
    this.render();
    return true;
  },

  applyDelta(delta) {
    if (!delta || Object.keys(delta).length === 0) return;
    if (delta.hp_delta)     this.current.hp = Math.min(this.current.max_hp, Math.max(0, this.current.hp + delta.hp_delta));
    if (delta.gold_delta)   this.current.gold = Math.max(0, this.current.gold + delta.gold_delta);
    if (delta.location)     this.current.location = delta.location;
    if (delta.add_items)    this.current.inventory.push(...delta.add_items);
    if (delta.remove_items) this.current.inventory = this.current.inventory.filter(i => !delta.remove_items.includes(i));
    if (delta.extra)        this.current.extra = { ...this.current.extra, ...delta.extra };
    this.render();
    this.saveToDB();
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
        extra_json:     this.current.extra
      });
    } catch (err) {
      console.warn('儲存玩家狀態失敗：', err.message);
    }
  },

  render() {
    const s = this.current;
    const el = (id) => document.getElementById(id);
    if (el('stat-name'))      el('stat-name').textContent = s.name || '???';
    if (el('stat-hp'))        el('stat-hp').textContent = `${s.hp} / ${s.max_hp}`;
    if (el('stat-hp-bar'))    el('stat-hp-bar').style.width = `${(s.hp / s.max_hp) * 100}%`;
    if (el('stat-gold'))      el('stat-gold').textContent = s.gold;
    if (el('stat-location'))  el('stat-location').textContent = s.location;
    if (el('stat-inventory')) el('stat-inventory').textContent = s.inventory.length > 0 ? s.inventory.join('、') : '（空）';
    if (el('stat-weapon'))    el('stat-weapon').textContent = s.weapon_type || '（無）';
  }
};