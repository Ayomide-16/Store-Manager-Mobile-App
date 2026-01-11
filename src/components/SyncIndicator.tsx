// Sync Indicator Component - shows sync status
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useShop } from '../store/ShopContext';
import { CheckCircle, RefreshCw, WifiOff, AlertCircle, Clock } from 'lucide-react-native';

const SyncIndicator: React.FC = () => {
    const { appState, syncNow } = useShop();
    const { syncStatus, lastSyncTime, pendingSyncCount, isOnline } = appState;

    const getStatusConfig = () => {
        if (!isOnline) {
            return {
                icon: WifiOff,
                label: 'Offline',
                sublabel: pendingSyncCount > 0 ? `${pendingSyncCount} changes pending` : 'Working offline',
                color: '#D97706',
                bg: '#FFFBEB',
            };
        }

        switch (syncStatus) {
            case 'syncing':
                return {
                    icon: RefreshCw,
                    label: 'Syncing...',
                    sublabel: 'Please wait',
                    color: '#2563EB',
                    bg: '#EFF6FF',
                    spinning: true,
                };
            case 'pending':
                return {
                    icon: AlertCircle,
                    label: 'Pending',
                    sublabel: `${pendingSyncCount} changes to sync`,
                    color: '#D97706',
                    bg: '#FFFBEB',
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    label: 'Sync Error',
                    sublabel: 'Tap to retry',
                    color: '#DC2626',
                    bg: '#FEF2F2',
                };
            default:
                return {
                    icon: CheckCircle,
                    label: 'Synced',
                    sublabel: lastSyncTime
                        ? `Last: ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'All data up to date',
                    color: '#059669',
                    bg: '#ECFDF5',
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: config.bg }]}
            onPress={syncNow}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                {config.spinning ? (
                    <ActivityIndicator color={config.color} size="small" />
                ) : (
                    <Icon color={config.color} size={18} />
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
                <Text style={styles.sublabel}>{config.sublabel}</Text>
            </View>
            {syncStatus !== 'syncing' && (
                <RefreshCw color={config.color} size={16} style={styles.refreshIcon} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 10,
        marginBottom: 10,
        padding: 12,
        borderRadius: 16,
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sublabel: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    refreshIcon: {
        opacity: 0.6,
    },
});

export default SyncIndicator;
