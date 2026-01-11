// Reason Modal - For inventory edit justification
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { X, Save, AlertTriangle } from 'lucide-react-native';

interface ReasonModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    isLoading?: boolean;
}

const ReasonModal: React.FC<ReasonModalProps> = ({ visible, onClose, onSubmit, isLoading }) => {
    const { theme } = useTheme();
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!reason.trim()) {
            setError('Reason is required');
            return;
        }
        if (reason.trim().length < 10) {
            setError('Please provide a more detailed reason (at least 10 characters)');
            return;
        }
        setError('');
        onSubmit(reason.trim());
        setReason('');
    };

    const handleClose = () => {
        setReason('');
        setError('');
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: theme.surface }]}>
                    <View style={[styles.header, { borderBottomColor: theme.border }]}>
                        <View style={styles.headerLeft}>
                            <AlertTriangle color={theme.warning} size={24} />
                            <Text style={[styles.title, { color: theme.text }]}>Reason Required</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose}>
                            <X color={theme.textMuted} size={24} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                            Please provide a reason for this inventory change. This will be logged for audit purposes.
                        </Text>

                        <Text style={[styles.label, { color: theme.textMuted }]}>Reason for Change</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {
                                    backgroundColor: theme.surfaceAlt,
                                    borderColor: error ? theme.danger : theme.border,
                                    color: theme.text
                                }
                            ]}
                            placeholder="e.g., Stock count correction after physical audit"
                            placeholderTextColor={theme.textMuted}
                            value={reason}
                            onChangeText={(t) => { setReason(t); setError(''); }}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />

                        {error && (
                            <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                        )}

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.cancelButton, { backgroundColor: theme.surfaceAlt }]}
                                onPress={handleClose}
                            >
                                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                <Save color="#fff" size={18} />
                                <Text style={styles.submitButtonText}>
                                    {isLoading ? 'Saving...' : 'Save Changes'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
    content: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '80%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    title: { fontSize: 18, fontWeight: '800' },
    body: { padding: 24 },
    description: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
    label: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    input: { borderWidth: 1, borderRadius: 16, padding: 16, fontSize: 16, minHeight: 120 },
    errorText: { fontSize: 12, fontWeight: '600', marginTop: 8 },
    buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
    cancelButton: { flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
    cancelButtonText: { fontSize: 14, fontWeight: '700' },
    submitButton: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4F46E5', paddingVertical: 16, borderRadius: 14 },
    submitButtonDisabled: { opacity: 0.7 },
    submitButtonText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

export default ReasonModal;
