import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
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
          // Vendor chunks - React MUST stay in main bundle
          if (id.includes('node_modules')) {
            // Critical: React must NOT be split - explicitly exclude from chunking
            // By not returning anything for React, it stays in the main entry bundle
            const isReact = id.includes('/react/') || 
                           id.includes('/react-dom/') || 
                           id.includes('/scheduler/') ||
                           (id.includes('react') && !id.includes('react-icons') && !id.includes('react-hook-form') && !id.includes('react-day-picker') && !id.includes('react-resizable'));
            
            if (isReact) {
              return; // Explicitly return undefined - keeps in main bundle
            }
            
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
            if (id.includes('react-icons') || id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Other node_modules go into a common vendor chunk
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
