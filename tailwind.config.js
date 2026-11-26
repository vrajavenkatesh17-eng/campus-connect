/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          secondary: 'rgb(var(--surface-2) / <alpha-value>)',
        },
        line: 'rgb(var(--line) / <alpha-value>)',
        border: {
          DEFAULT: 'rgb(var(--line) / <alpha-value>)',
          subtle: 'rgb(var(--line) / 0.6)',
          hover: 'rgb(var(--line) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--muted) / <alpha-value>)',
        },
        foreground: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--muted) / <alpha-value>)',
          subtle: 'rgb(var(--muted) / <alpha-value>)',
        },
        muted: 'rgb(var(--muted) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
          soft: 'rgb(var(--primary-soft) / <alpha-value>)',
          subtle: 'rgb(var(--primary-soft) / <alpha-value>)',
          foreground: 'rgb(var(--on-primary) / <alpha-value>)',
        },
        'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
        gold: {
          DEFAULT: 'rgb(var(--gold) / <alpha-value>)',
          decor: 'rgb(var(--gold) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          soft: 'rgb(var(--success-soft) / <alpha-value>)',
          subtle: 'rgb(var(--success-soft) / <alpha-value>)',
          foreground: 'rgb(var(--success) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          soft: 'rgb(var(--warning-soft) / <alpha-value>)',
          subtle: 'rgb(var(--warning-soft) / <alpha-value>)',
          foreground: 'rgb(var(--warning) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          soft: 'rgb(var(--danger-soft) / <alpha-value>)',
          subtle: 'rgb(var(--danger-soft) / <alpha-value>)',
          foreground: 'rgb(var(--danger) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          soft: 'rgb(var(--info-soft) / <alpha-value>)',
          subtle: 'rgb(var(--info-soft) / <alpha-value>)',
          foreground: 'rgb(var(--info) / <alpha-value>)',
        },
      },
      borderRadius: {
        btn: '12px',
        card: '20px',
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'Manrope', '"Manrope-Fallback"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Fraunces Variable"', 'Fraunces', '"Fraunces-Fallback"', 'Georgia', 'serif'],
        display: ['"Fraunces Variable"', 'Fraunces', '"Fraunces-Fallback"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono Variable"', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['28px', { lineHeight: '34px' }],
        '3xl': ['32px', { lineHeight: '38px' }],
        '4xl': ['40px', { lineHeight: '46px' }],
        display: ['clamp(40px, 6vw, 72px)', { lineHeight: '1.1' }],
      },
    },
  },
  plugins: [],
}
