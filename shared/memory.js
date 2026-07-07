// shared/memory.js
const MemoryManager = {
  shortTerm: [],      // 近 N 輪對話
  maxTurns: 8,        // 保留幾輪（可在 config.js 調整）

  // 加入一輪對話
  add(role, content) {
    this.shortTerm.push({ role, content });

    // 超過上限就從最舊的刪，但永遠保留 index 0（system prompt）
    while (this.shortTerm.filter(m => m.role !== 'system').length > this.maxTurns * 2) {
      const firstNonSystem = this.shortTerm.findIndex(m => m.role !== 'system');
      if (firstNonSystem !== -1) this.shortTerm.splice(firstNonSystem, 1);
    }
  },

  // 取得要送給 API 的完整訊息陣列（system + 近 N 輪）
  getMessages() {
    return [...this.shortTerm];
  },

  // 初始化，設定 system prompt
  init(systemPrompt, maxTurns = 8) {
    this.maxTurns = maxTurns;
    this.shortTerm = [{ role: 'system', content: systemPrompt }];
  }
};