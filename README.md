# FurryBuddy · 毛毛伴

> 纯个人用的 Web 宠物化身提醒日历。上传你宠物的照片 → AI 生成 30 张立绘 → 待办到点时宠物化身弹窗提醒。

## 技术栈

- **前端**：Vite + React 18 + TypeScript + Tailwind v4
- **状态**：Zustand
- **本地存储**：Dexie.js (IndexedDB)
- **AI**：Gemini 2.5 Flash Image (Nano Banana) 图生图
- **部署**：Vercel（Serverless Functions 代理 Gemini + Basic Auth 保护）

## 快速开始

```bash
# 1. 装依赖
npm install

# 2. 准备密钥（只本地，不进 git）
cp .env.example .env.local
# 编辑 .env.local 填入 GEMINI_API_KEY

# 3. 启动开发服务器
npm run dev
# → http://localhost:5173
```

## Spike · 验证 AI 图生图可用性（M0）

上真实开发前，先用你的宠物真照片跑一次 spike，确认 Gemini 能保持宠物外观一致性：

```bash
node spike.mjs path/to/your/cat.jpg
# 输出 5 张变体到 spike-output/
```

产出的 5 张图肉眼判断：**是不是同一只猫？情绪姿态是否有变化？** 通过 → 下一步集成 API；不通过 → 换模型（Flux Kontext / Imagen 4）。

## 目录结构

```
.
├─ index.html          Vite 入口
├─ src/
│  ├─ main.tsx         启动：seed DB → 加载 → render
│  ├─ App.tsx          页面容器（Top Nav + Hero + Stats + Todos + Dock + 悬浮组件）
│  ├─ index.css        全站 CSS（玻璃拟态 + 珊瑚橙 + 呼吸动画）
│  ├─ types.ts         数据类型定义
│  ├─ db.ts            Dexie schema（todos / pet / portraits / settings）
│  ├─ store.ts         Zustand：状态 + action
│  ├─ lib/
│  │  ├─ constants.ts  MOODS / PERIODS / GROUP_META / mock 图片池
│  │  └─ rules.ts      情绪映射规则引擎
│  └─ components/
│     ├─ Hero.tsx           宠物大头像 + 当前情绪 + 操作按钮
│     ├─ TodoList.tsx       今日时光待办列表（含筛选）
│     ├─ Reminder.tsx       ⭐ 提醒组件：宠物大图 + 消息卡 两段式
│     ├─ Gallery.tsx        30 张立绘池（底部抽屉）
│     └─ Modals.tsx         新建待办 Modal + 设置抽屉
├─ prototype/          原始 HTML 单文件 demo（历史保留）
├─ spike.mjs           M0 技术验证脚本
└─ vercel.json         部署配置（后续加）
```

## 开发路线

- [x] M0 · 原型 HTML 设计稿
- [x] M1 · Vite + React 骨架 + 本地持久化
- [ ] M1.5 · Gemini Spike（等宠物真照片）
- [ ] M2 · `/api/generate` Serverless Function + 首次生成 30 张立绘
- [ ] M3 · 提醒调度（Web Notification API + 定时轮询）
- [ ] M4 · Vercel 部署 + Basic Auth 密码防护
