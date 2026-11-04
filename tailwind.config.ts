import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6ff", 100: "#d9eaff", 200: "#bcdaff", 300: "#8ec2ff", 400: "#599fff",
          500: "#337bfc", 600: "#1d5cf1", 700: "#1647de", 800: "#183bb4", 900: "#1a378d",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
