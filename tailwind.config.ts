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
        // Paleta Mundial 2026
        pitch: {
          DEFAULT: "#00563F", // verde césped
          dark: "#003D2C",
          light: "#0A7A5A",
        },
        flame: {
          DEFAULT: "#C8102E", // rojo
          dark: "#9E0C24",
        },
        gold: {
          DEFAULT: "#FFD700",
          dark: "#E6B800",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        app: "30rem", // ~480px, mobile-first (modales y barras)
        content: "72rem", // ~1152px, área de contenido en escritorio
      },
    },
  },
  plugins: [],
};

export default config;
