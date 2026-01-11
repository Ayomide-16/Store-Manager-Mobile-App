// User Management Screen - Manage shop users (admin only)
import React, { useState } from 'react';
import {
    View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
    Modal, Alert, RefreshControl
} from 'react-native';
import { useShop } from '../store/ShopContext';
import { UserRole } from '../types';
import { formatDate } from '../utils';
import { Users, Plus, X, Shield, User, Mail, Save, Loader2 } from 'lucide-react-native';
import SyncIndicator from '../components/SyncIndicator';

const UserManagementScreen: React.FC = () => {
    const { currentUser, syncNow, isLoading } = useShop();
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
            <View style={styles.container}>
                <SyncIndicator />
                <View style={styles.accessDenied}>
                    <Users color="#CBD5E1" size={64} />
                    <Text style={styles.accessDeniedText}>Admin Access Required</Text>
                    <Text style={styles.accessDeniedSubtext}>User management is only available to administrators</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SyncIndicator />

            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Users</Text>
                    <Text style={styles.headerSubtitle}>Manage shop staff accounts</Text>
                </View>
                <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
                    <Plus color="#fff" size={20} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={syncNow} />}
            >
                {users.map(user => (
                    <View key={user.id} style={styles.userCard}>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userInitial}>{user.fullName.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{user.fullName}</Text>
                            <Text style={styles.userEmail}>{user.email}</Text>
                            <View style={[styles.roleBadge, user.role === UserRole.ADMIN ? styles.adminBadge : styles.staffBadge]}>
                                {user.role === UserRole.ADMIN ? (
                                    <Shield color="#4F46E5" size={12} />
                                ) : (
                                    <User color="#059669" size={12} />
                                )}
                                <Text style={[styles.roleText, user.role === UserRole.ADMIN ? styles.adminText : styles.staffText]}>
                                    {user.role}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.joinDate}>Joined {formatDate(user.createdAt)}</Text>
                    </View>
                ))}

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Note</Text>
                    <Text style={styles.infoText}>
                        Adding new users requires an internet connection as accounts are created in the cloud.
                        Existing user data is available offline.
                    </Text>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Add User Modal */}
            <Modal visible={showModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Add User</Text>
                            <TouchableOpacity onPress={() => setShowModal(false)}>
                                <X color="#64748B" size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <View style={styles.inputRow}>
                                <User color="#94A3B8" size={18} />
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.fullName}
                                    onChangeText={(t) => setFormData({ ...formData, fullName: t })}
                                    placeholder="Enter full name"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Email</Text>
                            <View style={styles.inputRow}>
                                <Mail color="#94A3B8" size={18} />
                                <TextInput
                                    style={styles.textInput}
                                    value={formData.email}
                                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                                    placeholder="Enter email address"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <Text style={styles.inputLabel}>Password</Text>
                            <TextInput
                                style={styles.textInputFull}
                                value={formData.password}
                                onChangeText={(t) => setFormData({ ...formData, password: t })}
                                placeholder="Enter password"
                                placeholderTextColor="#94A3B8"
                                secureTextEntry
                            />

                            <Text style={styles.inputLabel}>Role</Text>
                            <View style={styles.roleSelector}>
                                <TouchableOpacity
                                    style={[styles.roleOption, formData.role === UserRole.SALESPERSON && styles.roleOptionActive]}
                                    onPress={() => setFormData({ ...formData, role: UserRole.SALESPERSON })}
                                >
                                    <User color={formData.role === UserRole.SALESPERSON ? '#059669' : '#94A3B8'} size={20} />
                                    <Text style={[styles.roleOptionText, formData.role === UserRole.SALESPERSON && styles.roleOptionTextActive]}>
                                        Salesperson
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.roleOption, formData.role === UserRole.ADMIN && styles.roleOptionActive]}
                                    onPress={() => setFormData({ ...formData, role: UserRole.ADMIN })}
                                >
                                    <Shield color={formData.role === UserRole.ADMIN ? '#4F46E5' : '#94A3B8'} size={20} />
                                    <Text style={[styles.roleOptionText, formData.role === UserRole.ADMIN && { color: '#4F46E5' }]}>
                                        Admin
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
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
    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    userAvatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    userInitial: { fontSize: 20, fontWeight: '800', color: '#4F46E5' },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
    userEmail: { fontSize: 12, color: '#64748B', marginTop: 2 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginTop: 8, alignSelf: 'flex-start' },
    adminBadge: { backgroundColor: '#EEF2FF' },
    staffBadge: { backgroundColor: '#ECFDF5' },
    roleText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    adminText: { color: '#4F46E5' },
    staffText: { color: '#059669' },
    joinDate: { fontSize: 10, color: '#94A3B8', fontWeight: '600' },
    infoCard: { backgroundColor: '#F1F5F9', padding: 20, borderRadius: 16, marginTop: 8 },
    infoTitle: { fontSize: 12, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 },
    infoText: { fontSize: 14, color: '#64748B', lineHeight: 22 },
    accessDenied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
    accessDeniedText: { fontSize: 18, fontWeight: '800', color: '#64748B', marginTop: 24 },
    accessDeniedSubtext: { fontSize: 14, color: '#94A3B8', marginTop: 8, textAlign: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
    modalBody: { padding: 24 },
    inputLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16 },
    textInput: { flex: 1, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#0F172A' },
    textInputFull: { backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, fontWeight: '600', color: '#0F172A' },
    roleSelector: { flexDirection: 'row', gap: 12 },
    roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: 'transparent' },
    roleOptionActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
    roleOptionText: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
    roleOptionTextActive: { color: '#059669' },
    saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#4F46E5', paddingVertical: 18, borderRadius: 18, marginTop: 32, marginBottom: 40 },
    saveButtonDisabled: { opacity: 0.7 },
    saveButtonText: { fontSize: 12, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
});

export default UserManagementScreen;
