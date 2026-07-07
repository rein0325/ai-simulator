// shared/api.js
const AIApi = {
  async call(messages, apiKey) {
    // Gemini 的格式跟 OpenAI 不同，需要轉換
    const systemMsg = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const geminiMessages = chatMessages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body = {
      systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.9
      }
    };

    const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || '呼叫 API 失敗');
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },

  // 這個函式不變，直接沿用
  parseResponse(raw) {
    const storyMatch = raw.match(/<story>([\s\S]*?)<\/story>/);
    const deltaMatch = raw.match(/<state_delta>([\s\S]*?)<\/state_delta>/);

    const story = storyMatch ? storyMatch[1].trim() : raw.trim();
    let delta = {};

    if (deltaMatch) {
      try {
        delta = JSON.parse(deltaMatch[1].trim());
      } catch {
        console.warn('state_delta 解析失敗，忽略本輪狀態更新');
      }
    }

    return { story, delta };
  }
};