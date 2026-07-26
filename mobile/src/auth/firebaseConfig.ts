// ---------------------------------------------------------------------------
// Firebase configuration.
//
// The app runs in a fully functional MOCK auth mode out of the box (any phone
// + OTP "123456", one-tap Google/email) so you can develop and demo instantly.
//
// To enable REAL OTP + Google sign-in:
//   1. Create a free project at https://console.firebase.google.com
//   2. Add a Web app, copy its config values below (or set them via env).
//   3. In the Firebase console enable:
//        Authentication > Sign-in method > Phone
//        Authentication > Sign-in method > Google
//   4. For Google native sign-in, also add your OAuth client IDs in
//      src/auth/googleAuth.ts.
//
// As soon as apiKey + projectId are filled in, `isFirebaseConfigured` becomes
// true and the AuthContext switches from mock mode to real Firebase.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey.length > 0 && firebaseConfig.projectId.length > 0;

// Google OAuth client IDs (from Firebase console > Authentication > Google, or
// Google Cloud console). Only needed for real Google sign-in.
export const googleClientIds = {
  expo: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? '',
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
  web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
};
