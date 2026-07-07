// shared/state.js
const StateManager = {
  // 預設初始狀態（各模擬器可在 config.js 覆寫）
  defaults: {
    hp: 100,
    maxHp: 100,
    gold: 50,
    location: '起點',
    inventory: []
  },

  current: {},

  // 載入初始狀態（從 config 傳入覆寫值）
  init(overrides = {}) {
    this.current = { ...this.defaults, ...overrides };
    this.render();
  },

  // 套用 AI 回傳的 delta 事件
  applyDelta(delta) {
    if (!delta || Object.keys(delta).length === 0) return;

    if (delta.hp_delta)      this.current.hp = Math.min(this.current.maxHp, Math.max(0, this.current.hp + delta.hp_delta));
    if (delta.gold_delta)    this.current.gold = Math.max(0, this.current.gold + delta.gold_delta);
    if (delta.location)      this.current.location = delta.location;
    if (delta.add_items)     this.current.inventory.push(...delta.add_items);
    if (delta.remove_items)  this.current.inventory = this.current.inventory.filter(i => !delta.remove_items.includes(i));

    this.render();
  },

  // 將狀態渲染到頁面上的狀態欄（DOM id 需對應 index.html）
  render() {
    const s = this.current;
    const el = (id) => document.getElementById(id);

    if (el('stat-hp'))       el('stat-hp').textContent = `${s.hp} / ${s.maxHp}`;
    if (el('stat-hp-bar'))   el('stat-hp-bar').style.width = `${(s.hp / s.maxHp) * 100}%`;
    if (el('stat-gold'))     el('stat-gold').textContent = s.gold;
    if (el('stat-location')) el('stat-location').textContent = s.location;
    if (el('stat-inventory'))el('stat-inventory').textContent = s.inventory.length > 0 ? s.inventory.join('、') : '（空）';
  }
};