/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        editorial: ['Cormorant Garamond', 'Georgia', 'serif'],
        reading: ['Literata', 'Source Serif 4', 'Georgia', 'serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
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
        // Direct literary tokens for specialized accents
        ivory: {
          DEFAULT: "#F7F4ED",
          light: "#FAF8F3",
          dark: "#EFEAE0",
        },
        ink: {
          DEFAULT: "#22231F",
          soft: "#2D2E29",
          deep: "#151613",
        },
        literary: {
          DEFAULT: "#826449",
          hover: "#6F543C",
          light: "#A48263",
        },
        sage: {
          DEFAULT: "#DCE4D7",
          light: "#E8EFE4",
          dark: "#BFCDB8",
        },
        terracotta: {
          DEFAULT: "#B85C45",
          hover: "#9E4E3A",
          light: "#CD755F",
        },
        parchment: {
          DEFAULT: "#F1E9DA",
          dark: "#3C352A",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

