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
  SlideInRight,
  SlideOutRight,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import StorageService from '../services/StorageService';

const TipOutCalculatorScreen = ({ navigation }) => {
  const [totalTips, setTotalTips] = useState('');
  const [recipients, setRecipients] = useState([
    { id: '1', role: 'Busser', percentage: '15', amount: 0 },
    { id: '2', role: 'Bartender', percentage: '5', amount: 0 },
    { id: '3', role: 'Host', percentage: '3', amount: 0 },
  ]);
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    calculateAmounts();
  }, [totalTips, recipients]);

  const loadTemplates = async () => {
    try {
      const templates = await StorageService.getTipOutTemplates();
      setSavedTemplates(templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const calculateAmounts = () => {
    const total = parseFloat(totalTips) || 0;
    const updated = recipients.map(r => ({
      ...r,
      amount: (total * (parseFloat(r.percentage) || 0)) / 100,
    }));
    setRecipients(updated);
  };

  const addRecipient = () => {
    const newRecipient = {
      id: Date.now().toString(),
      role: '',
      percentage: '',
      amount: 0,
    };
    setRecipients([...recipients, newRecipient]);
  };

  const removeRecipient = (id) => {
    if (recipients.length <= 1) {
      Alert.alert('Cannot Remove', 'You need at least one recipient.');
      return;
    }
    setRecipients(recipients.filter(r => r.id !== id));
  };

  const updateRecipient = (id, field, value) => {
    setRecipients(recipients.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const totalPercentage = recipients.reduce(
    (sum, r) => sum + (parseFloat(r.percentage) || 0),
    0
  );

  const totalTipOut = recipients.reduce((sum, r) => sum + r.amount, 0);
  const remaining = (parseFloat(totalTips) || 0) - totalTipOut;

  const saveTemplate = async () => {
    Alert.prompt(
      'Save Template',
      'Enter a name for this tip-out template:',
      async (name) => {
        if (!name) return;
        
        const template = {
          id: Date.now().toString(),
          name,
          recipients: recipients.map(r => ({
            role: r.role,
            percentage: r.percentage,
          })),
          createdAt: new Date().toISOString(),
        };

        try {
          const templates = [...savedTemplates, template];
          await StorageService.saveTipOutTemplates(templates);
          setSavedTemplates(templates);
          Alert.alert('Saved', 'Template saved successfully!');
        } catch (error) {
          Alert.alert('Error', 'Failed to save template.');
        }
      },
      'plain-text'
    );
  };

  const loadTemplate = (template) => {
    setRecipients(
      template.recipients.map((r, index) => ({
        id: Date.now().toString() + index,
        role: r.role,
        percentage: r.percentage,
        amount: 0,
      }))
    );
    setShowTemplates(false);
  };

  const deleteTemplate = async (templateId) => {
    const updated = savedTemplates.filter(t => t.id !== templateId);
    await StorageService.saveTipOutTemplates(updated);
    setSavedTemplates(updated);
  };

  const RecipientCard = ({ recipient, index }) => (
    <Animated.View
      entering={SlideInRight.delay(index * 100)}
      exiting={SlideOutRight}
      layout={Layout.springify()}
      style={styles.recipientCard}
    >
      <View style={styles.recipientHeader}>
        <TextInput
          style={styles.roleInput}
          value={recipient.role}
          onChangeText={(value) => updateRecipient(recipient.id, 'role', value)}
          placeholder="Role (e.g., Busser)"
          placeholderTextColor={theme.colors.text.muted}
        />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeRecipient(recipient.id)}
        >
          <Ionicons name="close-circle" size={24} color={theme.colors.status.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.recipientInputs}>
        <View style={styles.percentageInput}>
          <TextInput
            style={styles.input}
            value={recipient.percentage}
            onChangeText={(value) => updateRecipient(recipient.id, 'percentage', value)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.colors.text.muted}
          />
          <Text style={styles.inputSuffix}>%</Text>
        </View>

        <View style={styles.amountDisplay}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            ${recipient.amount.toFixed(2)}
          </Text>
        </View>
      </View>
    </Animated.View>
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
        <Text style={styles.headerTitle}>Tip-Out Calculator</Text>
        <TouchableOpacity
          style={styles.templateButton}
          onPress={() => setShowTemplates(!showTemplates)}
        >
          <Ionicons
            name={showTemplates ? 'close' : 'bookmark-outline'}
            size={24}
            color={theme.colors.text.primary}
          />
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
          {/* Templates Panel */}
          {showTemplates && (
            <Animated.View
              entering={FadeInDown}
              style={styles.templatesPanel}
            >
              <Text style={styles.templatesPanelTitle}>Saved Templates</Text>
              {savedTemplates.length === 0 ? (
                <Text style={styles.noTemplatesText}>
                  No saved templates yet
                </Text>
              ) : (
                savedTemplates.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    style={styles.templateItem}
                    onPress={() => loadTemplate(template)}
                  >
                    <View style={styles.templateInfo}>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateDetails}>
                        {template.recipients.length} recipients
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => deleteTemplate(template.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={theme.colors.status.error}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </Animated.View>
          )}

          {/* Total Tips Input */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
            <Text style={styles.sectionLabel}>Total Tips to Split</Text>
            <View style={styles.totalInputWrapper}>
              <Text style={styles.dollarSign}>$</Text>
              <TextInput
                style={styles.totalInput}
                value={totalTips}
                onChangeText={setTotalTips}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={theme.colors.text.muted}
              />
            </View>
          </Animated.View>

          {/* Recipients */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Recipients</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addRecipient}
              >
                <Ionicons name="add" size={20} color={theme.colors.primary} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {recipients.map((recipient, index) => (
              <RecipientCard
                key={recipient.id}
                recipient={recipient}
                index={index}
              />
            ))}
          </Animated.View>

          {/* Summary */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Percentage</Text>
              <Text
                style={[
                  styles.summaryValue,
                  totalPercentage > 100 && styles.warningText,
                ]}
              >
                {totalPercentage.toFixed(1)}%
              </Text>
            </View>
            {totalPercentage > 100 && (
              <Text style={styles.warningMessage}>
                ⚠️ Total exceeds 100%
              </Text>
            )}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Tip-Out</Text>
              <Text style={styles.summaryValue}>
                ${totalTipOut.toFixed(2)}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <LinearGradient
              colors={theme.colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.remainingCard}
            >
              <Text style={styles.remainingLabel}>You Keep</Text>
              <Text style={styles.remainingValue}>
                ${remaining.toFixed(2)}
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Save Template Button */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <TouchableOpacity
              style={styles.saveTemplateButton}
              onPress={saveTemplate}
            >
              <Ionicons
                name="bookmark-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.saveTemplateText}>Save as Template</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Quick Reference */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.referenceCard}>
            <Text style={styles.referenceTitle}>💡 Common Tip-Out Rates</Text>
            <View style={styles.referenceGrid}>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceRole}>Busser</Text>
                <Text style={styles.referenceRate}>10-20%</Text>
              </View>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceRole}>Bartender</Text>
                <Text style={styles.referenceRate}>5-10%</Text>
              </View>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceRole}>Host</Text>
                <Text style={styles.referenceRate}>2-5%</Text>
              </View>
              <View style={styles.referenceItem}>
                <Text style={styles.referenceRole}>Food Runner</Text>
                <Text style={styles.referenceRate}>5-10%</Text>
              </View>
            </View>
          </Animated.View>
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
  templateButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  templatesPanel: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  templatesPanelTitle: {
    ...theme.typography.headline,
    marginBottom: theme.spacing.md,
  },
  noTemplatesText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.elevated,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  templateDetails: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  dollarSign: {
    fontSize: 36,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginRight: theme.spacing.sm,
  },
  totalInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.full,
  },
  addButtonText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  recipientCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  roleInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  recipientInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    ...theme.typography.headline,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.md,
  },
  inputSuffix: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  amountDisplay: {
    flex: 1,
    alignItems: 'flex-end',
  },
  amountLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  amountValue: {
    ...theme.typography.headline,
    color: theme.colors.accent,
  },
  summaryCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  summaryLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  summaryValue: {
    ...theme.typography.headline,
  },
  warningText: {
    color: theme.colors.status.warning,
  },
  warningMessage: {
    ...theme.typography.caption,
    color: theme.colors.status.warning,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.background.elevated,
    marginVertical: theme.spacing.sm,
  },
  remainingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.sm,
  },
  remainingLabel: {
    ...theme.typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  remainingValue: {
    ...theme.typography.largeTitle,
    color: theme.colors.text.primary,
  },
  saveTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  saveTemplateText: {
    ...theme.typography.body,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  referenceCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  referenceTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  referenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  referenceItem: {
    width: '50%',
    paddingVertical: theme.spacing.sm,
  },
  referenceRole: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  referenceRate: {
    ...theme.typography.body,
    color: theme.colors.accent,
  },
});

export default TipOutCalculatorScreen;