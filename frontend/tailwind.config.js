/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        luxury: {
          white: "#FFFFFF",
          black: "#111111",
          emerald: "#16A34A",
          emeraldHover: "#15803d",
          emeraldLight: "#D1FAE5",
          gray: "#F8F9FA",
          darkGray: "#1A1A1A",
          mutedGray: "#7E7873",
          border: "rgba(255, 255, 255, 0.1)",
          glassBg: "rgba(255, 255, 255, 0.8)",
          glassBgDark: "rgba(17, 17, 17, 0.85)",
        },
        grooming: {
          primary: "#00B8B0",
          hover: "#00A19B",
          light: "#E0F7F6",
          cream: "#F7F3EE",
          bg: "#FAFAFA"
        }
      },
      borderRadius: {
        '20': '20px',
        '24': '24px',
      },
      boxShadow: {
        'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        'premium-hover': '0 30px 60px -20px rgba(0, 0, 0, 0.1)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}

