// Dashboard Screen - matches web app design
import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useShop } from '../store/ShopContext';
import { SaleStatus, UserRole } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils';
import {
    TrendingUp, ShoppingBag, AlertTriangle, Wallet,
    ShoppingCart, Banknote, Clock, ChevronRight
} from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

interface DashboardProps {
    navigation: any;
}

const DashboardScreen: React.FC<DashboardProps> = ({ navigation }) => {
    const { currentUser, sales, items, posFloats, appState, syncNow, isLoading } = useShop();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.saleDate === today && s.status === SaleStatus.COMPLETED);
    const activeFloat = posFloats.find(f => f.date === today && f.status === 'active');
    const posProfitToday = activeFloat?.totalChargesEarned || 0;

    const totalRevenue = todaySales.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const lowStockItems = items.filter(i => i.quantityInStock <= i.reorderLevel);

    const posHealth = useMemo(() => {
        if (!activeFloat) return { label: 'Not Started', color: '#64748B', bg: '#F1F5F9' };
        if (activeFloat.currentBalance <= 0) return { label: 'Depleted', color: '#DC2626', bg: '#FEF2F2' };
        if (activeFloat.currentBalance < 10000) return { label: 'Low', color: '#D97706', bg: '#FFFBEB' };
        return { label: 'Healthy', color: '#059669', bg: '#ECFDF5' };
    }, [activeFloat]);

    const stats = [
        { label: "Today's Revenue", value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#4F46E5', bg: '#EEF2FF' },
        { label: 'Transactions', value: todaySales.length.toString(), icon: ShoppingBag, color: '#2563EB', bg: '#EFF6FF' },
        { label: 'Stock Alerts', value: lowStockItems.length.toString(), icon: AlertTriangle, color: '#DC2626', bg: '#FEF2F2', isAlert: lowStockItems.length > 0 },
        { label: 'POS Profit', value: formatCurrency(posProfitToday), icon: Wallet, color: '#7C3AED', bg: '#F5F3FF' },
    ];

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={syncNow} />
            }
        >
            {/* Sync Indicator */}
            <SyncIndicator />

            {/* Welcome Header */}
            <View style={styles.welcomeSection}>
                <View>
                    <Text style={styles.welcomeTitle}>Welcome, {currentUser?.fullName}!</Text>
                    <Text style={styles.welcomeSubtitle}>Shop status for {formatDate(new Date().toISOString())}</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('SalesCalculator')}
                >
                    <ShoppingCart color="#fff" size={18} />
                    <Text style={styles.primaryButtonText}>New Sale</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => navigation.navigate('POSWithdrawals')}
                >
                    <Banknote color="#fff" size={18} />
                    <Text style={styles.secondaryButtonText}>POS</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                {stats.map((stat, idx) => (
                    <View key={idx} style={styles.statCard}>
                        <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                            <stat.icon color={stat.color} size={20} />
                        </View>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                        <Text style={[styles.statValue, stat.isAlert && styles.alertValue]}>
                            {stat.value}
                        </Text>
                    </View>
                ))}
            </View>

            {/* POS Status Card */}
            <View style={[styles.posCard, { backgroundColor: activeFloat ? '#1E1B4B' : '#0F172A' }]}>
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
                <TouchableOpacity
                    style={styles.posButton}
                    onPress={() => navigation.navigate('POSWithdrawals')}
                >
                    <Text style={styles.posButtonText}>
                        {activeFloat ? 'Manage Float' : 'Start Service'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Recent Sales */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Sales</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SalesHistory')}>
                        <Text style={styles.sectionLink}>View All</Text>
                    </TouchableOpacity>
                </View>

                {todaySales.slice(0, 5).map(sale => (
                    <View key={sale.id} style={styles.saleItem}>
                        <View style={styles.saleInfo}>
                            <Text style={styles.saleNumber}>{sale.saleNumber}</Text>
                            <Text style={styles.saleTime}>{formatTime(sale.createdAt)}</Text>
                        </View>
                        <Text style={styles.saleAmount}>{formatCurrency(sale.totalAmount)}</Text>
                    </View>
                ))}

                {todaySales.length === 0 && (
                    <Text style={styles.emptyText}>No sales logged today</Text>
                )}
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    welcomeSection: {
        padding: 20,
        paddingTop: 10,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    welcomeSubtitle: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    quickActions: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        paddingVertical: 14,
        borderRadius: 16,
        gap: 8,
    },
    secondaryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 14,
        gap: 12,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    alertValue: {
        color: '#DC2626',
    },
    posCard: {
        margin: 20,
        padding: 24,
        borderRadius: 32,
    },
    posTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 20,
    },
    posRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    posLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    posValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    posBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    posBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    posButton: {
        backgroundColor: '#fff',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    posButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    section: {
        paddingHorizontal: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    sectionLink: {
        fontSize: 12,
        fontWeight: '800',
        color: '#4F46E5',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    saleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    saleInfo: {
        flex: 1,
    },
    saleNumber: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    saleTime: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    saleAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
        paddingVertical: 40,
    },
});

export default DashboardScreen;
