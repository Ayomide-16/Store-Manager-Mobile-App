// Sales History Screen - View all sales (works offline)
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useShop } from '../store/ShopContext';
import { SaleStatus, UserRole } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils';
import { Receipt, CheckCircle, XCircle, RotateCcw } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const SalesHistoryScreen: React.FC = () => {
    const { currentUser, sales, syncNow, isLoading } = useShop();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    // Filter sales for salesperson (only their own) or all for admin
    const filteredSales = useMemo(() => {
        if (isAdmin) return sales;
        return sales.filter(s => s.createdBy === currentUser?.id);
    }, [sales, currentUser, isAdmin]);

    const getStatusConfig = (status: SaleStatus) => {
        switch (status) {
            case SaleStatus.COMPLETED:
                return { icon: CheckCircle, color: '#059669', bg: '#ECFDF5', label: 'Completed' };
            case SaleStatus.RETURNED:
                return { icon: RotateCcw, color: '#D97706', bg: '#FFFBEB', label: 'Returned' };
            case SaleStatus.CANCELED:
                return { icon: XCircle, color: '#DC2626', bg: '#FEF2F2', label: 'Canceled' };
            default:
                return { icon: Receipt, color: '#64748B', bg: '#F1F5F9', label: 'Unknown' };
        }
    };

    return (
        <View style={styles.container}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sales History</Text>
                <Text style={styles.headerSubtitle}>
                    {filteredSales.length} transactions
                </Text>
            </View>

            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} />}
            >
                {filteredSales.map(sale => {
                    const config = getStatusConfig(sale.status);
                    const Icon = config.icon;

                    return (
                        <View key={sale.id} style={styles.saleCard}>
                            <View style={styles.saleHeader}>
                                <View style={styles.saleInfo}>
                                    <Text style={styles.saleNumber}>{sale.saleNumber}</Text>
                                    <Text style={styles.saleDate}>
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

                            <View style={styles.saleMeta}>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Payment</Text>
                                    <Text style={styles.metaValue}>{sale.paymentMethod.replace('_', ' ')}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <Text style={styles.metaLabel}>Profit</Text>
                                    <Text style={[styles.metaValue, { color: '#059669' }]}>
                                        {formatCurrency(sale.profitAmount)}
                                    </Text>
                                </View>
                                <View style={styles.metaItemTotal}>
                                    <Text style={styles.metaLabel}>Total</Text>
                                    <Text style={styles.totalAmount}>{formatCurrency(sale.totalAmount)}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {filteredSales.length === 0 && (
                    <View style={styles.emptyState}>
                        <Receipt color="#CBD5E1" size={48} />
                        <Text style={styles.emptyStateText}>No sales recorded</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 2,
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    saleCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    saleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    saleInfo: {
        flex: 1,
    },
    saleNumber: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    saleDate: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    saleMeta: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
    },
    metaItem: {
        flex: 1,
    },
    metaItemTotal: {
        flex: 1,
        alignItems: 'flex-end',
    },
    metaLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    metaValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#0F172A',
        textTransform: 'capitalize',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#94A3B8',
        marginTop: 16,
    },
});

export default SalesHistoryScreen;
