// shared/db.js
const DB = {
  GAS_URL: 'https://script.google.com/macros/s/AKfycbxy3ZvV57OncGdTXSysOUMV5rFX2Qij2IyabEw1mDb9ryqxkuya4SybyuJcrccxfHyeMg/exec',

  async post(action, params) {
    const response = await fetch(this.GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...params })
    });
    const result = await response.json();
    if (!result.ok) throw new Error(result.error || 'DB 錯誤');
    return result.data;
  },

  async getPlayer(playerId, simulatorId) {
    return await this.post('getPlayer', { player_id: playerId, simulator_id: simulatorId });
  },

  async savePlayer(data) {
    return await this.post('savePlayer', data);
  },

  async getMemory(playerId, simulatorId) {
    return await this.post('getMemory', { player_id: playerId, simulator_id: simulatorId });
  },

  async saveMemory(playerId, simulatorId, messages) {
    return await this.post('saveMemory', {
      player_id: playerId,
      simulator_id: simulatorId,
      messages
    });
  },

  async getSummary(playerId, simulatorId) {
    return await this.post('getSummary', { player_id: playerId, simulator_id: simulatorId });
  },

  async saveSummary(playerId, simulatorId, chapter, summary, keyEvents) {
    return await this.post('saveSummary', {
      player_id: playerId,
      simulator_id: simulatorId,
      chapter,
      summary,
      key_events_json: keyEvents
    });
  }
};