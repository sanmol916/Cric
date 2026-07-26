// Central black & red design tokens used across the app.
export const colors = {
  bg0: '#0a0a0c',
  bg1: '#111114',
  bg2: '#17171c',
  bg3: '#1e1e25',
  surface: '#16161b',
  surfaceHover: '#1d1d24',
  border: '#2a2a33',
  borderStrong: '#3a3a45',

  red: '#e11d2a',
  redBright: '#ff2d3f',
  redDim: '#9a1520',

  text0: '#f5f5f7',
  text1: '#c8c8d0',
  text2: '#8a8a96',
  text3: '#5c5c68',

  green: '#2fd07a',
  amber: '#f5a623',
  white: '#ffffff',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const font = {
  // React Native has no bundled mono; use platform monospace fallback.
  mono: 'monospace' as const,
};
