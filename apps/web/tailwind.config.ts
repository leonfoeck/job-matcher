// tailwind.config.ts
export default {
  darkMode: 'class',
  content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
};
