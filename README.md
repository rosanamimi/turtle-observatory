# 🐢 雲養龜觀察所

一個半認真、半荒謬的「龜龜推門進度監測 Dashboard」。持續觀察一隻正在考慮推門的龜。

🔗 Live:[ https://rosanamimi.github.io/turtle-observatory/]

## 專案結構

```
.
├── index.html          # 頁面結構（HTML）
├── style.css           # 樣式
├── app.js              # 互動與 Supabase 資料存取
├── assets/
│   ├── hero-door.webp      # 首頁門的圖片
│   ├── hero-turtle.webp    # 首頁龜龜圖片
│   └── bg-observatory.jpg  # 背景
├── push.bat            # 一鍵 pull / commit / push（Windows）
└── README.md
```

## 功能

- 首頁：門前觀測場景、本日神諭與互動按鈕、最近觀測（合併觀察紀錄與 MIX）
- 階段與進度：目前階段與階段軌跡、今日行為統計、門把磨損（僅存本機）
- 觀察紀錄：真實觀察紀錄新增／時間軸，串接 [Supabase](https://supabase.com) 資料庫（`observations` 表）
- 系統警告：隨機警告訊號 + 歷史紀錄

## 資料庫（Supabase）

`app.js` 裡的 `SUPABASE_URL` 和 `SUPABASE_KEY` 常數指向你自己的 Supabase 專案。
`app.js` 用到兩張表，皆需開放 `SELECT` 的 RLS Policy；只有 `observations` 需要開放 `INSERT`（前端表單新增）。`mix_observations` 由外部 API 自動寫入，前端唯讀（詳見 Supabase 後台 Authentication → Policies）。

### `observations`（真實觀察紀錄）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | int8 | 自動編號 |
| created_at | timestamptz | 自動時間戳記（預設 `now()`） |
| text | text | 觀察內容 |
| progress | int4 | 進度百分比（可留空） |
| has_event | bool | 是否為實際事件（預設 `false`） |
| event_time | timestamptz | 事件時間（可留空） |
| event_type | text | 事件類型（可留空） |
| event_content | text | 事件內容（可留空） |

### `mix_observations`（MIX 觀測紀錄）

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | int8 | 自動編號 |
| observed_at | timestamptz | 觀測時間 |
| question | text | 問題／觀測內容 |
| mix_components | text | MIX 組成（以「＋」串接） |
| conclusion | text | 結論 |
| stage | text | 階段（多軸以「｜」分隔） |

> 前端可以匿名寫入 `observations`，建議在 Supabase 端用 RLS／約束限制欄位長度與寫入頻率，避免被灌垃圾資料；`mix_observations` 不需要對匿名開放 `INSERT`，可以撤銷該 Policy（先確認自動寫入的 API 使用的是其他金鑰）。

> ⚠️ 目前用的是 Supabase 的 **publishable key**（前端安全金鑰），不要把 **secret key** 放進這個檔案。

## 本機開發

直接用瀏覽器打開 `index.html` 即可，不需要建置工具（`style.css`、`app.js` 以相對路徑載入）。

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
