# 🐢 雲養龜觀察所

一個半認真、半荒謬的「龜龜推門進度監測 Dashboard」。持續觀察一隻正在考慮推門的龜。

🔗 Live: _(部署後把網址貼在這裡)_

## 專案結構

```
.
├── index.html          # 網站本體（單一檔案，含 CSS + JS）
├── assets/
│   └── turtle.png       # 龜龜圖片
└── README.md
```

## 功能

- 首頁：門前觀測場景、今日觀察 Dashboard、門把健康狀況、每日語錄
- 階段與進度：10 階段推門進度追蹤、行為統計
- 觀察紀錄：真實觀察紀錄新增／時間軸，串接 [Supabase](https://supabase.com) 資料庫（`observations` 表）
- 系統警告：隨機警告訊號 + 歷史紀錄

## 資料庫（Supabase）

`index.html` 裡的 `SUPABASE_URL` 和 `SUPABASE_KEY` 常數指向你自己的 Supabase 專案。
表格結構：

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | int8 | 自動編號 |
| created_at | timestamptz | 自動時間戳記 |
| text | text | 觀察內容 |
| progress | int4 | 進度百分比（可留空） |

需要開放 `SELECT` 與 `INSERT` 的 RLS Policy（詳見 Supabase 後台 Authentication → Policies）。

> ⚠️ 目前用的是 Supabase 的 **publishable key**（前端安全金鑰），不要把 **secret key** 放進這個檔案。

## 本機開發

直接用瀏覽器打開 `index.html` 即可，不需要建置工具。

## 部署

推薦用 [GitHub Pages](https://pages.github.com/)：

1. Push 到 GitHub 之後，到 repo 的 **Settings → Pages**
2. Source 選 **Deploy from a branch**，Branch 選 `main` / `/root`
3. 存檔後幾分鐘內會產生網址：`https://<你的帳號>.github.io/<repo名稱>/`

也可以改接 Netlify / Vercel，接上 GitHub repo 之後每次 push 會自動重新部署。

## 待辦 / 想法

- [ ] 把「今日觀察 Dashboard」的數字也接資料庫
- [ ] 首頁按鈕觸發的更新也寫進 Supabase
- [ ] 加上每日自動語錄（可用 Supabase Edge Function 排程）
