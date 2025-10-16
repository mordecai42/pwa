import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
     
      manifest: {
        name: 'Mi Primera PWA con Vite',
        short_name: 'MiPWA',
        description: 'Un proyecto PWA para la clase.',
        theme_color: '#3367D6',
        icons: [
          {
            src: 'icons/icons/pngwing.com (2).png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/pngwing.com (1).png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})