# 图片格式转换器 运行手册

## 本地安装与启动

```bash
# 前置条件：Node.js >= 18, npm >= 9
node -v
npm -v

# 安装依赖
npm install

# 开发模式启动（HMR 热更新）
npm run dev
# 默认 http://localhost:5173/projects/image-converter/

# 生产构建
npm run build
# 产物在 dist/ 目录

# 预览生产构建
npm run preview
```

## 测试、构建与健康检查

```bash
# 运行 Playwright E2E 测试（需先安装浏览器）
npx playwright install chromium
npx playwright test

# 仅类型检查
npx tsc --noEmit

# 生产构建
npm run build

# 健康检查：访问 http://localhost:5173/projects/image-converter/
# 确认页面加载、无控制台错误
```

记录自动测试、生产启动、health endpoint、公网浏览器关键流程、静态资源、
控制台错误和 Kimi 截图视觉验收方式。

## 环境变量

无需环境变量。项目为纯前端静态应用，所有配置在 vite.config.ts 中。

## Base Path

项目必须支持 `/projects/image-converter/`，静态资源和前端路由不得假设部署在 `/`。

Vite 配置：
```typescript
// vite.config.ts
export default defineConfig({
  base: '/projects/image-converter/',
})
```

公网浏览器验收时，最终 URL 和所有项目资源必须保留此前缀。

## 缓存策略

功能迭代后公网 URL 不变，必须防止老板浏览器命中缓存旧页面：

- HTML 文档**真实 HTTP 响应头**必须携带 `Cache-Control: no-cache`（或 `no-store`），每次重新校验；**不得仅用 `<meta http-equiv>` 标签**（浏览器基本忽略其缓存语义），必须由服务器/框架下发响应头；
- 所有静态资源 URL 必须携带版本令牌 `?v=<当前发布版本 0.0.N>`，且路径保留 `/projects/image-converter/` 前缀（令牌挂在已带 basePath 的 URL 上）；
- 版本令牌随 `0.0.N` 递增，于是每个交付版本自动触发缓存失效。

浏览器验收（schema v3 机器报告）会逐条重算：`static_assets` 状态码 200–399、URL 带版本令牌且在 basePath 下（自包含页面可为空），`document_response_headers` 的真实 `Cache-Control` 为 no-cache/no-store，视觉审查须由 Kimi 视觉模型完成。

## Aliyun systemd 与 Nginx

（待部署阶段填充）

## 日志查看

（待部署阶段填充）

## 常见故障与恢复

（待迭代过程中积累）

## 回滚到精确 Tag

（待部署阶段填充）
