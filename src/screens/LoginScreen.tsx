// Login Screen - matches web app design
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useShop } from '../store/ShopContext';
import { Mail, Lock, Eye, EyeOff, Store } from 'lucide-react-native';

const LoginScreen: React.FC = () => {
    const { login, isLoading } = useShop();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLocalLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            Alert.alert('Login Failed', err.message || 'Invalid credentials');
        } finally {
            setLocalLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="dark" />

            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    <Store color="#4F46E5" size={40} />
                </View>
                <Text style={styles.title}>Shop Manager</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <Mail color="#94A3B8" size={20} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor="#94A3B8"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Lock color="#94A3B8" size={20} style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#94A3B8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeIcon}
                    >
                        {showPassword ? (
                            <EyeOff color="#94A3B8" size={20} />
                        ) : (
                            <Eye color="#94A3B8" size={20} />
                        )}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[styles.loginButton, (localLoading || isLoading) && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={localLoading || isLoading}
                >
                    {localLoading || isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <View style={styles.offlineBadge}>
                    <Text style={styles.offlineBadgeText}>Works Offline</Text>
                </View>
                <Text style={styles.footerText}>
                    All features available without internet. Data syncs automatically when online.
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#EEF2FF',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        marginTop: 8,
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#0F172A',
        fontWeight: '600',
    },
    eyeIcon: {
        padding: 8,
    },
    loginButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 16,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginTop: 8,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
    },
    offlineBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 12,
    },
    offlineBadgeText: {
        color: '#059669',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default LoginScreen;
