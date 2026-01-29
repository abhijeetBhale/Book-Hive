import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Use automatic runtime (default for React 18)
      jsxRuntime: 'automatic',
      // Ensure React is properly imported
      include: "**/*.{jsx,tsx}",
    }), 
    tailwindcss()
  ],
  assetsInclude: ['**/*.lottie'],
  
  // OPTIMIZED: Enhanced build configuration for LCP performance
  build: {
    // Enable source maps for debugging
    sourcemap: true,
    // Reduce chunk size warning limit for better performance
    chunkSizeWarningLimit: 500,
    // Use esbuild for faster minification
    minify: 'esbuild',
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Rollup options for optimal code splitting
    rollupOptions: {
      output: {
        // CRITICAL: Aggressive code splitting for better LCP
        manualChunks: {
          // Core React - highest priority
          'react-core': ['react', 'react-dom'],
          // Router - needed early
          'router': ['react-router-dom'],
          // UI libraries - can be lazy loaded
          'ui-icons': ['lucide-react'],
          'ui-styled': ['styled-components'],
          // Animation libraries - defer loading
          'animations': ['framer-motion'],
          // Heavy components - lazy load
          'charts': ['react-countup'],
          // Utility libraries
          'utils': ['react-intersection-observer'],
        },
        // Optimize chunk naming for caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.js', '') : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
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

  // OPTIMIZED: Enhanced dependency optimization for faster loading
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-countup' // Include react-countup to avoid lazy loading issues
    ],
    exclude: [
      // Exclude heavy libraries from pre-bundling to enable lazy loading
      'framer-motion'
    ],
    force: true,
    // Ensure proper ESM handling
    esbuildOptions: {
      target: 'es2020',
      // Fix for "exports is not defined" error
      format: 'esm',
      define: {
        global: 'globalThis',
      }
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
  },

  // Fix for CommonJS modules
  define: {
    global: 'globalThis',
  }
})