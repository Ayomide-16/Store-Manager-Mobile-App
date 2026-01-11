// Main App Entry Point with Theme and Shop Providers
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShopProvider } from './src/store/ShopContext';
import { ThemeProvider, useTheme } from './src/store/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// Inner component to access theme for StatusBar
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <ShopProvider>
        <AppNavigator />
      </ShopProvider>
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
