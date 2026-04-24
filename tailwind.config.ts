import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        burgundy: "hsl(var(--burgundy))",
        gold: "hsl(var(--gold))",
        cream: "hsl(var(--cream))",
        noir: "hsl(var(--noir))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        'gradient-curtain': 'var(--gradient-curtain)',
        'gradient-gold': 'var(--gradient-gold)',
        'gradient-noir': 'var(--gradient-noir)',
      },
      boxShadow: {
        'gold': 'var(--shadow-gold)',
        'poster': 'var(--shadow-poster)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "flicker": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.92" } },
        "curtain-left": {
          "0%": { transform: "translateX(0) skewY(0deg)" },
          "100%": { transform: "translateX(-105%) skewY(-1deg)" },
        },
        "curtain-right": {
          "0%": { transform: "translateX(0) skewY(0deg)" },
          "100%": { transform: "translateX(105%) skewY(1deg)" },
        },
        "curtain-sway": {
          "0%, 100%": { transform: "translateX(0) skewY(0deg)" },
          "50%": { transform: "translateX(-1%) skewY(-0.3deg)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "gold-glow": {
          "0%, 100%": { textShadow: "0 0 12px hsl(42 80% 65% / 0.6), 0 0 24px hsl(42 65% 55% / 0.3)" },
          "50%": { textShadow: "0 0 18px hsl(42 80% 65% / 0.85), 0 0 36px hsl(42 65% 55% / 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "flicker": "flicker 4s ease-in-out infinite",
        "curtain-left": "curtain-sway 1.2s ease-in-out, curtain-left 1.8s 0.4s cubic-bezier(0.7, 0, 0.3, 1) forwards",
        "curtain-right": "curtain-sway 1.2s ease-in-out, curtain-right 1.8s 0.4s cubic-bezier(0.7, 0, 0.3, 1) forwards",
        "shimmer": "shimmer 3s linear infinite",
        "gold-glow": "gold-glow 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
