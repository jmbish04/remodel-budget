import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { vitePlugin as remix } from "@remix-run/dev";

export default defineConfig({
  plugins: [cloudflare(), remix()],
});
