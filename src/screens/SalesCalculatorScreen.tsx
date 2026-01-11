// Sales Calculator Screen - POS for processing sales (works offline)
import React, { useState, useMemo } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { useShop } from '../store/ShopContext';
import { PaymentMethod, Item } from '../types';
import { formatCurrency } from '../utils';
import {
    Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle,
    Wallet, CreditCard, Scissors
} from 'lucide-react-native';

const SalesCalculatorScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { items, addSale } = useShop();
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<{ id: string; quantity: number }[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [additionalCharges, setAdditionalCharges] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);

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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.scrollView}>
                {/* Search */}
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

                {/* Search Results */}
                {searchTerm && filteredItems.length > 0 && (
                    <View style={styles.searchResults}>
                        {filteredItems.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.searchItem}
                                onPress={() => addToCart(item)}
                                disabled={item.quantityInStock <= 0}
                            >
                                <View style={styles.searchItemInfo}>
                                    <View style={styles.searchItemHeader}>
                                        <Text style={styles.searchItemName}>{item.name}</Text>
                                        {item.allowFractional && <Scissors color="#818CF8" size={14} />}
                                    </View>
                                    <Text style={styles.searchItemMeta}>
                                        {item.sku} • Stock: {item.quantityInStock}
                                    </Text>
                                </View>
                                <View style={styles.searchItemPrice}>
                                    <Text style={styles.searchItemPriceText}>{formatCurrency(item.sellingPrice)}</Text>
                                    <Plus color="#818CF8" size={18} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Cart */}
                <View style={styles.cartSection}>
                    <View style={styles.cartHeader}>
                        <View style={styles.cartTitleRow}>
                            <ShoppingCart color="#4F46E5" size={20} />
                            <Text style={styles.cartTitle}>Cart ({cart.length} items)</Text>
                        </View>
                        {cart.length > 0 && (
                            <TouchableOpacity onPress={() => setCart([])}>
                                <Text style={styles.clearButton}>CLEAR</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {cartDetails.map(item => (
                        <View key={item.id} style={styles.cartItem}>
                            <View style={styles.cartItemInfo}>
                                <View style={styles.cartItemHeader}>
                                    <Text style={styles.cartItemName}>{item.name}</Text>
                                    {item.allowFractional && <Scissors color="#818CF8" size={14} />}
                                </View>
                                <Text style={styles.cartItemPrice}>
                                    {formatCurrency(item.sellingPrice)} / {item.unit}
                                </Text>
                            </View>

                            <View style={styles.quantityControls}>
                                <TouchableOpacity
                                    style={styles.qtyButton}
                                    onPress={() => updateQuantity(item.id, -1)}
                                >
                                    <Minus color="#64748B" size={16} />
                                </TouchableOpacity>
                                <Text style={styles.qtyText}>{item.cartQuantity}</Text>
                                <TouchableOpacity
                                    style={styles.qtyButton}
                                    onPress={() => updateQuantity(item.id, 1)}
                                    disabled={item.cartQuantity >= item.quantityInStock}
                                >
                                    <Plus color="#64748B" size={16} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.cartItemTotal}>
                                {formatCurrency(item.sellingPrice * item.cartQuantity)}
                            </Text>

                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => removeFromCart(item.id)}
                            >
                                <Trash2 color="#EF4444" size={18} />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {cart.length === 0 && (
                        <View style={styles.emptyCart}>
                            <ShoppingCart color="#CBD5E1" size={48} />
                            <Text style={styles.emptyCartText}>Cart is empty</Text>
                        </View>
                    )}
                </View>

                {/* Payment Method */}
                <View style={styles.paymentSection}>
                    <Text style={styles.sectionLabel}>Payment Type</Text>
                    <View style={styles.paymentMethods}>
                        {Object.values(PaymentMethod).map(method => (
                            <TouchableOpacity
                                key={method}
                                style={[
                                    styles.paymentButton,
                                    paymentMethod === method && styles.paymentButtonActive
                                ]}
                                onPress={() => setPaymentMethod(method)}
                            >
                                {method === PaymentMethod.CASH && <Wallet color={paymentMethod === method ? '#4F46E5' : '#94A3B8'} size={20} />}
                                {method === PaymentMethod.BANK_TRANSFER && <CheckCircle color={paymentMethod === method ? '#4F46E5' : '#94A3B8'} size={20} />}
                                {method === PaymentMethod.CARD && <CreditCard color={paymentMethod === method ? '#4F46E5' : '#94A3B8'} size={20} />}
                                <Text style={[
                                    styles.paymentButtonText,
                                    paymentMethod === method && styles.paymentButtonTextActive
                                ]}>
                                    {method.replace('_', ' ')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Additional Charges */}
                <View style={styles.chargesSection}>
                    <Text style={styles.sectionLabel}>Extra Fee (POS charge, etc.)</Text>
                    <View style={styles.chargesInput}>
                        <TouchableOpacity
                            style={styles.chargeButton}
                            onPress={() => setAdditionalCharges(Math.max(0, additionalCharges - 50))}
                        >
                            <Minus color="#64748B" size={20} />
                        </TouchableOpacity>
                        <TextInput
                            style={styles.chargeTextInput}
                            value={additionalCharges.toString()}
                            onChangeText={(t) => setAdditionalCharges(Number(t) || 0)}
                            keyboardType="numeric"
                            textAlign="center"
                        />
                        <TouchableOpacity
                            style={styles.chargeButton}
                            onPress={() => setAdditionalCharges(additionalCharges + 50)}
                        >
                            <Plus color="#64748B" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Total */}
                <View style={styles.totalCard}>
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: '600',
        color: '#0F172A',
    },
    searchResults: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
        overflow: 'hidden',
    },
    searchItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    searchItemInfo: {
        flex: 1,
    },
    searchItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchItemName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    searchItemMeta: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginTop: 4,
    },
    searchItemPrice: {
        alignItems: 'flex-end',
    },
    searchItemPriceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4F46E5',
        marginBottom: 4,
    },
    cartSection: {
        backgroundColor: '#fff',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 20,
        overflow: 'hidden',
    },
    cartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    cartTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cartTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    clearButton: {
        fontSize: 10,
        fontWeight: '800',
        color: '#EF4444',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cartItemInfo: {
        flex: 1,
    },
    cartItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    cartItemPrice: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    qtyButton: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        minWidth: 40,
        textAlign: 'center',
    },
    cartItemTotal: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0F172A',
        marginHorizontal: 12,
        minWidth: 70,
        textAlign: 'right',
    },
    removeButton: {
        padding: 8,
    },
    emptyCart: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyCartText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 12,
    },
    paymentSection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    paymentMethods: {
        flexDirection: 'row',
        gap: 8,
    },
    paymentButton: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 8,
    },
    paymentButtonActive: {
        borderColor: '#4F46E5',
        backgroundColor: '#EEF2FF',
    },
    paymentButtonText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    paymentButtonTextActive: {
        color: '#4F46E5',
    },
    chargesSection: {
        marginBottom: 20,
    },
    chargesInput: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chargeButton: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chargeTextInput: {
        flex: 1,
        height: 56,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        fontSize: 20,
        fontWeight: '800',
        color: '#0F172A',
    },
    totalCard: {
        backgroundColor: '#0F172A',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    totalAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -1,
    },
    completeButton: {
        backgroundColor: '#059669',
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: 'center',
        shadowColor: '#059669',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    completeButtonDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
        elevation: 0,
    },
    completeButtonText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});

export default SalesCalculatorScreen;
