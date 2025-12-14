# Magic Card Battle (魔法卡片對戰)

這是一個基於 React、TypeScript 和 Socket.IO 的多人回合制策略卡牌遊戲。玩家需要管理經濟、施放元素法術，並運用策略擊敗對手。

## 🌟 遊戲特色

*   **回合制策略**：每回合管理金錢與魔力資源。
*   **動態經濟**：建造產業（農場、礦場、商店）以獲得被動收入。
*   **元素系統**：
    *   **5 種元素**：火、水、地、風、無屬性。
    *   **反應機制**：使用元素攻擊掛載「印記」，再用不同元素引爆產生強大效果（如擴散流血、緩速泥沼等）。
*   **物理戰鬥 (v3.0)**：
    *   **武器與符文**：結合物理武器卡與元素符文卡進行堆疊攻擊。
    *   **靈魂陣營**：根據你的靈魂傾向（光明/黑暗），不同陣營的武器會有加成或懲罰。
*   **靈魂天平**：動態的平衡系統。使用神聖卡偏向光明，邪惡卡偏向黑暗。達到極端值 (+3/-3) 可解鎖強大的儀式卡。
*   **多人連線**：支援線上開房對戰或單機 AI 對戰。

---

## 🚀 免費部署教學 (Render.com)

這是**完全免費**的部署方案，且支援多人連線功能。

### 步驟 1：準備程式碼
1. 確保你已經將此專案上傳到你的 **GitHub** 儲存庫。

### 步驟 2：註冊 Render
1. 前往 [Render.com](https://render.com)。
2. 註冊一個免費帳號 (可直接使用 GitHub 登入)。

### 步驟 3：建立 Web Service
1. 在 Render 儀表板點擊 **New +** 按鈕，選擇 **Web Service**。
2. 連結你的 GitHub 帳號，並選擇此專案的儲存庫 (Repository)。

### 步驟 4：設定參數 (重要！)
在設定頁面填寫以下資訊：

*   **Name**: 給你的遊戲取個名字 (例如 `magic-card-battle`)。
*   **Region**: 選擇離你最近的地區 (例如 Singapore)。
*   **Branch**: `main` (或你的分支名稱)。
*   **Root Directory**: 留空 (預設)。
*   **Runtime**: 選擇 **Node**。
*   **Build Command**: `npm install && npm run build`
    *   這會安裝依賴並將 React 前端打包到 `dist` 資料夾。
*   **Start Command**: `npm run start`
    *   這會啟動 Express 伺服器，同時服務前端頁面和 Socket.IO 後端。
*   **Instance Type**: 選擇 **Free**。

### 步驟 5：部署
1. 點擊 **Create Web Service**。
2. 等待幾分鐘，Render 會自動安裝並部署。
3. 完成後，你會獲得一個網址 (例如 `https://magic-card-battle.onrender.com`)。
4. 點擊網址，你的多人連線卡牌遊戲就上線了！

> **注意**：Render 的免費方案在閒置 15 分鐘後會進入休眠。下次有人訪問時，可能需要等待 30-60 秒啟動伺服器，這是正常現象。

---

## 🛠️ 技術棧

*   **前端**: React 18, TypeScript, Vite, TailwindCSS
*   **後端**: Node.js, Express, Socket.IO
*   **圖標**: Lucide React

## 📜 授權

MIT License. 歡迎自由修改與使用。
