import { Ionicons } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  Chip,
  Divider,
  InlineNotice,
  Input,
  Loading,
  Muted,
  Screen,
  SectionTitle,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { api, ApiError, DEMO_TENANT_SLUG } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { colors, spacing, typography } from "@/src/theme/tokens";

export default function CustomerGateScreen() {
  const { loading, customerSession } = useAuth();

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Cargando sesión..." />
      </Screen>
    );
  }

  if (customerSession) return <Redirect href="/customer/home" />;

  return <CustomerLogin />;
}

function CustomerLogin() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const routeSlug = typeof params.slug === "string" ? params.slug : DEMO_TENANT_SLUG;
  const routeToken = typeof params.token === "string" ? params.token : "";
  const { customerLogin } = useAuth();

  const [tenantSlug, setTenantSlug] = useState(routeSlug);
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("carlos@example.com");
  const [token, setToken] = useState(routeToken);
  const [message, setMessage] = useState<string | null>(
    routeToken ? "Código recibido. Presioná Ingresar para continuar." : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestAccess() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const data = await api.portalRequestAccess(
        tenantSlug.trim(),
        mode === "email" ? { email: contact.trim() } : { phone: contact.trim() },
      );
      setMessage(data.message);
      if (data.dev_token) {
        setToken(data.dev_token);
        setMessage("Modo demo: usá el código que aparece abajo.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos solicitar el acceso.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const session = await api.portalVerify(tenantSlug.trim(), token.trim());
      await customerLogin(session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Código inválido o vencido.");
    } finally {
      setLoading(false);
    }
  }

  async function demo() {
    setError(null);
    setLoading(true);
    try {
      const session = await api.portalDemo(DEMO_TENANT_SLUG);
      await customerLogin(session);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "La demo no está disponible ahora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Pressable
        onPress={() => router.replace("/")}
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio"
        style={styles.back}
      >
        <Text style={styles.backText}>← Inicio</Text>
      </Pressable>

      <View style={styles.header}>
        <Title>Ingreso de cliente</Title>
        <Subtitle>
          Pedí acceso a tu empresa y recibí un código por email o WhatsApp.
        </Subtitle>
      </View>

      <Card>
        <Input
          label="Código de empresa"
          value={tenantSlug}
          onChangeText={setTenantSlug}
          autoCapitalize="none"
          placeholder="servicios-demo"
          hint="Te lo da la empresa la primera vez."
        />
        <View style={styles.chips}>
          {(
            [
              { value: "email", label: "Email" },
              { value: "phone", label: "Teléfono" },
            ] as const
          ).map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={mode === item.value}
              onPress={() => {
                setMode(item.value);
                setContact("");
              }}
            />
          ))}
        </View>
        <Input
          label={mode === "email" ? "Email" : "Teléfono"}
          value={contact}
          onChangeText={setContact}
          autoCapitalize="none"
          keyboardType={mode === "email" ? "email-address" : "phone-pad"}
          placeholder={mode === "email" ? "tu@email.com" : "+54 11 5555-1001"}
        />
        <Button
          title="Enviar acceso"
          onPress={() => void requestAccess()}
          loading={loading}
          disabled={!tenantSlug.trim() || !contact.trim()}
        />
        {message ? <InlineNotice tone="info" message={message} /> : null}

        <Divider />

        <Input
          label="Código o token"
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          placeholder="Pegá el código recibido"
        />
        <Button
          title="Ingresar"
          variant="secondary"
          icon="log-in-outline"
          onPress={() => void verify()}
          disabled={!token.trim()}
          loading={loading}
        />
        {error ? <InlineNotice tone="danger" message={error} /> : null}
      </Card>

      <Card>
        <SectionTitle>Demo</SectionTitle>
        <Muted>Mirá la experiencia del cliente con datos de ejemplo.</Muted>
        <Button
          title="Probar demo de cliente"
          variant="outline"
          icon="play-circle-outline"
          onPress={() => void demo()}
        />
      </Card>

      <View style={styles.footNote}>
        <Ionicons name="lock-closed-outline" size={14} color={colors.text2} />
        <Text style={styles.footText}>
          El código es personal. No lo compartas: da acceso a tus trabajos y presupuestos.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 48, justifyContent: "center" },
  backText: { ...typography.label, color: colors.primary },
  header: { gap: spacing[1] },
  chips: { flexDirection: "row", gap: spacing[2] },
  footNote: { flexDirection: "row", alignItems: "flex-start", gap: spacing[2] },
  footText: { ...typography.caption, color: colors.text2, flex: 1 },
});