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
        // Paleta Mundial 2026 — Selección de Ecuador (FEF): azul marino + rojo
        pitch: {
          DEFAULT: "#152C5B", // azul marino profundo (color de marca principal)
          dark: "#0D1C3D", // marino casi negro (cabeceras, gradientes, hover)
          light: "#4F7AD1", // azul claro legible en modo oscuro
        },
        flame: {
          DEFAULT: "#C8102E", // rojo Ecuador
          dark: "#9E0C24",
        },
        gold: {
          DEFAULT: "#C9A227", // dorado metálico apagado (uso mínimo)
          dark: "#A8851C",
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
