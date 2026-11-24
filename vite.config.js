import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Vite 建置設定：整合 Vue 3、Tailwind CSS v4 與 Android / iOS PWA 捷徑支援
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons/apple-touch-icon-180x180.png',
        'icons/icon-192x192.png',
        'icons/icon-512x512.png',
        'icons/icon-maskable-512x512.png',
      ],
      manifest: {
        id: './',
        name: 'WANTOO 我也要｜讓想做的事，開始發生',
        short_name: 'WANTOO',
        description: '探索任務、任務交流、好友動態與個人足跡 — 讓想做的事，開始發生',
        lang: 'zh-Hant',
        start_url: './',
        scope: './',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        background_color: '#fafafa',
        theme_color: '#161616',
        categories: ['social', 'lifestyle'],
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: '探索任務',
            short_name: '探索',
            description: '瀏覽最新團體與個人任務',
            url: './#explore',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: '任務交流',
            short_name: '交流',
            description: '查看已加入的任務群組與動態',
            url: './#community',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: '好友動態',
            short_name: '好友',
            description: '檢視好友私訊、動態與名單',
            url: './#friends',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: '我的足跡',
            short_name: '足跡',
            description: '回顧個人旅程紀錄與參與任務',
            url: './#profile',
            icons: [{ src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.pexels\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pexels-demo-images',
              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})
