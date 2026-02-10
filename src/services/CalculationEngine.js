// CalculationEngine.js - Financial calculations for TipTrack Pro

const CalculationEngine = {
  // ============ SHIFT CALCULATIONS ============
  
  calculateShiftEarnings(shift, settings) {
    const { cashTips = 0, creditTips = 0, hoursWorked = 0, tipOutAmount = 0 } = shift;
    const { hourlyWage = 2.13 } = settings;
    
    const totalTips = cashTips + creditTips;
    const netTips = totalTips - tipOutAmount;
    const hourlyEarnings = hoursWorked * hourlyWage;
    const grossEarnings = netTips + hourlyEarnings;
    const effectiveHourlyRate = hoursWorked > 0 ? grossEarnings / hoursWorked : 0;
    
    return {
      totalTips,
      netTips,
      hourlyEarnings,
      grossEarnings,
      effectiveHourlyRate,
      tipOutAmount,
    };
  },

  // ============ TAX CALCULATIONS ============
  
  calculateTaxes(grossEarnings, settings) {
    const { 
      federalTaxRate = 12, 
      stateTaxRate = 5, 
      ficaRate = 7.65 
    } = settings;
    
    const federalTax = grossEarnings * (federalTaxRate / 100);
    const stateTax = grossEarnings * (stateTaxRate / 100);
    const ficaTax = grossEarnings * (ficaRate / 100);
    const totalTax = federalTax + stateTax + ficaTax;
    const netEarnings = grossEarnings - totalTax;
    const effectiveTaxRate = grossEarnings > 0 ? (totalTax / grossEarnings) * 100 : 0;
    
    return {
      federalTax,
      stateTax,
      ficaTax,
      totalTax,
      netEarnings,
      effectiveTaxRate,
    };
  },

  // ============ PAYCHECK PREVIEW ============
  
  calculatePaycheckPreview(shifts, settings) {
    const { hourlyWage = 2.13 } = settings;
    
    // Aggregate shift data
    let totalHours = 0;
    let totalCashTips = 0;
    let totalCreditTips = 0;
    let totalTipOut = 0;
    
    shifts.forEach(shift => {
      totalHours += shift.hoursWorked || 0;
      totalCreditTips += shift.creditTips || 0;
      totalTipOut += shift.tipOutAmount || 0;
    });
    
    const totalTips = totalCashTips + totalCreditTips;
    const netTips = totalTips - totalTipOut;
    const hourlyEarnings = totalHours * hourlyWage;
    const grossEarnings = netTips + hourlyEarnings;
    
    // Calculate taxes
    const taxes = this.calculateTaxes(grossEarnings, settings);
    
    // Cash vs paycheck breakdown
    // Cash tips are taken home immediately, credit tips come on paycheck
    const cashTakeHome = totalCashTips - (totalTipOut * (totalCashTips / totalTips || 0));
    const paycheckGross = totalCreditTips - (totalTipOut * (totalCreditTips / totalTips || 0)) + hourlyEarnings;
    const paycheckTaxes = this.calculateTaxes(paycheckGross, settings);
    const paycheckNet = paycheckGross - paycheckTaxes.totalTax;
    
    return {
      summary: {
        totalShifts: shifts.length,
        totalHours,
        totalTips,
        netTips,
        hourlyEarnings,
        grossEarnings,
      },
      taxes,
      breakdown: {
        cashTakeHome,
        paycheckGross,
        paycheckTaxes: paycheckTaxes.totalTax,
        paycheckNet,
        totalTakeHome: cashTakeHome + paycheckNet,
      },
      averages: {
        tipsPerShift: shifts.length > 0 ? netTips / shifts.length : 0,
        hoursPerShift: shifts.length > 0 ? totalHours / shifts.length : 0,
        effectiveHourlyRate: totalHours > 0 ? grossEarnings / totalHours : 0,
      },
    };
  },

  // ============ TIP OUT CALCULATIONS ============
  
  calculateTipOut(totalTips, preset) {
    if (!preset || !preset.roles) return { total: 0, breakdown: [] };
    
    const breakdown = preset.roles.map(role => ({
      name: role.name,
      percentage: role.percentage,
      amount: totalTips * (role.percentage / 100),
    }));
    
    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const remaining = totalTips - total;
    
    return {
      total,
      remaining,
      breakdown,
      percentageGiven: (total / totalTips) * 100 || 0,
    };
  },

  calculateCustomTipOut(totalTips, roles) {
    return this.calculateTipOut(totalTips, { roles });
  },

  // ============ WEEKLY/PERIOD SUMMARIES ============
  
  calculateWeeklySummary(shifts, settings) {
    const preview = this.calculatePaycheckPreview(shifts, settings);
    
    // Group by day
    const byDay = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    shifts.forEach(shift => {
      const date = new Date(shift.date);
      const dayIndex = date.getDay();
      const dayName = dayNames[dayIndex];
      
      if (!byDay[dayName]) {
        byDay[dayName] = {
          shifts: [],
          totalTips: 0,
          totalHours: 0,
        };
      }
      
      const earnings = this.calculateShiftEarnings(shift, settings);
      byDay[dayName].shifts.push(shift);
      byDay[dayName].totalTips += earnings.netTips;
      byDay[dayName].totalHours += shift.hoursWorked || 0;
    });
    
    // Find best/worst days
    const dayStats = Object.entries(byDay).map(([day, data]) => ({
      day,
      ...data,
      avgTips: data.shifts.length > 0 ? data.totalTips / data.shifts.length : 0,
    }));
    
    const sortedByTips = [...dayStats].sort((a, b) => b.avgTips - a.avgTips);
    
    return {
      ...preview,
      byDay,
      bestDay: sortedByTips[0] || null,
      worstDay: sortedByTips[sortedByTips.length - 1] || null,
      dayStats,
    };
  },

  // ============ TRENDS & ANALYTICS ============
  
  calculateTrends(currentPeriodShifts, previousPeriodShifts, settings) {
    const current = this.calculatePaycheckPreview(currentPeriodShifts, settings);
    const previous = this.calculatePaycheckPreview(previousPeriodShifts, settings);
    
    const calculateChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };
    
    return {
      current,
      previous,
      changes: {
        totalTips: calculateChange(current.summary.netTips, previous.summary.netTips),
        totalHours: calculateChange(current.summary.totalHours, previous.summary.totalHours),
        effectiveHourlyRate: calculateChange(
          current.averages.effectiveHourlyRate, 
          previous.averages.effectiveHourlyRate
        ),
        grossEarnings: calculateChange(current.summary.grossEarnings, previous.summary.grossEarnings),
      },
    };
  },

  // ============ FORMATTING HELPERS ============
  
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  formatPercentage(value, decimals = 1) {
    return `${value.toFixed(decimals)}%`;
  },

  formatHours(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  },
};

export default CalculationEngine;