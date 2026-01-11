// Inventory Screen - View and manage products (works offline)
import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Modal, Alert, RefreshControl
} from 'react-native';
import { useShop } from '../store/ShopContext';
import { UserRole, Item } from '../types';
import { formatCurrency } from '../utils';
import {
    Search, Plus, Package, Edit2, Scissors, X, Save, Loader2, AlertTriangle
} from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const InventoryScreen: React.FC = () => {
    const {
        currentUser, items, categories, shopName,
        addItem, updateItem, syncNow, isLoading
    } = useShop();

    const isAdmin = currentUser?.role === UserRole.ADMIN;
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

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

    return (
        <View style={styles.container}>
            <SyncIndicator />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Inventory</Text>
                    <Text style={styles.headerSubtitle}>
                        {items.length} products • {lowStockItems.length} low stock
                    </Text>
                </View>
                {isAdmin && (
                    <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                        <Plus color="#fff" size={20} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search & Filter */}
            <View style={styles.searchContainer}>
                <Search color="#94A3B8" size={20} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    placeholderTextColor="#94A3B8"
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
                    style={[styles.filterChip, categoryFilter === 'all' && styles.filterChipActive]}
                    onPress={() => setCategoryFilter('all')}
                >
                    <Text style={[styles.filterChipText, categoryFilter === 'all' && styles.filterChipTextActive]}>
                        All
                    </Text>
                </TouchableOpacity>
                {categories.map(cat => (
                    <TouchableOpacity
                        key={cat.id}
                        style={[styles.filterChip, categoryFilter === cat.id && styles.filterChipActive]}
                        onPress={() => setCategoryFilter(cat.id)}
                    >
                        <Text style={[styles.filterChipText, categoryFilter === cat.id && styles.filterChipTextActive]}>
                            {cat.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Product List */}
            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} />}
            >
                {filteredItems.map(item => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.productCard}
                        onPress={() => isAdmin ? openEditModal(item) : null}
                    >
                        <View style={styles.productInfo}>
                            <View style={styles.productHeader}>
                                <Text style={styles.productName}>{item.name}</Text>
                                {item.allowFractional && <Scissors color="#818CF8" size={14} />}
                                {item.quantityInStock <= item.reorderLevel && (
                                    <AlertTriangle color="#DC2626" size={14} />
                                )}
                            </View>
                            <Text style={styles.productSku}>{item.sku}</Text>
                        </View>
                        <View style={styles.productMeta}>
                            <Text style={[
                                styles.productStock,
                                item.quantityInStock <= item.reorderLevel && styles.productStockLow
                            ]}>
                                {item.quantityInStock} {item.unit}
                            </Text>
                            <Text style={styles.productPrice}>{formatCurrency(item.sellingPrice)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {filteredItems.length === 0 && (
                    <View style={styles.emptyState}>
                        <Package color="#CBD5E1" size={48} />
                        <Text style={styles.emptyStateText}>No products found</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={isModalOpen} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {isEditMode ? 'Edit Product' : 'Add Product'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                                <X color="#64748B" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>Product Name</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.name}
                                onChangeText={(t) => setFormData({ ...formData, name: t })}
                                placeholder="Enter product name"
                                placeholderTextColor="#94A3B8"
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.inputLabel}>Selling Price (₦)</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={formData.sellingPrice.toString()}
                                        onChangeText={(t) => setFormData({ ...formData, sellingPrice: Number(t) || 0 })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.inputLabel}>Cost Price (₦)</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={formData.costPrice.toString()}
                                        onChangeText={(t) => setFormData({ ...formData, costPrice: Number(t) || 0 })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <Text style={styles.inputLabel}>Stock Level</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={formData.quantityInStock.toString()}
                                        onChangeText={(t) => setFormData({ ...formData, quantityInStock: Number(t) || 0 })}
                                        keyboardType="numeric"
                                        placeholder="0"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <Text style={styles.inputLabel}>Reorder Level</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={formData.reorderLevel.toString()}
                                        onChangeText={(t) => setFormData({ ...formData, reorderLevel: Number(t) || 0 })}
                                        keyboardType="numeric"
                                        placeholder="5"
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>Unit</Text>
                            <TextInput
                                style={styles.textInput}
                                value={formData.unit}
                                onChangeText={(t) => setFormData({ ...formData, unit: t })}
                                placeholder="pcs"
                            />

                            {/* Fractional Toggle */}
                            <View style={styles.toggleRow}>
                                <View style={styles.toggleInfo}>
                                    <Scissors color="#4F46E5" size={20} />
                                    <View>
                                        <Text style={styles.toggleLabel}>Fractional Selling</Text>
                                        <Text style={styles.toggleDesc}>Allow sales of portions (1/2, 1/4)</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={[styles.toggle, formData.allowFractional && styles.toggleActive]}
                                    onPress={() => setFormData({ ...formData, allowFractional: !formData.allowFractional })}
                                >
                                    <View style={[styles.toggleKnob, formData.allowFractional && styles.toggleKnobActive]} />
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <Loader2 color="#fff" size={20} />
                                ) : (
                                    <Save color="#fff" size={20} />
                                )}
                                <Text style={styles.saveButtonText}>
                                    {isEditMode ? 'Update Product' : 'Save Product'}
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
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    filterScroll: {
        marginVertical: 16,
    },
    filterContainer: {
        paddingHorizontal: 20,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#4F46E5',
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    list: {
        flex: 1,
        paddingHorizontal: 20,
    },
    productCard: {
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
    productInfo: {
        flex: 1,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    productName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    productSku: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginTop: 4,
    },
    productMeta: {
        alignItems: 'flex-end',
    },
    productStock: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
    },
    productStockLow: {
        color: '#DC2626',
    },
    productPrice: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4F46E5',
        marginTop: 2,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    modalForm: {
        padding: 24,
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 16,
    },
    textInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    toggleDesc: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    toggle: {
        width: 52,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#CBD5E1',
        padding: 3,
    },
    toggleActive: {
        backgroundColor: '#4F46E5',
    },
    toggleKnob: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#fff',
    },
    toggleKnobActive: {
        transform: [{ translateX: 24 }],
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        paddingVertical: 18,
        borderRadius: 18,
        marginTop: 32,
        marginBottom: 40,
        gap: 10,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default InventoryScreen;
