// Settings Screen with Theme Toggle
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { Sun, Moon, Smartphone, LogOut, User, Shield, Palette } from 'lucide-react-native';
import { UserRole } from '../types';
import SyncIndicator from '../components/SyncIndicator';

const SettingsScreen: React.FC = () => {
    const { currentUser, logout, appState } = useShop();
    const { theme, themeMode, setThemeMode, isDark } = useTheme();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const themeOptions = [
        { mode: 'light' as const, label: 'Light', icon: Sun },
        { mode: 'dark' as const, label: 'Dark', icon: Moon },
        { mode: 'system' as const, label: 'System', icon: Smartphone },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* User Profile Card */}
                <View style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.userAvatar, { backgroundColor: theme.primaryLight }]}>
                        <Text style={[styles.userInitial, { color: theme.primary }]}>
                            {currentUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: theme.text }]}>{currentUser?.fullName}</Text>
                        <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{currentUser?.email}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: isAdmin ? theme.primaryLight : theme.successLight }]}>
                            {isAdmin ? <Shield color={theme.primary} size={12} /> : <User color={theme.success} size={12} />}
                            <Text style={[styles.roleText, { color: isAdmin ? theme.primary : theme.success }]}>
                                {currentUser?.role?.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Theme Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Palette color={theme.textMuted} size={18} />
                        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Theme</Text>
                    </View>

                    <View style={[styles.themeSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {themeOptions.map(opt => {
                            const Icon = opt.icon;
                            const isSelected = themeMode === opt.mode;
                            return (
                                <TouchableOpacity
                                    key={opt.mode}
                                    style={[
                                        styles.themeOption,
                                        isSelected && { backgroundColor: theme.primary }
                                    ]}
                                    onPress={() => setThemeMode(opt.mode)}
                                >
                                    <Icon color={isSelected ? '#fff' : theme.textSecondary} size={20} />
                                    <Text style={[styles.themeLabel, { color: isSelected ? '#fff' : theme.textSecondary }]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <Text style={[styles.themeHint, { color: theme.textMuted }]}>
                        {themeMode === 'system'
                            ? `Following system preference (currently ${isDark ? 'dark' : 'light'})`
                            : `${themeMode.charAt(0).toUpperCase() + themeMode.slice(1)} mode enabled`}
                    </Text>
                </View>

                {/* Sync Status */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Sync Status</Text>
                    <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.statusRow}>
                            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Status</Text>
                            <Text style={[styles.statusValue, { color: theme.text }]}>{appState.syncStatus}</Text>
                        </View>
                        <View style={styles.statusRow}>
                            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Pending Changes</Text>
                            <Text style={[styles.statusValue, { color: appState.pendingSyncCount > 0 ? theme.warning : theme.success }]}>
                                {appState.pendingSyncCount}
                            </Text>
                        </View>
                        <View style={styles.statusRow}>
                            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Connection</Text>
                            <Text style={[styles.statusValue, { color: appState.isOnline ? theme.success : theme.danger }]}>
                                {appState.isOnline ? 'Online' : 'Offline'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.dangerLight }]} onPress={logout}>
                    <LogOut color={theme.danger} size={20} />
                    <Text style={[styles.logoutText, { color: theme.danger }]}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    content: { flex: 1, paddingHorizontal: 20 },
    userCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 24 },
    userAvatar: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    userInitial: { fontSize: 24, fontWeight: '800' },
    userInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: '800' },
    userEmail: { fontSize: 14, marginTop: 4 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    roleText: { fontSize: 10, fontWeight: '800' },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    themeSelector: { flexDirection: 'row', padding: 6, borderRadius: 20, borderWidth: 1, marginBottom: 8 },
    themeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16 },
    themeLabel: { fontSize: 12, fontWeight: '700' },
    themeHint: { fontSize: 12, textAlign: 'center' },
    statusCard: { padding: 16, borderRadius: 16, borderWidth: 1 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    statusLabel: { fontSize: 14 },
    statusValue: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, marginTop: 16 },
    logoutText: { fontSize: 14, fontWeight: '800' },
});

export default SettingsScreen;
