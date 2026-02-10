# TipTrack Pro 💰

A premium mobile-first tip tracking app for restaurant workers. Built with React Native & Expo.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

## ✨ Features

- **Ultra-Fast Shift Logging** - Add shifts in seconds with smart defaults
- **Weekly Dashboard** - Beautiful charts and earnings snapshots
- **Paycheck Preview** - Week summary with estimated take-home pay
- **Tip-Out Calculator** - Split tips fairly among your team
- **Smooth Onboarding** - Get started in under a minute

## 🎨 Design

Inspired by Apple Fitness + Mint + Notion:
- Soft gradients (indigo → purple → teal)
- Rounded cards with subtle shadows
- Large, readable typography
- Dark mode optimized

## 📁 Project Structure

```
TipTrackPro/
├── App.js                    # Entry point with navigation
├── src/
│   ├── theme.js              # Design system (colors, typography, spacing)
│   ├── services/
│   │   ├── CalculationEngine.js  # Tax & tip math
│   │   └── StorageService.js     # AsyncStorage persistence
│   └── screens/
│       ├── OnboardingScreen.js
│       ├── DashboardScreen.js
│       ├── AddShiftScreen.js
│       ├── WeekSummaryScreen.js
│       ├── TipOutCalculatorScreen.js
│       └── SettingsScreen.js
├── package.json
├── app.json
└── babel.config.js
```

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/Parker-Lehner/TipTrackPro.git
cd TipTrackPro

# Install dependencies
npm install

# Start the development server
npx expo start
```

## 📦 Dependencies

- `@react-navigation/native` - Navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `@react-navigation/stack` - Stack navigation
- `expo-linear-gradient` - Gradient backgrounds
- `react-native-chart-kit` - Charts & graphs
- `react-native-svg` - SVG support
- `@react-native-community/datetimepicker` - Date/time picker
- `@react-native-async-storage/async-storage` - Local storage
- `react-native-reanimated` - Animations
- `react-native-gesture-handler` - Gestures
- `react-native-screens` - Native screens
- `react-native-safe-area-context` - Safe area handling

## 🎯 Core Calculations

### Tax Estimation
```javascript
// Federal brackets (2024)
0 - 11,600: 10%
11,601 - 47,150: 12%
47,151 - 100,525: 22%
// + State tax (configurable, default 5%)
// + FICA (7.65%)
```

### Tip-Out Splits
- Percentage-based distribution
- Role-based presets (Busser 15%, Bartender 10%, etc.)
- Custom split configurations

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Onboarding | Welcome flow, role selection, tax setup |
| Dashboard | Weekly snapshot, recent shifts, quick stats |
| Add Shift | Fast entry with date, hours, tips, notes |
| Week Summary | Detailed breakdown, charts, paycheck preview |
| Tip-Out Calculator | Split tips among team members |
| Settings | Tax rates, preferences, data export |

## 🔧 Configuration

Edit `src/theme.js` to customize:
- Primary colors
- Typography scale
- Spacing system
- Border radius
- Shadow styles

## 📄 License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ for the service industry