import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
        display: ["Sora", "ui-sans-serif", "system-ui"]
      },
      colors: {
        bg: "hsl(var(--bg))",
        panel: "hsl(var(--panel))",
        panel2: "hsl(var(--panel-2))",
        text: "hsl(var(--text))",
        muted: "hsl(var(--muted))",
        border: "hsl(var(--border))",
        accent: "hsl(var(--accent))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        risk: "hsl(var(--risk))",
        ai: "hsl(var(--ai))"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px rgba(30,63,95,0.35)",
        card: "0 10px 30px rgba(0,0,0,0.28)"
      },
      backgroundImage: {
        "brand-gradient": "radial-gradient(circle at 0% 0%, rgba(39,158,255,0.20), transparent 40%), radial-gradient(circle at 100% 100%, rgba(95,87,255,0.20), transparent 40%)"
      }
    }
  },
  plugins: []
};

export default config;