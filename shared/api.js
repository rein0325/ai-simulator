// shared/api.js
const AIApi = {
  // 呼叫 OpenAI，傳入訊息陣列，回傳 AI 的回應文字
  async call(messages, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: messages
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || '呼叫 API 失敗');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  // 從 AI 回應中解析出 <story> 和 <state_delta> 兩個區塊
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