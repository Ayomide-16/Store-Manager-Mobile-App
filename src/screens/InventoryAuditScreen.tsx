// Inventory Audit Log Screen - Admin Only
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { UserRole } from '../types';
import { formatDate, formatTime } from '../utils';
import { ClipboardList, Search, User, Package, Calendar, Lock } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const InventoryAuditScreen: React.FC = () => {
    const { currentUser, inventoryLogs, syncNow, isLoading } = useShop();
    const { theme } = useTheme();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const filteredLogs = useMemo(() => {
        let result = inventoryLogs;

        // Apply date filter
        switch (dateFilter) {
            case 'today':
                result = result.filter(l => l.createdAt.split('T')[0] === today);
                break;
            case 'week':
                result = result.filter(l => l.createdAt.split('T')[0] >= weekAgo);
                break;
            case 'month':
                result = result.filter(l => l.createdAt.split('T')[0] >= monthAgo);
                break;
        }

        // Apply search
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            result = result.filter(l =>
                l.itemName.toLowerCase().includes(search) ||
                l.userName.toLowerCase().includes(search) ||
                l.reason.toLowerCase().includes(search)
            );
        }

        return result;
    }, [inventoryLogs, dateFilter, searchTerm, today, weekAgo, monthAgo]);

    // Non-admin access denied
    if (!isAdmin) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <View style={styles.accessDenied}>
                    <Lock color={theme.textMuted} size={64} />
                    <Text style={[styles.accessDeniedText, { color: theme.textSecondary }]}>Admin Access Required</Text>
                    <Text style={[styles.accessDeniedSubtext, { color: theme.textMuted }]}>
                        Only administrators can view inventory audit logs
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const getFieldLabel = (field: string) => {
        const labels: Record<string, string> = {
            quantityInStock: 'Stock Level',
            sellingPrice: 'Selling Price',
            costPrice: 'Cost Price',
            name: 'Product Name',
            reorderLevel: 'Reorder Level',
        };
        return labels[field] || field;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <SyncIndicator />

            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Inventory Audit Log</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    {filteredLogs.length} changes recorded
                </Text>
            </View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Search color={theme.textMuted} size={20} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search by item, user, or reason..."
                    placeholderTextColor={theme.textMuted}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {/* Date Filter */}
            <View style={styles.filterRow}>
                {(['today', 'week', 'month', 'all'] as const).map(filter => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterChip,
                            { backgroundColor: dateFilter === filter ? theme.primary : theme.surfaceAlt }
                        ]}
                        onPress={() => setDateFilter(filter)}
                    >
                        <Text style={[
                            styles.filterChipText,
                            { color: dateFilter === filter ? '#fff' : theme.textSecondary }
                        ]}>
                            {filter === 'all' ? 'All Time' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.list}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} tintColor={theme.primary} />}
            >
                {filteredLogs.map(log => (
                    <View key={log.id} style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.logHeader}>
                            <View style={[styles.logIcon, { backgroundColor: theme.warningLight }]}>
                                <Package color={theme.warning} size={18} />
                            </View>
                            <View style={styles.logInfo}>
                                <Text style={[styles.logItemName, { color: theme.text }]}>{log.itemName}</Text>
                                <Text style={[styles.logTime, { color: theme.textMuted }]}>
                                    {formatDate(log.createdAt)} at {formatTime(log.createdAt)}
                                </Text>
                            </View>
                        </View>

                        <View style={[styles.changeRow, { backgroundColor: theme.surfaceAlt }]}>
                            <Text style={[styles.changeLabel, { color: theme.textMuted }]}>{getFieldLabel(log.fieldChanged)}</Text>
                            <View style={styles.changeValues}>
                                <Text style={[styles.oldValue, { color: theme.danger }]}>{log.oldValue}</Text>
                                <Text style={[styles.arrow, { color: theme.textMuted }]}>→</Text>
                                <Text style={[styles.newValue, { color: theme.success }]}>{log.newValue}</Text>
                            </View>
                        </View>

                        <View style={styles.logMeta}>
                            <View style={styles.metaItem}>
                                <User color={theme.textMuted} size={14} />
                                <Text style={[styles.metaText, { color: theme.textSecondary }]}>{log.userName}</Text>
                            </View>
                        </View>

                        <View style={[styles.reasonBox, { borderColor: theme.border }]}>
                            <Text style={[styles.reasonLabel, { color: theme.textMuted }]}>Reason:</Text>
                            <Text style={[styles.reasonText, { color: theme.text }]}>{log.reason}</Text>
                        </View>
                    </View>
                ))}

                {filteredLogs.length === 0 && (
                    <View style={styles.emptyState}>
                        <ClipboardList color={theme.textMuted} size={48} />
                        <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                            No audit logs found
                        </Text>
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
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, marginBottom: 16 },
    searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16 },
    filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    filterChipText: { fontSize: 12, fontWeight: '700' },
    list: { flex: 1, paddingHorizontal: 20 },
    logCard: { borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1 },
    logHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    logIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    logInfo: { flex: 1 },
    logItemName: { fontSize: 16, fontWeight: '700' },
    logTime: { fontSize: 12, marginTop: 2 },
    changeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 12 },
    changeLabel: { fontSize: 12, fontWeight: '600' },
    changeValues: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    oldValue: { fontSize: 14, fontWeight: '700', textDecorationLine: 'line-through' },
    arrow: { fontSize: 14 },
    newValue: { fontSize: 14, fontWeight: '700' },
    logMeta: { flexDirection: 'row', marginBottom: 12 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 12, fontWeight: '600' },
    reasonBox: { borderTopWidth: 1, paddingTop: 12 },
    reasonLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    reasonText: { fontSize: 14, lineHeight: 20 },
    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyStateText: { fontSize: 14, fontWeight: '600', marginTop: 16 },
    accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    accessDeniedText: { fontSize: 18, fontWeight: '800', marginTop: 24 },
    accessDeniedSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});

export default InventoryAuditScreen;
