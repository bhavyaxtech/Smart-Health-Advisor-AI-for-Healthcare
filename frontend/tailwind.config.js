/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        halo: "0 30px 90px rgba(15, 23, 42, 0.12)",
      },
      colors: {
        mist: "#f7fbff",
        shell: "#eef6ff",
        ink: "#10243e",
      },
    },
  },
  plugins: [],
};
