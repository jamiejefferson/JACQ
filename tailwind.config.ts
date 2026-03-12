import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Jacq design tokens (UX reference)
        jacq: {
          bg: "var(--jacq-bg)",
          surf: "var(--jacq-surf)",
          surf2: "var(--jacq-surf2)",
          surf3: "var(--jacq-surf3)",
          bord: "var(--jacq-bord)",
          bord2: "var(--jacq-bord2)",
          t1: "var(--jacq-t1)",
          t2: "var(--jacq-t2)",
          t3: "var(--jacq-t3)",
          gold: "var(--jacq-gold)",
          goldl: "var(--jacq-goldl)",
          goldb: "var(--jacq-goldb)",
          green: "var(--jacq-green)",
          greenl: "var(--jacq-greenl)",
          amber: "var(--jacq-amber)",
          amberl: "var(--jacq-amberl)",
          red: "var(--jacq-red)",
          redl: "var(--jacq-redl)",
          blue: "var(--jacq-blue)",
          bluel: "var(--jacq-bluel)",
        },
      },
      fontFamily: {
        "instrument-serif": ['"Instrument Serif"', "Georgia", "serif"],
        "gilda-display": ['"Gilda Display"', "Georgia", "serif"],
        "dm-sans": ['"DM Sans"', "sans-serif"],
        "dm-mono": ['"DM Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
