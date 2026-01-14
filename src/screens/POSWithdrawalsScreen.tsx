// POS Withdrawals Screen with SafeAreaView and Dark Theme Support
import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Modal, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { formatCurrency } from '../utils';
import {
    Banknote, Plus, X, CreditCard, CheckCircle, AlertTriangle, Wallet
} from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const DEFAULT_TIERS = [
    { min: 0, max: 5000, charge: 100 },
    { min: 5001, max: 10000, charge: 200 },
    { min: 10001, max: 20000, charge: 500 },
    { min: 20001, max: 50000, charge: 1000 },
    { min: 50001, max: 1000000, charge: 2000 },
];

const POSWithdrawalsScreen: React.FC = () => {
    const {
        posFloats, posTransactions, startPOSFloat, addPOSTransaction,
        syncNow, isLoading
    } = useShop();
    const { theme } = useTheme();

    const today = new Date().toISOString().split('T')[0];
    const activeFloat = posFloats.find(f => f.date === today && f.status === 'active');

    const [showStartModal, setShowStartModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [openingBalance, setOpeningBalance] = useState('');
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
    const [isProcessing, setIsProcessing] = useState(false);

    const serviceCharge = useMemo(() => {
        const amount = Number(withdrawalAmount) || 0;
        const tier = DEFAULT_TIERS.find(t => amount >= t.min && amount <= t.max);
        return tier?.charge || 0;
    }, [withdrawalAmount]);

    const todayTransactions = posTransactions.filter(t =>
        t.transactionDate.split('T')[0] === today
    );

    const handleStartFloat = async () => {
        const amount = Number(openingBalance);
        if (!amount || amount <= 0) {
            Alert.alert('Error', 'Enter a valid opening balance');
            return;
        }

        setIsProcessing(true);
        try {
            await startPOSFloat(amount);
            setShowStartModal(false);
            setOpeningBalance('');
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleWithdrawal = async () => {
        const amount = Number(withdrawalAmount);
        if (!amount || amount <= 0) {
            Alert.alert('Error', 'Enter a valid withdrawal amount');
            return;
        }

        setIsProcessing(true);
        try {
            await addPOSTransaction({
                withdrawalAmount: amount,
                serviceCharge,
                customerName: customerName || 'Walk-in',
                paymentMethod,
            });
            setShowWithdrawModal(false);
            setWithdrawalAmount('');
            setCustomerName('');
            Alert.alert('Success', 'Transaction completed!');
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const posHealth = useMemo(() => {
        if (!activeFloat) return { label: 'Not Started', color: theme.textMuted, bg: theme.surfaceAlt };
        if (activeFloat.currentBalance <= 0) return { label: 'Depleted', color: theme.danger, bg: theme.dangerLight };
        if (activeFloat.currentBalance < 10000) return { label: 'Low', color: theme.warning, bg: theme.warningLight };
        return { label: 'Healthy', color: theme.success, bg: theme.successLight };
    }, [activeFloat, theme]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>POS Withdrawals</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Cash withdrawal service</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} tintColor={theme.primary} />}
            >
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: theme.secondary }]}>
                    <View style={styles.statusHeader}>
                        <Banknote color="#fff" size={24} />
                        <View style={[styles.healthBadge, { backgroundColor: posHealth.bg }]}>
                            <Text style={[styles.healthText, { color: posHealth.color }]}>
                                {posHealth.label}
                            </Text>
                        </View>
                    </View>

                    {activeFloat ? (
                        <>
                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Cash Available</Text>
                                <Text style={styles.statusValue}>
                                    {formatCurrency(activeFloat.currentBalance)}
                                </Text>
                            </View>
                            <View style={styles.statusRow}>
                                <Text style={styles.statusLabel}>Today's Profit</Text>
                                <Text style={[styles.statusValue, { color: '#6EE7B7' }]}>
                                    {formatCurrency(activeFloat.totalChargesEarned)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.withdrawButton}
                                onPress={() => setShowWithdrawModal(true)}
                            >
                                <Plus color="#0F172A" size={18} />
                                <Text style={styles.withdrawButtonText}>New Withdrawal</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.noFloatText}>
                                No active float for today. Start the POS service to begin processing withdrawals.
                            </Text>
                            <TouchableOpacity
                                style={[styles.startButton, { backgroundColor: theme.primary }]}
                                onPress={() => setShowStartModal(true)}
                            >
                                <Text style={styles.startButtonText}>Start POS Service</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Today's Transactions */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Transactions</Text>

                {todayTransactions.map(tx => (
                    <View key={tx.id} style={[styles.txCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.txInfo}>
                            <Text style={[styles.txNumber, { color: theme.text }]}>{tx.transactionNumber}</Text>
                            <Text style={[styles.txCustomer, { color: theme.textSecondary }]}>{tx.customerName || 'Walk-in'}</Text>
                        </View>
                        <View style={styles.txMeta}>
                            <Text style={[styles.txAmount, { color: theme.text }]}>{formatCurrency(tx.withdrawalAmount)}</Text>
                            <Text style={[styles.txCharge, { color: theme.success }]}>+{formatCurrency(tx.serviceCharge)}</Text>
                        </View>
                    </View>
                ))}

                {todayTransactions.length === 0 && (
                    <View style={styles.emptyState}>
                        <Wallet color={theme.textMuted} size={48} />
                        <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>No transactions today</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Start Float Modal */}
            <Modal visible={showStartModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Start POS Float</Text>
                            <TouchableOpacity onPress={() => setShowStartModal(false)}>
                                <X color={theme.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Opening Balance (₦)</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                value={openingBalance}
                                onChangeText={setOpeningBalance}
                                keyboardType="numeric"
                                placeholder="e.g., 50000"
                                placeholderTextColor={theme.textMuted}
                            />
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.primary }, isProcessing && styles.saveButtonDisabled]}
                                onPress={handleStartFloat}
                                disabled={isProcessing}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isProcessing ? 'Starting...' : 'Start Service'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Withdrawal Modal */}
            <Modal visible={showWithdrawModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>New Withdrawal</Text>
                            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                                <X color={theme.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Customer Name (Optional)</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                value={customerName}
                                onChangeText={setCustomerName}
                                placeholder="Walk-in"
                                placeholderTextColor={theme.textMuted}
                            />

                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Withdrawal Amount (₦)</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                value={withdrawalAmount}
                                onChangeText={setWithdrawalAmount}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={theme.textMuted}
                            />

                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Payment Method</Text>
                            <View style={styles.paymentRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.paymentOption,
                                        { backgroundColor: theme.surfaceAlt },
                                        paymentMethod === 'card' && { borderColor: theme.primary, backgroundColor: theme.primaryLight }
                                    ]}
                                    onPress={() => setPaymentMethod('card')}
                                >
                                    <CreditCard color={paymentMethod === 'card' ? theme.primary : theme.textMuted} size={20} />
                                    <Text style={[styles.paymentText, { color: paymentMethod === 'card' ? theme.primary : theme.textMuted }]}>Card</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.paymentOption,
                                        { backgroundColor: theme.surfaceAlt },
                                        paymentMethod === 'bank_transfer' && { borderColor: theme.primary, backgroundColor: theme.primaryLight }
                                    ]}
                                    onPress={() => setPaymentMethod('bank_transfer')}
                                >
                                    <CheckCircle color={paymentMethod === 'bank_transfer' ? theme.primary : theme.textMuted} size={20} />
                                    <Text style={[styles.paymentText, { color: paymentMethod === 'bank_transfer' ? theme.primary : theme.textMuted }]}>Transfer</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.summaryCard, { backgroundColor: theme.surfaceAlt }]}>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Withdrawal</Text>
                                    <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(Number(withdrawalAmount) || 0)}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Service Charge</Text>
                                    <Text style={[styles.summaryValue, { color: theme.success }]}>+{formatCurrency(serviceCharge)}</Text>
                                </View>
                                <View style={[styles.summaryRow, styles.summaryTotal, { borderTopColor: theme.border }]}>
                                    <Text style={[styles.totalLabel, { color: theme.text }]}>Customer Pays</Text>
                                    <Text style={[styles.totalValue, { color: theme.text }]}>{formatCurrency((Number(withdrawalAmount) || 0) + serviceCharge)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.primary }, isProcessing && styles.saveButtonDisabled]}
                                onPress={handleWithdrawal}
                                disabled={isProcessing}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isProcessing ? 'Processing...' : 'Complete Withdrawal'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSubtitle: { fontSize: 14, marginTop: 2 },
    content: { flex: 1, paddingHorizontal: 20 },
    statusCard: { padding: 24, borderRadius: 28, marginBottom: 24 },
    statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    healthBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    healthText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    statusLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 },
    statusValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
    withdrawButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, marginTop: 12 },
    withdrawButtonText: { fontSize: 12, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 1 },
    noFloatText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22, marginBottom: 20 },
    startButton: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    startButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
    sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
    txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1 },
    txInfo: { flex: 1 },
    txNumber: { fontSize: 14, fontWeight: '700' },
    txCustomer: { fontSize: 12, marginTop: 2 },
    txMeta: { alignItems: 'flex-end' },
    txAmount: { fontSize: 16, fontWeight: '800' },
    txCharge: { fontSize: 12, fontWeight: '700', marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyStateText: { fontSize: 14, fontWeight: '600', marginTop: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    modalBody: { padding: 24 },
    inputLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    textInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600' },
    paymentRow: { flexDirection: 'row', gap: 12 },
    paymentOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
    paymentText: { fontSize: 12, fontWeight: '700' },
    summaryCard: { padding: 20, borderRadius: 20, marginTop: 24 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 12, fontWeight: '600' },
    summaryValue: { fontSize: 14, fontWeight: '700' },
    summaryTotal: { borderTopWidth: 1, paddingTop: 12, marginTop: 8, marginBottom: 0 },
    totalLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    totalValue: { fontSize: 20, fontWeight: '800' },
    saveButton: { paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
});

export default POSWithdrawalsScreen;
