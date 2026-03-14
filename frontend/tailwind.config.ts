import { colors, typography, shadows, borderRadius, animation, spacing } from './design-tokens';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        neutral: colors.neutral,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        // Backward-compatible aliases from old theme
        'primary-dark': colors.primary[700],
        'background-light': colors.neutral[50],
        'background-dark': colors.neutral[900],
        'surface-light': '#ffffff',
        'surface-dark': colors.neutral[800],
        'text-light': colors.neutral[900],
        'text-dark': colors.neutral[100],
        'subtext-light': colors.neutral[500],
        'subtext-dark': colors.neutral[400],
        'border-light': colors.neutral[200],
        'border-dark': colors.neutral[700],
      },
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      spacing: spacing,
      boxShadow: shadows,
      borderRadius: borderRadius,
      keyframes: animation.keyframes,
      animation: animation.animation,
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
