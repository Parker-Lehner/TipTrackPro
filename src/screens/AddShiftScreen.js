import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme';
import StorageService from '../services/StorageService';

const AddShiftScreen = ({ navigation, route }) => {
  const existingShift = route.params?.shift;
  const isEditing = !!existingShift;

  const [date, setDate] = useState(
    existingShift ? new Date(existingShift.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(
    existingShift?.hoursWorked?.toString() || ''
  );
  const [cashTips, setCashTips] = useState(
    existingShift?.cashTips?.toString() || ''
  );
  const [creditTips, setCreditTips] = useState(
    existingShift?.creditTips?.toString() || ''
  );
  const [tipOut, setTipOut] = useState(
    existingShift?.tipOut?.toString() || ''
  );
  const [notes, setNotes] = useState(existingShift?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const totalTips = (parseFloat(cashTips) || 0) + (parseFloat(creditTips) || 0);
  const netTips = totalTips - (parseFloat(tipOut) || 0);
  const hourlyRate = hoursWorked ? netTips / parseFloat(hoursWorked) : 0;

  const handleSave = async () => {
    if (!hoursWorked || parseFloat(hoursWorked) <= 0) {
      Alert.alert('Missing Information', 'Please enter hours worked.');
      return;
    }

    setIsSaving(true);

    try {
      const shiftData = {
        id: existingShift?.id || Date.now().toString(),
        date: date.toISOString().split('T')[0],
        hoursWorked: parseFloat(hoursWorked) || 0,
        cashTips: parseFloat(cashTips) || 0,
        creditTips: parseFloat(creditTips) || 0,
        tipOut: parseFloat(tipOut) || 0,
        notes: notes.trim(),
        createdAt: existingShift?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await StorageService.saveShift(shiftData);
      navigation.goBack();
    } catch (error) {
      console.error('Error saving shift:', error);
      Alert.alert('Error', 'Failed to save shift. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Shift',
      'Are you sure you want to delete this shift?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteShift(existingShift.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete shift.');
            }
          },
        },
      ]
    );
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const QuickHoursButton = ({ hours }) => (
    <TouchableOpacity
      style={[
        styles.quickButton,
        hoursWorked === hours.toString() && styles.quickButtonActive,
      ]}
      onPress={() => setHoursWorked(hours.toString())}
    >
      <Text
        style={[
          styles.quickButtonText,
          hoursWorked === hours.toString() && styles.quickButtonTextActive,
        ]}
      >
        {hours}h
      </Text>
    </TouchableOpacity>
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
          <Ionicons name="close" size={28} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Shift' : 'Log Shift'}
        </Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Date Picker */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <Text style={styles.sectionLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons
                name="calendar-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </Animated.View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={new Date()}
              themeVariant="dark"
            />
          )}

          {/* Hours Worked */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <Text style={styles.sectionLabel}>Hours Worked</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.largeInput}
                value={hoursWorked}
                onChangeText={setHoursWorked}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={theme.colors.text.muted}
              />
              <Text style={styles.inputSuffix}>hours</Text>
            </View>
            <View style={styles.quickButtons}>
              <QuickHoursButton hours={4} />
              <QuickHoursButton hours={5} />
              <QuickHoursButton hours={6} />
              <QuickHoursButton hours={7} />
              <QuickHoursButton hours={8} />
            </View>
          </Animated.View>

          {/* Tips Section */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
            <Text style={styles.sectionLabel}>Tips Earned</Text>
            
            <View style={styles.tipsRow}>
              <View style={styles.tipInput}>
                <Text style={styles.tipLabel}>Cash Tips</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={cashTips}
                    onChangeText={setCashTips}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.text.muted}
                  />
                </View>
              </View>

              <View style={styles.tipInput}>
                <Text style={styles.tipLabel}>Credit Tips</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    style={styles.input}
                    value={creditTips}
                    onChangeText={setCreditTips}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.text.muted}
                  />
                </View>
              </View>
            </View>

            <View style={styles.tipOutSection}>
              <Text style={styles.tipLabel}>Tip-Out (to support staff)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>$</Text>
                <TextInput
                  style={styles.input}
                  value={tipOut}
                  onChangeText={setTipOut}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.text.muted}
                />
              </View>
            </View>
          </Animated.View>

          {/* Summary Card */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.summaryCard}>
            <LinearGradient
              colors={theme.colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryGradient}
            >
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Tips</Text>
                  <Text style={styles.summaryValue}>
                    ${totalTips.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Net Tips</Text>
                  <Text style={styles.summaryValue}>
                    ${netTips.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Hourly</Text>
                  <Text style={styles.summaryValue}>
                    ${hourlyRate.toFixed(2)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
            <Text style={styles.sectionLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this shift..."
              placeholderTextColor={theme.colors.text.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </Animated.View>

          {/* Delete Button */}
          {isEditing && (
            <Animated.View entering={FadeInDown.delay(600)}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.status.error} />
                <Text style={styles.deleteButtonText}>Delete Shift</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
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
  sectionLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  dateText: {
    ...theme.typography.body,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  largeInput: {
    flex: 1,
    ...theme.typography.largeTitle,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.lg,
  },
  input: {
    flex: 1,
    ...theme.typography.headline,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.lg,
  },
  inputPrefix: {
    ...theme.typography.headline,
    color: theme.colors.text.secondary,
  },
  inputSuffix: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  quickButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  quickButtonText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  quickButtonTextActive: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  tipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  tipInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  tipLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  tipOutSection: {
    marginTop: theme.spacing.sm,
  },
  summaryCard: {
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  summaryGradient: {
    padding: theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    ...theme.typography.headline,
    color: theme.colors.text.primary,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  notesInput: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    minHeight: 100,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  deleteButtonText: {
    ...theme.typography.body,
    color: theme.colors.status.error,
    marginLeft: theme.spacing.sm,
  },
});

export default AddShiftScreen;