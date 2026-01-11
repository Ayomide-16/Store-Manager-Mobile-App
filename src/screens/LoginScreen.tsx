// Login Screen with Safe Area, Theme, and Web Link
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, Linking, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShop } from '../store/ShopContext';
import { useTheme } from '../store/ThemeContext';
import { Store, Mail, Lock, Eye, EyeOff, Loader2, Wifi, ExternalLink } from 'lucide-react-native';

const WEB_APP_URL = 'https://naijashop-manager.vercel.app';

const LoginScreen: React.FC = () => {
    const { login, appState } = useShop();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const openWebApp = async () => {
        try {
            await Linking.openURL(WEB_APP_URL);
        } catch (err) {
            Alert.alert('Error', 'Could not open web browser');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Logo */}
                <View style={[styles.logoContainer, { backgroundColor: theme.primaryLight }]}>
                    <Store color={theme.primary} size={48} />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>Shop Manager</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to your account</Text>

                {/* Offline Indicator */}
                {!appState.isOnline && (
                    <View style={[styles.offlineBadge, { backgroundColor: theme.warningLight }]}>
                        <Wifi color={theme.warning} size={16} />
                        <Text style={[styles.offlineText, { color: theme.warning }]}>Offline Mode Available</Text>
                    </View>
                )}

                {/* Error Message */}
                {error && (
                    <View style={[styles.errorBox, { backgroundColor: theme.dangerLight }]}>
                        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                    </View>
                )}

                {/* Email Input */}
                <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Mail color={theme.textMuted} size={20} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Email address"
                        placeholderTextColor={theme.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {/* Password Input */}
                <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Lock color={theme.textMuted} size={20} />
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        placeholder="Password"
                        placeholderTextColor={theme.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                            <EyeOff color={theme.textMuted} size={20} />
                        ) : (
                            <Eye color={theme.textMuted} size={20} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 color="#fff" size={20} />
                    ) : (
                        <Text style={styles.loginButtonText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                {/* Web App Link */}
                <View style={styles.webLinkContainer}>
                    <Text style={[styles.webLinkText, { color: theme.textSecondary }]}>
                        Don't have an account?{'\n'}New shops are onboarded via the web platform.
                    </Text>
                    <TouchableOpacity style={styles.webLinkButton} onPress={openWebApp}>
                        <ExternalLink color={theme.primary} size={16} />
                        <Text style={[styles.webLinkButtonText, { color: theme.primary }]}>
                            Create Account on Web
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        width: 96,
        height: 96,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 24,
    },
    offlineText: {
        fontSize: 12,
        fontWeight: '700',
    },
    errorBox: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 12,
        fontSize: 16,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    webLinkContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    webLinkText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 12,
    },
    webLinkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    webLinkButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default LoginScreen;
