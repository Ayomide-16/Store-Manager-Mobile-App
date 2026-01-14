// Main App Entry Point with Theme, Shop Providers, Splash Screen and Optimized Loading
import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShopProvider, useShop } from './src/store/ShopContext';
import { ThemeProvider, useTheme } from './src/store/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/components/SplashScreen';

// Inner component to access theme for StatusBar and show splash
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { isLoading } = useShop();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // Hide splash after min 1.5s and when loading is done
  useEffect(() => {
    const minSplashTime = 1500;
    const startTime = Date.now();

    const checkReady = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, minSplashTime - elapsed);

      if (!isLoading) {
        setTimeout(() => {
          setShowSplash(false);
          setAppReady(true);
        }, remaining);
      }
    };

    // Check every 100ms
    const interval = setInterval(checkReady, 100);

    // Fallback - hide after 5 seconds max
    const fallback = setTimeout(() => {
      setShowSplash(false);
      setAppReady(true);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(fallback);
    };
  }, [isLoading]);

  if (showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
        <SplashScreen />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <AppNavigator />
    </>
  );
};

// Wrapper to provide ShopContext before AppContent
const AppWithProviders: React.FC = () => {
  return (
    <ShopProvider>
      <AppContent />
    </ShopProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppWithProviders />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
