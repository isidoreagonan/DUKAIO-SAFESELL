import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env["SUPABASE_URL"] || env["VITE_SUPABASE_URL"] || "";
  const supabaseAnonKey = env["SUPABASE_PUBLISHABLE_KEY"] || env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabaseAnonKey),
    },
    plugins: [
      tanstackStart({
        server: { entry: "server" },
      }),
      nitro({
        preset: "vercel",
      }),
      viteReact(),
      tailwindcss(),
      tsconfigPaths(),
    ],
  };
});
