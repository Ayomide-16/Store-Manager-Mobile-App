// Theme colors for light and dark modes
// IMPORTANT: Text on surface cards should ALWAYS be visible 
// Light mode: Dark text on light cards
// Dark mode: Light text on dark cards (surface is dark but lighter than bg)
export const lightTheme = {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#F1F5F9',
    primary: '#4F46E5',
    primaryLight: '#EEF2FF',
    secondary: '#0F172A',
    // Text colors - dark text for light backgrounds
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    success: '#059669',
    successLight: '#ECFDF5',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    danger: '#DC2626',
    dangerLight: '#FEF2F2',
    info: '#2563EB',
    infoLight: '#EFF6FF',
    purple: '#7C3AED',
    purpleLight: '#F5F3FF',
    cardBg: '#FFFFFF',
    statusBar: 'dark' as 'dark' | 'light',
};

export const darkTheme = {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',
    primary: '#818CF8',
    primaryLight: '#312E81',
    secondary: '#0F172A', // Keep same as light for dark containers
    // Text colors - light text for dark backgrounds
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#64748B',
    border: '#475569',
    success: '#10B981',
    successLight: '#064E3B',
    warning: '#F59E0B',
    warningLight: '#78350F',
    danger: '#EF4444',
    dangerLight: '#7F1D1D',
    info: '#3B82F6',
    infoLight: '#1E3A8A',
    purple: '#A78BFA',
    purpleLight: '#4C1D95',
    cardBg: '#1E293B',
    statusBar: 'light' as 'dark' | 'light',
};

export type Theme = typeof lightTheme;
