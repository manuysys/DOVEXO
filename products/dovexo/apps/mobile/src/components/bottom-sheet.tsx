import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, IconButton } from "@/src/components/ui";
import { useReducedMotion } from "@/src/lib/a11y";
import { colors, layout, motion, radius, shadows, spacing, typography } from "@/src/theme/tokens";

/**
 * Bottom sheet con `Modal` + `Animated` (sin dependencias nuevas).
 * Cierra con el botón de Android, tocando el fondo o arrastrando el handle.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  dismissible?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);

  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    const duration = reduced ? 0 : visible ? motion.slow : motion.fast;
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [mounted, progress, reduced, visible]);

  const close = () => {
    if (!dismissible) return;
    onClose();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          dismissible && gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          dragY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 96 || gesture.vy > 0.9) {
            Animated.timing(dragY, {
              toValue: height,
              duration: motion.fast,
              useNativeDriver: true,
            }).start(() => {
              dragY.setValue(0);
              onClose();
            });
            return;
          }
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [dismissible, dragY, height, onClose],
  );

  if (!mounted) return null;

  const backdropOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const enterY = progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
      accessibilityViewIsModal
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            disabled={!dismissible}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
          pointerEvents="box-none"
        >
          <Animated.View style={{ transform: [{ translateY: enterY }] }}>
            <Animated.View
              style={[
                styles.sheet,
                {
                  maxHeight: height * layout.sheetMaxHeightRatio,
                  paddingBottom: Math.max(insets.bottom, spacing[4]),
                  transform: [{ translateY: dragY }],
                },
              ]}
            >
              <View style={styles.handleArea} {...panResponder.panHandlers}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.title} accessibilityRole="header">
                    {title}
                  </Text>
                  {description ? <Text style={styles.description}>{description}</Text> : null}
                </View>
                <IconButton icon="close" onPress={close} accessibilityLabel="Cerrar" tone="ghost" />
              </View>

              {children ? (
                <ScrollView
                  contentContainerStyle={styles.body}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {children}
                </ScrollView>
              ) : null}

              {footer ? <View style={styles.footer}>{footer}</View> : null}
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
  children,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      title={title}
      description={message}
      dismissible={!loading}
      footer={
        <View style={styles.actions}>
          <Button
            title={confirmLabel}
            variant={destructive ? "danger" : "primary"}
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
            style={styles.action}
          />
          <Button
            title={cancelLabel}
            variant="outline"
            onPress={onCancel}
            disabled={loading}
            style={styles.action}
          />
        </View>
      }
    >
      {children}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  keyboard: { width: "100%" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.sheet,
  },
  handleArea: { alignItems: "center", paddingTop: spacing[2], paddingBottom: spacing[2] },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  headerText: { flex: 1, gap: spacing[1] },
  title: { ...typography.title, color: colors.text },
  description: { ...typography.label, fontWeight: "400", color: colors.text2 },
  body: { paddingHorizontal: spacing[4], paddingBottom: spacing[4], gap: spacing[4] },
  footer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actions: { gap: spacing[2] },
  action: { width: "100%" },
});