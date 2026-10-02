# FixMo Mobile Application

**FixMo: A Mobile-Based Camera-Driven Artificial Intelligence Diagnostics and Service Matching System for Local Skilled Workers and Service Seekers in Barangay Tinago**

FixMo is a capstone project developed using React Native, Expo, TypeScript, and Expo Router. It aims to bridge the gap between local service seekers and community skilled workers through AI diagnostics and localized matching.

---

## 🚀 Tech Stack

- **Framework:** [Expo](https://expo.dev) (SDK 57)
- **Core Library:** [React Native](https://reactnative.dev)
- **Language:** [TypeScript](https://www.typescriptlang.org) (Strict mode)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **Dev Environment:** [Expo Go](https://expo.dev/go)

---

## 📁 Project Structure

```text
FixMo/
├── assets/                 # App icons, splash screens, and images
├── src/
│   ├── app/                # Expo Router screens and navigators
│   │   ├── _layout.tsx     # Root stack layout and global providers
│   │   └── index.tsx       # Welcome / Foundation entry screen
│   ├── components/         # Reusable UI components
│   ├── constants/          # Theme tokens, colors, layout sizing
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Supabase and backend integration layer
│   ├── types/              # Domain TypeScript types and interfaces
│   └── utils/              # Helper utilities and formatters
├── app.json                # Expo configuration manifest
├── package.json            # Dependencies and npm scripts
├── tsconfig.json           # TypeScript configuration with path aliases (@/*)
└── README.md               # Project documentation
```

---

## 🛠️ Prerequisites

Ensure the following tools are installed on your development machine:
1. **Node.js** (v18.0.0 or higher recommended, LTS)
2. **npm** (comes with Node.js)
3. **Expo Go** app installed on your physical mobile device (Android or iOS) from the Google Play Store or Apple App Store.

---

## 📦 Installation

1. Clone or open the repository folder in your terminal:
   ```bash
   cd FixMo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 📱 Running the Project

Start the Expo development server:

```bash
npm start
# or
npx expo start
```

### Options to view the application:

1. **Physical Device (Expo Go - Recommended):**
   - Open the **Expo Go** app on your phone.
   - Scan the QR code displayed in your terminal (Android uses Expo Go camera/scanner; iOS uses the built-in Camera app).
   - Ensure your phone and development PC are connected to the same Wi-Fi network (or press `s` to switch to Tunnel mode if on separate networks).

2. **Android Emulator:**
   - Press `a` in the terminal once the development server is running.

3. **iOS Simulator (macOS only):**
   - Press `i` in the terminal.

4. **Web Browser:**
   - Press `w` in the terminal.

---

## 🔍 Validation Commands

Before committing changes, ensure there are no compilation or configuration issues:

```bash
# Typecheck TypeScript files
npx tsc --noEmit

# Check Expo configuration and dependencies
npx expo-doctor
```
