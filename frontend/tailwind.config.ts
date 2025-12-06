import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'toss-blue': '#0ea5e9',
        'toss-bg': '#f7f5ef',
        'toss-text': '#0f172a',
        'toss-gray': '#6b7280',
      },
    },
  },
  plugins: [],
};
export default config;
