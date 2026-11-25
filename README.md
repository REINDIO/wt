# WANTOO 我也要｜讓想做的事，開始發生

以 **Vue 3** + **Tailwind CSS v4** + **PWA（Progressive Web App）** 重構的 WANTOO 互動原型，支援在 **Android** 與 **iOS** 手機加入主畫面捷徑，以全螢幕獨立視窗模式開啟並支援離線瀏覽。

## 技術架構

- **前端框架**：Vue 3 (`<script setup>`) + Vite 6
- **樣式系統**：Tailwind CSS v4 (`@tailwindcss/vite`)
- **手機捷徑與離線支援**：`vite-plugin-pwa`（Web App Manifest、Service Worker、iOS Apple Touch Icon、Android Maskable Icon 與長按快捷選單）
- **本機資料保存**：完整相容原本 `localStorage` 與 `IndexedDB`（`wantoo-media`）結構

## 本機開發與建置

```bash
# 安裝相依套件
npm install

# 啟動本機開發伺服器
npm run dev

# 建置正式版（輸出至 dist/）
npm run build

# 預覽正式版建置結果
npm run preview
```

## Android 與 iOS 加入手機主畫面（捷徑）

部署至 HTTPS 網址（例如 GitHub Pages）後，使用手機瀏覽器開啟即可建立桌面捷徑：

### iOS（iPhone / iPad）
1. 使用 **Safari** 開啟網站。
2. 點擊底部工具列中央的 **分享** 按鈕（方框加向上箭頭）。
3. 向下滑動並選擇 **「加入主畫面」** → 點擊右上角 **「新增」**。
4. 點開桌面上的 **WANTOO** 圖示即可全螢幕操作，並完整適配瀏海與底部安全區域。

### Android（Chrome / Edge）
1. 使用 **Chrome** 開啟網站。
2. 點擊頁面上方的 **「＋ 加到主畫面」** 或底部橫幅的 **「安裝」**（或點右上角 `⋮` →「安裝應用程式」／「加到主畫面」）。
3. 安裝完成後，長按桌面上的 **WANTOO** 圖示還可直接開啟「探索任務／任務交流／好友動態／我的足跡」快捷選單。

## GitHub Pages 自動部署

專案已內建 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)。
只需至 GitHub 儲存庫的 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**，每次推送至 `main` 分支即會自動建置並發布至 HTTPS 網址，方便直接用手機掃描或開啟加入桌面捷徑。
