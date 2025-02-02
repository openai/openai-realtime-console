import type { Config } from "tailwindcss";
const { fontFamily } = require("tailwindcss/defaultTheme");

const config = {
    darkMode: ["class"],
    content: [
        "./pages/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./src/**/*.{ts,tsx}",
    ],
    prefix: "",
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1440px",
            },
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
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "infinite-scroll": {
                    from: { transform: "translateX(0)" },
                    to: { transform: "translateX(-100%)" },
                },
                "infinite-scroll-inverse": {
                    from: { transform: "translateX(-100%)" },
                    to: { transform: "translateX(0)" },
                },
            },
            fontFamily: {
                inter: ["var(--font-inter)"],
                "inter-tight": ["var(--font-inter-tight)", "sans-serif"],
                baloo2: ["var(--font-baloo2)"],
                comicNeue: ["var(--font-comic-neue)"],
                quicksand: ["var(--font-quicksand)"],
                chewy: ["var(--font-chewy)"],
                fredoka: ["var(--font-fredoka)"],
                lora: ["var(--font-lora)", ...fontFamily.serif],
                karla: ["var(--font-karla)"],
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "infinite-scroll": "infinite-scroll 60s linear infinite",
                "infinite-scroll-inverse":
                    "infinite-scroll-inverse 60s linear infinite",
            },
            boxShadow: {
                cool: "0 4px 6px rgba(135, 206, 235, 0.2), 0 8px 24px rgba(70, 130, 180, 0.5)",
                tron: "0 4px 6px rgba(255, 215, 0, 0.2), 0 8px 24px rgba(218, 165, 32, 0.5)",
                custom_focus: "0 0 20px rgba(0, 0, 0, 0.25)", // Custom shadow
                custom_unfocus: "0 0 8px rgba(0, 0, 0, 0.07)", // Custom shadow
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/aspect-ratio"),
    ],
} satisfies Config;

export default config;
