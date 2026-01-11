// Reconciliation Screen - Daily closing accounts (works offline)
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useShop } from '../store/ShopContext';
import { SaleStatus, PaymentMethod, UserRole } from '../types';
import { formatCurrency } from '../utils';
import { Calculator, Wallet, CreditCard, Banknote, CheckCircle } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const ReconciliationScreen: React.FC = () => {
    const { currentUser, sales, posFloats, posTransactions, syncNow, isLoading } = useShop();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.saleDate === today && s.status === SaleStatus.COMPLETED);
    const activeFloat = posFloats.find(f => f.date === today);

    const summaries = useMemo(() => {
        const cashSales = todaySales.filter(s => s.paymentMethod === PaymentMethod.CASH);
        const transferSales = todaySales.filter(s => s.paymentMethod === PaymentMethod.BANK_TRANSFER);
        const cardSales = todaySales.filter(s => s.paymentMethod === PaymentMethod.CARD);

        const cashTotal = cashSales.reduce((acc, s) => acc + s.totalAmount, 0);
        const transferTotal = transferSales.reduce((acc, s) => acc + s.totalAmount, 0);
        const cardTotal = cardSales.reduce((acc, s) => acc + s.totalAmount, 0);
        const totalRevenue = cashTotal + transferTotal + cardTotal;
        const totalProfit = todaySales.reduce((acc, s) => acc + s.profitAmount, 0);

        const posProfit = activeFloat?.totalChargesEarned || 0;

        return {
            cashTotal, transferTotal, cardTotal, totalRevenue, totalProfit, posProfit,
            cashCount: cashSales.length,
            transferCount: transferSales.length,
            cardCount: cardSales.length,
        };
    }, [todaySales, activeFloat]);

    if (!isAdmin) {
        return (
            <View style={styles.container}>
                <SyncIndicator />
                <View style={styles.accessDenied}>
                    <Calculator color="#CBD5E1" size={64} />
                    <Text style={styles.accessDeniedText}>Admin Access Required</Text>
                    <Text style={styles.accessDeniedSubtext}>Reconciliation is only available to administrators</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reconciliation</Text>
                <Text style={styles.headerSubtitle}>Daily closing accounts</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} />}
            >
                {/* Today's Summary Card */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Today's Summary</Text>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#ECFDF5' }]}>
                                <Wallet color="#059669" size={20} />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Cash Sales</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(summaries.cashTotal)}</Text>
                                <Text style={styles.summaryCount}>{summaries.cashCount} transactions</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#EEF2FF' }]}>
                                <CreditCard color="#4F46E5" size={20} />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Card Sales</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(summaries.cardTotal)}</Text>
                                <Text style={styles.summaryCount}>{summaries.cardCount} transactions</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: '#EFF6FF' }]}>
                                <CheckCircle color="#2563EB" size={20} />
                            </View>
                            <View>
                                <Text style={styles.summaryLabel}>Bank Transfer</Text>
                                <Text style={styles.summaryValue}>{formatCurrency(summaries.transferTotal)}</Text>
                                <Text style={styles.summaryCount}>{summaries.transferCount} transactions</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Totals */}
                <View style={styles.totalsCard}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Revenue</Text>
                        <Text style={styles.totalValue}>{formatCurrency(summaries.totalRevenue)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Shop Profit</Text>
                        <Text style={[styles.totalValue, { color: '#059669' }]}>{formatCurrency(summaries.totalProfit)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>POS Service Profit</Text>
                        <Text style={[styles.totalValue, { color: '#7C3AED' }]}>{formatCurrency(summaries.posProfit)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotal]}>
                        <Text style={styles.grandTotalLabel}>Combined Profit</Text>
                        <Text style={styles.grandTotalValue}>{formatCurrency(summaries.totalProfit + summaries.posProfit)}</Text>
                    </View>
                </View>

                {/* POS Float Status */}
                {activeFloat && (
                    <View style={styles.floatCard}>
                        <View style={styles.floatHeader}>
                            <Banknote color="#fff" size={24} />
                            <Text style={styles.floatTitle}>POS Float Status</Text>
                        </View>
                        <View style={styles.floatRow}>
                            <Text style={styles.floatLabel}>Opening Balance</Text>
                            <Text style={styles.floatValue}>{formatCurrency(activeFloat.openingBalance)}</Text>
                        </View>
                        <View style={styles.floatRow}>
                            <Text style={styles.floatLabel}>Current Balance</Text>
                            <Text style={styles.floatValue}>{formatCurrency(activeFloat.currentBalance)}</Text>
                        </View>
                        <View style={styles.floatRow}>
                            <Text style={styles.floatLabel}>Today's Earnings</Text>
                            <Text style={[styles.floatValue, { color: '#6EE7B7' }]}>{formatCurrency(activeFloat.totalChargesEarned)}</Text>
                        </View>
                    </View>
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
    content: { flex: 1, paddingHorizontal: 20 },
    summaryCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
    summaryTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
    summaryRow: { marginBottom: 16 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    summaryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    summaryLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    summaryValue: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 2 },
    summaryCount: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
    totalsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    totalLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
    totalValue: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
    grandTotal: { borderBottomWidth: 0, marginTop: 8, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#E2E8F0' },
    grandTotalLabel: { fontSize: 14, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 },
    grandTotalValue: { fontSize: 24, fontWeight: '800', color: '#4F46E5' },
    floatCard: { backgroundColor: '#1E1B4B', borderRadius: 24, padding: 24, marginBottom: 16 },
    floatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    floatTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
    floatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    floatLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    floatValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
    accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    accessDeniedText: { fontSize: 18, fontWeight: '800', color: '#64748B', marginTop: 24 },
    accessDeniedSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
});

export default ReconciliationScreen;
