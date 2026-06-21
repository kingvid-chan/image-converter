import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** 版本令牌 — 每次迭代递增 */
const VERSION = '0.0.1'

/**
 * 自定义插件：为构建产物的静态资源 URL 追加版本令牌 ?v=0.0.N
 * 确保浏览器在版本迭代后不会命中旧缓存
 *
 * 仅在 build 模式生效：开发模式跳过（避免干扰 Vite HMR 和 esbuild 模块解析）。
 */
function versionTokenPlugin(): Plugin {
  return {
    name: 'version-token',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // 只在 production build 时添加版本令牌
        // Vite dev server 已有自己的缓存失效机制（import 查询参数、HMR）
        // 源文件路径（/src/）和 Vite 内部资源（@vite, @react-refresh）不能加 ?v=
        // 否则会破坏 esbuild 的 loader 检测
        return html.replace(
          /(src|href)="(\/projects\/image-converter\/(?!@vite|@react-refresh|src\/|favicon)[^"?]*?)"/g,
          (_match, attr, url) => `${attr}="${url}?v=${VERSION}"`,
        )
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), versionTokenPlugin()],
  base: '/projects/image-converter/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
