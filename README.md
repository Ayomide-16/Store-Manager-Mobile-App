# Shop Manager Mobile App

An **offline-first** React Native mobile application that replicates the Shop Manager web app functionality. All features work without internet connection, with automatic synchronization when connectivity is restored.

## Features

- 📱 **Dashboard** - Today's stats, POS status, recent sales
- 🛒 **Sales Calculator** - Process sales with cart, payment methods
- 📦 **Inventory** - View, search, add, edit products
- 📋 **Sales History** - View all transactions
- 💰 **POS Withdrawals** - Cash withdrawal service with float management

## Offline-First Architecture

```
User Action → Local SQLite → Background Sync Queue → Supabase (when online)
```

- All CRUD operations work offline
- Changes queued and synced automatically when online
- Network status indicator shows sync state
- Pull-to-refresh for manual sync

## Tech Stack

- **Framework**: React Native + Expo
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Local Database**: expo-sqlite
- **Backend**: Supabase
- **Icons**: lucide-react-native

## Project Structure

```
shop-manager-mobile/
├── App.tsx                 # Entry point
├── src/
│   ├── components/         # Reusable UI components
│   ├── database/           # SQLite setup & queries
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # All app screens
│   ├── services/           # Supabase client
│   ├── store/              # React Context state
│   ├── sync/               # Sync engine logic
│   ├── types/              # TypeScript interfaces
│   └── utils/              # Helper functions
```

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) or Android Emulator

### Installation

```bash
cd shop-manager-mobile
npm install
```

### Development

```bash
npx expo start
```

Scan QR code with Expo Go app, or press:
- `i` for iOS Simulator
- `a` for Android Emulator

## Building APK (GitHub Actions)

This app is configured for building via GitHub Actions. Push to GitHub and set up EAS Build workflow:

```yaml
# .github/workflows/build.yml
name: Build APK
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx expo prebuild --platform android
      - run: cd android && ./gradlew assembleRelease
```

## Sync Behavior

| Status | Description |
|--------|-------------|
| ✓ Synced | All data up to date |
| ⟳ Syncing | Currently syncing |
| ⚠ Pending | Changes waiting (offline) |
| ✕ Offline | No internet connection |

### Conflict Resolution
- **Sales**: Never overwritten (unique sale numbers)
- **Inventory**: Latest timestamp wins
- **Other data**: Last-write-wins

## Environment

The app uses the same Supabase project as the web app. Credentials are configured in `src/services/supabase.ts`.

## License

Private - NaijaShop Manager
