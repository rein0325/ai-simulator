// shared/memory.js
const MemoryManager = {
  shortTerm: [],
  maxTurns: 10,

  init(systemPrompt, maxTurns = 10) {
    this.maxTurns = maxTurns;
    this.shortTerm = [{ role: 'system', content: systemPrompt }];
  },

  // 從 DB 載入記憶
  loadFromDB(messages) {
    const system = this.shortTerm.find(m => m.role === 'system');
    this.shortTerm = system ? [system, ...messages] : messages;
  },

  add(role, content) {
    this.shortTerm.push({ role, content });
    const nonSystem = this.shortTerm.filter(m => m.role !== 'system');
    if (nonSystem.length > this.maxTurns * 2) {
      const firstNonSystem = this.shortTerm.findIndex(m => m.role !== 'system');
      if (firstNonSystem !== -1) this.shortTerm.splice(firstNonSystem, 1);
    }
  },

  getMessages() {
    return [...this.shortTerm];
  },

  getNonSystemMessages() {
    return this.shortTerm.filter(m => m.role !== 'system');
  },

  async saveToDB(playerId, simulatorId) {
    if (!playerId) return;
    try {
      await DB.saveMemory(playerId, simulatorId, this.getNonSystemMessages());
    } catch (err) {
      console.warn('儲存記憶失敗：', err.message);
    }
  }
};