// Sync Status Indicator with Theme support
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check, Loader2 } from 'lucide-react-native';

const SyncIndicator: React.FC = () => {
    const { appState, syncNow } = useShop();
    const { theme } = useTheme();
    const { isOnline, syncStatus, pendingSyncCount, lastSyncTime } = appState;

    const getStatusConfig = () => {
        if (!isOnline) return { icon: CloudOff, label: 'Offline', color: theme.textMuted, bg: theme.surfaceAlt };
        if (syncStatus === 'syncing') return { icon: Loader2, label: 'Syncing...', color: theme.info, bg: theme.infoLight };
        if (syncStatus === 'error') return { icon: AlertCircle, label: 'Sync Error', color: theme.danger, bg: theme.dangerLight };
        if (pendingSyncCount > 0) return { icon: RefreshCw, label: `${pendingSyncCount} pending`, color: theme.warning, bg: theme.warningLight };
        return { icon: Check, label: 'Synced', color: theme.success, bg: theme.successLight };
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <TouchableOpacity onPress={syncNow} style={styles.container}>
            <View style={[styles.badge, { backgroundColor: config.bg }]}>
                <Icon color={config.color} size={14} />
                <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
            </View>
            {isOnline && (
                <View style={[styles.dot, { backgroundColor: theme.success }]} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
});

export default SyncIndicator;
