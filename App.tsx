// Main App Entry Point - Splash Screen shows IMMEDIATELY before any loading
import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, View, Text, StyleSheet, Animated, Easing, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Inline Splash Screen - renders immediately without any imports that need loading
const ImmediateSplashScreen: React.FC = () => {
  const [spinAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={splashStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={splashStyles.logoContainer}>
        <View style={splashStyles.iconWrapper}>
          <Text style={splashStyles.iconText}>🏪</Text>
        </View>
        <Text style={splashStyles.appName}>Shop Manager</Text>
        <Text style={splashStyles.tagline}>Your offline-first retail companion</Text>
      </View>
      <View style={splashStyles.loaderContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={splashStyles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconText: {
    fontSize: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 12,
  },
});

// Lazy load heavy components AFTER splash is shown
let ShopProvider: any = null;
let ThemeProvider: any = null;
let useTheme: any = null;
let useShop: any = null;
let AppNavigator: any = null;

// Main App Content (loaded after splash)
const MainApp: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const { theme, isDark } = useTheme();
  const { isLoading } = useShop();

  useEffect(() => {
    if (!isLoading) {
      // Small delay for smooth transition
      setTimeout(onReady, 300);
    }
  }, [isLoading, onReady]);

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

// Wrapped with providers
const WrappedMainApp: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  return (
    <ThemeProvider>
      <ShopProvider>
        <MainApp onReady={onReady} />
      </ShopProvider>
    </ThemeProvider>
  );
};

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  // Load modules after splash is shown
  useEffect(() => {
    const loadModules = async () => {
      try {
        // Dynamic imports to load AFTER splash shows
        const shopContext = require('./src/store/ShopContext');
        const themeContext = require('./src/store/ThemeContext');
        const appNav = require('./src/navigation/AppNavigator');

        ShopProvider = shopContext.ShopProvider;
        useShop = shopContext.useShop;
        ThemeProvider = themeContext.ThemeProvider;
        useTheme = themeContext.useTheme;
        AppNavigator = appNav.default;

        setModulesLoaded(true);
      } catch (err) {
        console.error('Failed to load modules:', err);
        // Still try to show app
        setModulesLoaded(true);
      }
    };

    // Start loading modules after a tiny delay so splash renders first
    setTimeout(loadModules, 100);
  }, []);

  const handleReady = useCallback(() => {
    setIsReady(true);
  }, []);

  // Show splash until modules are loaded AND app data is ready
  if (!modulesLoaded || !isReady) {
    return (
      <SafeAreaProvider>
        <ImmediateSplashScreen />
        {modulesLoaded && (
          <View style={{ position: 'absolute', opacity: 0 }}>
            <WrappedMainApp onReady={handleReady} />
          </View>
        )}
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <WrappedMainApp onReady={handleReady} />
    </SafeAreaProvider>
  );
}
