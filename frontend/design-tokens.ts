// Design Tokens for LikeFood Brand
// Inspired by Vietnamese cuisine aesthetics & Phúc Long premium warmth

export const colors = {
  // Primary - Warm Terracotta / Burnt Orange
  primary: {
    50: '#fef3ec',
    100: '#fde4d0',
    200: '#fbc5a0',
    300: '#f8a06b',
    400: '#f57a3a',
    500: '#D4631D', // Main brand color
    600: '#b8521a',
    700: '#924118',
    800: '#6d3116',
    900: '#4a2212',
    950: '#2d1409',
  },
  // Secondary - Forest Green
  secondary: {
    50: '#edfaf2',
    100: '#d1f2df',
    200: '#a7e4c1',
    300: '#6fd09e',
    400: '#3fb87c',
    500: '#2D6A4F', // Main secondary
    600: '#245a42',
    700: '#1d4836',
    800: '#16372a',
    900: '#0f261e',
    950: '#081712',
  },
  // Accent - Golden
  accent: {
    50: '#fefae8',
    100: '#fcf3c3',
    200: '#f9e789',
    300: '#E9B949', // Main accent
    400: '#e5a820',
    500: '#d19318',
    600: '#b07514',
    700: '#8b5614',
    800: '#644017',
    900: '#3e2a14',
    950: '#24180c',
  },
  // Neutrals - Stone tones
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
    950: '#0c0a09',
  },
  // Semantic
  success: '#16a34a',
  error: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
} as const;

export const typography = {
  fontFamily: {
    display: ['Manrope', 'sans-serif'],
    body: ['Manrope', 'sans-serif'],
  },
  fontSize: {
    'display-lg': ['64px', { lineHeight: '1.1', fontWeight: '800', letterSpacing: '-0.02em' }],
    'display': ['48px', { lineHeight: '1.15', fontWeight: '800', letterSpacing: '-0.02em' }],
    'heading-lg': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
    'heading': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
    'subheading': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
    'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
    'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
    'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
    'caption': ['12px', { lineHeight: '1.5', fontWeight: '500' }],
    'overline': ['11px', { lineHeight: '1.5', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }],
  },
} as const;

export const spacing = {
  'section': '80px',
  'section-sm': '48px',
  'card': '24px',
  'card-sm': '16px',
  'element': '12px',
  'element-sm': '8px',
} as const;

export const shadows = {
  'card': '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  'card-hover': '0 8px 24px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.06)',
  'modal': '0 16px 48px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
  'dropdown': '0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
  'button': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  'glow': '0 0 20px rgba(212, 99, 29, 0.3)',
} as const;

export const borderRadius = {
  DEFAULT: '0.375rem',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.25rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

export const animation = {
  keyframes: {
    shimmer: {
      '100%': { transform: 'translateX(100%)' },
    },
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    'slide-up': {
      '0%': { opacity: '0', transform: 'translateY(20px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'slide-down': {
      '0%': { opacity: '0', transform: 'translateY(-10px)' },
      '100%': { opacity: '1', transform: 'translateY(0)' },
    },
    'scale-in': {
      '0%': { opacity: '0', transform: 'scale(0.95)' },
      '100%': { opacity: '1', transform: 'scale(1)' },
    },
    'bounce-gentle': {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-4px)' },
    },
  },
  animation: {
    shimmer: 'shimmer 1.5s infinite',
    'fade-in': 'fade-in 0.3s ease-out',
    'slide-up': 'slide-up 0.4s ease-out',
    'slide-down': 'slide-down 0.3s ease-out',
    'scale-in': 'scale-in 0.2s ease-out',
    'bounce-gentle': 'bounce-gentle 2s ease-in-out infinite',
  },
} as const;
