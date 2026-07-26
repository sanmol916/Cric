import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { InningsSummary, MatchState, Team } from '../types';
import { Badge } from './ui';
import { Avatar } from './Avatar';
import { colors, font, radius, spacing } from '../theme';

interface Props {
  state: MatchState;
  summary: InningsSummary;
  battingTeam: Team;
}

export function Scoreboard({ state, summary, battingTeam }: Props) {
  const isChase = state.currentInningsIndex === 1;
  let target = 0;
  let toWin = 0;
  let rrr = '—';
  if (isChase) {
    const firstTotal = state.innings[0].events.reduce((s, e) => s + e.runs + e.extraRuns, 0);
    target = firstTotal + 1;
    toWin = target - summary.totalRuns;
    const ballsLeft = state.oversLimit * 6 - summary.legalBalls;
    rrr = ballsLeft > 0 ? ((toWin / ballsLeft) * 6).toFixed(2) : '—';
  }

  return (
    <LinearGradient
      colors={[colors.bg2, colors.bg0]}
      style={styles.board}
    >
      <View style={styles.topRow}>
        <View style={styles.teamRow}>
          <Avatar name={battingTeam.name} uri={battingTeam.logoUri} size={34} kind="team" />
          <Text style={styles.team} numberOfLines={1}>{battingTeam.name.toUpperCase()}</Text>
        </View>
        <Badge
          label={state.status === 'complete' ? 'Match over' : `LIVE · Inn ${state.currentInningsIndex + 1}`}
          live={state.status !== 'complete'}
        />
      </View>

      <Text style={styles.score}>
        {summary.totalRuns}
        <Text style={styles.wkts}>/{summary.wickets}</Text>
      </Text>

      <View style={styles.meta}>
        <Stat label="Overs" value={`${summary.oversText}/${state.oversLimit}`} />
        <Stat label="Run rate" value={summary.runRate.toFixed(2)} />
        <Stat label="Extras" value={String(summary.extras)} />
      </View>

      {isChase && state.status !== 'complete' && (
        <View style={styles.target}>
          <Text style={styles.targetText}>
            Target {target} · need {Math.max(0, toWin)} runs · Req {rrr}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, marginRight: spacing.sm },
  team: { color: colors.text1, fontWeight: '700', letterSpacing: 1, fontSize: 13, flexShrink: 1 },
  score: { color: colors.text0, fontSize: 52, fontWeight: '800', fontFamily: font.mono, marginTop: 6 },
  wkts: { color: colors.text2, fontSize: 28 },
  meta: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.md },
  statValue: { color: colors.text0, fontFamily: font.mono, fontSize: 17, fontWeight: '700' },
  statLabel: { color: colors.text2, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  target: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(225,29,42,0.1)',
    borderColor: colors.redDim,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  targetText: { color: colors.text1, fontSize: 13, fontWeight: '600' },
});
