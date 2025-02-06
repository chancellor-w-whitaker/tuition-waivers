import { globalConst } from "vite-plugin-global-const";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const wrapperUrl = "https://irserver2.eku.edu/libraries/remote/wrapper.cjs";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "Y:/Reports/employee-tuition-waivers",
    copyPublicDir: false,
    emptyOutDir: false,
  },
  plugins: [
    react(),
    globalConst({
      wrapperUrl,
    }),
  ],
  base: "",
});
