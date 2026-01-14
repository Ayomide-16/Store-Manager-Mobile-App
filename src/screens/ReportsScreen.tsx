// Reports Screen with SafeAreaView and Dark Theme Support
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { SaleStatus, UserRole } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { BarChart3, TrendingUp, Package, DollarSign, Calendar } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const ReportsScreen: React.FC = () => {
    const { currentUser, sales, items, syncNow, isLoading } = useShop();
    const { theme } = useTheme();
    const isAdmin = currentUser?.role === UserRole.ADMIN;
    const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filteredSales = useMemo(() => {
        const completed = sales.filter(s => s.status === SaleStatus.COMPLETED);
        switch (period) {
            case 'today':
                return completed.filter(s => s.saleDate === today);
            case 'week':
                return completed.filter(s => s.saleDate >= weekAgo);
            case 'month':
                return completed.filter(s => s.saleDate >= monthAgo);
            default:
                return completed;
        }
    }, [sales, period, today, weekAgo, monthAgo]);

    const stats = useMemo(() => {
        const revenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
        const profit = filteredSales.reduce((acc, s) => acc + s.profitAmount, 0);
        const count = filteredSales.length;
        const avgSale = count > 0 ? revenue / count : 0;

        return { revenue, profit, count, avgSale };
    }, [filteredSales]);

    const lowStockItems = items.filter(i => i.quantityInStock <= i.reorderLevel);
    const outOfStockItems = items.filter(i => i.quantityInStock <= 0);

    if (!isAdmin) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <SyncIndicator />
                <View style={styles.accessDenied}>
                    <BarChart3 color={theme.textMuted} size={64} />
                    <Text style={[styles.accessDeniedText, { color: theme.textSecondary }]}>Admin Access Required</Text>
                    <Text style={[styles.accessDeniedSubtext, { color: theme.textMuted }]}>Reports are only available to administrators</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Reports</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Sales and inventory analytics</Text>
            </View>

            {/* Period Filter */}
            <View style={styles.periodFilter}>
                {(['today', 'week', 'month', 'all'] as const).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodChip, { backgroundColor: period === p ? theme.primary : theme.surfaceAlt }]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodChipText, { color: period === p ? '#fff' : theme.textSecondary }]}>
                            {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} tintColor={theme.primary} />}
            >
                {/* Revenue Stats */}
                <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <View style={[styles.statIcon, { backgroundColor: theme.primaryLight }]}>
                                <TrendingUp color={theme.primary} size={20} />
                            </View>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Revenue</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(stats.revenue)}</Text>
                        </View>
                        <View style={styles.stat}>
                            <View style={[styles.statIcon, { backgroundColor: theme.successLight }]}>
                                <DollarSign color={theme.success} size={20} />
                            </View>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Profit</Text>
                            <Text style={[styles.statValue, { color: theme.success }]}>{formatCurrency(stats.profit)}</Text>
                        </View>
                    </View>
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <View style={[styles.statIcon, { backgroundColor: theme.infoLight }]}>
                                <BarChart3 color={theme.info} size={20} />
                            </View>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Transactions</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{stats.count}</Text>
                        </View>
                        <View style={styles.stat}>
                            <View style={[styles.statIcon, { backgroundColor: theme.purpleLight }]}>
                                <Calendar color={theme.purple} size={20} />
                            </View>
                            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Avg Sale</Text>
                            <Text style={[styles.statValue, { color: theme.text }]}>{formatCurrency(stats.avgSale)}</Text>
                        </View>
                    </View>
                </View>

                {/* Inventory Health */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Inventory Health</Text>
                <View style={styles.inventoryStats}>
                    <View style={[styles.inventoryCard, { backgroundColor: theme.dangerLight }]}>
                        <Text style={[styles.inventoryCount, { color: theme.text }]}>{outOfStockItems.length}</Text>
                        <Text style={[styles.inventoryLabel, { color: theme.textSecondary }]}>Out of Stock</Text>
                    </View>
                    <View style={[styles.inventoryCard, { backgroundColor: theme.warningLight }]}>
                        <Text style={[styles.inventoryCount, { color: theme.text }]}>{lowStockItems.length}</Text>
                        <Text style={[styles.inventoryLabel, { color: theme.textSecondary }]}>Low Stock</Text>
                    </View>
                    <View style={[styles.inventoryCard, { backgroundColor: theme.successLight }]}>
                        <Text style={[styles.inventoryCount, { color: theme.text }]}>{items.length}</Text>
                        <Text style={[styles.inventoryLabel, { color: theme.textSecondary }]}>Total Items</Text>
                    </View>
                </View>

                {/* Low Stock Items */}
                {lowStockItems.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Low Stock Items</Text>
                        {lowStockItems.slice(0, 5).map(item => (
                            <View key={item.id} style={[styles.lowStockItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Package color={theme.warning} size={18} />
                                <View style={styles.lowStockInfo}>
                                    <Text style={[styles.lowStockName, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={[styles.lowStockMeta, { color: theme.warning }]}>
                                        {item.quantityInStock} {item.unit} remaining
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSubtitle: { fontSize: 14, marginTop: 2 },
    periodFilter: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    periodChipText: { fontSize: 12, fontWeight: '700' },
    content: { flex: 1, paddingHorizontal: 20 },
    statsCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 24 },
    statRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    stat: { flex: 1 },
    statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '800' },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
    inventoryStats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    inventoryCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
    inventoryCount: { fontSize: 28, fontWeight: '800' },
    inventoryLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
    lowStockItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1 },
    lowStockInfo: { flex: 1 },
    lowStockName: { fontSize: 14, fontWeight: '700' },
    lowStockMeta: { fontSize: 12, marginTop: 2 },
    accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    accessDeniedText: { fontSize: 18, fontWeight: '800', marginTop: 24 },
    accessDeniedSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});

export default ReportsScreen;
