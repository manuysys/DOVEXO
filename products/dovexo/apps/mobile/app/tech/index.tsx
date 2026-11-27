import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  Input,
  InlineNotice,
  Loading,
  Screen,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { ApiError } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { colors, spacing, typography } from "@/src/theme/tokens";

/**
 * Puerta de la experiencia del técnico: sesión, login o redirección a la
 * navegación inferior. Se mantiene como ruta para conservar `router.back()`
 * y el flujo de sesión existente.
 */
export default function TechGateScreen() {
  const { loading, techSession } = useAuth();

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Cargando sesión..." />
      </Screen>
    );
  }

  if (techSession) return <Redirect href="/tech/home" />;

  return <TechLogin />;
}

function TechLogin() {
  const router = useRouter();
  const { techLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      await techLogin(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos iniciar sesión.");
    } finally {
      setSubmitting(false);
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
        <Title>Ingreso de técnico</Title>
        <Subtitle>Usá el usuario que te dio tu empresa.</Subtitle>
      </View>

      <Card>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="tecnico@empresa.com"
          returnKeyType="next"
        />
        <Input
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          placeholder="Tu contraseña"
          returnKeyType="go"
          onSubmitEditing={() => void submit()}
        />
        {error ? <InlineNotice tone="danger" message={error} /> : null}
        <Button
          title="Ingresar"
          onPress={() => void submit()}
          loading={submitting}
          disabled={!email.trim() || !password}
          icon="log-in-outline"
        />
        <Button
          title="Usar cuenta demo"
          variant="ghost"
          size="sm"
          onPress={() => {
            setEmail("tecnico@saasgestion.com");
            setPassword("Tecnico12345!");
          }}
        />
      </Card>

      <Text style={styles.hint}>
        Sin conexión no vas a poder iniciar sesión, pero los cambios ya guardados en el teléfono
        se envían cuando vuelve la red.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 48, justifyContent: "center" },
  backText: { ...typography.label, color: colors.primary },
  header: { gap: spacing[1] },
  hint: { ...typography.caption, color: colors.text2 },
});