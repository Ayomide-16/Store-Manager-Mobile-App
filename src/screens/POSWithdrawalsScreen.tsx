// POS Withdrawals Screen - Cash withdrawal service (works offline)
import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Modal, Alert, RefreshControl
} from 'react-native';
import { useShop } from '../store/ShopContext';
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
        if (!activeFloat) return { label: 'Not Started', color: '#64748B', bg: '#F1F5F9' };
        if (activeFloat.currentBalance <= 0) return { label: 'Depleted', color: '#DC2626', bg: '#FEF2F2' };
        if (activeFloat.currentBalance < 10000) return { label: 'Low', color: '#D97706', bg: '#FFFBEB' };
        return { label: 'Healthy', color: '#059669', bg: '#ECFDF5' };
    }, [activeFloat]);

    return (
        <View style={styles.container}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>POS Withdrawals</Text>
                <Text style={styles.headerSubtitle}>Cash withdrawal service</Text>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} />}
            >
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: activeFloat ? '#1E1B4B' : '#0F172A' }]}>
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
                                style={styles.startButton}
                                onPress={() => setShowStartModal(true)}
                            >
                                <Text style={styles.startButtonText}>Start POS Service</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Today's Transactions */}
                <Text style={styles.sectionTitle}>Today's Transactions</Text>

                {todayTransactions.map(tx => (
                    <View key={tx.id} style={styles.txCard}>
                        <View style={styles.txInfo}>
                            <Text style={styles.txNumber}>{tx.transactionNumber}</Text>
                            <Text style={styles.txCustomer}>{tx.customerName || 'Walk-in'}</Text>
                        </View>
                        <View style={styles.txMeta}>
                            <Text style={styles.txAmount}>{formatCurrency(tx.withdrawalAmount)}</Text>
                            <Text style={styles.txCharge}>+{formatCurrency(tx.serviceCharge)}</Text>
                        </View>
                    </View>
                ))}

                {todayTransactions.length === 0 && (
                    <View style={styles.emptyState}>
                        <Wallet color="#CBD5E1" size={48} />
                        <Text style={styles.emptyStateText}>No transactions today</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Start Float Modal */}
            <Modal visible={showStartModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Start POS Float</Text>
                            <TouchableOpacity onPress={() => setShowStartModal(false)}>
                                <X color="#64748B" size={24} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Opening Balance (₦)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={openingBalance}
                                onChangeText={setOpeningBalance}
                                keyboardType="numeric"
                                placeholder="e.g., 50000"
                                placeholderTextColor="#94A3B8"
                            />
                            <TouchableOpacity
                                style={[styles.saveButton, isProcessing && styles.saveButtonDisabled]}
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
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Withdrawal</Text>
                            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
                                <X color="#64748B" size={24} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Customer Name (Optional)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={customerName}
                                onChangeText={setCustomerName}
                                placeholder="Walk-in"
                                placeholderTextColor="#94A3B8"
                            />

                            <Text style={styles.inputLabel}>Withdrawal Amount (₦)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={withdrawalAmount}
                                onChangeText={setWithdrawalAmount}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#94A3B8"
                            />

                            <Text style={styles.inputLabel}>Payment Method</Text>
                            <View style={styles.paymentRow}>
                                <TouchableOpacity
                                    style={[styles.paymentOption, paymentMethod === 'card' && styles.paymentOptionActive]}
                                    onPress={() => setPaymentMethod('card')}
                                >
                                    <CreditCard color={paymentMethod === 'card' ? '#4F46E5' : '#94A3B8'} size={20} />
                                    <Text style={[styles.paymentText, paymentMethod === 'card' && styles.paymentTextActive]}>Card</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.paymentOption, paymentMethod === 'bank_transfer' && styles.paymentOptionActive]}
                                    onPress={() => setPaymentMethod('bank_transfer')}
                                >
                                    <CheckCircle color={paymentMethod === 'bank_transfer' ? '#4F46E5' : '#94A3B8'} size={20} />
                                    <Text style={[styles.paymentText, paymentMethod === 'bank_transfer' && styles.paymentTextActive]}>Transfer</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.summaryCard}>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Withdrawal</Text>
                                    <Text style={styles.summaryValue}>{formatCurrency(Number(withdrawalAmount) || 0)}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Service Charge</Text>
                                    <Text style={[styles.summaryValue, { color: '#059669' }]}>+{formatCurrency(serviceCharge)}</Text>
                                </View>
                                <View style={[styles.summaryRow, styles.summaryTotal]}>
                                    <Text style={styles.totalLabel}>Customer Pays</Text>
                                    <Text style={styles.totalValue}>{formatCurrency((Number(withdrawalAmount) || 0) + serviceCharge)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, isProcessing && styles.saveButtonDisabled]}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
    headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
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
    startButton: { backgroundColor: '#4F46E5', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    startButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
    txCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
    txInfo: { flex: 1 },
    txNumber: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    txCustomer: { fontSize: 12, color: '#64748B', marginTop: 2 },
    txMeta: { alignItems: 'flex-end' },
    txAmount: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
    txCharge: { fontSize: 12, fontWeight: '700', color: '#059669', marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyStateText: { fontSize: 14, fontWeight: '600', color: '#94A3B8', marginTop: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    modalBody: { padding: 24 },
    inputLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    textInput: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#0F172A' },
    paymentRow: { flexDirection: 'row', gap: 12 },
    paymentOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: 'transparent' },
    paymentOptionActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
    paymentText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
    paymentTextActive: { color: '#4F46E5' },
    summaryCard: { backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, marginTop: 24 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
    summaryValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
    summaryTotal: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 12, marginTop: 8, marginBottom: 0 },
    totalLabel: { fontSize: 12, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    saveButton: { backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 24, marginBottom: 40 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
});

export default POSWithdrawalsScreen;
