// Reconciliation Screen with SafeAreaView and Dark Theme Support
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { SaleStatus, PaymentMethod, UserRole } from '../types';
import { formatCurrency } from '../utils';
import { Calculator, Wallet, CreditCard, Banknote, CheckCircle } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const ReconciliationScreen: React.FC = () => {
    const { currentUser, sales, posFloats, posTransactions, syncNow, isLoading } = useShop();
    const { theme } = useTheme();
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
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <SyncIndicator />
                <View style={styles.accessDenied}>
                    <Calculator color={theme.textMuted} size={64} />
                    <Text style={[styles.accessDeniedText, { color: theme.textSecondary }]}>Admin Access Required</Text>
                    <Text style={[styles.accessDeniedSubtext, { color: theme.textMuted }]}>Reconciliation is only available to administrators</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Reconciliation</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Daily closing accounts</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} tintColor={theme.primary} />}
            >
                {/* Today's Summary Card */}
                <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.summaryTitle, { color: theme.text }]}>Today's Summary</Text>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: theme.successLight }]}>
                                <Wallet color={theme.success} size={20} />
                            </View>
                            <View>
                                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Cash Sales</Text>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(summaries.cashTotal)}</Text>
                                <Text style={[styles.summaryCount, { color: theme.textMuted }]}>{summaries.cashCount} transactions</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: theme.primaryLight }]}>
                                <CreditCard color={theme.primary} size={20} />
                            </View>
                            <View>
                                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Card Sales</Text>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(summaries.cardTotal)}</Text>
                                <Text style={[styles.summaryCount, { color: theme.textMuted }]}>{summaries.cardCount} transactions</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <View style={[styles.summaryIcon, { backgroundColor: theme.infoLight }]}>
                                <CheckCircle color={theme.info} size={20} />
                            </View>
                            <View>
                                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Bank Transfer</Text>
                                <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(summaries.transferTotal)}</Text>
                                <Text style={[styles.summaryCount, { color: theme.textMuted }]}>{summaries.transferCount} transactions</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Totals */}
                <View style={[styles.totalsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={[styles.totalRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total Revenue</Text>
                        <Text style={[styles.totalValue, { color: theme.text }]}>{formatCurrency(summaries.totalRevenue)}</Text>
                    </View>
                    <View style={[styles.totalRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Shop Profit</Text>
                        <Text style={[styles.totalValue, { color: theme.success }]}>{formatCurrency(summaries.totalProfit)}</Text>
                    </View>
                    <View style={[styles.totalRow, { borderBottomColor: theme.border }]}>
                        <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>POS Service Profit</Text>
                        <Text style={[styles.totalValue, { color: theme.purple }]}>{formatCurrency(summaries.posProfit)}</Text>
                    </View>
                    <View style={[styles.totalRow, styles.grandTotal, { borderTopColor: theme.border }]}>
                        <Text style={[styles.grandTotalLabel, { color: theme.text }]}>Combined Profit</Text>
                        <Text style={[styles.grandTotalValue, { color: theme.primary }]}>{formatCurrency(summaries.totalProfit + summaries.posProfit)}</Text>
                    </View>
                </View>

                {/* POS Float Status */}
                {activeFloat && (
                    <View style={[styles.floatCard, { backgroundColor: theme.secondary }]}>
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSubtitle: { fontSize: 14, marginTop: 2 },
    content: { flex: 1, paddingHorizontal: 20 },
    summaryCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 16 },
    summaryTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
    summaryRow: { marginBottom: 16 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    summaryIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    summaryLabel: { fontSize: 12, fontWeight: '700' },
    summaryValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
    summaryCount: { fontSize: 11, marginTop: 2 },
    totalsCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 16 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    totalLabel: { fontSize: 14, fontWeight: '600' },
    totalValue: { fontSize: 18, fontWeight: '800' },
    grandTotal: { borderBottomWidth: 0, marginTop: 8, paddingTop: 16, borderTopWidth: 2 },
    grandTotalLabel: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    grandTotalValue: { fontSize: 24, fontWeight: '800' },
    floatCard: { borderRadius: 24, padding: 24, marginBottom: 16 },
    floatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    floatTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
    floatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    floatLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    floatValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
    accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    accessDeniedText: { fontSize: 18, fontWeight: '800', marginTop: 24 },
    accessDeniedSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});

export default ReconciliationScreen;
