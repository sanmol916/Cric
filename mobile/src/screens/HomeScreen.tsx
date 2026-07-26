import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { useMatch } from '../store/matchStore';
import { useAuth } from '../store/AuthContext';
import { computeInnings } from '../scoring';
import { Button, Card, CardTitle } from '../components/ui';
import { Avatar } from '../components/Avatar';
import { colors, radius, spacing } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: Props) {
  const { state } = useMatch();
  const { user } = useAuth();

  const liveSummary = useMemo(() => {
    if (state.status === 'setup') return null;
    const innings = state.innings[state.currentInningsIndex];
    return computeInnings(innings, state.teams);
  }, [state]);

  const battingTeam = state.teams.find(
    (t) => t.id === state.innings[state.currentInningsIndex].battingTeamId,
  );

  const greeting = user?.displayName ? `Hi, ${user.displayName}` : 'Welcome';

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.brand}>
                Voice<Text style={{ color: colors.redBright }}>Score</Text> Cricket
              </Text>
            </View>
            <LinearGradient colors={[colors.redBright, colors.redDim]} style={styles.logo}>
              <Text style={{ fontSize: 24 }}>🏏</Text>
            </LinearGradient>
          </View>

          {liveSummary && battingTeam ? (
            <Card style={styles.resumeCard}>
              <CardTitle>Match in progress</CardTitle>
              <View style={styles.resumeTeamRow}>
                <Avatar name={battingTeam.name} uri={battingTeam.logoUri} size={32} kind="team" />
                <Text style={styles.resumeTeam}>{battingTeam.name}</Text>
              </View>
              <Text style={styles.resumeScore}>
                {liveSummary.totalRuns}/{liveSummary.wickets}
                <Text style={styles.resumeOvers}> ({liveSummary.oversText} ov)</Text>
              </Text>
              <Button
                title={state.status === 'complete' ? 'View result' : 'Resume scoring'}
                icon="▶"
                onPress={() =>
                  navigation.navigate(state.status === 'complete' ? 'Scorecard' : 'LiveScoring')
                }
                style={{ marginTop: spacing.md }}
              />
            </Card>
          ) : null}

          <Button
            title="Start a new match"
            icon="＋"
            onPress={() => navigation.navigate('SetupMatch')}
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.quickRow}>
            <QuickTile
              icon="📊"
              label="Scorecard"
              onPress={() => navigation.navigate('Scorecard')}
              disabled={state.status === 'setup'}
            />
            <QuickTile icon="🕑" label="History" onPress={() => navigation.navigate('History')} />
          </View>

          <Card style={{ marginTop: spacing.lg }}>
            <CardTitle>How it works</CardTitle>
            {[
              'Set up your two teams and players.',
              'Tap the mic and say the ball, e.g. “Pritam ne chauka mara”.',
              'Check the proposed changes, edit if needed, then Approve.',
            ].map((t, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipNum}>
                  <Text style={styles.tipNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.tipText}>{t}</Text>
              </View>
            ))}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function QuickTile({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Card style={[styles.tile, disabled && { opacity: 0.4 }]}>
      <Text style={{ fontSize: 26 }} onPress={disabled ? undefined : onPress}>
        {icon}
      </Text>
      <Text style={styles.tileLabel} onPress={disabled ? undefined : onPress}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  greeting: { color: colors.text2, fontSize: 14 },
  brand: { color: colors.text0, fontSize: 22, fontWeight: '800', marginTop: 2 },
  logo: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  resumeCard: { borderColor: colors.redDim },
  resumeTeamRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  resumeTeam: { color: colors.text1, fontWeight: '600', fontSize: 14 },
  resumeScore: { color: colors.text0, fontSize: 34, fontWeight: '800', marginTop: 2 },
  resumeOvers: { color: colors.text2, fontSize: 16, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  tile: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  tileLabel: { color: colors.text1, marginTop: 8, fontWeight: '600' },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  tipNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(225,29,42,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tipNumText: { color: colors.redBright, fontWeight: '800', fontSize: 13 },
  tipText: { color: colors.text1, flex: 1, fontSize: 14, lineHeight: 20 },
});
