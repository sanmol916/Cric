# 🏏 VoiceScore Cricket — Mobile App (iOS & Android)

A full, installable React Native (Expo) app for scoring cricket **by voice**.
Onboarding slides → login (Phone OTP / Google / Email) → a full menu app with
voice scoring, review-before-approve, live scorecards, match history and
settings. Black & red professional theme.

This is the native mobile app. A browser version also lives in the repo root.

---

## 📱 What's inside

- **Onboarding**: 4 intro slides on first launch (remembered afterwards).
- **Login**: Phone **OTP**, **Google**, or **Email** — via Firebase, with a
  built-in **demo mode** so it runs instantly (see below).
- **Home menu**: resume a live match, start a new match, quick links, tips.
- **New match**: name two teams, add players, choose overs.
- **Live scoring**: tap the mic, say the ball (Hindi/Hinglish/English), then
  **review the proposed changes**, edit anything, and **Approve** to apply it to
  the batter, bowler and team totals. Manual controls, strike swap, undo.
- **Scorecard**: both innings, batting & bowling cards, result.
- **History**: past matches saved on the device (tap to reopen the scorecard).
- **Settings**: account, sign out, reset match, clear history.
- Everything is saved on-device with AsyncStorage.

---

## 🚀 Run it (development)

Requires **Node 18+** and the **Expo Go** app on your phone (App Store / Play
Store) — or an emulator.

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

> **Demo login:** until you add Firebase keys, the app runs in demo mode.
> Any phone number works and the OTP is **`123456`**. Google/Email create a demo
> account. This lets you try the whole app immediately.

> **Voice note:** live speech-to-text uses a **native module** that does **not**
> run inside Expo Go. In Expo Go, use the **“Type the ball”** box (works fully).
> To get the microphone working you need a **dev build** (next section).

---

## 🎤 Enable real voice input (dev build)

The `@react-native-voice/voice` native module needs a custom build:

```bash
npm install -g eas-cli
eas login                       # create a free Expo account first
eas build --profile development --platform android
```

Install the resulting build on your device, run `npx expo start --dev-client`,
and the mic will work. (iOS dev builds need an Apple Developer account or a
simulator build on a Mac.)

---

## 🔑 Enable real OTP + Google login (Firebase)

1. Create a free project at <https://console.firebase.google.com>.
2. Add a **Web app** and copy its config.
3. Enable **Authentication → Sign-in method → Phone** and **Google**.
4. Create a file `mobile/.env` (or set EAS env vars):

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
   ```

Once `apiKey` + `projectId` are present, the app switches from demo mode to real
Firebase automatically (see `src/auth/firebaseConfig.ts` and the marked
integration points in `src/store/AuthContext.tsx`).

---

## 🏪 Publish to the App Store & Google Play

Publishing requires **your own paid developer accounts**:

- **Google Play**: one-time **$25** — <https://play.google.com/console>
- **Apple**: **$99/year** — <https://developer.apple.com>

Then, using EAS (Expo Application Services):

```bash
npm install -g eas-cli
eas login
eas build:configure          # links the project (creates the EAS project id)

# Android app bundle (.aab) for Play Store:
eas build --platform android --profile production

# iOS build for App Store (uses Expo's cloud macOS — no Mac needed):
eas build --platform ios --profile production
```

Submit the builds:

```bash
eas submit --platform android --profile production   # needs a Play service-account JSON
eas submit --platform ios --profile production        # fill Apple IDs in eas.json first
```

Edit `eas.json` `submit.production` with your Apple ID / App Store Connect app
id / team id, and provide a Google Play service-account key. Full guide:
<https://docs.expo.dev/submit/introduction/>.

### Before you submit
- Replace the placeholder icons in `assets/` with your own 1024×1024 icon.
- Update `app.json` → `ios.bundleIdentifier` / `android.package` if you want a
  different id (currently `com.sanmol916.voicescore`).
- Bump `version` (and EAS auto-increments build numbers).
- Prepare store listing text, screenshots, and a privacy policy (required by
  both stores, especially because the app requests microphone access).

---

## 🗂️ Project structure

```
mobile/
  App.tsx                     providers + navigation root
  app.json                    Expo config (bundle ids, permissions, plugins)
  eas.json                    build & submit profiles
  src/
    theme.ts                  black/red design tokens
    types.ts                  domain model
    scoring.ts                derived scorecard + diff preview (pure)
    parser.ts                 Hindi/Hinglish voice → ball event (pure)
    hooks/
      useVoice.ts             native speech-to-text (with fallback)
      useFlag.ts              persisted boolean flags
    auth/firebaseConfig.ts    Firebase config + mode detection
    store/
      AuthContext.tsx         login state (Firebase + demo mock)
      matchStore.tsx          match state + AsyncStorage + history
    components/               ui, Scoreboard, ScorecardTables, ReviewSheet
    navigation/               RootNavigator + types
    screens/                  Onboarding, Auth, Home, SetupMatch,
                              LiveScoring, Scorecard, History, Settings
```

## ✅ Verified
- `npm run typecheck` (tsc) — passes.
- `npx expo-doctor` — 20/20 checks pass.
- `npx expo export` — Metro bundles all 954 modules with no errors.
