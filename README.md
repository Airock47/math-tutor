# 數學解題小幫手 🧮

專為小學生設計的 AI 解題工具，拍照或輸入題目，逐步說明解法。

## 部署到 Vercel（10分鐘完成）

### 步驟一：取得 Anthropic API Key
1. 前往 https://console.anthropic.com
2. 登入或註冊帳號
3. 點選左側 "API Keys"
4. 點 "Create Key"，複製 API Key（格式：sk-ant-...）

### 步驟二：上傳程式碼到 GitHub
1. 前往 https://github.com，登入帳號
2. 點右上角 "+" → "New repository"
3. Repository name 填 `math-tutor`，選 Public，點 "Create repository"
4. 把這個資料夾裡的所有檔案上傳（拖曳到頁面）

### 步驟三：部署到 Vercel
1. 前往 https://vercel.com，用 GitHub 帳號登入
2. 點 "Add New Project"
3. 選剛才建立的 `math-tutor` repository，點 "Import"
4. 在 "Environment Variables" 區塊加入：
   - Name: `ANTHROPIC_API_KEY`
   - Value: 剛才複製的 API Key（sk-ant-...）
5. 點 "Deploy"，等約 1 分鐘

完成！你會得到一個網址，例如：`math-tutor-xxx.vercel.app`

手機、平板、電腦都可以直接用瀏覽器開啟。
