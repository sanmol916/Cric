import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { InningsSummary, MatchState } from '../types';
import { Card, CardTitle } from './ui';
import { Avatar } from './Avatar';
import { ballsToOvers } from '../scoring';
import { colors, font, spacing } from '../theme';

interface Props {
  summary: InningsSummary;
  state: MatchState;
}

function photoOf(state: MatchState, playerId: string): string | undefined {
  for (const t of state.teams) {
    const p = t.players.find((pl) => pl.id === playerId);
    if (p) return p.photoUri;
  }
  return undefined;
}

export function BattingCard({ summary, state }: Props) {
  const batters = summary.batting.filter(
    (b) =>
      b.balls > 0 ||
      b.isOut ||
      b.playerId === state.strikerId ||
      b.playerId === state.nonStrikerId,
  );

  return (
    <Card>
      <CardTitle>Batting</CardTitle>
      <View style={styles.headerRow}>
        <Text style={[styles.h, styles.nameCol]}>Batter</Text>
        <Text style={[styles.h, styles.numCol]}>R</Text>
        <Text style={[styles.h, styles.numCol]}>B</Text>
        <Text style={[styles.h, styles.numCol]}>4s</Text>
        <Text style={[styles.h, styles.numCol]}>6s</Text>
        <Text style={[styles.h, styles.srCol]}>SR</Text>
      </View>
      {batters.length === 0 ? (
        <Text style={styles.empty}>No batters yet</Text>
      ) : (
        batters.map((b) => {
          const onStrike = b.playerId === state.strikerId && !b.isOut;
          return (
            <View key={b.playerId} style={[styles.row, onStrike && styles.rowActive]}>
              <View style={[styles.nameCol, styles.nameWrap]}>
                <Avatar name={b.name} uri={photoOf(state, b.playerId)} size={30} kind="player" ring={onStrike} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, onStrike && { color: colors.redBright }]} numberOfLines={1}>
                    {b.name}
                    {onStrike ? ' *' : ''}
                  </Text>
                  {b.isOut && b.dismissal ? <Text style={styles.dismissal}>{b.dismissal}</Text> : null}
                  {!b.isOut && (b.playerId === state.strikerId || b.playerId === state.nonStrikerId) ? (
                    <Text style={styles.notout}>not out</Text>
                  ) : null}
                </View>
              </View>
              <Text style={[styles.num, styles.numCol]}>{b.runs}</Text>
              <Text style={[styles.num, styles.numCol]}>{b.balls}</Text>
              <Text style={[styles.num, styles.numCol]}>{b.fours}</Text>
              <Text style={[styles.num, styles.numCol]}>{b.sixes}</Text>
              <Text style={[styles.num, styles.srCol]}>{b.strikeRate.toFixed(0)}</Text>
            </View>
          );
        })
      )}
    </Card>
  );
}

export function BowlingCard({ summary, state }: Props) {
  const bowlers = summary.bowling.filter((b) => b.legalBalls > 0 || b.runsConceded > 0);
  return (
    <Card style={{ marginTop: spacing.lg }}>
      <CardTitle>Bowling</CardTitle>
      <View style={styles.headerRow}>
        <Text style={[styles.h, styles.nameCol]}>Bowler</Text>
        <Text style={[styles.h, styles.numCol]}>O</Text>
        <Text style={[styles.h, styles.numCol]}>R</Text>
        <Text style={[styles.h, styles.numCol]}>W</Text>
        <Text style={[styles.h, styles.srCol]}>Econ</Text>
      </View>
      {bowlers.length === 0 ? (
        <Text style={styles.empty}>No bowlers yet</Text>
      ) : (
        bowlers.map((b) => {
          const bowling = b.playerId === state.bowlerId;
          return (
            <View key={b.playerId} style={[styles.row, bowling && styles.rowActive]}>
              <View style={[styles.nameCol, styles.nameWrap]}>
                <Avatar name={b.name} uri={photoOf(state, b.playerId)} size={30} kind="player" ring={bowling} />
                <Text style={[styles.name, bowling && { color: colors.redBright }]} numberOfLines={1}>
                  {b.name}
                  {bowling ? ' *' : ''}
                </Text>
              </View>
              <Text style={[styles.num, styles.numCol]}>{ballsToOvers(b.legalBalls)}</Text>
              <Text style={[styles.num, styles.numCol]}>{b.runsConceded}</Text>
              <Text style={[styles.num, styles.numCol]}>{b.wickets}</Text>
              <Text style={[styles.num, styles.srCol]}>{b.economy.toFixed(1)}</Text>
            </View>
          );
        })
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  h: {
    color: colors.text3,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg3,
  },
  rowActive: { backgroundColor: 'rgba(225,29,42,0.06)', borderRadius: 8 },
  nameCol: { flex: 3.4 },
  numCol: { flex: 1, textAlign: 'right' },
  srCol: { flex: 1.3, textAlign: 'right' },
  nameWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingRight: 6 },
  name: { color: colors.text0, fontWeight: '600', fontSize: 14 },
  num: { color: colors.text1, fontFamily: font.mono, fontSize: 13 },
  dismissal: { color: colors.text3, fontSize: 11 },
  notout: { color: colors.text2, fontSize: 11 },
  empty: { color: colors.text2, paddingVertical: 10, fontSize: 13 },
});
