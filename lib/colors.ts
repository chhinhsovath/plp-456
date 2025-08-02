// PLP Color Palette Configuration
export const colors = {
  // Primary Blue Gradient (from the image)
  primary: {
    900: '#4A73A6', // Darkest blue
    800: '#5E84BA',
    700: '#7295CE',
    600: '#86A6E2',
    500: '#9AB7F6', // Mid blue
    400: '#B3CAF8',
    300: '#CCDEFA',
    200: '#E5F1FC',
    100: '#F2F8FE', // Lightest blue
    50: '#F9FCFF',
  },
  
  // Semantic Colors
  semantic: {
    success: '#52C41A',
    warning: '#FAAD14',
    error: '#FF4D4F',
    info: '#1890FF',
  },
  
  // Neutral Colors
  neutral: {
    900: '#1F1F1F',
    800: '#2F2F2F',
    700: '#404040',
    600: '#595959',
    500: '#737373',
    400: '#8C8C8C',
    300: '#A6A6A6',
    200: '#BFBFBF',
    100: '#D9D9D9',
    50: '#F0F0F0',
    0: '#FFFFFF',
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FCFF',
    tertiary: '#F2F8FE',
    section: '#E5F1FC',
  },
  
  // Text Colors
  text: {
    primary: '#1F1F1F',
    secondary: '#595959',
    tertiary: '#8C8C8C',
    inverse: '#FFFFFF',
  },
  
  // Border Colors
  border: {
    default: '#E5F1FC',
    light: '#F2F8FE',
    dark: '#CCDEFA',
  },
};

// CSS Variable Names for runtime theming
export const cssVariables = {
  // Primary Colors
  '--color-primary-900': colors.primary[900],
  '--color-primary-800': colors.primary[800],
  '--color-primary-700': colors.primary[700],
  '--color-primary-600': colors.primary[600],
  '--color-primary-500': colors.primary[500],
  '--color-primary-400': colors.primary[400],
  '--color-primary-300': colors.primary[300],
  '--color-primary-200': colors.primary[200],
  '--color-primary-100': colors.primary[100],
  '--color-primary-50': colors.primary[50],
  
  // Semantic Colors
  '--color-success': colors.semantic.success,
  '--color-warning': colors.semantic.warning,
  '--color-error': colors.semantic.error,
  '--color-info': colors.semantic.info,
  
  // Background Colors
  '--bg-primary': colors.background.primary,
  '--bg-secondary': colors.background.secondary,
  '--bg-tertiary': colors.background.tertiary,
  '--bg-section': colors.background.section,
  
  // Text Colors
  '--text-primary': colors.text.primary,
  '--text-secondary': colors.text.secondary,
  '--text-tertiary': colors.text.tertiary,
  '--text-inverse': colors.text.inverse,
  
  // Border Colors
  '--border-default': colors.border.default,
  '--border-light': colors.border.light,
  '--border-dark': colors.border.dark,
};

// Ant Design Theme Configuration
export const antdTheme = {
  token: {
    colorPrimary: colors.primary[700],
    colorBgContainer: colors.background.primary,
    colorBgLayout: colors.background.secondary,
    colorBgElevated: colors.background.primary,
    colorText: colors.text.primary,
    colorTextSecondary: colors.text.secondary,
    colorTextTertiary: colors.text.tertiary,
    colorBorder: colors.border.default,
    colorBorderSecondary: colors.border.light,
    colorSuccess: colors.semantic.success,
    colorWarning: colors.semantic.warning,
    colorError: colors.semantic.error,
    colorInfo: colors.semantic.info,
    borderRadius: 8,
    fontFamily: "'Inter', 'Hanuman', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  components: {
    Layout: {
      colorBgHeader: colors.background.primary,
      colorBgBody: colors.background.secondary,
      colorBgTrigger: colors.primary[700],
    },
    Menu: {
      colorItemBg: 'transparent',
      colorItemBgHover: colors.primary[100],
      colorItemBgSelected: colors.primary[200],
      colorItemText: colors.text.primary,
      colorItemTextHover: colors.primary[700],
      colorItemTextSelected: colors.primary[900],
    },
    Button: {
      colorPrimary: colors.primary[700],
      colorPrimaryHover: colors.primary[600],
      colorPrimaryActive: colors.primary[800],
    },
    Card: {
      colorBgContainer: colors.background.primary,
      colorBorderSecondary: colors.border.light,
    },
  },
};