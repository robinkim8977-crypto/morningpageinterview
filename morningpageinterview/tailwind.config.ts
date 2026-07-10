import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#F5F4F2",
        foreground: "#111111",
        border: "rgba(17, 17, 17, 0.22)",
        muted: "#7A746B",
        sand: "#C9C4BA",
        paper: "#FBFAF8"
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "system-ui", "sans-serif"]
      },
      borderRadius: {
        pill: "999px"
      }
    }
  },
  plugins: []
};

export default config;
