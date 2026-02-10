import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import StorageService from '../services/StorageService';
import CalculationEngine from '../services/CalculationEngine';

const { width } = Dimensions.get('window');

const WeekSummaryScreen = ({ navigation }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekData, setWeekData] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [paycheckPreview, setPaycheckPreview] = useState(null);

  const loadData = async () => {
    try {
      const [shiftsData, settingsData] = await Promise.all([
        StorageService.getShifts(),
        StorageService.getSettings(),
      ]);

      setSettings(settingsData);

      // Calculate week boundaries
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Filter shifts for this week
      const weekShifts = shiftsData.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= startOfWeek && shiftDate <= endOfWeek;
      });

      setShifts(weekShifts);

      // Calculate week stats
      const stats = CalculationEngine.calculateWeekStats(weekShifts);
      setWeekData({
        ...stats,
        startDate: startOfWeek,
        endDate: endOfWeek,
      });

      // Calculate paycheck preview
      if (settingsData) {
        const preview = CalculationEngine.calculatePaycheckPreview(
          weekShifts,
          settingsData
        );
        setPaycheckPreview(preview);
      }
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [weekOffset])
  );

  const formatCurrency = (amount) => `$${(amount || 0).toFixed(2)}`;
  const formatTime = (hours) => {
    const h = Math.floor(hours || 0);
    const m = Math.round(((hours || 0) - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDateRange = () => {
    if (!weekData) return '';
    const options = { month: 'short', day: 'numeric' };
    const start = weekData.startDate.toLocaleDateString('en-US', options);
    const end = weekData.endDate.toLocaleDateString('en-US', options);
    return `${start} - ${end}`;
  };

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'This Week';
    if (weekOffset === -1) return 'Last Week';
    return formatDateRange();
  };

  const DayBar = ({ day, amount, maxAmount }) => {
    const barHeight = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
    
    return (
      <View style={styles.dayBarContainer}>
        <View style={styles.dayBarWrapper}>
          <LinearGradient
            colors={amount > 0 ? theme.colors.gradient.accent : ['transparent', 'transparent']}
            style={[styles.dayBar, { height: `${barHeight}%` }]}
          />
        </View>
        <Text style={styles.dayLabel}>{day}</Text>
        <Text style={styles.dayAmount}>${amount.toFixed(0)}</Text>
      </View>
    );
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyTips = days.map((day, index) => {
    const dayShift = shifts.find(s => new Date(s.date).getDay() === index);
    return dayShift ? dayShift.cashTips + dayShift.creditTips : 0;
  });
  const maxDailyTips = Math.max(...dailyTips, 1);

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
        <Text style={styles.headerTitle}>Week Summary</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Week Navigation */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.weekNav}>
          <TouchableOpacity
            style={styles.weekNavButton}
            onPress={() => setWeekOffset(weekOffset - 1)}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
          <View style={styles.weekNavCenter}>
            <Text style={styles.weekLabel}>{getWeekLabel()}</Text>
            <Text style={styles.weekDates}>{formatDateRange()}</Text>
          </View>
          <TouchableOpacity
            style={[styles.weekNavButton, weekOffset >= 0 && styles.weekNavButtonDisabled]}
            onPress={() => weekOffset < 0 && setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={weekOffset >= 0 ? theme.colors.text.muted : theme.colors.text.secondary}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Overview */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.statsCard}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>
              {formatCurrency(weekData?.totalTips)}
            </Text>
            <Text style={styles.mainStatLabel}>Total Tips</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.statValue}>{formatTime(weekData?.totalHours)}</Text>
              <Text style={styles.statLabel}>Hours</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.accent} />
              <Text style={styles.statValue}>{weekData?.shiftsWorked || 0}</Text>
              <Text style={styles.statLabel}>Shifts</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="trending-up-outline" size={20} color={theme.colors.status.success} />
              <Text style={styles.statValue}>{formatCurrency(weekData?.avgHourlyRate)}</Text>
              <Text style={styles.statLabel}>Per Hour</Text>
            </View>
          </View>
        </Animated.View>

        {/* Daily Chart */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.chartCard}>
          <Text style={styles.chartTitle}>Daily Breakdown</Text>
          <View style={styles.chartContainer}>
            {days.map((day, index) => (
              <DayBar
                key={day}
                day={day}
                amount={dailyTips[index]}
                maxAmount={maxDailyTips}
              />
            ))}
          </View>
        </Animated.View>

        {/* Paycheck Preview */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.paycheckCard}>
          <View style={styles.paycheckHeader}>
            <Ionicons name="wallet-outline" size={24} color={theme.colors.accent} />
            <Text style={styles.paycheckTitle}>Paycheck Breakdown</Text>
          </View>

          <View style={styles.paycheckSection}>
            <Text style={styles.paycheckSectionTitle}>Earnings</Text>
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckLabel}>Hourly Wages</Text>
              <Text style={styles.paycheckValue}>
                {formatCurrency(paycheckPreview?.hourlyWages)}
              </Text>
            </View>
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckLabel}>Cash Tips</Text>
              <Text style={styles.paycheckValue}>
                {formatCurrency(paycheckPreview?.cashTips)}
              </Text>
            </View>
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckLabel}>Credit Tips</Text>
              <Text style={styles.paycheckValue}>
                {formatCurrency(paycheckPreview?.creditTips)}
              </Text>
            </View>
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckLabel}>Tip-Outs</Text>
              <Text style={[styles.paycheckValue, styles.negativeValue]}>
                -{formatCurrency(paycheckPreview?.tipOuts)}
              </Text>
            </View>
            <View style={styles.paycheckDivider} />
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckTotalLabel}>Gross Pay</Text>
              <Text style={styles.paycheckTotalValue}>
                {formatCurrency(paycheckPreview?.grossPay)}
              </Text>
            </View>
          </View>

          <View style={styles.paycheckSection}>
            <Text style={styles.paycheckSectionTitle}>Estimated Taxes</Text>
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckLabel}>Federal ({settings?.federalTaxRate || 0}%)</Text>
              <Text style={[styles.paycheckValue, styles.negativeValue]}>
                -{formatCurrency(paycheckPreview?.federalTax)}
              </Text>
            </View>
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckLabel}>State ({settings?.stateTaxRate || 0}%)</Text>
              <Text style={[styles.paycheckValue, styles.negativeValue]}>
                -{formatCurrency(paycheckPreview?.stateTax)}
              </Text>
            </View>
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckLabel}>FICA (7.65%)</Text>
              <Text style={[styles.paycheckValue, styles.negativeValue]}>
                -{formatCurrency(paycheckPreview?.ficaTax)}
              </Text>
            </View>
            <View style={styles.paycheckDivider} />
            <View style={styles.paycheckRow}>
              <Text style={styles.paycheckTotalLabel}>Total Taxes</Text>
              <Text style={[styles.paycheckTotalValue, styles.negativeValue]}>
                -{formatCurrency(paycheckPreview?.totalTaxes)}
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={theme.colors.gradient.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.netPayCard}
          >
            <Text style={styles.netPayLabel}>Estimated Take Home</Text>
            <Text style={styles.netPayValue}>
              {formatCurrency(paycheckPreview?.netPay)}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Shift List */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.shiftsSection}>
          <Text style={styles.shiftsTitle}>Shifts This Week</Text>
          
          {shifts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.text.muted} />
              <Text style={styles.emptyText}>No shifts logged this week</Text>
            </View>
          ) : (
            shifts
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((shift) => (
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
                    <Text style={styles.shiftTips}>
                      {formatCurrency(shift.cashTips + shift.creditTips)}
                    </Text>
                    <Text style={styles.shiftDetails}>
                      {formatTime(shift.hoursWorked)} • ${((shift.cashTips + shift.creditTips) / shift.hoursWorked).toFixed(2)}/hr
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.text.muted} />
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
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  weekNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNavButtonDisabled: {
    opacity: 0.5,
  },
  weekNavCenter: {
    alignItems: 'center',
  },
  weekLabel: {
    ...theme.typography.headline,
  },
  weekDates: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  mainStatValue: {
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  mainStatLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.headline,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.small,
  },
  chartTitle: {
    ...theme.typography.headline,
    marginBottom: theme.spacing.lg,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
  },
  dayBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dayBarWrapper: {
    flex: 1,
    width: 24,
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  dayBar: {
    width: '100%',
    borderRadius: 12,
  },
  dayLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  dayAmount: {
    ...theme.typography.caption,
    color: theme.colors.text.muted,
    fontSize: 10,
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
    marginBottom: theme.spacing.lg,
  },
  paycheckTitle: {
    ...theme.typography.headline,
    marginLeft: theme.spacing.sm,
  },
  paycheckSection: {
    marginBottom: theme.spacing.lg,
  },
  paycheckSectionTitle: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  paycheckRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  paycheckLabel: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  paycheckValue: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
  },
  negativeValue: {
    color: theme.colors.status.error,
  },
  paycheckDivider: {
    height: 1,
    backgroundColor: theme.colors.background.elevated,
    marginVertical: theme.spacing.sm,
  },
  paycheckTotalLabel: {
    ...theme.typography.body,
    fontWeight: '600',
  },
  paycheckTotalValue: {
    ...theme.typography.headline,
  },
  netPayCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netPayLabel: {
    ...theme.typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  netPayValue: {
    ...theme.typography.largeTitle,
    color: theme.colors.text.primary,
  },
  shiftsSection: {
    marginBottom: theme.spacing.xl,
  },
  shiftsTitle: {
    ...theme.typography.headline,
    marginBottom: theme.spacing.md,
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
  shiftDetails: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
  },
});

export default WeekSummaryScreen;