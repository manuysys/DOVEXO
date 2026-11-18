import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Badge, Button, Card, type IconName } from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

export default function WelcomeScreen() {
  const router = useRouter();
  const { techSession, customerSession } = useAuth();
  const version = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.mark}>
            <Text style={styles.markText}>D</Text>
          </View>
          <Text style={styles.brand}>DOVEXO</Text>
          <Text style={styles.heroTitle}>Del primer llamado al último cobro.</Text>
          <Text style={styles.heroText}>
            Gestión de servicios técnicos para empresas, técnicos y clientes.
          </Text>
        </View>

        <RoleCard
          icon="construct"
          title="Soy técnico"
          description="Trabajos asignados, agenda del día, materiales, fotos y notas."
          actionLabel={techSession ? "Continuar como técnico" : "Entrar como técnico"}
          active={Boolean(techSession)}
          onPress={() => router.push("/tech")}
        />

        <RoleCard
          icon="home"
          title="Soy cliente"
          description="Pedí un servicio, seguí el trabajo y respondé presupuestos."
          actionLabel={customerSession ? "Continuar como cliente" : "Entrar como cliente"}
          active={Boolean(customerSession)}
          onPress={() => router.push("/customer")}
        />

        <Text style={styles.footer}>ARVOKTA · DOVEXO {version}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoleCard({
  icon,
  title,
  description,
  actionLabel,
  active,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  actionLabel: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Card>
      <View style={styles.roleHeader}>
        <View style={styles.roleIcon}>
          <Ionicons name={icon} size={22} color={colors.primary} />
        </View>
        <View style={styles.roleText}>
          <View style={styles.roleTitleRow}>
            <Text style={styles.roleTitle}>{title}</Text>
            {active ? <Badge label="Sesión activa" tone="success" /> : null}
          </View>
          <Text style={styles.roleDescription}>{description}</Text>
        </View>
      </View>
      <Button
        title={actionLabel}
        onPress={onPress}
        variant={active ? "primary" : "soft"}
        accessibilityHint={`Abre la experiencia de ${title.toLowerCase()}`}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  hero: {
    backgroundColor: colors.deep,
    borderRadius: radius.xl,
    padding: spacing[6],
    gap: spacing[2],
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[2],
  },
  markText: { color: colors.textInverse, fontSize: 22, fontWeight: "800" },
  brand: { ...typography.overline, color: colors.cyan, letterSpacing: 2 },
  heroTitle: { ...typography.display, color: colors.textInverse },
  heroText: { ...typography.body, color: "rgba(255,255,255,0.78)" },
  roleHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing[3] },
  roleIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  roleText: { flex: 1, gap: spacing[1] },
  roleTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  roleTitle: { ...typography.heading, color: colors.text },
  roleDescription: { ...typography.label, fontWeight: "400", color: colors.text2 },
  footer: {
    ...typography.caption,
    color: colors.text2,
    textAlign: "center",
    marginTop: spacing[2],
  },
});