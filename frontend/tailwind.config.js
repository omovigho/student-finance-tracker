import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans]
      },
      colors: {
        primary: '#0B63CE',
        accent: '#F59E0B',
        background: '#F7FAFF',
        muted: '#6B7280'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(11, 99, 206, 0.08)'
      }
    }
  },
  plugins: []
};
