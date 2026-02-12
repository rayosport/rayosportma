import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async () => {
  const isProd = process.env.NODE_ENV === "production";
  const isReplitDev = !isProd && process.env.REPL_ID !== undefined;

  // Optional Replit-only plugin (avoid top-level await issues by using async config)
  const replitPlugins = isReplitDev
    ? [
        (await import("@replit/vite-plugin-cartographer")).cartographer(),
      ]
    : [];

  return {
    // Base path for GitHub Pages
    // For project pages (username.github.io/repo-name): '/repo-name/'
    // For custom domain or user pages: '/'
    base: process.env.GITHUB_PAGES_BASE || "/",

    plugins: [
      react(),
      runtimeErrorOverlay(),
      themePlugin(),
      ...replitPlugins,
    ],

    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
      // Keep one React instance
      dedupe: ["react", "react-dom"],
    },

    root: path.resolve(import.meta.dirname, "client"),
    envDir: path.resolve(import.meta.dirname),

    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,

      rollupOptions: {
        // Do NOT externalize React
        external: [],
        output: {
          // ✅ IMPORTANT: put React in its own stable chunk so other chunks never see "undefined"
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              const isReactCore =
                /node_modules[\/\\]react[\/\\]/.test(id) ||
                /node_modules[\/\\]react-dom[\/\\]/.test(id) ||
                /node_modules[\/\\]scheduler[\/\\]/.test(id);

              if (isReactCore) return "react-vendor";

              if (id.includes("react-icons") || id.includes("lucide-react")) return "icons-vendor";
              if (id.includes("wouter")) return "router-vendor";
              if (id.includes("@radix-ui")) return "ui-vendor";
              if (id.includes("recharts")) return "charts-vendor";
              if (id.includes("framer-motion")) return "animation-vendor";
              if (id.includes("@supabase")) return "supabase-vendor";

              return "vendor";
            }
          },

          chunkFileNames: "assets/js/[name]-[hash].js",
          entryFileNames: "assets/js/[name]-[hash].js",
          assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
        },
      },

      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },

      chunkSizeWarningLimit: 1000,

      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: true,
          pure_funcs: isProd ? ["console.log", "console.info", "console.debug"] : [],
          passes: 2,
        },
        mangle: { safari10: true },
      },

      sourcemap: !isProd,
      target: "esnext",
      cssCodeSplit: true,
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "wouter",
        "recharts",
        "@radix-ui/react-dialog",
        "@radix-ui/react-tooltip",
        "@supabase/supabase-js",
      ],
      exclude: [],
    },
  };
});
