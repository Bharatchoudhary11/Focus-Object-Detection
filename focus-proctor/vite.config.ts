import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  optimizeDeps: {
    // Prebundle heavy deps to reduce dev cold-start
    include: [
      '@tensorflow/tfjs',
      '@tensorflow-models/blazeface',
      '@tensorflow-models/coco-ssd',
    ],
  },
  build: {
    // Split out TFJS/models so app code becomes interactive faster
    rollupOptions: {
      output: {
        manualChunks: {
          tf: [
            '@tensorflow/tfjs',
            '@tensorflow-models/blazeface',
            '@tensorflow-models/coco-ssd',
          ],
        },
      },
    },
  },
});
