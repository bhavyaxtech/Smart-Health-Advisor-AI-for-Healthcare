/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["DM Sans", "-apple-system", "sans-serif"],
      },
      colors: {
        bg: "var(--bg)",
        "bg-deep": "var(--bg-deep)",
        amber: {
          50: "var(--amber-50)",
          100: "var(--amber-100)",
          200: "var(--amber-200)",
          300: "var(--amber-300)",
          400: "var(--amber-400)",
          500: "var(--amber-500)",
          600: "var(--amber-600)",
          700: "var(--amber-700)",
          800: "var(--amber-800)",
        },
        stone: {
          50: "var(--stone-50)",
          100: "var(--stone-100)",
          200: "var(--stone-200)",
          300: "var(--stone-300)",
          400: "var(--stone-400)",
          500: "var(--stone-500)",
          600: "var(--stone-600)",
          700: "var(--stone-700)",
          800: "var(--stone-800)",
          900: "var(--stone-900)",
        },
        sky: {
          soft: "var(--sky-soft)",
          mid: "var(--sky-mid)",
        },
        vital: {
          amber: {
            50: "#fdf8f0",
            100: "#faecd8",
            200: "#f5d4a8",
            300: "#edaf60",
            400: "#e09040",
            500: "#c97022",
            600: "#a85a14",
            700: "#7e420d",
            800: "#5a2f08",
          },
          stone: {
            50: "#f9f8f6",
            100: "#f0eeea",
            200: "#dedad3",
            300: "#c8c3b9",
            400: "#a09990",
            500: "#776e64",
            600: "#5a5249",
            700: "#3e3830",
            800: "#252018",
            900: "#141008",
          },
          sky: {
            soft: "#d4e8f0",
            mid: "#89b8cc",
          },
        },
      },
      borderRadius: {
        pill: "100px",
        card: "20px",
        chip: "14px",
      },
      boxShadow: {
        glass: "var(--glass-shadow)",
        "glass-md": "var(--glass-shadow-md)",
        "glass-lg": "var(--glass-shadow-lg)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        float: "float 4.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
