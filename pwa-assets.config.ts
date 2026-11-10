import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // The padded icons get the dark icon background instead of the default white.
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#0e0e0e' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#0e0e0e' } },
  },
  images: ['public/favicon.svg'],
})
