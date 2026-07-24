import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Team } from '../types';
import { useMatch } from '../store/matchStore';
import { useVoice } from '../hooks/useVoice';
import { parseTranscript } from '../parser';
import { computeInnings } from '../scoring';
import { Scoreboard } from '../components/Scoreboard';
import { BattingCard, BowlingCard } from '../components/ScorecardTables';
import { ReviewSheet, type DraftEvent } from '../components/ReviewSheet';
import { Button, Card, CardTitle, Field, Pill } from '../components/ui';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveScoring'>;

export function LiveScoringScreen({ navigation }: Props) {
  const { state, dispatch } = useMatch();
  const voice = useVoice();
  const [draft, setDraft] = useState<DraftEvent | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [manual, setManual] = useState('');

  const innings = state.innings[state.currentInningsIndex];
  const battingTeam = state.teams.find((t) => t.id === innings.battingTeamId) as Team;
  const bowlingTeam = state.teams.find((t) => t.id === innings.bowlingTeamId) as Team;
  const summary = useMemo(() => computeInnings(innings, state.teams), [innings, state.teams]);

  const doParse = (text: string) => {
    if (!text.trim()) return;
    const result = parseTranscript(text, {
      battingPlayers: battingTeam.players,
      bowlingPlayers: bowlingTeam.players,
      currentStrikerId: state.strikerId,
      currentNonStrikerId: state.nonStrikerId,
      currentBowlerId: state.bowlerId,
    });
    setDraft(result.event);
    setNotes(result.notes);
    setManual('');
    voice.reset();
  };

  const toggleMic = async () => {
    if (voice.listening) {
      await voice.stop();
      const text = `${voice.finalText} ${voice.partial}`.trim();
      if (text) doParse(text);
    } else {
      await voice.start('hi-IN');
    }
  };

  const startBlank = () =>
    setDraft({
      strikerId: state.strikerId,
      nonStrikerId: state.nonStrikerId,
      bowlerId: state.bowlerId,
      runs: 0,
      extra: null,
      extraRuns: 0,
      isWicket: false,
      isLegalDelivery: true,
    });

  const approve = () => {
    if (!draft) return;
    dispatch({ type: 'COMMIT_BALL', event: draft });
    setDraft(null);
    setNotes([]);
  };

  const endInnings = () => {
    const first = state.currentInningsIndex === 0;
    Alert.alert(
      first ? 'End innings?' : 'End match?',
      first ? 'Start the second innings (the chase)?' : 'Finish the match and view the result?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: first ? 'End innings' : 'End match',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'END_INNINGS' });
            if (!first) navigation.replace('Scorecard');
          },
        },
      ],
    );
  };

  const liveText = `${voice.finalText}${voice.partial ? ' ' + voice.partial : ''}`.trim();

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Scoreboard state={state} summary={summary} battingTeam={battingTeam} />

          {draft ? (
            <View style={{ marginTop: spacing.lg }}>
              <ReviewSheet
                draft={draft}
                notes={notes}
                state={state}
                battingTeam={battingTeam}
                bowlingTeam={bowlingTeam}
                onChange={setDraft}
                onApprove={approve}
                onCancel={() => {
                  setDraft(null);
                  setNotes([]);
                }}
              />
            </View>
          ) : (
            <Card style={{ marginTop: spacing.lg, alignItems: 'center' }}>
              <CardTitle>Voice input</CardTitle>
              <Pressable onPress={toggleMic}>
                <LinearGradient
                  colors={voice.listening ? [colors.redBright, colors.redDim] : [colors.bg3, colors.bg1]}
                  style={[styles.mic, voice.listening && styles.micOn]}
                >
                  <Text style={{ fontSize: 34 }}>{voice.listening ? '⏹' : '🎙️'}</Text>
                </LinearGradient>
              </Pressable>
              <Text style={styles.micHint}>
                {voice.listening ? 'Listening… tap to stop & review' : 'Tap and say what happened this ball'}
              </Text>

              <View style={styles.transcript}>
                <Text style={liveText ? styles.transcriptText : styles.transcriptEmpty}>
                  {liveText || 'e.g. “Pritam ne chauka mara”'}
                </Text>
              </View>

              {voice.error ? <Text style={styles.err}>⚠️ {voice.error}</Text> : null}
              {!voice.available ? (
                <Text style={styles.warn}>
                  Voice needs a dev/production build. In Expo Go, type the ball below.
                </Text>
              ) : null}

              <View style={styles.manualRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    placeholder="Type: rahul ne single liya"
                    value={manual}
                    onChangeText={setManual}
                    onSubmitEditing={() => doParse(manual)}
                  />
                </View>
              </View>
              <Button title="Review changes" icon="✓" disabled={!manual.trim() && !liveText} onPress={() => doParse(manual || liveText)} />
              <Button title="Add ball manually" variant="ghost" onPress={startBlank} style={{ marginTop: spacing.sm }} />
            </Card>
          )}

          {/* On-field controls */}
          <Card style={{ marginTop: spacing.lg }}>
            <CardTitle>On field</CardTitle>
            <Text style={styles.ofLabel}>Striker</Text>
            <PlayerRow
              players={battingTeam.players}
              selectedId={state.strikerId}
              disabledId={state.nonStrikerId}
              onSelect={(id) => dispatch({ type: 'SET_STRIKER', playerId: id })}
            />
            <Text style={styles.ofLabel}>Non-striker</Text>
            <PlayerRow
              players={battingTeam.players}
              selectedId={state.nonStrikerId}
              disabledId={state.strikerId}
              onSelect={(id) => dispatch({ type: 'SET_NON_STRIKER', playerId: id })}
            />
            <Text style={styles.ofLabel}>Bowler</Text>
            <PlayerRow
              players={bowlingTeam.players}
              selectedId={state.bowlerId}
              onSelect={(id) => dispatch({ type: 'SET_BOWLER', playerId: id })}
            />
            <View style={styles.ctrlRow}>
              <Button title="⇄ Swap" variant="ghost" style={{ flex: 1 }} onPress={() => dispatch({ type: 'SWAP_STRIKE' })} />
              <Button
                title="↺ Undo"
                variant="ghost"
                style={{ flex: 1 }}
                disabled={!!draft || innings.events.length === 0}
                onPress={() => dispatch({ type: 'UNDO_LAST' })}
              />
            </View>
            <Button
              title={state.currentInningsIndex === 0 ? 'End innings' : 'End match'}
              variant="danger"
              onPress={endInnings}
              style={{ marginTop: spacing.sm }}
            />
          </Card>

          <View style={{ marginTop: spacing.lg }}>
            <BattingCard summary={summary} state={state} />
            <BowlingCard summary={summary} state={state} />
          </View>

          <Button
            title="View full scorecard"
            variant="ghost"
            onPress={() => navigation.navigate('Scorecard')}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function PlayerRow({
  players,
  selectedId,
  disabledId,
  onSelect,
}: {
  players: Team['players'];
  selectedId?: string;
  disabledId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
      <View style={{ flexDirection: 'row' }}>
        {players.map((p) => (
          <Pill
            key={p.id}
            label={p.name}
            selected={selectedId === p.id}
            onPress={() => (p.id === disabledId ? undefined : onSelect(p.id))}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  mic: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    marginVertical: spacing.md,
  },
  micOn: { borderColor: 'transparent' },
  micHint: { color: colors.text2, fontSize: 13, marginBottom: spacing.md, textAlign: 'center' },
  transcript: {
    width: '100%',
    minHeight: 54,
    backgroundColor: colors.bg0,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  transcriptText: { color: colors.text0, fontSize: 15, lineHeight: 21 },
  transcriptEmpty: { color: colors.text3, fontStyle: 'italic', fontSize: 14 },
  err: { color: colors.redBright, fontSize: 13, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  warn: { color: colors.amber, fontSize: 12.5, marginBottom: spacing.sm },
  manualRow: { width: '100%' },
  ofLabel: { color: colors.text2, fontSize: 12, fontWeight: '600', marginTop: spacing.sm, marginBottom: 6 },
  ctrlRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
});
