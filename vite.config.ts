import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Served from the domain root (Vercel / custom domain). For a GitHub Pages
// project site under a subpath, change this to '/fieldforce-mvp/'.
const BASE = '/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Field Punch',
        short_name: 'Field Punch',
        description: 'Capture site walk-through punch lists — photos, notes, and reports, offline.',
        theme_color: '#0b2739',
        background_color: '#0b2739',
        display: 'standalone',
        orientation: 'portrait',
        id: BASE,
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
