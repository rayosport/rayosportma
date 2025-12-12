import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  // Base path for GitHub Pages
  // For project pages (username.github.io/repo-name): '/repo-name/'
  // For custom domain or user pages: '/'
  // This can be overridden with GITHUB_PAGES_BASE environment variable
  base: process.env.GITHUB_PAGES_BASE || '/',
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      // Ensure single React instance
      "react": path.resolve(import.meta.dirname, "node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // CRITICAL: React MUST stay in main bundle
          // Use more specific path matching to catch all React-related modules
          const isReactCore = 
            /node_modules[\/\\]react[\/\\]/.test(id) ||
            /node_modules[\/\\]react-dom[\/\\]/.test(id) ||
            /node_modules[\/\\]scheduler[\/\\]/.test(id) ||
            id === 'react' ||
            id === 'react-dom' ||
            id === 'react/jsx-runtime' ||
            id === 'react-dom/client';
          
          if (isReactCore) {
            // Explicitly return undefined to prevent chunking
            return undefined;
          }
          
          // Only process other node_modules
          if (id.includes('node_modules')) {
            // Skip any other react-related packages that aren't core
            if (id.includes('react-icons') || id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Skip react-hook-form, react-day-picker, etc - they can be chunked
            if (id.includes('wouter')) {
              return 'router-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts')) {
              return 'charts-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            return 'vendor';
          }
        },
        // Optimize chunk names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production', // Remove console in production
        drop_debugger: true,
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
        passes: 2, // Multiple passes for better optimization
      },
      mangle: {
        safari10: true,
      },
    },
    // Enable source maps only in development
    sourcemap: process.env.NODE_ENV !== 'production',
    // Optimize chunk size
    target: 'esnext',
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tooltip',
    ],
    // Exclude large dependencies that should be lazy loaded
    exclude: [],
  },
});
