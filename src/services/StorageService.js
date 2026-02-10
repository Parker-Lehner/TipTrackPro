import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SHIFTS: '@tiptrack_shifts',
  SETTINGS: '@tiptrack_settings',
  TIP_OUT_PRESETS: '@tiptrack_tipout_presets',
};

const StorageService = {
  // ============ SHIFTS ============
  async getShifts() {
    try {
      const data = await AsyncStorage.getItem(KEYS.SHIFTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting shifts:', error);
      return [];
    }
  },

  async saveShift(shift) {
    try {
      const shifts = await this.getShifts();
      const newShift = {
        ...shift,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      shifts.unshift(newShift);
      await AsyncStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
      return newShift;
    } catch (error) {
      console.error('Error saving shift:', error);
      throw error;
    }
  },

  async updateShift(id, updates) {
    try {
      const shifts = await this.getShifts();
      const index = shifts.findIndex(s => s.id === id);
      if (index !== -1) {
        shifts[index] = { ...shifts[index], ...updates, updatedAt: new Date().toISOString() };
        await AsyncStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
        return shifts[index];
      }
      throw new Error('Shift not found');
    } catch (error) {
      console.error('Error updating shift:', error);
      throw error;
    }
  },

  async deleteShift(id) {
    try {
      const shifts = await this.getShifts();
      const filtered = shifts.filter(s => s.id !== id);
      await AsyncStorage.setItem(KEYS.SHIFTS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
  },

  async getShiftsByDateRange(startDate, endDate) {
    try {
      const shifts = await this.getShifts();
      return shifts.filter(shift => {
        const shiftDate = new Date(shift.date);
        return shiftDate >= startDate && shiftDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting shifts by date range:', error);
      return [];
    }
  },

  async getShiftsForWeek(date = new Date()) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return this.getShiftsByDateRange(startOfWeek, endOfWeek);
  },

  // ============ SETTINGS ============
  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      return data ? JSON.parse(data) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.getDefaultSettings();
    }
  },

  async saveSettings(settings) {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  async updateSettings(updates) {
    try {
      const settings = await this.getSettings();
      const newSettings = { ...settings, ...updates };
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(newSettings));
      return newSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  },

  getDefaultSettings() {
    return {
      onboardingComplete: false,
      role: 'server',
      hourlyWage: 2.13,
      federalTaxRate: 12,
      stateTaxRate: 5,
      ficaRate: 7.65,
      defaultTipOutPercentage: 3,
      currency: 'USD',
      weekStartsOn: 0, // Sunday
      theme: 'dark',
    };
  },

  // ============ TIP OUT PRESETS ============
  async getTipOutPresets() {
    try {
      const data = await AsyncStorage.getItem(KEYS.TIP_OUT_PRESETS);
      return data ? JSON.parse(data) : this.getDefaultTipOutPresets();
    } catch (error) {
      console.error('Error getting tip out presets:', error);
      return this.getDefaultTipOutPresets();
    }
  },

  async saveTipOutPreset(preset) {
    try {
      const presets = await this.getTipOutPresets();
      const newPreset = {
        ...preset,
        id: Date.now().toString(),
      };
      presets.push(newPreset);
      await AsyncStorage.setItem(KEYS.TIP_OUT_PRESETS, JSON.stringify(presets));
      return newPreset;
    } catch (error) {
      console.error('Error saving tip out preset:', error);
      throw error;
    }
  },

  async deleteTipOutPreset(id) {
    try {
      const presets = await this.getTipOutPresets();
      const filtered = presets.filter(p => p.id !== id);
      await AsyncStorage.setItem(KEYS.TIP_OUT_PRESETS, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting tip out preset:', error);
      throw error;
    }
  },

  getDefaultTipOutPresets() {
    return [
      { id: '1', name: 'Standard', roles: [
        { name: 'Busser', percentage: 15 },
        { name: 'Bartender', percentage: 10 },
        { name: 'Host', percentage: 5 },
      ]},
      { id: '2', name: 'Fine Dining', roles: [
        { name: 'Busser', percentage: 20 },
        { name: 'Bartender', percentage: 15 },
        { name: 'Food Runner', percentage: 10 },
        { name: 'Host', percentage: 5 },
      ]},
    ];
  },

  // ============ UTILITIES ============
  async clearAllData() {
    try {
      await AsyncStorage.multiRemove([KEYS.SHIFTS, KEYS.SETTINGS, KEYS.TIP_OUT_PRESETS]);
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  },

  async exportData() {
    try {
      const shifts = await this.getShifts();
      const settings = await this.getSettings();
      const presets = await this.getTipOutPresets();
      return {
        shifts,
        settings,
        tipOutPresets: presets,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  },

  async importData(data) {
    try {
      if (data.shifts) {
        await AsyncStorage.setItem(KEYS.SHIFTS, JSON.stringify(data.shifts));
      }
      if (data.settings) {
        await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
      }
      if (data.tipOutPresets) {
        await AsyncStorage.setItem(KEYS.TIP_OUT_PRESETS, JSON.stringify(data.tipOutPresets));
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  },
};

export default StorageService;