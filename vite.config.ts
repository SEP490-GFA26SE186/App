import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    define: {
      // react-native-web uses 'global' — polyfill for browser environment
      global: 'window',
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
        // Force single React instance — CRITICAL for react-native-web compatibility
        // Without this, apps/mobile uses React 18 while root uses React 19 → crashes
        'react': path.resolve(import.meta.dirname, 'node_modules/react'),
        'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
        // React Native → Web shim (react-native-web)
        'react-native': path.resolve(import.meta.dirname, 'apps/mobile/node_modules/react-native-web'),
        // Stub out react-native-reanimated for web (mobile-only library)
        'react-native-reanimated': path.resolve(import.meta.dirname, 'src/shims/reanimated-stub.ts'),
        // Stub out @expo/vector-icons for web (uses Lucide SVG stroke icons)
        '@expo/vector-icons': path.resolve(import.meta.dirname, 'src/shims/vector-icons-stub.tsx'),
        // Stub out expo-speech and expo-haptics for web
        'expo-speech': path.resolve(import.meta.dirname, 'src/shims/expo-stub.ts'),
        'expo-haptics': path.resolve(import.meta.dirname, 'src/shims/expo-stub.ts'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
