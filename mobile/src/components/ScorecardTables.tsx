import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { InningsSummary, MatchState } from '../types';
import { Card, CardTitle } from './ui';
import { ballsToOvers } from '../scoring';
import { colors, font, spacing } from '../theme';

interface Props {
  summary: InningsSummary;
  state: MatchState;
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
      <Row header cols={['Batter', 'R', 'B', '4s', '6s', 'SR']} />
      {batters.length === 0 ? (
        <Text style={styles.empty}>No batters yet</Text>
      ) : (
        batters.map((b) => {
          const onStrike = b.playerId === state.strikerId && !b.isOut;
          return (
            <View key={b.playerId}>
              <Row
                active={onStrike}
                cols={[
                  `${b.name}${onStrike ? ' *' : ''}`,
                  String(b.runs),
                  String(b.balls),
                  String(b.fours),
                  String(b.sixes),
                  b.strikeRate.toFixed(0),
                ]}
              />
              {b.isOut && b.dismissal ? <Text style={styles.dismissal}>{b.dismissal}</Text> : null}
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
      <Row header cols={['Bowler', 'O', 'R', 'W', 'Econ']} widths={[3, 1, 1, 1, 1.4]} />
      {bowlers.length === 0 ? (
        <Text style={styles.empty}>No bowlers yet</Text>
      ) : (
        bowlers.map((b) => (
          <Row
            key={b.playerId}
            active={b.playerId === state.bowlerId}
            widths={[3, 1, 1, 1, 1.4]}
            cols={[
              `${b.name}${b.playerId === state.bowlerId ? ' *' : ''}`,
              ballsToOvers(b.legalBalls),
              String(b.runsConceded),
              String(b.wickets),
              b.economy.toFixed(1),
            ]}
          />
        ))
      )}
    </Card>
  );
}

function Row({
  cols,
  header,
  active,
  widths,
}: {
  cols: string[];
  header?: boolean;
  active?: boolean;
  widths?: number[];
}) {
  const flexes = widths ?? [3, 1, 1, 1, 1, 1.2];
  return (
    <View style={[styles.row, active && styles.rowActive]}>
      {cols.map((c, i) => (
        <Text
          key={i}
          style={[
            styles.cell,
            { flex: flexes[i] ?? 1, textAlign: i === 0 ? 'left' : 'right' },
            i === 0 ? styles.nameCell : styles.numCell,
            header && styles.headerCell,
            active && i === 0 && { color: colors.redBright },
          ]}
        >
          {c}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.bg3,
    alignItems: 'center',
  },
  rowActive: { backgroundColor: 'rgba(225,29,42,0.06)' },
  cell: { fontSize: 13 },
  nameCell: { color: colors.text0, fontWeight: '600' },
  numCell: { color: colors.text1, fontFamily: font.mono },
  headerCell: {
    color: colors.text3,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    fontFamily: 'System',
  },
  dismissal: { color: colors.text3, fontSize: 11, marginTop: -2, marginBottom: 4 },
  empty: { color: colors.text2, paddingVertical: 8, fontSize: 13 },
});
