// Inventory Screen with Reason Modal for Salesperson Edits
import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Modal, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { UserRole, Item } from '../types';
import { formatCurrency } from '../utils';
import { Search, Plus, Package, Edit2, Scissors, X, Save, Loader2, AlertTriangle } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';
import ReasonModal from '../components/ReasonModal';

const InventoryScreen: React.FC = () => {
    const {
        currentUser, items, categories, addItem, updateItem,
        updateItemWithReason, syncNow, isLoading
    } = useShop();
    const { theme } = useTheme();

    const isAdmin = currentUser?.role === UserRole.ADMIN;
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState<Partial<Item> | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        categoryId: '',
        sellingPrice: 0,
        costPrice: 0,
        quantityInStock: 0,
        reorderLevel: 5,
        unit: 'pcs',
        allowFractional: false,
    });

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return item.name.toLowerCase().includes(searchLower) ||
                item.sku.toLowerCase().includes(searchLower);
        });
    }, [items, searchTerm, categoryFilter]);

    const lowStockItems = items.filter(i => i.quantityInStock <= i.reorderLevel);

    const openAddModal = () => {
        setIsEditMode(false);
        setFormData({
            name: '', categoryId: '', sellingPrice: 0, costPrice: 0,
            quantityInStock: 0, reorderLevel: 5, unit: 'pcs', allowFractional: false,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: Item) => {
        setIsEditMode(true);
        setSelectedItem(item);
        setFormData({
            name: item.name,
            categoryId: item.categoryId || '',
            sellingPrice: item.sellingPrice,
            costPrice: item.costPrice,
            quantityInStock: item.quantityInStock,
            reorderLevel: item.reorderLevel,
            unit: item.unit,
            allowFractional: item.allowFractional,
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            Alert.alert('Error', 'Product name is required');
            return;
        }

        // For salesperson editing, require reason
        if (isEditMode && !isAdmin && selectedItem) {
            setPendingUpdates(formData);
            setIsModalOpen(false);
            setShowReasonModal(true);
            return;
        }

        // Admin or new item - save directly
        setIsSaving(true);
        try {
            if (isEditMode && selectedItem) {
                await updateItem(selectedItem.id, formData);
            } else {
                await addItem(formData);
            }
            setIsModalOpen(false);
            setSelectedItem(null);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save product');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveWithReason = async (reason: string) => {
        if (!selectedItem || !pendingUpdates) return;

        setIsSaving(true);
        try {
            await updateItemWithReason(selectedItem.id, pendingUpdates, reason);
            setShowReasonModal(false);
            setPendingUpdates(null);
            setSelectedItem(null);
            Alert.alert('Success', 'Changes saved with audit log');
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <SyncIndicator />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Inventory</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                        {items.length} products • {lowStockItems.length} low stock
                    </Text>
                </View>
                {isAdmin && (
                    <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={openAddModal}>
                        <Plus color="#fff" size={20} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search & Filter */}
            <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Search color={theme.textMuted} size={20} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search products..."
                    placeholderTextColor={theme.textMuted}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {/* Category Filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterContainer}
            >
                <TouchableOpacity
                    style={[styles.filterChip, { backgroundColor: categoryFilter === 'all' ? theme.primary : theme.surfaceAlt }]}
                    onPress={() => setCategoryFilter('all')}
                >
                    <Text style={[styles.filterChipText, { color: categoryFilter === 'all' ? '#fff' : theme.textSecondary }]}>
                        All
                    </Text>
                </TouchableOpacity>
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.filterChip, { backgroundColor: categoryFilter === cat.id ? theme.primary : theme.surfaceAlt }]}
                        onPress={() => setCategoryFilter(cat.id)}
                    >
                        <Text style={[styles.filterChipText, { color: categoryFilter === cat.id ? '#fff' : theme.textSecondary }]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Product List */}
            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} tintColor={theme.primary} />}
            >
                {filteredItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.productCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => openEditModal(item)}
                    >
                        <View style={styles.productInfo}>
                            <View style={styles.productHeader}>
                                <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                                {item.allowFractional && <Scissors color={theme.primary} size={14} />}
                                {item.quantityInStock <= item.reorderLevel && (
                                    <AlertTriangle color={theme.danger} size={14} />
                                )}
                            </View>
                            <Text style={[styles.productSku, { color: theme.textMuted }]}>{item.sku}</Text>
                        </View>
                        <View style={styles.productMeta}>
                            <Text style={[
                                styles.productStock,
                                { color: item.quantityInStock <= item.reorderLevel ? theme.danger : theme.text }
                            ]}>
                                {item.quantityInStock} {item.unit}
                            </Text>
                            <Text style={[styles.productPrice, { color: theme.primary }]}>{formatCurrency(item.sellingPrice)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {filteredItems.length === 0 && (
                    <View style={styles.emptyState}>
                        <Package color={theme.textMuted} size={48} />
                        <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>No products found</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                {isEditMode ? 'Edit Product' : 'Add Product'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <X color={theme.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Product Name</Text>
                            <TextInput
                                style={[styles.textInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                value={formData.name}
                                onChangeText={(t) => setFormData({ ...formData, name: t })}
                                placeholder="Enter product name"
                                placeholderTextColor={theme.textMuted}
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Selling Price (₦)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                        value={formData.sellingPrice.toString()}
                                        onChangeText={(t) => setFormData({ ...formData, sellingPrice: Number(t) || 0 })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Cost Price (₦)</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                        value={formData.costPrice.toString()}
                                        onChangeText={(t) => setFormData({ ...formData, costPrice: Number(t) || 0 })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Stock Level</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                        value={formData.quantityInStock.toString()}
                                        onChangeText={(t) => setFormData({ ...formData, quantityInStock: Number(t) || 0 })}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Reorder Level</Text>
                                    <TextInput
                                        style={[styles.textInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                        value={formData.reorderLevel.toString()}
                                        onChangeText={(t) => setFormData({ ...formData, reorderLevel: Number(t) || 0 })}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            {/* Salesperson Notice */}
                            {isEditMode && !isAdmin && (
                                <View style={[styles.noticeBox, { backgroundColor: theme.warningLight }]}>
                                    <AlertTriangle color={theme.warning} size={16} />
                                    <Text style={[styles.noticeText, { color: theme.warning }]}>
                                        You'll need to provide a reason for any changes
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 color="#fff" size={20} /> : <Save color="#fff" size={20} />}
                                <Text style={styles.saveButtonText}>
                                    {isEditMode ? 'Update Product' : 'Save Product'}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Reason Modal for Salesperson Edits */}
            <ReasonModal
                visible={showReasonModal}
                onClose={() => { setShowReasonModal(false); setPendingUpdates(null); }}
                onSubmit={handleSaveWithReason}
                isLoading={isSaving}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSubtitle: { fontSize: 14, marginTop: 2 },
    addButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, marginHorizontal: 20, borderWidth: 1 },
    searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, fontWeight: '600' },
    filterScroll: { marginVertical: 16 },
    filterContainer: { paddingHorizontal: 20, gap: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    filterChipText: { fontSize: 12, fontWeight: '700' },
    list: { flex: 1, paddingHorizontal: 20 },
    productCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1 },
    productInfo: { flex: 1 },
    productHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    productName: { fontSize: 14, fontWeight: '700' },
    productSku: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
    productMeta: { alignItems: 'flex-end' },
    productStock: { fontSize: 14, fontWeight: '800' },
    productPrice: { fontSize: 12, fontWeight: '700', marginTop: 2 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyStateText: { fontSize: 14, fontWeight: '600', marginTop: 16 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    modalForm: { padding: 24 },
    inputLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    textInput: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600' },
    row: { flexDirection: 'row', gap: 12 },
    halfInput: { flex: 1 },
    noticeBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginTop: 20 },
    noticeText: { fontSize: 13, fontWeight: '600', flex: 1 },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 18, marginTop: 32, marginBottom: 40, gap: 10 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
});

export default InventoryScreen;
