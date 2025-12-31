export const suiteTheme = {
  colors: {
    // Monochromatic gray scale (Fabrknt standard)
    gray: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    // Accent colors for Suite apps
    pulse: {
      primary: '#667eea', // Human-centric purple
      secondary: '#764ba2',
      light: '#a5b4fc',
      dark: '#4c51bf',
    },
    trace: {
      primary: '#f39c12', // Growth orange
      secondary: '#e74c3c',
      light: '#fbbf24',
      dark: '#d97706',
    },
    fabric: {
      primary: '#27ae60', // Exit green
      secondary: '#16a085',
      light: '#34d399',
      dark: '#059669',
    },
  },
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    mono: 'JetBrains Mono, Courier New, monospace',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
  },
};

export type SuiteTheme = typeof suiteTheme;
