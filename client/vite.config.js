import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Add explicit JSX runtime configuration
      jsxRuntime: 'automatic',
      jsxImportSource: 'react'
    }), 
    tailwindcss()
  ],
  assetsInclude: ['**/*.lottie'],
  
  // Simplified build configuration for reliable deployment
  build: {
    // Disable source maps for production
    sourcemap: false,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Use esbuild for minification (more reliable than terser)
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2015',
    // Rollup options
    rollupOptions: {
      output: {
        // Simple manual chunks for better caching
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('lucide-react') || id.includes('styled-components')) {
              return 'ui';
            }
            return 'vendor';
          }
        }
      },
      // Suppress warnings that might cause build failures
      onwarn(warning, warn) {
        // Ignore eval warnings from lottie files
        if (warning.code === 'EVAL') {
          return;
        }
        // Ignore circular dependency warnings
        if (warning.code === 'CIRCULAR_DEPENDENCY') {
          return;
        }
        warn(warning);
      }
    }
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true
  },

  // Explicit resolve configuration
  resolve: {
    alias: {
      'react': 'react',
      'react-dom': 'react-dom'
    }
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})