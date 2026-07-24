import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field } from '../components/ui';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../store/AuthContext';

type Mode = 'phone' | 'email';

export function AuthScreen() {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('phone');

  // phone
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  // email
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.logoWrap}>
              <LinearGradient colors={[colors.redBright, colors.redDim]} style={styles.logo}>
                <Text style={{ fontSize: 34 }}>🏏</Text>
              </LinearGradient>
              <Text style={styles.brand}>
                Voice<Text style={{ color: colors.redBright }}>Score</Text>
              </Text>
              <Text style={styles.tag}>Sign in to start scoring</Text>
            </View>

            {auth.usingMock && (
              <View style={styles.demoNote}>
                <Text style={styles.demoText}>
                  Demo mode · OTP is <Text style={{ fontWeight: '800', color: colors.amber }}>123456</Text>.
                  Connect Firebase for real OTP & Google login.
                </Text>
              </View>
            )}

            {/* Google */}
            <Button
              title="Continue with Google"
              icon="🔵"
              variant="ghost"
              loading={auth.busy}
              onPress={() => run(auth.signInWithGoogle)}
            />

            <View style={styles.orRow}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>

            {/* Mode switch */}
            <View style={styles.tabs}>
              <Tab label="📱 Phone OTP" active={mode === 'phone'} onPress={() => setMode('phone')} />
              <Tab label="✉️ Email" active={mode === 'email'} onPress={() => setMode('email')} />
            </View>

            {mode === 'phone' ? (
              <View>
                {!auth.pendingPhone ? (
                  <>
                    <Field
                      label="Phone number"
                      placeholder="+91 98765 43210"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                    <Button
                      title="Send OTP"
                      loading={auth.busy}
                      disabled={phone.trim().length < 6}
                      onPress={() => run(() => auth.sendOtp(phone.trim()))}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.sentTo}>
                      Code sent to <Text style={{ color: colors.text0 }}>{auth.pendingPhone}</Text>
                    </Text>
                    <Field
                      label="Enter 6-digit code"
                      placeholder="123456"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                    />
                    <Button
                      title="Verify & sign in"
                      loading={auth.busy}
                      disabled={otp.trim().length < 4}
                      onPress={() => run(() => auth.verifyOtp(otp.trim()))}
                    />
                  </>
                )}
              </View>
            ) : (
              <View>
                <Field label="Name" placeholder="Your name" value={name} onChangeText={setName} />
                <Field
                  label="Email"
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
                <Field
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <Button
                  title="Continue"
                  loading={auth.busy}
                  disabled={!email.includes('@') || password.length < 4}
                  onPress={() => run(() => auth.signInWithEmail(email.trim(), password, name.trim()))}
                />
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.terms}>
              By continuing you agree to the Terms of Service and Privacy Policy.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingTop: spacing.xxl, flexGrow: 1, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 70, height: 70, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  brand: { color: colors.text0, fontSize: 26, fontWeight: '800' },
  tag: { color: colors.text2, marginTop: 4, fontSize: 14 },
  demoNote: {
    backgroundColor: 'rgba(245,166,35,0.09)',
    borderColor: 'rgba(245,166,35,0.3)',
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  demoText: { color: colors.text1, fontSize: 12.5, lineHeight: 18 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.text3, marginHorizontal: spacing.md, fontSize: 13 },
  tabs: { flexDirection: 'row', backgroundColor: colors.bg0, borderRadius: radius.sm, padding: 4, marginBottom: spacing.lg },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.sm - 2, alignItems: 'center' },
  tabActive: { backgroundColor: colors.red },
  tabText: { color: colors.text2, fontWeight: '700', fontSize: 14 },
  sentTo: { color: colors.text2, marginBottom: spacing.md, fontSize: 14 },
  error: { color: colors.redBright, marginTop: spacing.md, textAlign: 'center', fontSize: 14 },
  terms: { color: colors.text3, fontSize: 11, textAlign: 'center', marginTop: spacing.xl, lineHeight: 16 },
});
