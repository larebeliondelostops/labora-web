import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        labora: {
          green: "#2F8F6B",
          deep: "#1F5E49",
          mint: "#9FD5BF",
          ivory: "#F6F7F2",
          charcoal: "#1F2421",
          gray: "#6E7C74",
          ui: "#D9E3DD",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Manrope", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 20px 60px rgba(31, 94, 73, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
