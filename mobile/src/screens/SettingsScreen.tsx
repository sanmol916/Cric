import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../store/AuthContext';
import { clearHistory, useMatch } from '../store/matchStore';
import { isFirebaseConfigured } from '../auth/firebaseConfig';
import { Button, Card, CardTitle, Divider } from '../components/ui';
import { colors, spacing } from '../theme';

export function SettingsScreen() {
  const { user, signOutUser } = useAuth();
  const { state, dispatch } = useMatch();

  const confirmReset = () =>
    Alert.alert('Reset current match?', 'This clears the in-progress match.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => dispatch({ type: 'RESET' }) },
    ]);

  const confirmClearHistory = () =>
    Alert.alert('Clear match history?', 'All saved matches will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => clearHistory() },
    ]);

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Settings</Text>

          <Card>
            <CardTitle>Account</CardTitle>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 22 }}>
                  {user?.method === 'google' ? '🔵' : user?.method === 'email' ? '✉️' : '📱'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.displayName ?? 'Player'}</Text>
                <Text style={styles.sub}>{user?.email ?? user?.phone ?? 'Signed in'}</Text>
              </View>
            </View>
            <Button title="Sign out" variant="ghost" onPress={signOutUser} style={{ marginTop: spacing.md }} />
          </Card>

          <Card style={{ marginTop: spacing.lg }}>
            <CardTitle>Data</CardTitle>
            <Button
              title="Reset current match"
              variant="ghost"
              disabled={state.status === 'setup'}
              onPress={confirmReset}
            />
            <View style={{ height: spacing.sm }} />
            <Button title="Clear match history" variant="danger" onPress={confirmClearHistory} />
          </Card>

          <Card style={{ marginTop: spacing.lg }}>
            <CardTitle>About</CardTitle>
            <Row label="App" value="VoiceScore Cricket" />
            <Divider />
            <Row label="Version" value="1.0.0" />
            <Divider />
            <Row label="Auth backend" value={isFirebaseConfigured ? 'Firebase' : 'Demo (mock)'} />
          </Card>

          <Text style={styles.footer}>Made for gully cricket. 🏏</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text0, fontSize: 22, fontWeight: '800', marginBottom: spacing.lg },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: { color: colors.text0, fontSize: 16, fontWeight: '700' },
  sub: { color: colors.text2, fontSize: 13, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { color: colors.text2, fontSize: 14 },
  infoValue: { color: colors.text0, fontSize: 14, fontWeight: '600' },
  footer: { color: colors.text3, textAlign: 'center', marginTop: spacing.xl, fontSize: 13 },
});
