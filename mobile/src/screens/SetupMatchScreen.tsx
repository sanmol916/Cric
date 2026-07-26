import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Player, Team } from '../types';
import { uid, useMatch } from '../store/matchStore';
import { pickImageFromLibrary } from '../lib/media';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/ui';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SetupMatch'>;

interface PlayerDraft {
  id: string;
  name: string;
  photoUri?: string;
}
interface TeamDraft {
  name: string;
  shortName: string;
  logoUri?: string;
  players: PlayerDraft[];
}

const blankPlayers = (): PlayerDraft[] =>
  [0, 1, 2].map(() => ({ id: uid('p_'), name: '' }));

const STEPS = ['Team A', 'Team B', 'Settings'];

export function SetupMatchScreen({ navigation }: Props) {
  const { dispatch } = useMatch();
  const [step, setStep] = useState(0);
  const [teamA, setTeamA] = useState<TeamDraft>({
    name: 'Royal Strikers',
    shortName: 'RS',
    players: blankPlayers(),
  });
  const [teamB, setTeamB] = useState<TeamDraft>({
    name: 'Crimson Kings',
    shortName: 'CK',
    players: blankPlayers(),
  });
  const [overs, setOvers] = useState('20');

  const current = step === 0 ? teamA : teamB;
  const setCurrent = step === 0 ? setTeamA : setTeamB;

  const teamValid = (t: TeamDraft) =>
    t.name.trim().length > 0 && t.players.filter((p) => p.name.trim()).length >= 2;

  const start = () => {
    const build = (d: TeamDraft): Team => ({
      id: uid('t_'),
      name: d.name.trim() || 'Team',
      shortName: d.shortName.trim() || undefined,
      logoUri: d.logoUri,
      players: d.players
        .filter((p) => p.name.trim())
        .map<Player>((p) => ({ id: p.id, name: p.name.trim(), photoUri: p.photoUri })),
    });
    const oversNum = Math.max(1, Math.min(50, parseInt(overs, 10) || 20));
    dispatch({ type: 'SETUP', teams: [build(teamA), build(teamB)], oversLimit: oversNum });
    navigation.replace('LiveScoring');
  };

  const next = () => {
    if (step < 2) setStep(step + 1);
    else start();
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
    else navigation.goBack();
  };

  const canProceed = step === 2 ? true : teamValid(current);

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Stepper step={step} />

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {step < 2 ? (
              <TeamForm
                key={step}
                accent={step === 0 ? [colors.redBright, colors.redDim] : ['#3aa0ff', '#1560c4']}
                team={current}
                onChange={setCurrent}
                label={step === 0 ? 'Home team' : 'Opponent'}
              />
            ) : (
              <SettingsStep
                teamA={teamA}
                teamB={teamB}
                overs={overs}
                setOvers={setOvers}
              />
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button title={step === 0 ? 'Cancel' : 'Back'} variant="ghost" style={{ flex: 1 }} onPress={back} />
            <Button
              title={step === 2 ? 'Start match' : 'Next'}
              icon={step === 2 ? '🏏' : undefined}
              style={{ flex: 1.4 }}
              disabled={!canProceed}
              onPress={next}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <View style={styles.stepper}>
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={label}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  active && styles.stepDotActive,
                  done && styles.stepDotDone,
                ]}
              >
                <Text style={[styles.stepNum, (active || done) && { color: colors.white }]}>
                  {done ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, active && { color: colors.text0 }]}>{label}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, done && { backgroundColor: colors.red }]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function TeamForm({
  team,
  onChange,
  label,
  accent,
}: {
  team: TeamDraft;
  onChange: (t: TeamDraft) => void;
  label: string;
  accent: [string, string];
}) {
  const pickLogo = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) onChange({ ...team, logoUri: uri });
  };
  const pickPlayerPhoto = async (id: string) => {
    const uri = await pickImageFromLibrary();
    if (uri) onChange({ ...team, players: team.players.map((p) => (p.id === id ? { ...p, photoUri: uri } : p)) });
  };
  const setPlayerName = (id: string, name: string) =>
    onChange({ ...team, players: team.players.map((p) => (p.id === id ? { ...p, name } : p)) });
  const addPlayer = () =>
    onChange({ ...team, players: [...team.players, { id: uid('p_'), name: '' }] });
  const removePlayer = (id: string) =>
    onChange({ ...team, players: team.players.filter((p) => p.id !== id) });

  const named = team.players.filter((p) => p.name.trim()).length;

  return (
    <View>
      {/* Team identity header */}
      <LinearGradient colors={accent} style={styles.teamHero}>
        <Pressable onPress={pickLogo} style={styles.logoTap}>
          <Avatar name={team.name || 'Team'} uri={team.logoUri} size={84} kind="team" />
          <View style={styles.cameraBadge}>
            <Text style={{ fontSize: 13 }}>{team.logoUri ? '✏️' : '📷'}</Text>
          </View>
        </Pressable>
        <Text style={styles.heroLabel}>{label}</Text>
        <Text style={styles.heroHint}>Tap the badge to add a team logo</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Team name</Text>
        <TextInput
          style={styles.input}
          value={team.name}
          placeholder="e.g. Mumbai Mavericks"
          placeholderTextColor={colors.text3}
          onChangeText={(v) => onChange({ ...team, name: v })}
        />
        <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Short code (optional)</Text>
        <TextInput
          style={[styles.input, { width: 120 }]}
          value={team.shortName}
          placeholder="MI"
          autoCapitalize="characters"
          maxLength={4}
          placeholderTextColor={colors.text3}
          onChangeText={(v) => onChange({ ...team, shortName: v })}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.playersHead}>
          <Text style={styles.fieldLabel}>Players (batting order)</Text>
          <View style={[styles.countPill, named >= 2 && { borderColor: colors.green }]}>
            <Text style={[styles.countText, named >= 2 && { color: colors.green }]}>{named} added</Text>
          </View>
        </View>

        {team.players.map((p, i) => (
          <View key={p.id} style={styles.playerRow}>
            <Text style={styles.playerIdx}>{i + 1}</Text>
            <Pressable onPress={() => pickPlayerPhoto(p.id)}>
              <Avatar name={p.name || `P${i + 1}`} uri={p.photoUri} size={40} kind="player" />
            </Pressable>
            <TextInput
              style={styles.playerInput}
              value={p.name}
              placeholder={`Player ${i + 1}`}
              placeholderTextColor={colors.text3}
              onChangeText={(v) => setPlayerName(p.id, v)}
            />
            <Pressable
              style={styles.removeBtn}
              onPress={() => (team.players.length > 1 ? removePlayer(p.id) : undefined)}
            >
              <Text style={{ color: colors.text3, fontSize: 15 }}>✕</Text>
            </Pressable>
          </View>
        ))}

        <Pressable style={styles.addRow} onPress={addPlayer}>
          <Text style={styles.addText}>＋  Add player</Text>
        </Pressable>
        <Text style={styles.tip}>Tip: tap a player's circle to add their photo.</Text>
      </View>
    </View>
  );
}

