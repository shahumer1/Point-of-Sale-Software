/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                urdu: ['Noto Nastaliq Urdu', 'Arial', 'sans-serif'], // Need to import this font or use system default
                sindhi: ['Noto Naskh Arabic', 'Arial', 'sans-serif'], // Sindhi works well with Naskh
            },
        },
    },
    plugins: [],
}
