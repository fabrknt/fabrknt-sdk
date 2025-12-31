/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                pulsar: {
                    primary: "#14F195",
                    secondary: "#9945FF",
                    dark: "#1a1a2e",
                },
            },
        },
    },
    plugins: [],
};
