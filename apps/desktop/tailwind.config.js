/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./renderer/index.html",
        "./renderer/src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {},
    },
    plugins: [],
}
