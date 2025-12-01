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
        'toss-blue': '#3182f6',
        'toss-bg': '#f2f4f6',
        'toss-text': '#191f28',
        'toss-gray': '#b1b8c0',
      },
    },
  },
  plugins: [],
};
export default config;
