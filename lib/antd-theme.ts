import { ThemeConfig } from 'antd';

export const theme: ThemeConfig = {
  token: {
    // Primary color
    colorPrimary: '#1890ff',
    
    // Layout
    borderRadius: 6,
    
    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    
    // Component tokens
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',
  },
  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
    },
  },
};

export const darkTheme: ThemeConfig = {
  ...theme,
  token: {
    ...theme.token,
    colorBgContainer: '#141414',
    colorBgLayout: '#000000',
    colorText: '#ffffff',
  },
  algorithm: 'dark',
};