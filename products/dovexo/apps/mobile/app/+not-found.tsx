import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button, EmptyState } from "@/src/components/ui";
import { colors, spacing } from "@/src/theme/tokens";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.code}>404</Text>
      <EmptyState
        icon="compass-outline"
        title="No encontramos esta pantalla"
        description="El enlace puede estar vencido o la pantalla cambió de lugar."
      />
      <Button title="Ir al inicio" onPress={() => router.replace("/")} variant="outline" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "stretch",
    justifyContent: "center",
    padding: spacing[4],
    backgroundColor: colors.bg,
    gap: spacing[3],
  },
  code: {
    fontSize: 44,
    fontWeight: "800",
    color: colors.border,
    textAlign: "center",
  },
});