import { ShipmentStatus } from '../types';

/**
 * Comprehensive Design System Tokens for TAC Cargo Portal
 * Centralized constants ensuring consistency across all components
 */

// ============================================
// SPACING SCALE (8px base unit)
// ============================================
export const SPACING = {
  '0': '0px',
  '0.5': '2px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
} as const;

// ============================================
// TYPOGRAPHY SCALE
// ============================================
export const TYPOGRAPHY = {
  fontFamily: {
    sans: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
    mono: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
  },
  size: {
    '2xs': '10px',
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
    '6xl': '60px',
  },
  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tighter: '-0.04em',
    tight: '-0.02em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.04em',
    widest: '0.08em',
  },
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const RADIUS = {
  none: '0px',
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const;

// ============================================
// SHADOWS
// ============================================
export const SHADOWS = {
  '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 40px -5px hsl(var(--primary) / 0.3)',
} as const;

// ============================================
// Z-INDEX SCALE
// ============================================
export const Z_INDEX = {
  hide: -1,
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================
export const DURATION = {
  fast: '100ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '1000ms',
} as const;

// ============================================
// EASING FUNCTIONS
// ============================================
export const EASING = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// ============================================
// STATUS COLORS (Semantic)
// ============================================
export const STATUS_COLORS: Partial<Record<ShipmentStatus, string>> = {
  CREATED: 'badge--created',
  PICKUP_SCHEDULED: 'badge--created',
  PICKED_UP: 'badge--manifested',
  RECEIVED_AT_ORIGIN: 'badge--manifested',
  IN_TRANSIT: 'badge--in-transit',
  RECEIVED_AT_DEST: 'badge--arrived',
  OUT_FOR_DELIVERY: 'badge--in-transit',
  DELIVERED: 'badge--delivered',
  CANCELLED: 'badge--cancelled',
  RTO: 'badge--returned',
  EXCEPTION: 'badge--exception',
};

// ============================================
// CHART COLORS
// ============================================
export const CHART_COLORS = {
  primary: 'var(--primary)',
  secondary: 'var(--status-info)',
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  error: 'var(--status-error)',
  info: 'var(--status-info)',
  neutral: 'var(--status-neutral)',
  danger: 'var(--status-error)',
  background: 'transparent',
  grid: 'var(--border-subtle)',
  axis: 'var(--text-muted)',
};

// ============================================
// ANIMATION VARIANTS
// ============================================
export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  },
  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
  },
  scaleIn: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
  },
  stagger: {
    container: {
      animate: { transition: { staggerChildren: 0.1 } },
    },
    item: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
    },
  },
};

// ============================================
// COMPONENT TOKENS
// ============================================
export const COMPONENT_TOKENS = {
  button: {
    height: { sm: '32px', md: '40px', lg: '48px' },
    padding: { sm: '0 12px', md: '0 16px', lg: '0 24px' },
    fontSize: { sm: '12px', md: '14px', lg: '16px' },
  },
  input: {
    height: { sm: '32px', md: '40px', lg: '48px' },
    padding: { sm: '0 12px', md: '0 16px', lg: '0 16px' },
  },
  card: {
    padding: { sm: '16px', md: '24px', lg: '32px' },
    gap: { sm: '12px', md: '16px', lg: '24px' },
  },
};

// Default export for convenience
export default {
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  SHADOWS,
  Z_INDEX,
  DURATION,
  EASING,
  STATUS_COLORS,
  CHART_COLORS,
  ANIMATION_VARIANTS,
  COMPONENT_TOKENS,
};
