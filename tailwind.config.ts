import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de marca (white-label). Los colores se leen de variables de
        // entorno al COMPILAR, con default = paleta actual (Seagate / Ecuador).
        // Cada cliente cambia su color principal en su .env sin tocar código.
        pitch: {
          DEFAULT: process.env.NEXT_PUBLIC_COLOR_PRIMARY ?? "#152C5B",
          dark: process.env.NEXT_PUBLIC_COLOR_PRIMARY_DARK ?? "#0D1C3D",
          light: process.env.NEXT_PUBLIC_COLOR_PRIMARY_LIGHT ?? "#4F7AD1",
        },
        flame: {
          DEFAULT: process.env.NEXT_PUBLIC_COLOR_ACCENT ?? "#C8102E",
          dark: process.env.NEXT_PUBLIC_COLOR_ACCENT_DARK ?? "#9E0C24",
        },
        gold: {
          DEFAULT: process.env.NEXT_PUBLIC_COLOR_GOLD ?? "#C9A227",
          dark: process.env.NEXT_PUBLIC_COLOR_GOLD_DARK ?? "#A8851C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        app: "30rem", // ~480px, mobile-first (modales y barras)
        content: "72rem", // ~1152px, área de contenido en escritorio
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
