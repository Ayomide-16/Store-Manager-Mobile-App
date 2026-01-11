// Dashboard Screen with SafeAreaView and Theme support
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { SaleStatus, UserRole } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils';
import {
    TrendingUp, ShoppingBag, AlertTriangle, Wallet,
    ShoppingCart, Banknote
} from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

interface DashboardProps {
    navigation: any;
}

const DashboardScreen: React.FC<DashboardProps> = ({ navigation }) => {
    const { currentUser, sales, items, posFloats, syncNow, isLoading } = useShop();
    const { theme } = useTheme();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.saleDate === today && s.status === SaleStatus.COMPLETED);
    const activeFloat = posFloats.find(f => f.date === today && f.status === 'active');
    const posProfitToday = activeFloat?.totalChargesEarned || 0;

    const totalRevenue = todaySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const lowStockItems = items.filter(i => i.quantityInStock <= i.reorderLevel);

    const posHealth = useMemo(() => {
        if (!activeFloat) return { label: 'Not Started', color: theme.textMuted, bg: theme.surfaceAlt };
        if (activeFloat.currentBalance <= 0) return { label: 'Depleted', color: theme.danger, bg: theme.dangerLight };
        if (activeFloat.currentBalance < 10000) return { label: 'Low', color: theme.warning, bg: theme.warningLight };
        return { label: 'Healthy', color: theme.success, bg: theme.successLight };
    }, [activeFloat, theme]);

    const stats = [
        { label: "Today's Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: theme.primary, bg: theme.primaryLight },
        { label: 'Transactions', value: todaySales.length.toString(), icon: ShoppingBag, color: theme.info, bg: theme.infoLight },
        { label: 'Stock Alerts', value: lowStockItems.length.toString(), icon: AlertTriangle, color: theme.danger, bg: theme.dangerLight, isAlert: lowStockItems.length > 0 },
        { label: 'POS Profit', value: formatCurrency(posProfitToday), icon: Wallet, color: theme.purple, bg: theme.purpleLight },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={syncNow} tintColor={theme.primary} />
                }
            >
                <SyncIndicator />

                {/* Welcome Header */}
                <View style={styles.welcomeSection}>
                    <Text style={[styles.welcomeTitle, { color: theme.text }]}>
                        Welcome, {currentUser?.fullName}!
                    </Text>
                    <Text style={[styles.welcomeSubtitle, { color: theme.textSecondary }]}>
                        Shop status for {formatDate(new Date().toISOString())}
                    </Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate('Sales')}
                    >
                        <ShoppingCart color="#fff" size={18} />
                        <Text style={styles.primaryButtonText}>New Sale</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.secondaryButton, { backgroundColor: theme.secondary }]}
                        onPress={() => navigation.navigate('More', { screen: 'SettingsStack' })}
                    >
                        <Banknote color="#fff" size={18} />
                        <Text style={styles.secondaryButtonText}>POS</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, idx) => (
                        <View key={idx} style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                                <stat.icon color={stat.color} size={20} />
                            </View>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
                            <Text style={[styles.statValue, { color: stat.isAlert ? theme.danger : theme.text }]}>
                                {stat.value}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* POS Status Card */}
                <View style={[styles.posCard, { backgroundColor: activeFloat ? '#1E1B4B' : theme.secondary }]}>
                    <Text style={styles.posTitle}>POS Status</Text>
                    <View style={styles.posRow}>
                        <Text style={styles.posLabel}>Cash in POS</Text>
                        <Text style={styles.posValue}>
                            {activeFloat ? formatCurrency(activeFloat.currentBalance) : 'OFFLINE'}
                        </Text>
                    </View>
                    <View style={styles.posRow}>
                        <Text style={styles.posLabel}>Today's Profit</Text>
                        <Text style={[styles.posValue, { color: '#6EE7B7' }]}>
                            {formatCurrency(activeFloat?.totalChargesEarned || 0)}
                        </Text>
                    </View>
                    <View style={styles.posRow}>
                        <Text style={styles.posLabel}>Health</Text>
                        <View style={[styles.posBadge, { backgroundColor: posHealth.bg }]}>
                            <Text style={[styles.posBadgeText, { color: posHealth.color }]}>
                                {posHealth.label}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Recent Sales */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Sales</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('History')}>
                            <Text style={[styles.sectionLink, { color: theme.primary }]}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {todaySales.slice(0, 5).map(sale => (
                        <View key={sale.id} style={[styles.saleItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.saleInfo}>
                                <Text style={[styles.saleNumber, { color: theme.text }]}>{sale.saleNumber}</Text>
                                <Text style={[styles.saleTime, { color: theme.textSecondary }]}>{formatTime(sale.createdAt)}</Text>
                            </View>
                            <Text style={[styles.saleAmount, { color: theme.text }]}>{formatCurrency(sale.totalAmount)}</Text>
                        </View>
                    ))}

                    {todaySales.length === 0 && (
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No sales logged today</Text>
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    welcomeSection: { padding: 20, paddingTop: 10 },
    welcomeTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    welcomeSubtitle: { fontSize: 14, marginTop: 4 },
    quickActions: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
    primaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8, shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 16, gap: 8 },
    secondaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12 },
    statCard: { width: '47%', padding: 16, borderRadius: 20, borderWidth: 1 },
    statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '800' },
    posCard: { margin: 20, padding: 24, borderRadius: 32 },
    posTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 20 },
    posRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    posLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
    posValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
    posBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    posBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    section: { paddingHorizontal: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    sectionLink: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    saleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1 },
    saleInfo: { flex: 1 },
    saleNumber: { fontSize: 14, fontWeight: '800' },
    saleTime: { fontSize: 12, marginTop: 2 },
    saleAmount: { fontSize: 16, fontWeight: '800' },
    emptyText: { textAlign: 'center', fontSize: 14, fontWeight: '600', paddingVertical: 40 },
});

export default DashboardScreen;
