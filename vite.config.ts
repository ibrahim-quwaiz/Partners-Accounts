import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { metaImagesPlugin } from "./vite-plugin-meta-images";

// استخدام process.cwd() للحصول على المجلد الرئيسي للمشروع
const projectRoot = process.cwd();

// استيراد إضافات Replit بشكل آمن
async function getReplitPlugins() {
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    try {
      const cartographer = await import("@replit/vite-plugin-cartographer");
      const devBanner = await import("@replit/vite-plugin-dev-banner");
      return [cartographer.cartographer(), devBanner.devBanner()];
    } catch (error) {
      console.warn("Failed to load Replit plugins:", error);
      return [];
    }
  }
  return [];
}

export default defineConfig(async () => {
  const replitPlugins = await getReplitPlugins();
  
  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      tailwindcss(),
      metaImagesPlugin(),
      ...replitPlugins,
    ],
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "client", "src"),
        "@shared": path.resolve(projectRoot, "shared"),
      },
    },
    css: {
      postcss: {
        plugins: [],
      },
    },
    root: path.resolve(projectRoot, "client"),
    publicDir: path.resolve(projectRoot, "client", "public"),
    build: {
      outDir: path.resolve(projectRoot, "dist", "public"),
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(projectRoot, "client", "index.html"),
      },
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: true,
      fs: {
        strict: false,
        allow: [".."],
      },
    },
  };
});
