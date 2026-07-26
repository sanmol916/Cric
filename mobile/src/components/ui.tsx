import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleBar} />
      <Text style={styles.titleText}>{children}</Text>
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: string;
  style?: ViewProps['style'];
}

export function Button({
  title,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  icon,
  style,
}: ButtonProps) {
  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.white : colors.red} />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'ghost' && { color: colors.text0 },
            variant === 'danger' && { color: colors.redBright },
          ]}
        >
          {icon ? `${icon}  ` : ''}
          {title}
        </Text>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <Pressable onPress={disabled || loading ? undefined : onPress} style={[{ borderRadius: radius.sm }, style]}>
        <LinearGradient
          colors={[colors.redBright, colors.red]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, disabled && styles.btnDisabled]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={[
        styles.btn,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        disabled && styles.btnDisabled,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function Field({
  label,
  ...rest
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.text3}
        style={styles.input}
        {...rest}
      />
    </View>
  );
}

export function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && styles.pillSel]}>
      <Text style={[styles.pillText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, live }: { label: string; live?: boolean }) {
  return (
    <View style={[styles.badge, live && styles.badgeLive]}>
      {live ? <View style={styles.dot} /> : null}
      <Text style={[styles.badgeText, live && { color: colors.redBright }]}>{label}</Text>
    </View>
  );
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  titleBar: {
    width: 4,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.red,
    marginRight: spacing.sm,
  },
  titleText: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  btn: {
    minHeight: 50,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
  },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.borderStrong },
  btnDanger: {
    backgroundColor: 'rgba(225,29,42,0.08)',
    borderWidth: 1,
    borderColor: colors.redDim,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: colors.white, fontSize: 15, fontWeight: '700' },
  label: { color: colors.text2, fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.bg0,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text0,
    fontSize: 15,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg0,
    marginRight: 8,
    marginBottom: 8,
  },
  pillSel: { backgroundColor: colors.red, borderColor: colors.red },
  pillText: { color: colors.text1, fontWeight: '700', fontSize: 14 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeLive: { borderColor: colors.redDim },
  badgeText: { color: colors.text1, fontSize: 12, fontWeight: '600' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.redBright, marginRight: 6 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.lg },
});
