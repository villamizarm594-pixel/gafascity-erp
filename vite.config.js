import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',

      includeAssets: [
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],

      manifest: {
        id: '/',
        name: 'GafasCity ADM',
        short_name: 'GafasCity',
        description: 'Sistema administrativo interno de GafasCity',

        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',

        theme_color: '#0284c7',
        background_color: '#020617',

        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        navigateFallback: 'index.html',

        globPatterns: [
          '**/*.{js,css,html,png,svg,ico,json}'
        ],

        cleanupOutdatedCaches: true,
        runtimeCaching: []
      },

      devOptions: {
        enabled: false
      }
    })
  ]
})
