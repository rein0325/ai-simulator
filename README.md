# AI 模擬器

一個具備長期記憶與狀態管理的網頁版 AI 文字冒險遊戲平台，採用完全免費的技術架構，支援多個獨立模擬器世界。

🎮 **[立即遊玩](https://rein0325.github.io/ai-simulator/)**

---

## 📖 專案介紹

AI 模擬器是一個以 AI 驅動的文字冒險遊戲平台。玩家在遊戲中輸入行動，AI 即時生成劇情回應，並透過結構化的狀態管理系統精確追蹤玩家的血量、金幣、背包、任務等數值。

### 解決的核心問題

**AI 失憶問題**
採用記憶分層機制：短期記憶保留最近 10 輪對話，長期記憶定期由 AI 壓縮成摘要存入資料庫，需要時動態注入 Prompt，實現無限長度的遊戲體驗。

**數值崩壞問題**
AI 只負責輸出觸發事件（如：扣血 15 點），真正的數值計算完全交由程式碼處理，徹底避免 AI 算錯數字的問題。

---

## ✨ 功能列表

**遊戲系統**
- AI 即時劇情生成，每回合提供四個建議行動
- 玩家狀態欄即時渲染（HP、EXP、金幣、位置、背包）
- 角色創建流程（名字輸入 + 武器選擇，融入劇情不突兀）
- 主線／支線任務追蹤面板
- 死亡警示系統（HP 低於 20% 觸發視覺警告）
- 重開遊戲功能

**技術系統**
- 密碼保護入口，API Key 加密存於瀏覽器 localStorage
- Google Sheets 存檔，重新開啟自動讀取進度
- Sliding Window 短期記憶管理（保留最近 10 輪）
- AI 自動壓縮舊對話成長期摘要
- API 限流自動倒數重試，不中斷遊戲體驗
- 手機／桌機雙版面自適應

**目前模擬器**
- ⚔️ 奇幻冒險 — 中古世紀奇幻世界，從橡木鎮重新出發成為 S 級冒險者
- 🎮 SAO：艾恩葛朗特 — 死亡遊戲，攻略百層浮空城

---

## 🏗️ 技術架構
前端（GitHub Pages）
↕ fetch()
中介（Google Apps Script）← 隱藏 Sheets 憑證
↕ 讀寫
資料庫（Google Sheets）
├── PlayerState   玩家核心數值
├── ShortMemory   近期對話記錄
└── GlobalSummary AI 生成的長期摘要

**技術選型**

| 層級 | 技術 | 原因 |
|------|------|------|
| 前端 | HTML / CSS / Vanilla JS | 無框架，部署簡單 |
| 託管 | GitHub Pages | 免費靜態網頁託管 |
| 中介 | Google Apps Script | 免費 API 橋樑，保護 Sheets 憑證 |
| 資料庫 | Google Sheets | 免費、可視化後台、支援 GM 操作 |
| AI | Gemini 3.5 Flash | 免費額度高，支援繁體中文 |

**記憶分層架構**
短期記憶（ShortMemory）
└── 保留最近 10 輪對話
└── 超過上限自動剔除最舊的
長期記憶（GlobalSummary）
└── 累積 8 輪後觸發 AI 壓縮
└── 摘要注入下次 Prompt 最前端
└── 覆蓋式儲存，不重複累積

---

## 🗂️ 目錄結構
ai-simulator/
├── index.html                    # 模擬器選單首頁
├── shared/
│   ├── api.js                    # Gemini API 呼叫與回應解析
│   ├── state.js                  # 玩家狀態管理與渲染
│   ├── memory.js                 # 短期記憶、長期壓縮
│   └── db.js                     # Google Sheets 讀寫介面
├── simulators/
│   ├── fantasy/                  # 奇幻冒險模擬器
│   │   ├── index.html
│   │   ├── config.js             # 世界觀、初始狀態、System Prompt
│   │   └── style.css
│   └── sao/                      # SAO 模擬器
│       ├── index.html
│       ├── config.js
│       └── style.css
└── gas/
├── Code.gs                   # GAS 進入點與路由
└── sheets.gs                 # Sheets 讀寫操作

---

## ➕ 如何新增模擬器

新增一個模擬器只需要三步，不需要修改任何核心程式碼。

**第一步：複製資料夾**

```bash
cp -r simulators/fantasy simulators/你的主題名稱
```

**第二步：修改 `config.js`**

只需要改這個檔案，設定你的世界觀：

```javascript
const SimulatorConfig = {
  name: '你的模擬器名稱',
  theme: 'your_theme',        // 唯一識別碼，用於資料庫區分

  initialState: {
    hp: 100,
    max_hp: 100,
    // 依你的世界觀設定初始數值
  },

  systemPrompt: `你是...的主持人。
  
  【世界背景】
  ...
  
  【回應格式】
  // 保留三個固定區塊：<story> <state_delta> <suggestions>
  `
};
```

**第三步：在選單加入入口**

在外層 `index.html` 的 `.grid` 裡加一張卡片：

```html
<a class="card" href="simulators/你的主題名稱/index.html">
  <div class="icon">🌟</div>
  <div class="name">你的模擬器名稱</div>
  <div class="desc">簡短介紹</div>
</a>
```

完成。存檔、push，新模擬器上線。

---

## 📊 資料庫結構

**PlayerState** — 玩家核心數值

| 欄位 | 說明 |
|------|------|
| player_id | 玩家唯一識別碼 |
| simulator_id | 所屬模擬器 |
| name / gender / weapon_type | 角色基本資料 |
| hp / max_hp / gold / location | 核心數值 |
| inventory_json | 背包（JSON 陣列） |
| extra_json | 模擬器專屬數值（等級、技能、任務等） |
| updated_at | 最後更新時間 |

**ShortMemory** — 近期對話

| 欄位 | 說明 |
|------|------|
| player_id / simulator_id | 對應玩家 |
| turn | 輪次排序 |
| role / content | 對話內容 |

**GlobalSummary** — 長期摘要

| 欄位 | 說明 |
|------|------|
| player_id / simulator_id | 對應玩家 |
| chapter | 壓縮章節編號 |
| summary | AI 生成的摘要文字 |
| key_events_json | 重要事件清單 |