import type { Config } from "tailwindcss";

// As cores vêm de variáveis CSS (globals.css): o tema escuro troca os valores das
// variáveis em `html.dark`, então as classes existentes (bg-white, text-slate-500...)
// funcionam nos dois temas sem precisar de `dark:` em cada componente.
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const palette = (name: string) =>
  Object.fromEntries(SHADES.map((s) => [s, `rgb(var(--c-${name}-${s}) / <alpha-value>)`]));

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // `white` é a cor de superfície (cartões, inputs). Texto branco continua branco (textColor abaixo).
        white: "rgb(var(--c-white) / <alpha-value>)",
        slate: palette("slate"),
        brand: palette("brand"),
        emerald: palette("emerald"),
        red: palette("red"),
        amber: palette("amber"),
        blue: palette("blue"),
        violet: palette("violet"),
      },
      textColor: { white: "#fff" },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        "scale-in": { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "none" } },
        "slide-down": { from: { opacity: "0", transform: "translateY(-12px)" }, to: { opacity: "1", transform: "none" } },
        "sheet-up": { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        pop: { "0%": { transform: "scale(.6)" }, "60%": { transform: "scale(1.15)" }, "100%": { transform: "scale(1)" } },
        shimmer: { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
      },
      animation: {
        "fade-in": "fade-in .25s ease-out both",
        "fade-up": "fade-up .35s cubic-bezier(.2,.8,.2,1) both",
        "scale-in": "scale-in .2s cubic-bezier(.2,.8,.2,1) both",
        "slide-down": "slide-down .3s cubic-bezier(.2,.8,.2,1) both",
        "sheet-up": "sheet-up .3s cubic-bezier(.2,.8,.2,1) both",
        pop: "pop .3s ease-out both",
        shimmer: "shimmer 1.6s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
