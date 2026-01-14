// Sales Calculator Screen - POS with SafeAreaView, Dark Theme, and Frequently Bought Items
import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { PaymentMethod, Item } from '../types';
import { formatCurrency } from '../utils';
import {
    Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle,
    Wallet, CreditCard, Scissors, TrendingUp
} from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const SalesCalculatorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { items, sales, addSale } = useShop();
    const { theme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [additionalCharges, setAdditionalCharges] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculate frequently bought items from sales history
    const frequentlyBought = useMemo(() => {
        const itemCounts: Record<string, number> = {};

        // Count how many times each item was sold
        sales.forEach(sale => {
            // Simple approach: count sales by item_id from the sale items
            // Since we don't have sale_items directly, we'll use the main sales
            // In a real scenario, you'd query sale_items table
        });

        // Alternative: Use items with highest sales based on lower stock relative to reorder
        // This is a heuristic when we don't have detailed sale_items
        const popular = items
            .filter(i => i.quantityInStock > 0)
            .sort((a, b) => {
                // Items that have been restocked more frequently (low stock relative to reorder level)
                // might indicate higher sales
                const aScore = a.reorderLevel - a.quantityInStock + 10;
                const bScore = b.reorderLevel - b.quantityInStock + 10;
                return bScore - aScore;
            })
            .slice(0, 10);

        return popular;
    }, [items, sales]);

    const filteredItems = useMemo(() => {
        if (!searchTerm) return [];
        return items.filter(i =>
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.sku.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 10);
    }, [items, searchTerm]);

    const cartDetails = useMemo(() => {
        return cart.map(cartItem => {
            const item = items.find(i => i.id === cartItem.id)!;
            return { ...item, cartQuantity: cartItem.quantity };
        }).filter(Boolean);
    }, [cart, items]);

    const subtotal = cartDetails.reduce((acc, curr) => acc + (curr.sellingPrice * curr.cartQuantity), 0);
    const total = subtotal + additionalCharges;

    const addToCart = (item: Item) => {
        if (item.quantityInStock <= 0) return;
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                if (existing.quantity >= item.quantityInStock) return prev;
                return prev.map(i => i.id === item.id ? { ...i, quantity: Number((i.quantity + 1).toFixed(4)) } : i);
            }
            return [...prev, { id: item.id, quantity: 1 }];
        });
        setSearchTerm('');
    };

    const updateQuantity = (id: string, delta: number) => {
        const item = items.find(i => i.id === id)!;
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const step = item.allowFractional ? 0.25 : 1;
                const newQty = Math.max(step, Math.min(item.quantityInStock, i.quantity + (delta * step)));
                return { ...i, quantity: Number(newQty.toFixed(4)) };
            }
            return i;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id));
    };

    const handleCompleteSale = async () => {
        if (cart.length === 0 || !paymentMethod) {
            Alert.alert('Error', 'Add items to cart and select payment method');
            return;
        }

        setIsProcessing(true);
        try {
            await addSale({ items: cart, paymentMethod, additionalCharges });
            setCart([]);
            setPaymentMethod(null);
            setAdditionalCharges(0);
            Alert.alert('Success', 'Sale completed successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to complete sale');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <SyncIndicator />

                <ScrollView style={styles.scrollView}>
                    {/* Frequently Bought Items */}
                    {frequentlyBought.length > 0 && cart.length === 0 && (
                        <View style={styles.frequentSection}>
                            <View style={styles.frequentHeader}>
                                <TrendingUp color={theme.primary} size={18} />
                                <Text style={[styles.frequentTitle, { color: theme.text }]}>Quick Add</Text>
                            </View>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={frequentlyBought}
                                keyExtractor={item => item.id}
                                contentContainerStyle={styles.frequentList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.frequentItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                        onPress={() => addToCart(item)}
                                        disabled={item.quantityInStock <= 0}
                                    >
                                        <Text style={[styles.frequentName, { color: theme.text }]} numberOfLines={2}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.frequentPrice, { color: theme.primary }]}>
                                            {formatCurrency(item.sellingPrice)}
                                        </Text>
                                        <Text style={[styles.frequentStock, { color: item.quantityInStock <= item.reorderLevel ? theme.danger : theme.textMuted }]}>
                                            {item.quantityInStock} left
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}

                    {/* Search */}
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

                    {/* Search Results */}
                    {searchTerm && filteredItems.length > 0 && (
                        <View style={[styles.searchResults, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            {filteredItems.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.searchItem, { borderBottomColor: theme.border }]}
                                    onPress={() => addToCart(item)}
                                    disabled={item.quantityInStock <= 0}
                                >
                                    <View style={styles.searchItemInfo}>
                                        <View style={styles.searchItemHeader}>
                                            <Text style={[styles.searchItemName, { color: theme.text }]}>{item.name}</Text>
                                            {item.allowFractional && <Scissors color={theme.primary} size={14} />}
                                        </View>
                                        <Text style={[styles.searchItemMeta, { color: theme.textMuted }]}>
                                            {item.sku} • Stock: {item.quantityInStock}
                                        </Text>
                                    </View>
                                    <View style={styles.searchItemPrice}>
                                        <Text style={[styles.searchItemPriceText, { color: theme.primary }]}>{formatCurrency(item.sellingPrice)}</Text>
                                        <Plus color={theme.primary} size={18} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Cart */}
                    <View style={[styles.cartSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.cartHeader, { backgroundColor: theme.surfaceAlt, borderBottomColor: theme.border }]}>
                            <View style={styles.cartTitleRow}>
                                <ShoppingCart color={theme.primary} size={20} />
                                <Text style={[styles.cartTitle, { color: theme.text }]}>Cart ({cart.length} items)</Text>
                            </View>
                            {cart.length > 0 && (
                                <TouchableOpacity onPress={() => setCart([])}>
                                    <Text style={[styles.clearButton, { color: theme.danger }]}>CLEAR</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {cartDetails.map(item => (
                            <View key={item.id} style={[styles.cartItem, { borderBottomColor: theme.border }]}>
                                <View style={styles.cartItemInfo}>
                                    <View style={styles.cartItemHeader}>
                                        <Text style={[styles.cartItemName, { color: theme.text }]}>{item.name}</Text>
                                        {item.allowFractional && <Scissors color={theme.primary} size={14} />}
                                    </View>
                                    <Text style={[styles.cartItemPrice, { color: theme.textSecondary }]}>
                                        {formatCurrency(item.sellingPrice)} / {item.unit}
                                    </Text>
                                </View>

                                <View style={styles.quantityControls}>
                                    <TouchableOpacity
                                        style={[styles.qtyButton, { backgroundColor: theme.surfaceAlt }]}
                                        onPress={() => updateQuantity(item.id, -1)}
                                    >
                                        <Minus color={theme.textSecondary} size={16} />
                                    </TouchableOpacity>
                                    <Text style={[styles.qtyText, { color: theme.text }]}>{item.cartQuantity}</Text>
                                    <TouchableOpacity
                                        style={[styles.qtyButton, { backgroundColor: theme.surfaceAlt }]}
                                        onPress={() => updateQuantity(item.id, 1)}
                                        disabled={item.cartQuantity >= item.quantityInStock}
                                    >
                                        <Plus color={theme.textSecondary} size={16} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.cartItemTotal, { color: theme.text }]}>
                                    {formatCurrency(item.sellingPrice * item.cartQuantity)}
                                </Text>

                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeFromCart(item.id)}
                                >
                                    <Trash2 color={theme.danger} size={18} />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {cart.length === 0 && (
                            <View style={styles.emptyCart}>
                                <ShoppingCart color={theme.textMuted} size={48} />
                                <Text style={[styles.emptyCartText, { color: theme.textMuted }]}>Cart is empty</Text>
                            </View>
                        )}
                    </View>

                    {/* Payment Method */}
                    <View style={styles.paymentSection}>
                        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Payment Type</Text>
                        <View style={styles.paymentMethods}>
                            {Object.values(PaymentMethod).map(method => (
                                <TouchableOpacity
                                    key={method}
                                    style={[
                                        styles.paymentButton,
                                        { backgroundColor: theme.surfaceAlt, borderColor: paymentMethod === method ? theme.primary : 'transparent' },
                                        paymentMethod === method && { backgroundColor: theme.primaryLight }
                                    ]}
                                    onPress={() => setPaymentMethod(method)}
                                >
                                    {method === PaymentMethod.CASH && <Wallet color={paymentMethod === method ? theme.primary : theme.textMuted} size={20} />}
                                    {method === PaymentMethod.BANK_TRANSFER && <CheckCircle color={paymentMethod === method ? theme.primary : theme.textMuted} size={20} />}
                                    {method === PaymentMethod.CARD && <CreditCard color={paymentMethod === method ? theme.primary : theme.textMuted} size={20} />}
                                    <Text style={[
                                        styles.paymentButtonText,
                                        { color: paymentMethod === method ? theme.primary : theme.textMuted }
                                    ]}>
                                        {method.replace('_', ' ')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Additional Charges */}
                    <View style={styles.chargesSection}>
                        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Extra Fee (POS charge, etc.)</Text>
                        <View style={styles.chargesInput}>
                            <TouchableOpacity
                                style={[styles.chargeButton, { backgroundColor: theme.surfaceAlt }]}
                                onPress={() => setAdditionalCharges(Math.max(0, additionalCharges - 50))}
                            >
                                <Minus color={theme.textSecondary} size={20} />
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.chargeTextInput, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                value={additionalCharges.toString()}
                                onChangeText={(t) => setAdditionalCharges(Number(t) || 0)}
                                keyboardType="numeric"
                                textAlign="center"
                            />
                            <TouchableOpacity
                                style={[styles.chargeButton, { backgroundColor: theme.surfaceAlt }]}
                                onPress={() => setAdditionalCharges(additionalCharges + 50)}
                            >
                                <Plus color={theme.textSecondary} size={20} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Total */}
                    <View style={[styles.totalCard, { backgroundColor: theme.secondary }]}>
                        <Text style={styles.totalLabel}>Total to Pay</Text>
                        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
                    </View>

                    {/* Complete Button */}
                    <TouchableOpacity
                        style={[styles.completeButton, (cart.length === 0 || !paymentMethod || isProcessing) && styles.completeButtonDisabled]}
                        onPress={handleCompleteSale}
                        disabled={cart.length === 0 || !paymentMethod || isProcessing}
                    >
                        <Text style={styles.completeButtonText}>
                            {isProcessing ? 'Processing...' : 'Complete Order'}
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    scrollView: { flex: 1, padding: 20 },
    frequentSection: { marginBottom: 20 },
    frequentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    frequentTitle: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    frequentList: { paddingRight: 20 },
    frequentItem: { width: 120, padding: 12, borderRadius: 16, borderWidth: 1, marginRight: 10 },
    frequentName: { fontSize: 12, fontWeight: '700', marginBottom: 6, lineHeight: 16 },
    frequentPrice: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
    frequentStock: { fontSize: 10, fontWeight: '600' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, marginBottom: 16 },
    searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, fontWeight: '600' },
    searchResults: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
    searchItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    searchItemInfo: { flex: 1 },
    searchItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    searchItemName: { fontSize: 14, fontWeight: '700' },
    searchItemMeta: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
    searchItemPrice: { alignItems: 'flex-end' },
    searchItemPriceText: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
    cartSection: { borderRadius: 24, borderWidth: 1, marginBottom: 20, overflow: 'hidden' },
    cartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    cartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cartTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    clearButton: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    cartItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    cartItemInfo: { flex: 1 },
    cartItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cartItemName: { fontSize: 14, fontWeight: '700' },
    cartItemPrice: { fontSize: 12, marginTop: 2 },
    quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    qtyButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    qtyText: { fontSize: 14, fontWeight: '800', minWidth: 40, textAlign: 'center' },
    cartItemTotal: { fontSize: 14, fontWeight: '800', marginHorizontal: 12, minWidth: 70, textAlign: 'right' },
    removeButton: { padding: 8 },
    emptyCart: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    emptyCartText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 },
    paymentSection: { marginBottom: 20 },
    sectionLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
    paymentMethods: { flexDirection: 'row', gap: 8 },
    paymentButton: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 2, gap: 8 },
    paymentButtonText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    chargesSection: { marginBottom: 20 },
    chargesInput: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    chargeButton: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    chargeTextInput: { flex: 1, height: 56, borderRadius: 16, borderWidth: 1, fontSize: 20, fontWeight: '800' },
    totalCard: { borderRadius: 24, padding: 24, marginBottom: 20 },
    totalLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    totalAmount: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1 },
    completeButton: { backgroundColor: '#059669', borderRadius: 20, paddingVertical: 20, alignItems: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
    completeButtonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0, elevation: 0 },
    completeButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 2 },
});

export default SalesCalculatorScreen;
