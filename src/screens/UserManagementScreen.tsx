// User Management Screen with SafeAreaView and Dark Theme Support
import React, { useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Modal, Alert, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { UserRole } from '../types';
import { formatDate } from '../utils';
import { Users, Plus, X, Shield, User, Mail, Save, Loader2 } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const UserManagementScreen: React.FC = () => {
    const { currentUser, syncNow, isLoading } = useShop();
    const { theme } = useTheme();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        fullName: '',
        role: UserRole.SALESPERSON,
        password: '',
    });

    // Placeholder users (would come from store)
    const users = currentUser ? [currentUser] : [];

    const handleSaveUser = async () => {
        if (!formData.email || !formData.fullName || !formData.password) {
            Alert.alert('Error', 'All fields are required');
            return;
        }

        setIsSaving(true);
        try {
            // Would call store.addUser() here
            Alert.alert('Note', 'User management requires online connection to create accounts');
            setShowModal(false);
            setFormData({ email: '', fullName: '', role: UserRole.SALESPERSON, password: '' });
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAdmin) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
                <SyncIndicator />
                <View style={styles.accessDenied}>
                    <Users color={theme.textMuted} size={64} />
                    <Text style={[styles.accessDeniedText, { color: theme.textSecondary }]}>Admin Access Required</Text>
                    <Text style={[styles.accessDeniedSubtext, { color: theme.textMuted }]}>User management is only available to administrators</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            <SyncIndicator />

            <View style={styles.header}>
                <View>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Users</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Manage shop staff accounts</Text>
                </View>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={() => setShowModal(true)}>
                    <Plus color="#fff" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} tintColor={theme.primary} />}
            >
                {users.map(user => (
                    <View key={user.id} style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={[styles.userAvatar, { backgroundColor: theme.primaryLight }]}>
                            <Text style={[styles.userInitial, { color: theme.primary }]}>{user.fullName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={[styles.userName, { color: theme.text }]}>{user.fullName}</Text>
                            <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
                            <View style={[styles.roleBadge, { backgroundColor: user.role === UserRole.ADMIN ? theme.primaryLight : theme.successLight }]}>
                                {user.role === UserRole.ADMIN ? (
                                    <Shield color={theme.primary} size={12} />
                                ) : (
                                    <User color={theme.success} size={12} />
                                )}
                                <Text style={[styles.roleText, { color: user.role === UserRole.ADMIN ? theme.primary : theme.success }]}>
                                    {user.role}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.joinDate, { color: theme.textMuted }]}>Joined {formatDate(user.createdAt)}</Text>
                    </View>
                ))}

                <View style={[styles.infoCard, { backgroundColor: theme.surfaceAlt }]}>
                    <Text style={[styles.infoTitle, { color: theme.textSecondary }]}>Note</Text>
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        Adding new users requires an internet connection as accounts are created in the cloud.
                        Existing user data is available offline.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add User Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Add User</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <X color={theme.textMuted} size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Full Name</Text>
                            <View style={[styles.inputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                                <User color={theme.textMuted} size={18} />
                                <TextInput
                                    style={[styles.textInput, { color: theme.text }]}
                                    value={formData.fullName}
                                    onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                                    placeholder="Enter full name"
                                    placeholderTextColor={theme.textMuted}
                                />
                            </View>

                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Email</Text>
                            <View style={[styles.inputRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                                <Mail color={theme.textMuted} size={18} />
                                <TextInput
                                    style={[styles.textInput, { color: theme.text }]}
                                    value={formData.email}
                                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                                    placeholder="Enter email address"
                                    placeholderTextColor={theme.textMuted}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Password</Text>
                            <TextInput
                                style={[styles.textInputFull, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                                value={formData.password}
                                onChangeText={(t) => setFormData({ ...formData, password: t })}
                                placeholder="Enter password"
                                placeholderTextColor={theme.textMuted}
                                secureTextEntry
                            />

                            <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Role</Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.roleOption,
                                        { backgroundColor: theme.surfaceAlt },
                                        formData.role === UserRole.SALESPERSON && { borderColor: theme.success, backgroundColor: theme.successLight }
                                    ]}
                                    onPress={() => setFormData({ ...formData, role: UserRole.SALESPERSON })}
                                >
                                    <User color={formData.role === UserRole.SALESPERSON ? theme.success : theme.textMuted} size={20} />
                                    <Text style={[styles.roleOptionText, { color: formData.role === UserRole.SALESPERSON ? theme.success : theme.textMuted }]}>
                                        Salesperson
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.roleOption,
                                        { backgroundColor: theme.surfaceAlt },
                                        formData.role === UserRole.ADMIN && { borderColor: theme.primary, backgroundColor: theme.primaryLight }
                                    ]}
                                    onPress={() => setFormData({ ...formData, role: UserRole.ADMIN })}
                                >
                                    <Shield color={formData.role === UserRole.ADMIN ? theme.primary : theme.textMuted} size={20} />
                                    <Text style={[styles.roleOptionText, { color: formData.role === UserRole.ADMIN ? theme.primary : theme.textMuted }]}>
                                        Admin
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.primary }, isSaving && styles.saveButtonDisabled]}
                                onPress={handleSaveUser}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 color="#fff" size={20} /> : <Save color="#fff" size={20} />}
                                <Text style={styles.saveButtonText}>Create User</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    headerTitle: { fontSize: 24, fontWeight: '800' },
    headerSubtitle: { fontSize: 14, marginTop: 2 },
    addButton: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, paddingHorizontal: 20 },
    userCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
    userAvatar: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    userInitial: { fontSize: 20, fontWeight: '800' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700' },
    userEmail: { fontSize: 12, marginTop: 2 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    roleText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    joinDate: { fontSize: 10, fontWeight: '600' },
    infoCard: { padding: 20, borderRadius: 16, marginTop: 8 },
    infoTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8 },
    infoText: { fontSize: 14, lineHeight: 22 },
    accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    accessDeniedText: { fontSize: 18, fontWeight: '800', marginTop: 24 },
    accessDeniedSubtext: { fontSize: 14, marginTop: 8, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    modalBody: { padding: 24 },
    inputLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16 },
    textInput: { flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: '600' },
    textInputFull: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600' },
    roleSelector: { flexDirection: 'row', gap: 12 },
    roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
    roleOptionText: { fontSize: 12, fontWeight: '700' },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, marginTop: 32, marginBottom: 40 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
});

export default UserManagementScreen;
