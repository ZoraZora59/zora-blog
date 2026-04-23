import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    // 报告阈值收紧，防止未来 chunk 又长回去
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 核心 + 路由，首屏必需
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 动效，只在有动画的组件用到
          'vendor-motion': ['motion'],
          // 代码高亮引擎，仅文章详情 / 编辑器用
          'vendor-shiki': ['shiki'],
          // Markdown 相关生态，仅文章详情 / 编辑器用
          'vendor-markdown': [
            'react-markdown',
            'remark-gfm',
            'remark-parse',
            'unified',
            'unist-util-visit',
            'mdast-util-to-string',
            'github-slugger',
          ],
          // 图表库，仅 admin Analytics 用
          'vendor-charts': ['recharts'],
          // 拖拽库，仅 admin 编辑器用
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
});
