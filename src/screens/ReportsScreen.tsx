// Reports Screen - View sales and inventory reports (works offline)
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useShop } from '../store/ShopContext';
import { SaleStatus, UserRole } from '../types';
import { formatCurrency, formatDate } from '../utils';
import { BarChart3, TrendingUp, Package, DollarSign, Calendar } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const ReportsScreen: React.FC = () => {
    const { currentUser, sales, items, syncNow, isLoading } = useShop();
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
            <View style={styles.container}>
                <SyncIndicator />
                <View style={styles.accessDenied}>
                    <BarChart3 color="#CBD5E1" size={64} />
                    <Text style={styles.accessDeniedText}>Admin Access Required</Text>
                    <Text style={styles.accessDeniedSubtext}>Reports are only available to administrators</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reports</Text>
                <Text style={styles.headerSubtitle}>Sales and inventory analytics</Text>
            </View>

            {/* Period Filter */}
            <View style={styles.periodFilter}>
                {(['today', 'week', 'month', 'all'] as const).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodChip, period === p && styles.periodChipActive]}
                        onPress={() => setPeriod(p)}
                    >
                        <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>
                            {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} />}
            >
                {/* Revenue Stats */}
                <View style={styles.statsCard}>
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
                                <TrendingUp color="#4F46E5" size={20} />
                            </View>
                            <Text style={styles.statLabel}>Revenue</Text>
                            <Text style={styles.statValue}>{formatCurrency(stats.revenue)}</Text>
                        </View>
                        <View style={styles.stat}>
                            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                                <DollarSign color="#059669" size={20} />
                            </View>
                            <Text style={styles.statLabel}>Profit</Text>
                            <Text style={[styles.statValue, { color: '#059669' }]}>{formatCurrency(stats.profit)}</Text>
                        </View>
                    </View>
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                                <BarChart3 color="#2563EB" size={20} />
                            </View>
                            <Text style={styles.statLabel}>Transactions</Text>
                            <Text style={styles.statValue}>{stats.count}</Text>
                        </View>
                        <View style={styles.stat}>
                            <View style={[styles.statIcon, { backgroundColor: '#FDF4FF' }]}>
                                <Calendar color="#9333EA" size={20} />
                            </View>
                            <Text style={styles.statLabel}>Avg Sale</Text>
                            <Text style={styles.statValue}>{formatCurrency(stats.avgSale)}</Text>
                        </View>
                    </View>
                </View>

                {/* Inventory Health */}
                <Text style={styles.sectionTitle}>Inventory Health</Text>
                <View style={styles.inventoryStats}>
                    <View style={[styles.inventoryCard, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={styles.inventoryCount}>{outOfStockItems.length}</Text>
                        <Text style={styles.inventoryLabel}>Out of Stock</Text>
                    </View>
                    <View style={[styles.inventoryCard, { backgroundColor: '#FFFBEB' }]}>
                        <Text style={styles.inventoryCount}>{lowStockItems.length}</Text>
                        <Text style={styles.inventoryLabel}>Low Stock</Text>
                    </View>
                    <View style={[styles.inventoryCard, { backgroundColor: '#ECFDF5' }]}>
                        <Text style={styles.inventoryCount}>{items.length}</Text>
                        <Text style={styles.inventoryLabel}>Total Items</Text>
                    </View>
                </View>

                {/* Low Stock Items */}
                {lowStockItems.length > 0 && (
                    <>
                        <Text style={styles.sectionTitle}>Low Stock Items</Text>
                        {lowStockItems.slice(0, 5).map(item => (
                            <View key={item.id} style={styles.lowStockItem}>
                                <Package color="#D97706" size={18} />
                                <View style={styles.lowStockInfo}>
                                    <Text style={styles.lowStockName}>{item.name}</Text>
                                    <Text style={styles.lowStockMeta}>
                                        {item.quantityInStock} {item.unit} remaining
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
    headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
    periodFilter: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    periodChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9' },
    periodChipActive: { backgroundColor: '#4F46E5' },
    periodChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    periodChipTextActive: { color: '#fff' },
    content: { flex: 1, paddingHorizontal: 20 },
    statsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
    statRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
    stat: { flex: 1 },
    statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
    inventoryStats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    inventoryCard: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
    inventoryCount: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
    inventoryLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginTop: 4 },
    lowStockItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    lowStockInfo: { flex: 1 },
    lowStockName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    lowStockMeta: { fontSize: 12, color: '#D97706', marginTop: 2 },
    accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    accessDeniedText: { fontSize: 18, fontWeight: '800', color: '#64748B', marginTop: 24 },
    accessDeniedSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
});

export default ReportsScreen;
