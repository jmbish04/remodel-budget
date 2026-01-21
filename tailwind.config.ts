import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(222 47% 6%)",
        foreground: "hsl(210 40% 98%)",
        muted: "hsl(217 33% 17%)",
        "muted-foreground": "hsl(215 20% 65%)",
        border: "hsl(217 33% 17%)",
        primary: "hsl(210 40% 98%)",
        "primary-foreground": "hsl(222 47% 6%)",
      },
    },
  },
  plugins: [],
} satisfies Config;
