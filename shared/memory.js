// shared/memory.js
const MemoryManager = {
  shortTerm: [],
  maxTurns: 10,
  summaryTrigger: 8,  // 幾輪後觸發壓縮
  currentSummary: '', // 當前摘要文字

  init(systemPrompt, maxTurns = 10) {
    this.maxTurns = maxTurns;
    this.shortTerm = [{ role: 'system', content: systemPrompt }];
    this.currentSummary = '';
  },

  loadFromDB(messages) {
    const system = this.shortTerm.find(m => m.role === 'system');
    this.shortTerm = system ? [system, ...messages] : messages;
  },

  loadSummary(summaryData) {
    if (!summaryData) return;
    this.currentSummary = summaryData.summary || '';
  },

  add(role, content) {
    this.shortTerm.push({ role, content });
    const nonSystem = this.shortTerm.filter(m => m.role !== 'system');

    // 超過上限刪最舊
    if (nonSystem.length > this.maxTurns * 2) {
      const firstNonSystem = this.shortTerm.findIndex(m => m.role !== 'system');
      if (firstNonSystem !== -1) this.shortTerm.splice(firstNonSystem, 1);
    }
  },

  // 組合給 AI 的完整訊息：system + 摘要注入 + 近期對話
  getMessages() {
    const system = this.shortTerm.find(m => m.role === 'system');
    const nonSystem = this.shortTerm.filter(m => m.role !== 'system');

    const messages = [];

    // System prompt
    if (system) messages.push(system);

    // 如果有摘要，注入到最前面
    if (this.currentSummary) {
      messages.push({
        role: 'user',
        content: `【前情提要】\n${this.currentSummary}\n\n以上是之前發生的事，請記住這些背景繼續故事。`
      });
      messages.push({
        role: 'model',
        content: '好的，我已記住前情提要，將繼續這個故事。'
      });
    }

    // 加入近期對話（只取最新 5 輪）
    const recentMessages = nonSystem.slice(-10);
    messages.push(...recentMessages);

    return messages;
  },

  getNonSystemMessages() {
    return this.shortTerm.filter(m => m.role !== 'system');
  },

  // 檢查是否需要觸發壓縮
  shouldCompress() {
    const nonSystem = this.getNonSystemMessages();
    return nonSystem.length >= this.summaryTrigger * 2;
  },

  async saveToDB(playerId, simulatorId) {
    if (!playerId) return;
    try {
      await DB.saveMemory(playerId, simulatorId, this.getNonSystemMessages());
    } catch (err) {
      console.warn('儲存記憶失敗：', err.message);
    }
  },

  // 壓縮舊對話成摘要，存進 DB
  isCompressing: false,

  async compress(playerId, simulatorId, apiKey, chapter) {
    const nonSystem = this.getNonSystemMessages();
    if (nonSystem.length === 0) return;

    const toCompress = nonSystem.slice(0, -10);
    if (toCompress.length === 0) return;

    this.isCompressing = true;
    console.log('觸發記憶壓縮...');

    try {
      const compressMessages = [
        {
          role: 'user',
          content: `以下是一段文字冒險遊戲的對話記錄，請將其壓縮成一段簡潔的前情提要（200字以內），保留重要事件、玩家決策、獲得的物品與地點變化。請直接輸出摘要文字，不要加任何標籤。\n\n${toCompress.map(m => `${m.role}: ${m.content}`).join('\n')}`
        }
      ];

      const raw = await AIApi.call(compressMessages, apiKey);
      const newSummary = this.currentSummary
        ? `${this.currentSummary}\n\n${raw.trim()}`
        : raw.trim();

      this.currentSummary = newSummary;
      await DB.saveSummary(playerId, simulatorId, chapter, newSummary, []);

      const system = this.shortTerm.find(m => m.role === 'system');
      const recent = this.getNonSystemMessages().slice(-10);
      this.shortTerm = system ? [system, ...recent] : recent;
      await this.saveToDB(playerId, simulatorId);

      console.log('記憶壓縮完成');
    } catch (err) {
      console.warn('記憶壓縮失敗：', err.message);
    }

    this.isCompressing = false;
  },

  waitForCompress() {
    return new Promise(resolve => {
      if (!this.isCompressing) { resolve(); return; }
      console.log('等待記憶壓縮完成...');
      const check = setInterval(() => {
        if (!this.isCompressing) {
          clearInterval(check);
          resolve();
        }
      }, 500);
    });
  },
};