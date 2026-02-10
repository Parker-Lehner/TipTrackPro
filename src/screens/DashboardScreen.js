import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import StorageService from '../services/StorageService';
import CalculationEngine from '../services/CalculationEngine';

const { width } = Dimensions.get('window');

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [todayShift, setTodayShift] = useState(null);
  const [weekStats, setWeekStats] = useState(null);
  const [recentShifts, setRecentShifts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [paycheckPreview, setPaycheckPreview] = useState(null);

  const loadData = async () => {
    try {
      const [shiftsData, settingsData] = await Promise.all([
        StorageService.getShifts(),
        StorageService.getSettings(),
      ]);

      setSettings(settingsData);

      // Get today's shift
      const today = new Date().toISOString().split('T')[0];
      const todayShiftData = shiftsData.find(s => s.date === today);
      setTodayShift(todayShiftData);

      // Get week stats
      const weekStatsData = CalculationEngine.calculateWeekStats(shiftsData);
      setWeekStats(weekStatsData);

      // Get recent shifts (last 5)
      const sortedShifts = [...shiftsData].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      ).slice(0, 5);
      setRecentShifts(sortedShifts);

      // Calculate paycheck preview
      if (settingsData) {
        const preview = CalculationEngine.calculatePaycheckPreview(
          shiftsData,
          settingsData
        );
        setPaycheckPreview(preview);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `$${(amount || 0).toFixed(2)}`;
  };

  const formatTime = (hours) => {
    const h = Math.floor(hours || 0);
    const m = Math.round(((hours || 0) - h) * 60);
    return `${h}h ${m}m`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Add Button */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => navigation.navigate('AddShift')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.quickAddGradient}
            >
              <Ionicons name="add-circle" size={28} color={theme.colors.text.primary} />
              <Text style={styles.quickAddText}>Log Today's Shift</Text>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.text.primary} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Week Summary Card */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>This Week</Text>
            <TouchableOpacity onPress={() => navigation.navigate('WeekSummary')}>
              <Text style={styles.seeAllText}>See Details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(weekStats?.totalTips)}
              </Text>
              <Text style={styles.statLabel}>Tips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatTime(weekStats?.totalHours)}
              </Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {weekStats?.shiftsWorked || 0}
              </Text>
              <Text style={styles.statLabel}>Shifts</Text>
            </View>
          </View>

          {/* Hourly Rate Indicator */}
          <View style={styles.hourlyRateContainer}>
            <View style={styles.hourlyRateBar}>
              <LinearGradient
                colors={theme.colors.gradient.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.hourlyRateFill,
                  { width: `${Math.min((weekStats?.avgHourlyRate || 0) / 50 * 100, 100)}%` }
                ]}
              />
            </View>
            <View style={styles.hourlyRateInfo}>
              <Text style={styles.hourlyRateValue}>
                {formatCurrency(weekStats?.avgHourlyRate)}/hr
              </Text>
              <Text style={styles.hourlyRateLabel}>Avg. Hourly (Tips)</Text>
            </View>
          </View>
        </Animated.View>

        {/* Paycheck Preview */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <TouchableOpacity
            style={styles.paycheckCard}
            onPress={() => navigation.navigate('WeekSummary')}
            activeOpacity={0.8}
          >
            <View style={styles.paycheckHeader}>
              <Ionicons name="wallet-outline" size={24} color={theme.colors.accent} />
              <Text style={styles.paycheckTitle}>Paycheck Preview</Text>
            </View>
            <View style={styles.paycheckContent}>
              <View style={styles.paycheckRow}>
                <Text style={styles.paycheckLabel}>Gross Pay</Text>
                <Text style={styles.paycheckValue}>
                  {formatCurrency(paycheckPreview?.grossPay)}
                </Text>
              </View>
              <View style={styles.paycheckRow}>
                <Text style={styles.paycheckLabel}>Est. Taxes</Text>
                <Text style={[styles.paycheckValue, styles.taxValue]}>
                  -{formatCurrency(paycheckPreview?.totalTaxes)}
                </Text>
              </View>
              <View style={styles.paycheckDivider} />
              <View style={styles.paycheckRow}>
                <Text style={styles.paycheckNetLabel}>Take Home</Text>
                <Text style={styles.paycheckNetValue}>
                  {formatCurrency(paycheckPreview?.netPay)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('TipOutCalculator')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.actionGradient}
            >
              <Ionicons name="calculator-outline" size={32} color={theme.colors.accent} />
              <Text style={styles.actionTitle}>Tip-Out</Text>
              <Text style={styles.actionSubtitle}>Calculator</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('WeekSummary')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.actionGradient}
            >
              <Ionicons name="bar-chart-outline" size={32} color={theme.colors.primary} />
              <Text style={styles.actionTitle}>Weekly</Text>
              <Text style={styles.actionSubtitle}>Summary</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Shifts */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent Shifts</Text>
          </View>

          {recentShifts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.text.muted} />
              <Text style={styles.emptyText}>No shifts logged yet</Text>
              <Text style={styles.emptySubtext}>Tap the button above to add your first shift</Text>
            </View>
          ) : (
            recentShifts.map((shift, index) => (
              <TouchableOpacity
                key={shift.id}
                style={styles.shiftCard}
                onPress={() => navigation.navigate('AddShift', { shift })}
                activeOpacity={0.7}
              >
                <View style={styles.shiftDate}>
                  <Text style={styles.shiftDay}>
                    {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.shiftDateNum}>
                    {new Date(shift.date).getDate()}
                  </Text>
                </View>
                <View style={styles.shiftInfo}>
                  <Text style={styles.shiftTips}>{formatCurrency(shift.cashTips + shift.creditTips)}</Text>
                  <Text style={styles.shiftHours}>{formatTime(shift.hoursWorked)}</Text>
                </View>
                <View style={styles.shiftHourly}>
                  <Text style={styles.shiftHourlyValue}>
                    {formatCurrency((shift.cashTips + shift.creditTips) / shift.hoursWorked)}
                  </Text>
                  <Text style={styles.shiftHourlyLabel}>/hr</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    ...theme.typography.title,
    marginBottom: 4,
  },
  date: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddButton: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  quickAddGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  quickAddText: {
    ...theme.typography.body,
    fontWeight: '600',
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  summaryCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  summaryTitle: {
    ...theme.typography.headline,
  },
  seeAllText: {
    ...theme.typography.caption,
    color: theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.largeTitle,
    color: theme.colors.text.primary,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.background.elevated,
  },
  hourlyRateContainer: {
    backgroundColor: theme.colors.background.elevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  hourlyRateBar: {
    height: 8,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  hourlyRateFill: {
    height: '100%',
    borderRadius: 4,
  },
  hourlyRateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hourlyRateValue: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  hourlyRateLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  paycheckCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  paycheckHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  paycheckTitle: {
    ...theme.typography.headline,
    marginLeft: theme.spacing.sm,
  },
  paycheckContent: {},
  paycheckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  paycheckLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  paycheckValue: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  taxValue: {
    color: theme.colors.status.error,
  },
  paycheckDivider: {
    height: 1,
    backgroundColor: theme.colors.background.elevated,
    marginVertical: theme.spacing.sm,
  },
  paycheckNetLabel: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  paycheckNetValue: {
    ...theme.typography.headline,
    color: theme.colors.status.success,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  actionCard: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.md) / 2,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.small,
  },
  actionGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  actionTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    marginTop: theme.spacing.sm,
  },
  actionSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  recentSection: {
    marginBottom: theme.spacing.xl,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  recentTitle: {
    ...theme.typography.headline,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  shiftDate: {
    width: 50,
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  shiftDay: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
  },
  shiftDateNum: {
    ...theme.typography.headline,
  },
  shiftInfo: {
    flex: 1,
  },
  shiftTips: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  shiftHours: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
  shiftHourly: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  shiftHourlyValue: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  shiftHourlyLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
});

export default DashboardScreen;