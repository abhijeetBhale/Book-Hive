import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use classic runtime to avoid createContext issues
      jsxRuntime: 'classic',
      jsxImportSource: undefined,
      // Ensure React is properly imported
      include: "**/*.{jsx,tsx}",
    }), 
    tailwindcss()
  ],
  assetsInclude: ['**/*.lottie'],
  
  // Enhanced build configuration for React compatibility
  build: {
    // Enable source maps for debugging
    sourcemap: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Use esbuild for minification
    minify: 'esbuild',
    // Target modern browsers
    target: 'es2015',
    // Rollup options
    rollupOptions: {
      output: {
        // Ensure React is in its own chunk
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-vendor': ['lucide-react', 'styled-components', 'framer-motion'],
        }
      },
      // External dependencies that should not be bundled
      external: [],
      // Suppress warnings
      onwarn(warning, warn) {
        if (warning.code === 'EVAL') return;
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
      }
    }
  },

  // Enhanced dependency optimization
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime'
    ],
    exclude: [],
    force: true,
    // Ensure proper ESM handling
    esbuildOptions: {
      target: 'es2015'
    }
  },

  // Enhanced resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom')
    },
    // Ensure proper module resolution
    dedupe: ['react', 'react-dom']
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },

  // Preview server configuration
  preview: {
    port: 3000,
    host: true
  }
})