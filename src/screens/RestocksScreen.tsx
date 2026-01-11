// Restocks Screen - Track inventory restocks (works offline)
import React, { useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Modal, Alert, RefreshControl
} from 'react-native';
import { useShop } from '../store/ShopContext';
import { formatCurrency, formatDate } from '../utils';
import { Package, Plus, X, Truck, Save, Loader2 } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const RestocksScreen: React.FC = () => {
    const { items, syncNow, isLoading } = useShop();
    const [showModal, setShowModal] = useState(false);
    const [supplierName, setSupplierName] = useState('');
    const [selectedItems, setSelectedItems] = useState<{ id: string; name: string; quantity: number; unitCost: number }[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Placeholder restocks data (would come from store in full implementation)
    const restocks: any[] = [];

    const addItemToRestock = (item: any) => {
        if (selectedItems.find(i => i.id === item.id)) return;
        setSelectedItems([...selectedItems, {
            id: item.id,
            name: item.name,
            quantity: 1,
            unitCost: item.costPrice
        }]);
    };

    const updateRestockItem = (id: string, field: string, value: number) => {
        setSelectedItems(selectedItems.map(i =>
            i.id === id ? { ...i, [field]: value } : i
        ));
    };

    const removeRestockItem = (id: string) => {
        setSelectedItems(selectedItems.filter(i => i.id !== id));
    };

    const totalAmount = selectedItems.reduce((acc, i) => acc + (i.quantity * i.unitCost), 0);

    const handleSaveRestock = async () => {
        if (!supplierName || selectedItems.length === 0) {
            Alert.alert('Error', 'Enter supplier name and add items');
            return;
        }

        setIsSaving(true);
        try {
            // Would call store.addRestock() here
            Alert.alert('Success', 'Restock recorded!');
            setShowModal(false);
            setSupplierName('');
            setSelectedItems([]);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <SyncIndicator />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Restocks</Text>
                    <Text style={styles.headerSubtitle}>Track inventory replenishments</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
                    <Plus color="#fff" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} />}
            >
                {restocks.length === 0 && (
                    <View style={styles.emptyState}>
                        <Truck color="#CBD5E1" size={48} />
                        <Text style={styles.emptyStateText}>No restocks recorded</Text>
                        <Text style={styles.emptyStateSubtext}>Tap + to record a new restock</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add Restock Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Restock</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <X color="#64748B" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Supplier Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={supplierName}
                                onChangeText={setSupplierName}
                                placeholder="Enter supplier name"
                                placeholderTextColor="#94A3B8"
                            />

                            <Text style={styles.inputLabel}>Select Items to Restock</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemPicker}>
                                {items.slice(0, 10).map(item => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={[
                                            styles.itemChip,
                                            selectedItems.find(i => i.id === item.id) && styles.itemChipSelected
                                        ]}
                                        onPress={() => addItemToRestock(item)}
                                    >
                                        <Text style={styles.itemChipText}>{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {selectedItems.map(item => (
                                <View key={item.id} style={styles.restockItem}>
                                    <Text style={styles.restockItemName}>{item.name}</Text>
                                    <View style={styles.restockInputs}>
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.quantity.toString()}
                                            keyboardType="numeric"
                                            onChangeText={(t) => updateRestockItem(item.id, 'quantity', Number(t) || 0)}
                                            placeholder="Qty"
                                        />
                                        <TextInput
                                            style={styles.smallInput}
                                            value={item.unitCost.toString()}
                                            keyboardType="numeric"
                                            onChangeText={(t) => updateRestockItem(item.id, 'unitCost', Number(t) || 0)}
                                            placeholder="Cost"
                                        />
                                        <TouchableOpacity onPress={() => removeRestockItem(item.id)}>
                                            <X color="#EF4444" size={20} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            {selectedItems.length > 0 && (
                                <View style={styles.totalCard}>
                                    <Text style={styles.totalLabel}>Total Amount</Text>
                                    <Text style={styles.totalValue}>{formatCurrency(totalAmount)}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                onPress={handleSaveRestock}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 color="#fff" size={20} /> : <Save color="#fff" size={20} />}
                                <Text style={styles.saveButtonText}>Record Restock</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
    headerSubtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
    addButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, paddingHorizontal: 20 },
    emptyState: { alignItems: 'center', paddingVertical: 80 },
    emptyStateText: { fontSize: 16, fontWeight: '700', color: '#64748B', marginTop: 16 },
    emptyStateSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    modalBody: { padding: 24 },
    inputLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    textInput: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#0F172A' },
    itemPicker: { flexDirection: 'row', marginBottom: 16 },
    itemChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F1F5F9', marginRight: 8 },
    itemChipSelected: { backgroundColor: '#4F46E5' },
    itemChipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
    restockItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 8 },
    restockItemName: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1 },
    restockInputs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    smallInput: { width: 60, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, fontWeight: '600', textAlign: 'center' },
    totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0F172A', padding: 20, borderRadius: 16, marginTop: 16 },
    totalLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
    totalValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 18, marginTop: 24, marginBottom: 40 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
});

export default RestocksScreen;
