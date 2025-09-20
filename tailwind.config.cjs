/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("../../../packages/tailwind-config/tailwind.preset.js")],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // shared packages (ui, frontend-common, etc.)
    "../../../packages/**/src/**/*.{js,ts,jsx,tsx}",
    "../../**/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  plugins: [require("tailwindcss-animate")],
};
