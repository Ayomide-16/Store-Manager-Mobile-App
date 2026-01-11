// Main Navigation Setup with All Screens
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
    Home, ShoppingCart, Package, Receipt, Banknote, MoreHorizontal,
    BarChart3, Calculator, Users, Truck
} from 'lucide-react-native';

import { useShop } from '../store/ShopContext';
import { UserRole } from '../types';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import SalesCalculatorScreen from '../screens/SalesCalculatorScreen';
import InventoryScreen from '../screens/InventoryScreen';
import SalesHistoryScreen from '../screens/SalesHistoryScreen';
import POSWithdrawalsScreen from '../screens/POSWithdrawalsScreen';
import RestocksScreen from '../screens/RestocksScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ReconciliationScreen from '../screens/ReconciliationScreen';
import UserManagementScreen from '../screens/UserManagementScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// More Menu Screen (for additional screens)
const MoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { currentUser, logout } = useShop();
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    const menuItems = [
        { name: 'Restocks', screen: 'RestocksStack', icon: Truck, color: '#059669', adminOnly: false },
        { name: 'Reports', screen: 'ReportsStack', icon: BarChart3, color: '#2563EB', adminOnly: true },
        { name: 'Reconciliation', screen: 'ReconciliationStack', icon: Calculator, color: '#7C3AED', adminOnly: true },
        { name: 'User Management', screen: 'UserManagementStack', icon: Users, color: '#EC4899', adminOnly: true },
    ];

    return (
        <View style={styles.moreContainer}>
            <Text style={styles.moreTitle}>More Options</Text>

            {menuItems.map((item, idx) => {
                if (item.adminOnly && !isAdmin) return null;
                const Icon = item.icon;
                return (
                    <TouchableOpacity
                        key={idx}
                        style={styles.menuItem}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                            <Icon color={item.color} size={22} />
                        </View>
                        <Text style={styles.menuLabel}>{item.name}</Text>
                    </TouchableOpacity>
                );
            })}

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

// Stack navigators for each screen (needed for proper navigation from More menu)
const RestocksStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="RestocksMain" component={RestocksScreen} />
    </Stack.Navigator>
);

const ReportsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ReportsMain" component={ReportsScreen} />
    </Stack.Navigator>
);

const ReconciliationStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ReconciliationMain" component={ReconciliationScreen} />
    </Stack.Navigator>
);

const UserManagementStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UserManagementMain" component={UserManagementScreen} />
    </Stack.Navigator>
);

// Main Tab Navigator
const TabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 0,
                    height: 80,
                    paddingBottom: 20,
                    paddingTop: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 16,
                },
                tabBarActiveTintColor: '#4F46E5',
                tabBarInactiveTintColor: '#94A3B8',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color }) => <Home color={color} size={22} />,
                }}
            />
            <Tab.Screen
                name="SalesCalculator"
                component={SalesCalculatorScreen}
                options={{
                    tabBarLabel: 'Sales',
                    tabBarIcon: ({ color }) => <ShoppingCart color={color} size={22} />,
                }}
            />
            <Tab.Screen
                name="Inventory"
                component={InventoryScreen}
                options={{
                    tabBarIcon: ({ color }) => <Package color={color} size={22} />,
                }}
            />
            <Tab.Screen
                name="POSWithdrawals"
                component={POSWithdrawalsScreen}
                options={{
                    tabBarLabel: 'POS',
                    tabBarIcon: ({ color }) => <Banknote color={color} size={22} />,
                }}
            />
            <Tab.Screen
                name="More"
                component={MoreScreen}
                options={{
                    tabBarIcon: ({ color }) => <MoreHorizontal color={color} size={22} />,
                }}
            />
        </Tab.Navigator>
    );
};

// Main Stack with all screens accessible
const MainStack: React.FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="SalesHistory" component={SalesHistoryScreen} />
            <Stack.Screen name="RestocksStack" component={RestocksStack} />
            <Stack.Screen name="ReportsStack" component={ReportsStack} />
            <Stack.Screen name="ReconciliationStack" component={ReconciliationStack} />
            <Stack.Screen name="UserManagementStack" component={UserManagementStack} />
        </Stack.Navigator>
    );
};

// Root Navigator (Auth + Main)
const RootNavigator: React.FC = () => {
    const { currentUser, isLoading } = useShop();

    if (isLoading) {
        return null;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {currentUser ? (
                <Stack.Screen name="Main" component={MainStack} />
            ) : (
                <Stack.Screen name="Login" component={LoginScreen} />
            )}
        </Stack.Navigator>
    );
};

// Navigation Container
const AppNavigator: React.FC = () => {
    return (
        <NavigationContainer>
            <RootNavigator />
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    moreContainer: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 20,
        paddingTop: 60,
    },
    moreTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    menuLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    logoutButton: {
        marginTop: 'auto',
        backgroundColor: '#FEF2F2',
        padding: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#DC2626',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default AppNavigator;
