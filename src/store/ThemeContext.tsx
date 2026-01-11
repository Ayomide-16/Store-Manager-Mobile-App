// Theme Context for Dark/Light/System theme management
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, Theme } from '../utils/colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    themeMode: ThemeMode;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@shop_manager_theme';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved theme preference on mount
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
                    setThemeModeState(savedTheme as ThemeMode);
                }
            } catch (e) {
                console.log('Failed to load theme preference');
            } finally {
                setIsLoaded(true);
            }
        };
        loadTheme();
    }, []);

    // Save theme preference when changed
    const setThemeMode = async (mode: ThemeMode) => {
        setThemeModeState(mode);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (e) {
            console.log('Failed to save theme preference');
        }
    };

    // Determine actual theme based on mode
    const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
    const theme = isDark ? darkTheme : lightTheme;

    if (!isLoaded) {
        return null; // Or a loading screen
    }

    return (
        <ThemeContext.Provider value={{ theme, themeMode, isDark, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
