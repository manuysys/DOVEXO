import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ColorValue,
  type DimensionValue,
  type RefreshControlProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useReducedMotion } from "@/src/lib/a11y";
import {
  colors,
  layout,
  motion,
  radius,
  shadows,
  spacing,
  typography,
} from "@/src/theme/tokens";

export type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * El navegador de tabs entrega el color como `ColorValue`, que puede ser un
 * número o un objeto. Ionicons solo acepta string: si no lo es, usamos el
 * color de texto secundario del design system.
 */
export function tabIconColor(color: ColorValue | undefined): string {
  return typeof color === "string" ? color : colors.text2;
}
export type ButtonVariant = "primary" | "secondary" | "soft" | "outline" | "danger" | "ghost";
export type NoticeTone = "info" | "success" | "warning" | "danger";

/* ------------------------------------------------------------------ layout */

export function Screen({
  children,
  scroll = true,
  padded = true,
  contentStyle,
  style,
  footer,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  footer?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
}) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={["top", "left", "right"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, padded && styles.padded, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.column, padded && styles.padded, contentStyle]}>
          {children}
        </View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function BottomBar({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing[3]) }, style]}>
      {children}
    </View>
  );
}

export function Row({
  children,
  style,
  gap = spacing[2],
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  return <View style={[styles.row, { gap }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

/* -------------------------------------------------------------------- card */

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  flat = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  flat?: boolean;
}) {
  const base = [styles.card, flat && styles.cardFlat, style];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      android_ripple={{ color: colors.surface2 }}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

/* -------------------------------------------------------------------- text */

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
  style,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.headerTitle} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ button */

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  accessibilityLabel,
  accessibilityHint,
}: {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: "md" | "sm";
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const isDisabled = disabled || loading;
  const filled = variant === "primary" || variant === "secondary" || variant === "danger";
  const tint = filled ? colors.textInverse : buttonTextTints[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      android_ripple={{ color: filled ? "rgba(255,255,255,0.18)" : colors.surface2 }}
      style={({ pressed }) => [
        styles.button,
        size === "sm" ? styles.buttonSm : styles.buttonMd,
        buttonSurfaceStyles[variant],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tint} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
          <Text numberOfLines={1} style={[styles.buttonText, { color: tint }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = "surface",
  disabled = false,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: "surface" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const tint = tone === "danger" ? colors.dangerInk : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      android_ripple={{ color: colors.border, borderless: true }}
      style={({ pressed }) => [
        styles.iconButton,
        tone === "surface" && styles.iconButtonSurface,
        tone === "danger" && styles.iconButtonDanger,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Ionicons name={icon} size={22} color={tint} />
    </Pressable>
  );
}

/* ------------------------------------------------------------------- input */

export function Input({
  label,
  hint,
  error,
  style,
  containerStyle,
  ...props
}: TextInputProps & {
  label?: string;
  hint?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputGroup, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.text2}
        accessibilityLabel={props.accessibilityLabel ?? label}
        {...props}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        style={[
          styles.input,
          props.multiline ? styles.inputMultiline : null,
          focused ? styles.inputFocused : null,
          error ? styles.inputError : null,
          style,
        ]}
      />
      {error ? (
        <Text style={styles.inputErrorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ badges */

export function Badge({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: "neutral" | "primary" | "teal" | "success" | "warning" | "danger";
  icon?: IconName;
}) {
  const tint = badgeTextColors[tone];
  return (
    <View style={[styles.badge, badgeSurfaceStyles[tone]]}>
      {icon ? <Ionicons name={icon} size={12} color={tint} /> : null}
      <Text style={[styles.badgeText, { color: tint }]}>{label}</Text>
    </View>
  );
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: IconName;
  count?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      android_ripple={{ color: selected ? "rgba(255,255,255,0.2)" : colors.surface2 }}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {icon ? (
        <Ionicons name={icon} size={16} color={selected ? colors.textInverse : colors.text2} />
      ) : null}
      <Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{label}</Text>
      {count !== undefined ? (
        <View style={[styles.chipCount, selected ? styles.chipCountSelected : null]}>
          <Text style={[styles.chipCountText, selected ? styles.chipCountTextSelected : null]}>
            {count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ------------------------------------------------------------------- lists */

export function ListRow({
  title,
  subtitle,
  meta,
  icon,
  right,
  onPress,
  accessibilityLabel,
  style,
  last = false,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: IconName;
  right?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  last?: boolean;
}) {
  const content = (
    <>
      {icon ? (
        <View style={styles.listIcon}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.listText}>
        <Text style={styles.listTitle} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.muted}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.text2} /> : null)}
    </>
  );

  const base = [styles.listRow, last ? null : styles.listRowBorder, style];

  if (!onPress) return <View style={base}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      android_ripple={{ color: colors.surface2 }}
      style={({ pressed }) => [base, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

/* -------------------------------------------------------------- feedback UI */

export function Loading({ label = "Cargando..." }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function Skeleton({
  width = "100%",
  height = 14,
  rounding = radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  rounding?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (reduced) {
      opacity.setValue(0.7);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: motion.slow,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: motion.slow,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: rounding, backgroundColor: colors.surface2, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card>
      <Skeleton width="35%" height={12} />
      <Skeleton width="75%" height={18} />
      {Array.from({ length: Math.max(0, lines - 2) }).map((_, index) => (
        <Skeleton key={index} width={index % 2 === 0 ? "60%" : "45%"} height={12} />
      ))}
    </Card>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.column} accessibilityLabel="Cargando contenido">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

export function InlineNotice({
  tone = "info",
  title,
  message,
  action,
}: {
  tone?: NoticeTone;
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  const meta = noticeMeta[tone];
  return (
    <View style={[styles.notice, meta.surface]} accessibilityLiveRegion="polite">
      <Ionicons name={meta.icon} size={18} color={meta.tint} style={styles.noticeIcon} />
      <View style={styles.noticeText}>
        {title ? <Text style={[styles.noticeTitle, { color: meta.tint }]}>{title}</Text> : null}
        <Text style={[styles.noticeMessage, { color: meta.tint }]}>{message}</Text>
        {action ? <View style={styles.noticeAction}>{action}</View> : null}
      </View>
    </View>
  );
}

export function ErrorState({
  title = "No pudimos cargar los datos",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.errorCard} accessibilityRole="alert">
      <Row>
        <Ionicons name="alert-circle" size={20} color={colors.dangerInk} />
        <Text style={styles.errorTitle}>{title}</Text>
      </Row>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry ? (
        <Button title="Reintentar" variant="outline" size="sm" icon="refresh" onPress={onRetry} />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyText}>{description}</Text> : null}
      {action ? <View style={styles.emptyAction}>{action}</View> : null}
    </View>
  );
}

/* ------------------------------------------------------------------ styles */

const buttonTextTints: Record<ButtonVariant, string> = {
  primary: colors.textInverse,
  secondary: colors.textInverse,
  soft: colors.primaryDark,
  outline: colors.text,
  danger: colors.textInverse,
  ghost: colors.primary,
};

const badgeTextColors = {
  neutral: colors.text,
  primary: colors.primaryDark,
  teal: colors.tealInk,
  success: colors.successInk,
  warning: colors.warningInk,
  danger: colors.dangerInk,
} as const;

const badgeSurfaceStyles = StyleSheet.create({
  neutral: { backgroundColor: colors.surface2 },
  primary: { backgroundColor: colors.primarySoft },
  teal: { backgroundColor: colors.tealSoft },
  success: { backgroundColor: colors.successSoft },
  warning: { backgroundColor: colors.warningSoft },
  danger: { backgroundColor: colors.dangerSoft },
});

const buttonSurfaceStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.deep },
  soft: { backgroundColor: colors.primarySoft },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: colors.transparent },
});

const noticeMeta = {
  info: { surface: { backgroundColor: colors.primarySoft }, tint: colors.primaryDark, icon: "information-circle" },
  success: { surface: { backgroundColor: colors.successSoft }, tint: colors.successInk, icon: "checkmark-circle" },
  warning: { surface: { backgroundColor: colors.warningSoft }, tint: colors.warningInk, icon: "warning" },
  danger: { surface: { backgroundColor: colors.dangerSoft }, tint: colors.dangerInk, icon: "alert-circle" },
} as const satisfies Record<NoticeTone, { surface: ViewStyle; tint: string; icon: IconName }>;

const textBase: TextStyle = { includeFontPadding: false };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  column: { gap: spacing[4] },
  padded: { paddingHorizontal: layout.screenPadding },
  scrollContent: { paddingTop: spacing[4], paddingBottom: spacing[10], gap: spacing[4] },
  pressed: { opacity: 0.86 },
  disabled: { opacity: 0.5 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    gap: spacing[3],
    ...shadows.card,
  },
  cardFlat: { padding: 0, gap: 0, overflow: "hidden" },

  row: { flexDirection: "row", alignItems: "center" },
  divider: { height: 1, backgroundColor: colors.border },

  title: { ...textBase, ...typography.display, color: colors.text },
  heading: { ...textBase, ...typography.heading, color: colors.text },
  subtitle: { ...textBase, ...typography.body, color: colors.text2 },
  muted: { ...textBase, fontSize: 13, lineHeight: 19, color: colors.text2 },
  label: { ...textBase, ...typography.label, color: colors.text },
  sectionTitle: { ...textBase, ...typography.overline, color: colors.text2 },

  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
  headerText: { flex: 1, gap: spacing[1] },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  eyebrow: { ...textBase, ...typography.overline, color: colors.primary },
  headerTitle: { ...textBase, ...typography.display, color: colors.text },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    overflow: "hidden",
  },
  buttonMd: { minHeight: layout.buttonHeight },
  buttonSm: { minHeight: layout.touchTarget, paddingHorizontal: spacing[3] },
  buttonText: { ...textBase, ...typography.bodyStrong },

  iconButton: {
    width: layout.touchTarget,
    height: layout.touchTarget,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconButtonSurface: { backgroundColor: colors.surface2 },
  iconButtonDanger: { backgroundColor: colors.dangerSoft },

  inputGroup: { gap: spacing[1] },
  input: {
    ...textBase,
    minHeight: layout.buttonHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: { minHeight: 104, textAlignVertical: "top" },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.danger },
  inputErrorText: { ...textBase, ...typography.caption, color: colors.dangerInk },
  hint: { ...textBase, ...typography.caption, color: colors.text2 },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    paddingHorizontal: spacing[2] + 2,
    paddingVertical: spacing[1],
  },
  badgeText: { ...textBase, fontSize: 12, lineHeight: 16, fontWeight: "700" },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    minHeight: layout.touchTarget,
    paddingHorizontal: spacing[4],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  chipSelected: { backgroundColor: colors.deep, borderColor: colors.deep },
  chipText: { ...textBase, ...typography.label, color: colors.text },
  chipTextSelected: { color: colors.textInverse },
  chipCount: {
    minWidth: 20,
    paddingHorizontal: spacing[1],
    borderRadius: radius.pill,
    backgroundColor: colors.surface2,
    alignItems: "center",
  },
  chipCountSelected: { backgroundColor: "rgba(255,255,255,0.22)" },
  chipCountText: { ...textBase, ...typography.caption, color: colors.text2 },
  chipCountTextSelected: { color: colors.textInverse },

  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    minHeight: 56,
    paddingVertical: spacing[3],
  },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  listText: { flex: 1, gap: 2 },
  listTitle: { ...textBase, ...typography.bodyStrong, color: colors.text },
  listMeta: { ...textBase, ...typography.caption, color: colors.text2 },

  center: { alignItems: "center", justifyContent: "center", padding: spacing[6], gap: spacing[2] },

  notice: { flexDirection: "row", gap: spacing[2], borderRadius: radius.md, padding: spacing[3] },
  noticeIcon: { marginTop: 1 },
  noticeText: { flex: 1, gap: 2 },
  noticeTitle: { ...textBase, ...typography.label },
  noticeMessage: { ...textBase, ...typography.caption },
  noticeAction: { marginTop: spacing[2] },

  errorCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#F3C9C9",
    padding: spacing[4],
    gap: spacing[2],
  },
  errorTitle: { ...textBase, ...typography.bodyStrong, color: colors.dangerInk, flex: 1 },
  errorText: { ...textBase, ...typography.label, color: colors.dangerInk },

  empty: { alignItems: "center", paddingVertical: spacing[8], paddingHorizontal: spacing[4], gap: spacing[2] },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { ...textBase, ...typography.heading, color: colors.text, textAlign: "center" },
  emptyText: { ...textBase, ...typography.label, color: colors.text2, textAlign: "center" },
  emptyAction: { marginTop: spacing[2], width: "100%" },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing[3],
    paddingHorizontal: layout.screenPadding,
    gap: spacing[2],
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.raised,
  },
});