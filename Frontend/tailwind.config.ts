import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        cbookC: {
          "50": "#faf8fc",
          "100": "#f4eef9",
          "200": "#ebe1f3",
          "300": "#dcc9e9",
          "400": "#c4a5db",
          "500": "#a87bc7",
          "600": "#9666b7",
          "700": "#81529e",
          "800": "#6c4782",
          "900": "#583a69",
          "950": "#3b214a",
        },
      },
    },

    fontFamily: {
      cbookF: ["Nunito"],
    },
  },
  plugins: [],
};
export default config;