function SettingsStep({
  teamA,
  teamB,
  overs,
  setOvers,
}: {
  teamA: TeamDraft;
  teamB: TeamDraft;
  overs: string;
  setOvers: (v: string) => void;
}) {
  const presets = ['5', '10', '20', '50'];
  return (
    <View>
      <View style={styles.vsRow}>
        <View style={styles.vsTeam}>
          <Avatar name={teamA.name} uri={teamA.logoUri} size={64} kind="team" />
          <Text style={styles.vsName} numberOfLines={1}>{teamA.name}</Text>
        </View>
        <Text style={styles.vs}>VS</Text>
        <View style={styles.vsTeam}>
          <Avatar name={teamB.name} uri={teamB.logoUri} size={64} kind="team" />
          <Text style={styles.vsName} numberOfLines={1}>{teamB.name}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Overs per innings</Text>
        <View style={styles.presetRow}>
          {presets.map((p) => (
            <Pressable
              key={p}
              onPress={() => setOvers(p)}
              style={[styles.preset, overs === p && styles.presetSel]}
            >
              <Text style={[styles.presetText, overs === p && { color: colors.white }]}>{p}</Text>
            </Pressable>
          ))}
          <TextInput
            style={styles.oversInput}
            value={overs}
            keyboardType="number-pad"
            maxLength={2}
            placeholderTextColor={colors.text3}
            onChangeText={setOvers}
          />
        </View>
        <Text style={styles.tip}>{teamA.name} bats first. You can change the striker/bowler anytime during play.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg1,
  },
  // stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  stepItem: { alignItems: 'center', width: 74 },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepDotActive: { backgroundColor: colors.red, borderColor: colors.red },
  stepDotDone: { backgroundColor: colors.redDim, borderColor: colors.redDim },
  stepNum: { color: colors.text2, fontWeight: '800', fontSize: 13 },
  stepLabel: { color: colors.text3, fontSize: 11, marginTop: 4, fontWeight: '600' },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginTop: -16, maxWidth: 40 },
  // team hero
  teamHero: {
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  logoTap: { position: 'relative' },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bg1,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: spacing.md },
  heroHint: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  // cards
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  fieldLabel: { color: colors.text2, fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  input: {
    backgroundColor: colors.bg0,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text0,
    fontSize: 15,
    marginTop: 6,
  },
  playersHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: { color: colors.text2, fontSize: 11, fontWeight: '700' },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
  playerIdx: { color: colors.text3, width: 16, fontSize: 13, fontWeight: '700' },
  playerInput: {
    flex: 1,
    backgroundColor: colors.bg0,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.text0,
    fontSize: 15,
  },
  removeBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRow: {
    paddingVertical: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginTop: 4,
  },
  addText: { color: colors.text1, fontWeight: '700', fontSize: 14 },
  tip: { color: colors.text3, fontSize: 12, marginTop: spacing.md, lineHeight: 17 },
  // settings vs row
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  vsTeam: { alignItems: 'center', flex: 1 },
  vsName: { color: colors.text0, fontWeight: '700', marginTop: spacing.sm, fontSize: 14 },
  vs: { color: colors.redBright, fontWeight: '900', fontSize: 20, marginHorizontal: spacing.sm },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  preset: {
    width: 52,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetSel: { backgroundColor: colors.red, borderColor: colors.red },
  presetText: { color: colors.text1, fontWeight: '800', fontSize: 16 },
  oversInput: {
    width: 64,
    height: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg0,
    color: colors.text0,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
});
