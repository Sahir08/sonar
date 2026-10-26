import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the PWA icons (64, 192, 512, maskable 512, Apple touch, favicon.ico) from public/icon.svg.
// Run: npm run generate-pwa-assets
const BG = '#0B0E14'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: BG } },
    // iOS only rounds the corners, so the Apple icon can use less padding than the maskable one
    apple: { ...minimal2023Preset.apple, padding: 0.1, resizeOptions: { background: BG } },
  },
  images: ['public/icon.svg'],
})
