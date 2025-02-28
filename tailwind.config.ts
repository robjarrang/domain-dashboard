import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00DECA",
        "primary-hover": "#00C5B3", // Slightly darker shade of Bright Turquoise
        "midnight-navy": "#080043", // For headings and primary text
        "deep-teal": "#004063",     // For secondary actions or elements
        "soft-grey": "#EAEAEA",     // For borders and dividers
        "ice-white": "#EEF2FB",     // Background color
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
};

export default config;
