import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import StorageService from '../services/StorageService';

const SettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    hourlyWage: '',
    federalTaxRate: '',
    stateTaxRate: '',
    role: 'server',
    darkMode: true,
    notifications: true,
    weekStartsOn: 'sunday',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await StorageService.getSettings();
      if (savedSettings) {
        setSettings({
          ...settings,
          ...savedSettings,
          hourlyWage: savedSettings.hourlyWage?.toString() || '',
          federalTaxRate: savedSettings.federalTaxRate?.toString() || '',
          stateTaxRate: savedSettings.stateTaxRate?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      const settingsToSave = {
        ...settings,
        hourlyWage: parseFloat(settings.hourlyWage) || 0,
        federalTaxRate: parseFloat(settings.federalTaxRate) || 0,
        stateTaxRate: parseFloat(settings.stateTaxRate) || 0,
      };
      await StorageService.saveSettings(settingsToSave);
      setHasChanges(false);
      Alert.alert('Saved', 'Your settings have been updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  const exportData = async () => {
    try {
      const shifts = await StorageService.getShifts();
      const data = JSON.stringify({ shifts, settings }, null, 2);
      // In a real app, you'd use Share API or file system
      Alert.alert(
        'Export Data',
        'Data export functionality would save your shifts and settings to a file.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your shifts and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAll();
              Alert.alert('Done', 'All data has been cleared.');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Onboarding' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
            }
          },
        },
      ]
    );
  };

  const roles = [
    { id: 'server', label: 'Server', icon: 'restaurant-outline' },
    { id: 'bartender', label: 'Bartender', icon: 'wine-outline' },
    { id: 'barback', label: 'Barback', icon: 'beer-outline' },
    { id: 'busser', label: 'Busser', icon: 'cafe-outline' },
    { id: 'host', label: 'Host', icon: 'people-outline' },
  ];

  const SettingRow = ({ icon, label, children, onPress }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      {children}
    </TouchableOpacity>
  );

  const InputRow = ({ icon, label, value, onChangeText, placeholder, keyboardType = 'default', suffix }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.muted}
          keyboardType={keyboardType}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        {hasChanges ? (
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <Text style={styles.roleLabel}>Your Role</Text>
            <View style={styles.roleGrid}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleOption,
                    settings.role === role.id && styles.roleOptionSelected,
                  ]}
                  onPress={() => updateSetting('role', role.id)}
                >
                  <Ionicons
                    name={role.icon}
                    size={24}
                    color={
                      settings.role === role.id
                        ? theme.colors.text.primary
                        : theme.colors.text.secondary
                    }
                  />
                  <Text
                    style={[
                      styles.roleOptionText,
                      settings.role === role.id && styles.roleOptionTextSelected,
                    ]}
                  >
                    {role.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Wages & Taxes Section */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>Wages & Taxes</Text>
          <View style={styles.card}>
            <InputRow
              icon="cash-outline"
              label="Hourly Wage"
              value={settings.hourlyWage}
              onChangeText={(v) => updateSetting('hourlyWage', v)}
              placeholder="0.00"
              keyboardType="decimal-pad"
              suffix="$/hr"
            />
            <View style={styles.divider} />
            <InputRow
              icon="business-outline"
              label="Federal Tax"
              value={settings.federalTaxRate}
              onChangeText={(v) => updateSetting('federalTaxRate', v)}
              placeholder="22"
              keyboardType="decimal-pad"
              suffix="%"
            />
            <View style={styles.divider} />
            <InputRow
              icon="flag-outline"
              label="State Tax"
              value={settings.stateTaxRate}
              onChangeText={(v) => updateSetting('stateTaxRate', v)}
              placeholder="5"
              keyboardType="decimal-pad"
              suffix="%"
            />
          </View>
          <Text style={styles.hint}>
            Tax rates are used to estimate your take-home pay. FICA (7.65%) is automatically included.
          </Text>
        </Animated.View>

        {/* Preferences Section */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingRow icon="moon-outline" label="Dark Mode">
              <Switch
                value={settings.darkMode}
                onValueChange={(v) => updateSetting('darkMode', v)}
                trackColor={{
                  false: theme.colors.background.elevated,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.text.primary}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow icon="notifications-outline" label="Notifications">
              <Switch
                value={settings.notifications}
                onValueChange={(v) => updateSetting('notifications', v)}
                trackColor={{
                  false: theme.colors.background.elevated,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.text.primary}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow
              icon="calendar-outline"
              label="Week Starts On"
              onPress={() => {
                updateSetting(
                  'weekStartsOn',
                  settings.weekStartsOn === 'sunday' ? 'monday' : 'sunday'
                );
              }}
            >
              <View style={styles.weekToggle}>
                <Text style={styles.weekToggleText}>
                  {settings.weekStartsOn === 'sunday' ? 'Sunday' : 'Monday'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.colors.text.muted}
                />
              </View>
            </SettingRow>
          </View>
        </Animated.View>

        {/* Data Section */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <SettingRow
              icon="download-outline"
              label="Export Data"
              onPress={exportData}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.muted}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow
              icon="cloud-upload-outline"
              label="Backup to Cloud"
              onPress={() => Alert.alert('Coming Soon', 'Cloud backup will be available in a future update.')}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.muted}
              />
            </SettingRow>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dangerRow} onPress={clearAllData}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, styles.dangerIcon]}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.status.error} />
                </View>
                <Text style={styles.dangerLabel}>Clear All Data</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.status.error}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <SettingRow icon="information-circle-outline" label="Version">
              <Text style={styles.versionText}>1.0.0</Text>
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow
              icon="star-outline"
              label="Rate TipTrack Pro"
              onPress={() => Linking.openURL('https://apps.apple.com')}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.muted}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow
              icon="mail-outline"
              label="Send Feedback"
              onPress={() => Linking.openURL('mailto:support@tiptrackpro.app')}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.muted}
              />
            </SettingRow>
            <View style={styles.divider} />
            <SettingRow
              icon="document-text-outline"
              label="Privacy Policy"
              onPress={() => Linking.openURL('https://tiptrackpro.app/privacy')}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colors.text.muted}
              />
            </SettingRow>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.footer}>
          <Text style={styles.footerText}>Made with 💜 for service industry workers</Text>
          <Text style={styles.footerSubtext}>TipTrack Pro © 2026</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.headline,
  },
  saveButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
  },
  saveButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 100,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  roleLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    paddingTop: 0,
  },
  roleOption: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  roleOptionSelected: {
    backgroundColor: theme.colors.primary + '30',
  },
  roleOptionText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  roleOptionTextSelected: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    ...theme.typography.body,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    minWidth: 100,
  },
  input: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.sm,
    textAlign: 'right',
    minWidth: 50,
  },
  inputSuffix: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.background.elevated,
    marginLeft: 68,
  },
  weekToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekToggleText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.xs,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  dangerIcon: {
    backgroundColor: theme.colors.status.error + '20',
  },
  dangerLabel: {
    ...theme.typography.body,
    color: theme.colors.status.error,
  },
  hint: {
    ...theme.typography.caption,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  versionText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  footerSubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
});

export default SettingsScreen;