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
        primary: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        antic: {
          navy:    '#071525',
          dark:    '#0D2644',
          mid:     '#1E4A7E',
          green:   '#059669',
          glow:    '#10B981',
          gold:    '#F59E0B',
          goldlt:  '#FCD34D',
        },
        neutral: {
          50:  '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        success: { 50:'#ECFDF5', 100:'#D1FAE5', 500:'#10B981', 600:'#059669', 700:'#047857' },
        danger:  { 50:'#FEF2F2', 100:'#FEE2E2', 500:'#EF4444', 600:'#DC2626', 700:'#B91C1C' },
        warning: { 50:'#FFF7ED', 100:'#FFEDD5', 500:'#F97316', 600:'#EA580C', 700:'#C2410C' },
        info:    { 50:'#F0F9FF', 100:'#E0F2FE', 500:'#0EA5E9', 600:'#0284C7', 700:'#0369A1' },
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '56px', fontWeight: '800' }],
        'h1':      ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'h2':      ['30px', { lineHeight: '38px', fontWeight: '700' }],
        'h3':      ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'h4':      ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'h5':      ['18px', { lineHeight: '26px', fontWeight: '600' }],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(5,150,105,0.35)',
        'glow-blue':  '0 0 20px rgba(30,74,126,0.4)',
        'glow-gold':  '0 0 16px rgba(245,158,11,0.35)',
        'card':       '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.08)',
        'sidebar':    '4px 0 24px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #071525 0%, #0D2644 60%, #071525 100%)',
        'green-glow':       'radial-gradient(ellipse at center, rgba(5,150,105,0.15) 0%, transparent 70%)',
        'gold-shine':       'linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%)',
        'card-gradient':    'linear-gradient(135deg, #ffffff 0%, #f8faff 100%)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'glow-pulse':  'glowPulse 3s ease-in-out infinite',
        'slide-in':    'slideIn 0.25s ease-out',
        'fade-up':     'fadeUp 0.35s ease-out',
        'shimmer':     'shimmer 2s linear infinite',
        'spin-slow':   'spin 8s linear infinite',
        'badge-pop':   'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%,100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%':     { opacity: '1',   transform: 'scale(1.05)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        badgePop: {
          from: { transform: 'scale(0.7)', opacity: '0' },
          to:   { transform: 'scale(1)',   opacity: '1' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
