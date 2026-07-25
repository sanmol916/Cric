import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { MatchState } from '../types';
import { loadHistory } from '../store/matchStore';
import { computeInnings } from '../scoring';
import { Card, CardTitle } from '../components/ui';
import { Avatar } from '../components/Avatar';
import { colors, font, spacing } from '../theme';

export function HistoryScreen() {
  const [matches, setMatches] = useState<MatchState[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadHistory().then((m) => active && setMatches(m));
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Match history</Text>
          {matches.length === 0 ? (
            <Card style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🕑</Text>
              <Text style={{ color: colors.text2 }}>No completed matches yet.</Text>
            </Card>
          ) : (
            matches.map((m) => {
              const s0 = computeInnings(m.innings[0], m.teams);
              const s1 = computeInnings(m.innings[1], m.teams);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => navigation.navigate('Scorecard', { match: m })}
                >
                  <Card style={{ marginBottom: spacing.md }}>
                    <View style={styles.row}>
                      <View style={styles.teamCell}>
                        <Avatar name={m.teams[0].name} uri={m.teams[0].logoUri} size={30} kind="team" />
                        <Text style={styles.team} numberOfLines={1}>{m.teams[0].name}</Text>
                      </View>
                      <Text style={styles.score}>
                        {s0.totalRuns}/{s0.wickets}
                      </Text>
                    </View>
                    <View style={styles.row}>
                      <View style={styles.teamCell}>
                        <Avatar name={m.teams[1].name} uri={m.teams[1].logoUri} size={30} kind="team" />
                        <Text style={styles.team} numberOfLines={1}>{m.teams[1].name}</Text>
                      </View>
                      <Text style={styles.score}>
                        {s1.totalRuns}/{s1.wickets}
                      </Text>
                    </View>
                    <Text style={styles.date}>
                      {new Date(m.updatedAt).toLocaleDateString()} · {m.oversLimit} overs
                    </Text>
                  </Card>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text0, fontSize: 22, fontWeight: '800', marginBottom: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  teamCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, marginRight: spacing.sm },
  team: { color: colors.text1, fontSize: 15, fontWeight: '600', flexShrink: 1 },
  score: { color: colors.text0, fontSize: 18, fontWeight: '800', fontFamily: font.mono },
  date: { color: colors.text3, fontSize: 12, marginTop: 6 },
});
