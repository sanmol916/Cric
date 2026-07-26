import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

interface Slide {
  icon: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: '🏏',
    title: 'Score by speaking',
    body: 'No more tapping every ball. Just say what happened — in Hindi, Hinglish or English — and the app scores it for you.',
  },
  {
    icon: '🎙️',
    title: 'One line per ball',
    body: '“Rahul ne dusri bowl karwai aur Pritam ne single run liya.” The app understands runs, wickets, wides and no-balls.',
  },
  {
    icon: '✅',
    title: 'Review, then approve',
    body: 'Every command becomes an editable draft with a clear before → after preview. Fix anything, then approve to apply it everywhere.',
  },
  {
    icon: '📊',
    title: 'Full scorecard & history',
    body: 'Live batting and bowling cards, ball-by-ball commentary, chase targets and saved match history — all in your pocket.',
  },
];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);
  const isLast = index === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (isLast) {
      onDone();
    } else {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  return (
    <LinearGradient colors={[colors.bg0, colors.bg1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.skipRow}>
          {!isLast ? (
            <Text style={styles.skip} onPress={onDone}>
              Skip
            </Text>
          ) : (
            <View />
          )}
        </View>

        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            title={isLast ? 'Get started' : 'Next'}
            icon={isLast ? '🚀' : undefined}
            onPress={next}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.xl, height: 40, alignItems: 'center' },
  skip: { color: colors.text2, fontSize: 15, fontWeight: '600', padding: spacing.sm },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  iconWrap: {
    width: 140,
    height: 140,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(225,29,42,0.10)',
    borderWidth: 1,
    borderColor: colors.redDim,
    marginBottom: spacing.xxl,
  },
  icon: { fontSize: 66 },
  title: { color: colors.text0, fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: spacing.md },
  body: { color: colors.text2, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border, marginHorizontal: 4 },
  dotActive: { backgroundColor: colors.red, width: 24 },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
});
