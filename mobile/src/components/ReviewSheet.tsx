import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type {
  BallEvent,
  DismissalType,
  ExtraType,
  MatchState,
  Team,
} from '../types';
import { previewChanges } from '../scoring';
import { Button, Card, CardTitle, Divider, Pill } from './ui';
import { colors, font, spacing } from '../theme';

export type DraftEvent = Omit<BallEvent, 'id' | 'timestamp'>;

interface Props {
  draft: DraftEvent;
  notes: string[];
  state: MatchState;
  battingTeam: Team;
  bowlingTeam: Team;
  onChange: (d: DraftEvent) => void;
  onApprove: () => void;
  onCancel: () => void;
}

const RUN_OPTIONS = [0, 1, 2, 3, 4, 6];
const EXTRA_OPTIONS: { value: ExtraType; label: string }[] = [
  { value: null, label: 'None' },
  { value: 'wide', label: 'Wide' },
  { value: 'noball', label: 'No ball' },
  { value: 'bye', label: 'Bye' },
  { value: 'legbye', label: 'Leg bye' },
];
const DISMISSALS: { value: DismissalType; label: string }[] = [
  { value: 'bowled', label: 'Bowled' },
  { value: 'caught', label: 'Caught' },
  { value: 'lbw', label: 'LBW' },
  { value: 'stumped', label: 'Stumped' },
  { value: 'runout', label: 'Run out' },
  { value: 'other', label: 'Other' },
];

export function ReviewSheet({
  draft,
  notes,
  state,
  battingTeam,
  bowlingTeam,
  onChange,
  onApprove,
  onCancel,
}: Props) {
  const innings = state.innings[state.currentInningsIndex];
  const changes = previewChanges(innings, state.teams, { ...draft, id: 'preview', timestamp: 0 });
  const set = (patch: Partial<DraftEvent>) => onChange({ ...draft, ...patch });

  const setExtra = (extra: ExtraType) =>
    set({
      extra,
      extraRuns: extra === 'wide' || extra === 'noball' ? Math.max(1, draft.extraRuns || 1) : 0,
      isLegalDelivery: extra !== 'wide' && extra !== 'noball',
    });

  return (
    <Card style={styles.pending}>
      <CardTitle>Review this ball</CardTitle>

      {draft.transcript ? <Text style={styles.heard}>Heard: “{draft.transcript}”</Text> : null}

      {notes.map((n, i) => (
        <View key={i} style={styles.note}>
          <Text style={styles.noteText}>⚠️  {n}</Text>
        </View>
      ))}

      <Text style={styles.label}>Bowler</Text>
      <PlayerPills
        players={bowlingTeam.players}
        selectedId={draft.bowlerId}
        onSelect={(id) => set({ bowlerId: id })}
      />

      <Text style={styles.label}>Batter on strike</Text>
      <PlayerPills
        players={battingTeam.players}
        selectedId={draft.strikerId}
        onSelect={(id) => set({ strikerId: id })}
      />

      <Text style={styles.label}>Runs</Text>
      <View style={styles.pillRow}>
        {RUN_OPTIONS.map((r) => (
          <Pill key={r} label={String(r)} selected={draft.runs === r} onPress={() => set({ runs: r })} />
        ))}
      </View>

      <Text style={styles.label}>Extra</Text>
      <View style={styles.pillRow}>
        {EXTRA_OPTIONS.map((o) => (
          <Pill
            key={o.label}
            label={o.label}
            selected={draft.extra === o.value}
            onPress={() => setExtra(o.value)}
          />
        ))}
      </View>

      <View style={styles.wicketRow}>
        <Text style={styles.wicketLabel}>Wicket fell</Text>
        <Switch
          value={draft.isWicket}
          onValueChange={(v) =>
            set({
              isWicket: v,
              dismissalType: v ? draft.dismissalType ?? 'bowled' : undefined,
              outPlayerId: v ? draft.outPlayerId ?? draft.strikerId : undefined,
            })
          }
          trackColor={{ true: colors.red, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      {draft.isWicket && (
        <>
          <Text style={styles.label}>How out</Text>
          <View style={styles.pillRow}>
            {DISMISSALS.map((d) => (
              <Pill
                key={d.value}
                label={d.label}
                selected={draft.dismissalType === d.value}
                onPress={() => set({ dismissalType: d.value })}
              />
            ))}
          </View>
          <Text style={styles.label}>Who is out</Text>
          <PlayerPills
            players={battingTeam.players}
            selectedId={draft.outPlayerId}
            onSelect={(id) => set({ outPlayerId: id })}
          />
        </>
      )}

      <Divider />

      <CardTitle>Resulting changes</CardTitle>
      {changes.map((c, i) => (
        <View key={i} style={styles.diffRow}>
          <Text style={styles.diffLabel}>{c.label}</Text>
          <Text style={styles.diffBefore}>{c.before}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.diffAfter}>{c.after}</Text>
        </View>
      ))}

      <Button title="Approve & apply" icon="✓" onPress={onApprove} style={{ marginTop: spacing.md }} />
      <Button title="Cancel" variant="ghost" onPress={onCancel} style={{ marginTop: spacing.sm }} />
    </Card>
  );
}

function PlayerPills({
  players,
  selectedId,
  onSelect,
}: {
  players: Team['players'];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
      <View style={{ flexDirection: 'row' }}>
        {players.map((p) => (
          <Pill key={p.id} label={p.name} selected={selectedId === p.id} onPress={() => onSelect(p.id)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pending: { borderColor: colors.redDim },
  heard: { color: colors.text2, fontStyle: 'italic', marginBottom: spacing.md, fontSize: 13 },
  note: {
    backgroundColor: 'rgba(245,166,35,0.09)',
    borderColor: 'rgba(245,166,35,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  noteText: { color: colors.amber, fontSize: 12.5 },
  label: { color: colors.text2, fontSize: 12, fontWeight: '600', marginTop: spacing.md, marginBottom: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  wicketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  wicketLabel: { color: colors.text0, fontSize: 15, fontWeight: '600' },
  diffRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  diffLabel: { flex: 1, color: colors.text1, fontSize: 13, fontWeight: '600' },
  diffBefore: { color: colors.text3, fontFamily: font.mono, fontSize: 12 },
  arrow: { color: colors.red },
  diffAfter: { color: colors.text0, fontFamily: font.mono, fontSize: 13, fontWeight: '700' },
});
