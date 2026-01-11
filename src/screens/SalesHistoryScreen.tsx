// Sales History Screen with Role-Based Access Control
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { SaleStatus, UserRole } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils';
import { Receipt, CheckCircle, XCircle, RotateCcw, Search, Calendar, Lock } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const SalesHistoryScreen: React.FC = () => {
    const { currentUser, sales, syncNow, isLoading } = useShop();
    const { theme } = useTheme();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>(isAdmin ? 'all' : 'today');

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Role-based filtering:
    // - Admin: Can view all sales, any date range
    // - Salesperson: Only their own sales from TODAY
    const filteredSales = useMemo(() => {
        let result = sales;

        // Salesperson: Only their own sales
        if (!isAdmin) {
            result = result.filter(s => s.createdBy === currentUser?.id);
            // Salesperson: Today only
            result = result.filter(s => s.saleDate === today);
        } else {
            // Admin: Apply date filter
            switch (dateFilter) {
                case 'today':
                    result = result.filter(s => s.saleDate === today);
                    break;
                case 'week':
                    result = result.filter(s => s.saleDate >= weekAgo);
                    break;
                case 'month':
                    result = result.filter(s => s.saleDate >= monthAgo);
                    break;
                // 'all' shows everything
            }
        }

        // Apply search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.saleNumber.toLowerCase().includes(search) ||
                s.paymentMethod.toLowerCase().includes(search)
            );
        }

        return result;
    }, [sales, currentUser, isAdmin, dateFilter, searchTerm, today, weekAgo, monthAgo]);

    const getStatusConfig = (status: SaleStatus) => {
        switch (status) {
            case SaleStatus.COMPLETED:
                return { icon: CheckCircle, color: theme.success, bg: theme.successLight, label: 'Completed' };
            case SaleStatus.RETURNED:
                return { icon: RotateCcw, color: theme.warning, bg: theme.warningLight, label: 'Returned' };
            case SaleStatus.CANCELED:
                return { icon: XCircle, color: theme.danger, bg: theme.dangerLight, label: 'Canceled' };
            default:
                return { icon: Receipt, color: theme.textMuted, bg: theme.surfaceAlt, label: 'Unknown' };
        }
    };

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalProfit = filteredSales.reduce((acc, s) => acc + s.profitAmount, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Sales History</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    {filteredSales.length} transactions
                    {!isAdmin && ' (Today only)'}
                </Text>
            </View>

            {/* Salesperson Restriction Notice */}
            {!isAdmin && (
                <View style={[styles.restrictionBanner, { backgroundColor: theme.warningLight }]}>
                    <Lock color={theme.warning} size={16} />
                    <Text style={[styles.restrictionText, { color: theme.warning }]}>
                        You can only view your own sales from today
                    </Text>
                </View>
            )}

            {/* Search (Admin only) */}
            {isAdmin && (
                <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Search color={theme.textMuted} size={20} />
                    <TextInput
                        style={[styles.searchInput, { color: theme.text }]}
                        placeholder="Search sales..."
                        placeholderTextColor={theme.textMuted}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            )}

            {/* Date Filter (Admin only) */}
            {isAdmin && (
                <View style={styles.filterRow}>
                    {(['today', 'week', 'month', 'all'] as const).map(filter => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterChip,
                                { backgroundColor: dateFilter === filter ? theme.primary : theme.surfaceAlt }
                            ]}
                            onPress={() => setDateFilter(filter)}
                        >
                            <Text style={[
                                styles.filterChipText,
                                { color: dateFilter === filter ? '#fff' : theme.textSecondary }
                            ]}>
                                {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Revenue</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(totalRevenue)}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Profit</Text>
                    <Text style={[styles.summaryValue, { color: theme.success }]}>{formatCurrency(totalProfit)}</Text>
                </View>
            </View>

            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} tintColor={theme.primary} />}
            >
                {filteredSales.map(sale => {
                    const config = getStatusConfig(sale.status);
                    const Icon = config.icon;

                    return (
                        <View key={sale.id} style={[styles.saleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={styles.saleHeader}>
                                <View style={styles.saleInfo}>
                                    <Text style={[styles.saleNumber, { color: theme.text }]}>{sale.saleNumber}</Text>
                                    <Text style={[styles.saleDate, { color: theme.textSecondary }]}>
                                        {formatDate(sale.saleDate)} • {formatTime(sale.createdAt)}
                                    </Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                                    <Icon color={config.color} size={12} />
                                    <Text style={[styles.statusText, { color: config.color }]}>
                                        {config.label}
                                    </Text>
                                </View>
                            </View>

                            <View style={[styles.saleMeta, { borderTopColor: theme.border }]}>
                                <View style={styles.metaItem}>
                                    <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Payment</Text>
                                    <Text style={[styles.metaValue, { color: theme.text }]}>{sale.paymentMethod.replace('_', ' ')}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Profit</Text>
                                    <Text style={[styles.metaValue, { color: theme.success }]}>
                                        {formatCurrency(sale.profitAmount)}
                                    </Text>
                                </View>
                                <View style={styles.metaItemTotal}>
                                    <Text style={[styles.metaLabel, { color: theme.textMuted }]}>Total</Text>
                                    <Text style={[styles.totalAmount, { color: theme.text }]}>{formatCurrency(sale.totalAmount)}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {filteredSales.length === 0 && (
                    <View style={styles.emptyState}>
                        <Receipt color={theme.textMuted} size={48} />
                        <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                            {!isAdmin ? 'No sales recorded by you today' : 'No sales found'}
                        </Text>
                    </View>
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
    restrictionBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, padding: 12, borderRadius: 12, marginBottom: 16 },
    restrictionText: { fontSize: 12, fontWeight: '600' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, marginBottom: 16 },
    searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, fontWeight: '500' },
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    filterChipText: { fontSize: 12, fontWeight: '700' },
    summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
    summaryCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1 },
    summaryLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    summaryValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
    list: { flex: 1, paddingHorizontal: 20 },
    saleCard: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
    saleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    saleInfo: { flex: 1 },
    saleNumber: { fontSize: 16, fontWeight: '800' },
    saleDate: { fontSize: 12, marginTop: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    saleMeta: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12 },
    metaItem: { flex: 1 },
    metaItemTotal: { flex: 1, alignItems: 'flex-end' },
    metaLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    metaValue: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    totalAmount: { fontSize: 18, fontWeight: '800' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyStateText: { fontSize: 14, fontWeight: '600', marginTop: 16, textAlign: 'center' },
});

export default SalesHistoryScreen;
