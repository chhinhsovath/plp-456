import { ThemeConfig } from 'antd';

export interface ThemePreset {
  name: string;
  key: string;
  primaryColor: string;
  algorithm?: 'default' | 'dark' | 'compact';
  preview?: {
    background: string;
    foreground: string;
    accent?: string;
  };
}

export const themePresets: ThemePreset[] = [
  {
    name: 'លំនាំដើម',
    key: 'default',
    primaryColor: '#1677FF',
    algorithm: 'default',
    preview: {
      background: '#F5F5F5',
      foreground: '#FFFFFF',
    },
  },
  {
    name: 'ងងឹត',
    key: 'dark',
    primaryColor: '#1677FF',
    algorithm: 'dark',
    preview: {
      background: '#141414',
      foreground: '#1F1F1F',
      accent: '#434343',
    },
  },
  {
    name: 'ឯកសារ',
    key: 'document',
    primaryColor: '#52C41A',
    algorithm: 'default',
    preview: {
      background: '#F6FFED',
      foreground: '#FFFFFF',
      accent: '#52C41A',
    },
  },
  {
    name: 'ផ្កាឈូក',
    key: 'blossom',
    primaryColor: '#EB2F96',
    algorithm: 'default',
    preview: {
      background: '#FFF0F6',
      foreground: '#FFFFFF',
      accent: '#EB2F96',
    },
  },
  {
    name: 'ពណ៌ខៀវបុរាណ',
    key: 'v4',
    primaryColor: '#1890FF',
    algorithm: 'default',
    preview: {
      background: '#E6F7FF',
      foreground: '#FFFFFF',
      accent: '#1890FF',
    },
  },
];

export const getThemeConfig = (preset: ThemePreset): ThemeConfig => {
  const baseConfig: ThemeConfig = {
    cssVar: true,
    hashed: false,
    token: {
      colorPrimary: preset.primaryColor,
      borderRadius: 6,
      fontFamily: "'Hanuman', 'Noto Sans Khmer', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      colorBgLayout: '#f5f5f5',
      fontSize: 14,
      motion: true,
    },
    components: {
      Layout: {
        siderBg: '#ffffff',
        headerBg: '#ffffff',
        bodyBg: '#f5f5f5',
        triggerBg: '#ffffff',
        triggerColor: '#1677ff',
        headerColor: 'rgba(0, 0, 0, 0.88)',
        headerPadding: '0 24px',
      },
      Menu: {
        itemBg: '#ffffff',
        subMenuItemBg: '#ffffff',
        darkItemBg: '#001529',
        darkSubMenuItemBg: '#001529',
      },
    },
  };

  // Apply algorithm
  if (preset.algorithm === 'dark') {
    return {
      ...baseConfig,
      algorithm: (theme) => theme.darkAlgorithm,
      token: {
        ...baseConfig.token,
        colorBgContainer: '#1F1F1F',
        colorBgElevated: '#262626',
        colorBgLayout: '#141414',
      },
      components: {
        ...baseConfig.components,
        Layout: {
          siderBg: '#001529',
          headerBg: '#001529',
          bodyBg: '#141414',
          triggerBg: '#001529',
          triggerColor: '#ffffff',
        },
        Menu: {
          itemBg: 'transparent',
          subMenuItemBg: 'transparent',
          darkItemBg: '#001529',
          darkSubMenuItemBg: '#001529',
        },
      },
    };
  }

  if (preset.algorithm === 'compact') {
    return {
      ...baseConfig,
      algorithm: (theme) => theme.compactAlgorithm,
    };
  }

  // Theme-specific customizations
  switch (preset.key) {
    case 'document':
      return {
        ...baseConfig,
        token: {
          ...baseConfig.token,
          colorSuccess: preset.primaryColor,
          colorLink: preset.primaryColor,
        },
        components: {
          Button: {
            colorPrimary: preset.primaryColor,
          },
        },
      };

    case 'blossom':
      return {
        ...baseConfig,
        token: {
          ...baseConfig.token,
          colorLink: preset.primaryColor,
          colorBgLayout: '#FFF0F6',
        },
        components: {
          ...baseConfig.components,
          Layout: {
            ...baseConfig.components?.Layout,
            headerBg: '#FFFFFF',
            bodyBg: '#FFF0F6',
          },
        },
      };

    case 'v4':
      return {
        ...baseConfig,
        token: {
          ...baseConfig.token,
          borderRadius: 4,
          colorLink: preset.primaryColor,
        },
      };

    default:
      return baseConfig;
  }
};

// Color palette generator for primary color
export const generateColorPalette = (primaryColor: string) => {
  // This is a simplified version. In production, you might want to use
  // a proper color manipulation library like chroma-js
  const adjustBrightness = (color: string, amount: number) => {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  return {
    50: adjustBrightness(primaryColor, 240),
    100: adjustBrightness(primaryColor, 220),
    200: adjustBrightness(primaryColor, 180),
    300: adjustBrightness(primaryColor, 140),
    400: adjustBrightness(primaryColor, 80),
    500: primaryColor,
    600: adjustBrightness(primaryColor, -40),
    700: adjustBrightness(primaryColor, -80),
    800: adjustBrightness(primaryColor, -120),
    900: adjustBrightness(primaryColor, -160),
  };
};

// Available primary colors for custom theme creation
export const primaryColors = [
  '#1677FF', // Blue
  '#722ED1', // Purple
  '#8B3A9B', // Violet
  '#EB2F96', // Magenta
  '#FF4D4F', // Red
  '#FA8C16', // Orange
  '#FADB14', // Yellow
  '#52C41A', // Green
  '#13C2C2', // Cyan
];