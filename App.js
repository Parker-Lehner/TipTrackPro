import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddShiftScreen from './src/screens/AddShiftScreen';
import WeekSummaryScreen from './src/screens/WeekSummaryScreen';
import TipOutCalculatorScreen from './src/screens/TipOutCalculatorScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import StorageService from './src/services/StorageService';
import theme from './src/theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar Icon Component
const TabIcon = ({ name, focused }) => {
  const icons = {
    Dashboard: '📊',
    'Add Shift': '➕',
    Summary: '📈',
    'Tip Out': '💰',
    Settings: '⚙️',
  };
  
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={styles.tabIconText}>{icons[name]}</Text>
    </View>
  );
};

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Add Shift" component={AddShiftScreen} />
      <Tab.Screen name="Summary" component={WeekSummaryScreen} />
      <Tab.Screen name="Tip Out" component={TipOutCalculatorScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const settings = await StorageService.getSettings();
      setIsOnboarded(settings?.onboardingComplete || false);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboarded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    setIsOnboarded(true);
  };

  if (isLoading) {
    return (
      <LinearGradient colors={theme.colors.gradientDark} style={styles.loadingContainer}>
        <Text style={styles.loadingText}>TipTrack Pro</Text>
        <StatusBar style="light" />
      </LinearGradient>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isOnboarded ? (
            <Stack.Screen name="Onboarding">
              {(props) => (
                <OnboardingScreen {...props} onComplete={handleOnboardingComplete} />
              )}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="Main" component={MainTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.typography.sizes.hero,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  tabBar: {
    backgroundColor: theme.colors.cardBackground,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
    height: 85,
  },
  tabBarLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    marginTop: theme.spacing.xs,
  },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconFocused: {
    backgroundColor: theme.colors.primaryMuted,
  },
  tabIconText: {
    fontSize: 20,
  },
});