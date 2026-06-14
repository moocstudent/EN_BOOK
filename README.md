# 英语学习书 · EN_BOOK

> 一本从 **初中到大学** 的在线英语学习书 —— 像数学课本一样按学段分册、按章节编排，中英双语。
> A bilingual online English study book, from middle school to university — structured like a textbook.

包含 **词汇单词卡** 和 **语法讲解** 两大模块，分为初中 / 高中 / 大学 + 四六级 / 雅思 五册（在校学段 + 应试），纯静态网站，零构建，可直接部署到 GitHub Pages。

## ✨ 功能

- 📚 **书架首页**：三本书（初中 / 高中 / 大学英语），点击进入目录。
- 📖 **目录（TOC）**：每册分「词汇单元」和「语法专题」两栏。
- 🃏 **单词卡**：卡片翻转（英文 ↔ 中文释义 + 例句）、上一张/下一张、乱序复习、列表速览、键盘 ← → 空格 操作。
- ✍️ **语法讲解**：用法、结构、例句（中英对照 + 提示）、易错点 Tips，上一专题/下一专题翻页。
- 🌏 **中英双语界面**。

## 📁 目录结构

```
EN_BOOK/
├── index.html          # 页面外壳 + 导航
├── css/book.css        # 书本风格样式
├── js/app.js           # 前端引擎（hash 路由 + 渲染，纯原生 JS）
├── content/
│   ├── manifest.json   # 书架配置（学段、颜色、计数）
│   ├── schema.md       # 内容格式说明
│   ├── vocab/          # 词汇：junior/senior/college.json
│   └── grammar/        # 语法：junior/senior/college.json
└── .nojekyll
```

## 🚀 本地运行

内容通过 `fetch()` 加载，**不能** 用 `file://` 直接打开（浏览器会拦截）。请用任意静态服务器：

```bash
# 方式一：用本仓库自带脚本（需要 Node）
npm install
npm run dev          # → http://localhost:5173

# 方式二：任意静态服务器
npx serve .
# 或
python -m http.server 5173
```

## 🌐 部署到 GitHub Pages

本项目是纯静态文件，**无需构建**：

1. 仓库 **Settings → Pages**。
2. **Source** 选 `Deploy from a branch`，分支选 `main`，目录选 `/ (root)`。
3. 保存后等待几分钟，访问 `https://moocstudent.github.io/EN_BOOK/`。

> 所有资源路径均为相对路径，因此在 `/EN_BOOK/` 子路径下也能正常工作。`.nojekyll` 确保 Pages 原样发布静态文件。

## ➕ 添加 / 修改内容

所有学习内容都是 `content/` 下的 JSON 文件，按 [`content/schema.md`](content/schema.md) 的格式增删条目即可，**改完直接刷新页面生效**，无需重新构建。

## 🛠 技术栈

原生 HTML + CSS + JavaScript（无框架、无构建步骤），内容数据驱动（JSON）。

## 📄 License

MIT
