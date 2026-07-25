import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

// A palette of tasteful gradient pairs; chosen deterministically per name so an
// avatar's colour is stable across the app.
const GRADIENTS: [string, string][] = [
  ['#ff2d3f', '#9a1520'],
  ['#f5a623', '#d67d00'],
  ['#2fd07a', '#12a55c'],
  ['#3aa0ff', '#1560c4'],
  ['#a06bff', '#6a2fd0'],
  ['#ff6ba6', '#c41f6a'],
  ['#20c9c9', '#0e8a8a'],
  ['#8a94a6', '#4c5568'],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

function initials(name: string, kind: 'team' | 'player'): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (kind === 'team') {
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

interface Props {
  name: string;
  uri?: string;
  size?: number;
  kind?: 'team' | 'player';
  ring?: boolean;
}

export function Avatar({ name, uri, size = 44, kind = 'player', ring }: Props) {
  const radius = kind === 'team' ? size * 0.28 : size / 2;
  const border = ring ? { borderWidth: 2, borderColor: colors.redBright } : null;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: radius }, border]}
      />
    );
  }

  const pair = GRADIENTS[hash(name || '?') % GRADIENTS.length];
  return (
    <LinearGradient
      colors={pair}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius },
        border,
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
        {initials(name, kind)}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.white, fontWeight: '800' },
});
