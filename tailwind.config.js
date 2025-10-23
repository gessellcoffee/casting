// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        neu: {
          bg: {
            base: '#e6eef9',
            gradientStart: '#6b8dd6',
            gradientEnd: '#e89cc5',
          },
          surface: {
            DEFAULT: '#e6eef9',
            light: '#f0f5fc',
            dark: '#dce6f5',
          },
          shadow: {
            light: 'rgba(255, 255, 255, 0.8)',
            dark: 'rgba(163, 177, 198, 0.6)',
            insetLight: 'rgba(255, 255, 255, 0.5)',
            insetDark: 'rgba(163, 177, 198, 0.4)',
          },
          accent: {
            primary: '#6b8dd6',
            secondary: '#8b9dc3',
            success: '#68d391',
            danger: '#fc8181',
            warning: '#f6ad55',
          },
          text: {
            primary: '#2d3748',
            secondary: '#4a5568',
            muted: '#718096',
          },
          border: {
            DEFAULT: 'rgba(163, 177, 198, 0.2)',
            focus: 'rgba(107, 141, 214, 0.4)',
          },
        },
      },
      boxShadow: {
        'neu-raised': '10px 10px 20px rgba(163, 177, 198, 0.6), -10px -10px 20px rgba(255, 255, 255, 0.8)',
        'neu-raised-lg': '15px 15px 30px rgba(163, 177, 198, 0.6), -15px -15px 30px rgba(255, 255, 255, 0.8)',
        'neu-pressed': 'inset 6px 6px 12px rgba(163, 177, 198, 0.4), inset -6px -6px 12px rgba(255, 255, 255, 0.5)',
        'neu-pressed-sm': 'inset 4px 4px 8px rgba(163, 177, 198, 0.4), inset -4px -4px 8px rgba(255, 255, 255, 0.5)',
      },
    },
  },
  plugins: [],
};