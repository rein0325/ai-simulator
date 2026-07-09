const AIApi = {
  async call(messages, apiKey) {
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
        maxOutputTokens: 1500,
        temperature: 0.9
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
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

  parseResponse(raw) {
    const storyMatch   = raw.match(/<story>([\s\S]*?)<\/story>/);
    const deltaMatch   = raw.match(/<state_delta>([\s\S]*?)<\/state_delta>/);
    const suggestMatch = raw.match(/<suggestions>([\s\S]*?)<\/suggestions>/);

    const story = storyMatch ? storyMatch[1].trim() : raw.trim();
    let delta = {};
    let suggestions = ['向前探索', '查看背包', '前往公會', '與人交談'];

    if (deltaMatch) {
      try { delta = JSON.parse(deltaMatch[1].trim()); }
      catch { console.warn('state_delta 解析失敗'); }
    }

    if (suggestMatch) {
      try {
        const parsed = JSON.parse(suggestMatch[1].trim());
        if (Array.isArray(parsed) && parsed.length === 4) suggestions = parsed;
      } catch { console.warn('suggestions 解析失敗'); }
    }

    return { story, delta, suggestions };
  }
};