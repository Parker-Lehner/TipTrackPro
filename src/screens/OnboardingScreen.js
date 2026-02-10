import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import StorageService from '../services/StorageService';

const { width, height } = Dimensions.get('window');

const ROLES = [
  { id: 'server', label: 'Server', icon: 'restaurant-outline', wage: 2.13 },
  { id: 'bartender', label: 'Bartender', icon: 'wine-outline', wage: 2.13 },
  { id: 'barback', label: 'Barback', icon: 'beer-outline', wage: 7.25 },
  { id: 'host', label: 'Host', icon: 'people-outline', wage: 7.25 },
  { id: 'busser', label: 'Busser', icon: 'cafe-outline', wage: 7.25 },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', wage: 7.25 },
];

const OnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);
  const [hourlyWage, setHourlyWage] = useState('');
  const [federalTax, setFederalTax] = useState('12');
  const [stateTax, setStateTax] = useState('5');
  
  const progress = useSharedValue(0);
  const scrollRef = useRef(null);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setHourlyWage(role.wage.toString());
  };

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
      progress.value = withSpring((step + 1) / 2);
    } else {
      // Save settings and complete onboarding
      await StorageService.saveSettings({
        onboardingComplete: true,
        role: selectedRole?.id || 'server',
        hourlyWage: parseFloat(hourlyWage) || 2.13,
        federalTaxRate: parseFloat(federalTax) || 12,
        stateTaxRate: parseFloat(stateTax) || 5,
        ficaRate: 7.65,
        defaultTipOutPercentage: 3,
        currency: 'USD',
        weekStartsOn: 0,
        theme: 'dark',
      });
      navigation.replace('Main');
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      progress.value = withSpring((step - 1) / 2);
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${(progress.value + 0.33) * 100}%`,
  }));

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={theme.colors.gradient.primary}
                style={styles.iconGradient}
              >
                <Ionicons name="wallet-outline" size={48} color={theme.colors.text.primary} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Welcome to TipTrack Pro</Text>
            <Text style={styles.subtitle}>
              Track your tips, predict your paycheck, and take control of your earnings.
            </Text>
            <View style={styles.featureList}>
              {[
                { icon: 'add-circle-outline', text: 'Log shifts in seconds' },
                { icon: 'analytics-outline', text: 'See weekly summaries' },
                { icon: 'calculator-outline', text: 'Preview your paycheck' },
                { icon: 'pie-chart-outline', text: 'Calculate tip-outs instantly' },
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name={feature.icon} size={24} color={theme.colors.primary} />
                  <Text style={styles.featureText}>{feature.text}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What's your role?</Text>
            <Text style={styles.subtitle}>
              This helps us set your default hourly wage
            </Text>
            <View style={styles.roleGrid}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    selectedRole?.id === role.id && styles.roleCardSelected,
                  ]}
                  onPress={() => handleRoleSelect(role)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={role.icon}
                    size={32}
                    color={
                      selectedRole?.id === role.id
                        ? theme.colors.primary
                        : theme.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.roleLabel,
                      selectedRole?.id === role.id && styles.roleLabelSelected,
                    ]}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.stepContainer}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.title}>Set your rates</Text>
              <Text style={styles.subtitle}>
                We'll use these to estimate your take-home pay
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hourly Wage</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={hourlyWage}
                    onChangeText={setHourlyWage}
                    keyboardType="decimal-pad"
                    placeholder="2.13"
                    placeholderTextColor={theme.colors.text.muted}
                  />
                  <Text style={styles.inputSuffix}>/hr</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Federal Tax Rate</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={federalTax}
                    onChangeText={setFederalTax}
                    keyboardType="decimal-pad"
                    placeholder="12"
                    placeholderTextColor={theme.colors.text.muted}
                  />
                  <Text style={styles.inputSuffix}>%</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>State Tax Rate</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={stateTax}
                    onChangeText={setStateTax}
                    keyboardType="decimal-pad"
                    placeholder="5"
                    placeholderTextColor={theme.colors.text.muted}
                  />
                  <Text style={styles.inputSuffix}>%</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>
                  FICA (Social Security + Medicare) is automatically calculated at 7.65%
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    if (step === 1 && !selectedRole) return false;
    if (step === 2 && !hourlyWage) return false;
    return true;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderStep()}
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}

        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!canProceed()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={canProceed() ? theme.colors.gradient.primary : ['#333', '#333']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {step === 2 ? 'Get Started' : 'Continue'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.text.primary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...theme.typography.title,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  featureList: {
    marginTop: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.md,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roleCard: {
    width: '48%',
    aspectRatio: 1.2,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background.elevated,
  },
  roleLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
  roleLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  inputPrefix: {
    ...theme.typography.title,
    color: theme.colors.text.secondary,
  },
  input: {
    flex: 1,
    ...theme.typography.title,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  inputSuffix: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  infoText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 40,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
  },
  nextButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
    marginRight: theme.spacing.sm,
  },
});

export default OnboardingScreen;