# me.ccsert.top

ccsert 的交互式个人站，展示开发者工具、AI 辅助工程、自托管系统和技术手记。

- **首页 `/`**：终端工作台、主题切换、项目探索和随滚动定位的章节目录。
- **个人实验场 `/archive`**：四个交互演示、项目与手记阅读器、关联阅读和阅读位置恢复。
- **案例页 `/work/artifact-gateway`**：Artifact Gateway 的工程案例记录，从问题、约束到关键决策与验证方式。
- **分享入口**：`/archive#play=<项目标识>` 打开演示，`/archive#read=<内容标识>` 打开文章。

技术栈：Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 4 和 Motion。字体使用本地 Inter、JetBrains Mono、Source Serif 4，构建无需从字体服务下载资源。

## 本地开发

当前验证环境为 Node.js 24。使用 npm 和仓库中的 `package-lock.json` 安装锁定依赖：

```bash
npm ci
npm run dev
```

打开 [localhost:3000](http://localhost:3000)。开发服务监听 `0.0.0.0`，也可以通过本机局域网 IP 在其他设备上预览。

开发资源和 HMR 默认允许本机网卡地址。通过自定义域名或反向代理访问时，显式追加开发域名：

```bash
NEXT_ALLOWED_DEV_ORIGINS=me.ccsert.top npm run dev
```

多个域名用逗号分隔；IP 或域名变化后重启开发服务。该变量仅用于开发环境，正常构建和运行不需要配置环境变量。

## 验证与生产运行

```bash
npm test
npm run lint
npm run build
npm start
```

构建生成首页和实验场页面。交互演示在浏览器本地运行，联系表单打开系统邮件客户端；当前站点不依赖数据库或外部 API 密钥。

## 内容与设计

- [站点配置和公开内容](app/lib/content/portfolio.ts)：域名、邮箱、项目索引、知识主题及资料核验日期。
- [阅读内容](app/lib/archive/stories.ts)：文章场景、过程、取舍及关联阅读。
- [实验场设计](docs/design/elastic-playground.md)：当前实验场的交互与布局说明。
- [设计验收记录](design-qa.md)：响应式、滚动、阅读器和章节目录的验证记录。
- 分享图与图标：`app/**/opengraph-image.jpg`、`twitter-image.jpg`、`icon.svg`、`favicon.ico` 与 `apple-icon.png` 由 [compose-og-images.py](scripts/assets/compose-og-images.py) 和 [compose-icons.py](scripts/assets/compose-icons.py) 生成。分享图背景为不含文字的生成插画，标题用站点字体合成；修改文案后重新运行脚本（中文字体使用 macOS 自带的 Hiragino Sans GB）。

内容基于注明日期的公开资料快照；演示不代表真实后端执行或服务的实时状态。
