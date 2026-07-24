import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { InningsSummary, MatchState, Team } from '../types';
import { useMatch } from '../store/matchStore';
import { computeInnings } from '../scoring';
import { BattingCard, BowlingCard } from '../components/ScorecardTables';
import { Card, CardTitle } from '../components/ui';
import { colors, font, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Scorecard'>;

function resultLine(match: MatchState, s0: InningsSummary, s1: InningsSummary): string | null {
  if (match.status !== 'complete') return null;
  const t0 = match.teams.find((t) => t.id === s0.battingTeamId);
  const t1 = match.teams.find((t) => t.id === s1.battingTeamId);
  if (s1.legalBalls === 0 && s1.totalRuns === 0) return null;
  if (s1.totalRuns > s0.totalRuns) {
    return `${t1?.name} won by ${10 - s1.wickets} wickets`;
  }
  if (s0.totalRuns > s1.totalRuns) {
    return `${t0?.name} won by ${s0.totalRuns - s1.totalRuns} runs`;
  }
  return 'Match tied';
}

export function ScorecardScreen({ route }: Props) {
  const { state } = useMatch();
  const match = route.params?.match ?? state;

  const s0 = computeInnings(match.innings[0], match.teams);
  const s1 = computeInnings(match.innings[1], match.teams);
  const result = resultLine(match, s0, s1);

  const innaHasData = (s: InningsSummary) => s.legalBalls > 0 || s.totalRuns > 0;

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {result ? (
            <Card style={styles.resultCard}>
              <Text style={styles.trophy}>🏆</Text>
              <Text style={styles.result}>{result}</Text>
            </Card>
          ) : null}

          {[s0, s1].map((s, i) =>
            innaHasData(s) || i === match.currentInningsIndex ? (
              <View key={i} style={{ marginBottom: spacing.xl }}>
                <InningsHeader match={match} summary={s} index={i} />
                <BattingCard summary={s} state={{ ...match, currentInningsIndex: i as 0 | 1 }} />
                <BowlingCard summary={s} state={{ ...match, currentInningsIndex: i as 0 | 1 }} />
              </View>
            ) : null,
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function InningsHeader({
  match,
  summary,
  index,
}: {
  match: MatchState;
  summary: InningsSummary;
  index: number;
}) {
  const team = match.teams.find((t) => t.id === summary.battingTeamId) as Team | undefined;
  return (
    <Card style={styles.header}>
      <CardTitle>{`Innings ${index + 1}`}</CardTitle>
      <View style={styles.headerRow}>
        <Text style={styles.headerTeam}>{team?.name ?? 'Team'}</Text>
        <Text style={styles.headerScore}>
          {summary.totalRuns}/{summary.wickets}
          <Text style={styles.headerOvers}> ({summary.oversText})</Text>
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  resultCard: { alignItems: 'center', borderColor: colors.redDim, marginBottom: spacing.lg },
  trophy: { fontSize: 40, marginBottom: 6 },
  result: { color: colors.text0, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  header: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTeam: { color: colors.text1, fontSize: 15, fontWeight: '600' },
  headerScore: { color: colors.text0, fontSize: 24, fontWeight: '800', fontFamily: font.mono },
  headerOvers: { color: colors.text2, fontSize: 14 },
});
