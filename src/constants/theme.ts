/**
 * FixMo Design System Theme Tokens
 *
 * Professional, clean, neutral, and comfortable to interact with.
 * Inspired by modern utility and on-demand service platforms.
 */

export const Colors = {
  // Surfaces & Backgrounds
  background: '#F8F9FA', // Off-white/light gray background
  surface: '#FFFFFF', // Pure white card & sheet surface
  surfaceSecondary: '#F1F3F5', // Soft gray utility surface
  surfaceHover: '#F8F9FA', // Subtle hover/press tint

  // Text Hierarchy
  textPrimary: '#191C21', // Charcoal/dark neutral for high readability
  textSecondary: '#667085', // Medium slate gray for descriptions & labels
  textTertiary: '#98A2B3', // Subtle placeholder & hint gray
  textInverse: '#FFFFFF', // Inverted text on dark/accent surfaces

  // Borders & Dividers
  border: '#EAECF0', // Crisp, subtle hairline borders
  borderStrong: '#D0D5DD', // Focused or active border lines
  divider: '#F2F4F7', // In-card separators

  // Primary Accent (Restrained, professional cobalt utility tone)
  accent: '#0C63E4',
  accentHover: '#0A52BE',
  accentPressed: '#08439B',
  accentLight: '#EFF4FE',
  accentBorder: '#C6DCFD',

  // Status & Feedback Colors
  success: '#12B76A', // Verified / Available / Completed
  successDark: '#027A48',
  successLight: '#ECFDF3',
  successBorder: '#A6F4C5',

  warning: '#F79009', // In-progress / Pending / Caution
  warningDark: '#B54708',
  warningLight: '#FFFAEB',
  warningBorder: '#FEDF89',

  error: '#F04438', // Error / Cancelled / Failed
  errorDark: '#B42318',
  errorLight: '#FEF3F2',
  errorBorder: '#FECDCA',

  // Interactive Disabled State
  disabled: '#F2F4F7',
  disabledText: '#98A2B3',
  disabledBorder: '#EAECF0',
};

export const Spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  sizes: {
    xxs: 11,
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 28,
  },
  lineHeights: {
    xxs: 14,
    xs: 16,
    sm: 20,
    md: 22,
    lg: 24,
    xl: 26,
    xxl: 30,
    display: 34,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const Layout = {
  touchTargetMin: 48,
  buttonHeightSm: 36,
  buttonHeightMd: 44,
  buttonHeightLg: 50,
  inputHeight: 48,
  screenPadding: 16,
};
