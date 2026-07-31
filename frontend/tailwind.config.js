/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        foreground: '#f8fafc',
        card: '#1e293b',
        'card-foreground': '#f8fafc',
        primary: '#3b82f6',
        'primary-foreground': '#ffffff',
        accent: '#8b5cf6',
        decision: '#3b82f6',
        task: '#f97316',
        question: '#eab308',
        contradiction: '#ef4444',
      },
    },
  },
  plugins: [],
};
