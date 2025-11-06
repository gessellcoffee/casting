// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/contexts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        neu: {
          bg: {
            base: 'var(--neu-bg-base)',
            'gradient-start': 'var(--neu-bg-gradient-start)',
            'gradient-end': 'var(--neu-bg-gradient-end)',
          },
          surface: {
            DEFAULT: 'var(--neu-surface)',
            light: 'var(--neu-surface-light)',
            dark: 'var(--neu-surface-dark)',
          },
          shadow: {
            light: 'var(--neu-shadow-light)',
            dark: 'var(--neu-shadow-dark)',
            'inset-light': 'var(--neu-shadow-inset-light)',
            'inset-dark': 'var(--neu-shadow-inset-dark)',
          },
          accent: {
            primary: 'var(--neu-accent-primary)',
            secondary: 'var(--neu-accent-secondary)',
            success: 'var(--neu-accent-success)',
            danger: 'var(--neu-accent-danger)',
            warning: 'var(--neu-accent-warning)',
          },
          text: {
            primary: 'var(--neu-text-primary)',
            secondary: 'var(--neu-text-secondary)',
            muted: 'var(--neu-text-muted)',
          },
          border: {
            DEFAULT: 'var(--neu-border)',
            focus: 'var(--neu-border-focus)',
          },
        },
      },
      boxShadow: {
        'neu-raised': '10px 10px 20px var(--neu-shadow-dark), -10px -10px 20px var(--neu-shadow-light)',
        'neu-raised-lg': '15px 15px 30px var(--neu-shadow-dark), -15px -15px 30px var(--neu-shadow-light)',
        'neu-pressed': 'inset 6px 6px 12px var(--neu-shadow-inset-dark), inset -6px -6px 12px var(--neu-shadow-inset-light)',
        'neu-pressed-sm': 'inset 4px 4px 8px var(--neu-shadow-inset-dark), inset -4px -4px 8px var(--neu-shadow-inset-light)',
      },
    },
  },
  plugins: [],
};