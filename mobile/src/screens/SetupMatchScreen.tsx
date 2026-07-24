import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { makeTeam, useMatch } from '../store/matchStore';
import { Button, Card, CardTitle, Field } from '../components/ui';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SetupMatch'>;

interface TeamDraft {
  name: string;
  players: string[];
}

export function SetupMatchScreen({ navigation }: Props) {
  const { dispatch } = useMatch();
  const [teamA, setTeamA] = useState<TeamDraft>({ name: 'Royal Strikers', players: ['', '', ''] });
  const [teamB, setTeamB] = useState<TeamDraft>({ name: 'Crimson Kings', players: ['', '', ''] });
  const [overs, setOvers] = useState('20');

  const canStart =
    teamA.name.trim() &&
    teamB.name.trim() &&
    teamA.players.filter((p) => p.trim()).length >= 2 &&
    teamB.players.filter((p) => p.trim()).length >= 2;

  const start = () => {
    const tA = makeTeam(teamA.name, teamA.players);
    const tB = makeTeam(teamB.name, teamB.players);
    const oversNum = Math.max(1, Math.min(50, parseInt(overs, 10) || 20));
    dispatch({ type: 'SETUP', teams: [tA, tB], oversLimit: oversNum });
    navigation.replace('LiveScoring');
  };

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TeamEditor label="Team A (bats first)" team={teamA} onChange={setTeamA} />
          <View style={{ height: spacing.lg }} />
          <TeamEditor label="Team B" team={teamB} onChange={setTeamB} />

          <Card style={{ marginTop: spacing.lg }}>
            <CardTitle>Overs per innings</CardTitle>
            <Field keyboardType="number-pad" value={overs} onChangeText={setOvers} maxLength={2} />
          </Card>

          <Button
            title="Start match"
            icon="🏏"
            disabled={!canStart}
            onPress={start}
            style={{ marginTop: spacing.lg }}
          />
          {!canStart ? (
            <Text style={styles.hint}>Add at least 2 players to each team and name both teams.</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function TeamEditor({
  label,
  team,
  onChange,
}: {
  label: string;
  team: TeamDraft;
  onChange: (t: TeamDraft) => void;
}) {
  const setPlayer = (i: number, value: string) => {
    const players = [...team.players];
    players[i] = value;
    onChange({ ...team, players });
  };
  const addPlayer = () => onChange({ ...team, players: [...team.players, ''] });
  const removePlayer = (i: number) =>
    onChange({ ...team, players: team.players.filter((_, idx) => idx !== i) });

  return (
    <Card>
      <CardTitle>{label}</CardTitle>
      <Field label="Team name" value={team.name} onChangeText={(v) => onChange({ ...team, name: v })} />
      <Text style={styles.subLabel}>Players (batting order)</Text>
      {team.players.map((p, i) => (
        <View key={i} style={styles.playerRow}>
          <Text style={styles.idx}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Field placeholder={`Player ${i + 1}`} value={p} onChangeText={(v) => setPlayer(i, v)} />
          </View>
          <Pressable
            style={styles.removeBtn}
            onPress={() => (team.players.length > 1 ? removePlayer(i) : undefined)}
          >
            <Text style={{ color: colors.text2, fontSize: 16 }}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Button title="Add player" variant="ghost" icon="＋" onPress={addPlayer} />
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subLabel: { color: colors.text2, fontSize: 12, fontWeight: '600', marginBottom: spacing.sm },
  playerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  idx: { color: colors.text3, width: 20, fontSize: 14, marginTop: 14 },
  removeBtn: {
    width: 44,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg0,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  hint: { color: colors.text2, fontSize: 13, textAlign: 'center', marginTop: spacing.md },
});
