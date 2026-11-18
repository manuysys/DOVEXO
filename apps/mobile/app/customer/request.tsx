import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  Button,
  Card,
  Chip,
  EmptyState,
  IconButton,
  InlineNotice,
  Input,
  Muted,
  Screen,
  SectionTitle,
  Subtitle,
  Title,
} from "@/src/components/ui";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { errorMessage } from "@/src/lib/offline";
import { priorities } from "@/src/lib/status";
import type { PortalSession } from "@/src/lib/types";
import { colors, spacing, typography } from "@/src/theme/tokens";

const priorityOptions = ["low", "normal", "high", "urgent"] as const;

export default function CustomerRequestScreen() {
  const { customerSession } = useAuth();
  if (!customerSession) return <Redirect href="/customer" />;
  return <RequestForm session={customerSession} />;
}

function RequestForm({ session }: { session: PortalSession }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.portalCreateRequest(session, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["portal-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["portal-requests"] });
      setError(null);
      setSent(true);
    },
    onError: (err) => setError(errorMessage(err)),
  });

  if (sent) {
    return (
      <Screen>
        <Card>
          <EmptyState
            icon="checkmark-circle-outline"
            title="Solicitud enviada"
            description={`${session.tenant.name} va a revisar tu pedido y te va a contactar para coordinar la visita.`}
            action={
              <Button
                title="Volver al inicio"
                onPress={() => router.replace("/customer/home")}
              />
            }
          />
        </Card>
        <Button
          title="Hacer otra solicitud"
          variant="ghost"
          icon="add"
          onPress={() => {
            setSent(false);
            setTitle("");
            setDescription("");
            setPriority("normal");
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon="arrow-back" onPress={() => router.back()} accessibilityLabel="Volver" />
        <Text style={styles.step}>Nueva solicitud</Text>
      </View>

      <View style={styles.header}>
        <Title>¿Qué necesitás?</Title>
        <Subtitle>Contanos el problema. Cuanto más claro, mejor podemos ayudarte.</Subtitle>
      </View>

      <Card>
        <Input
          label="Motivo"
          value={title}
          onChangeText={setTitle}
          placeholder="Ej.: El aire acondicionado no enfría"
          maxLength={120}
          autoFocus
        />
        <Input
          label="Detalle (opcional)"
          value={description}
          onChangeText={setDescription}
          placeholder="Contanos desde cuándo pasa, si hace ruido, si es urgente..."
          multiline
          maxLength={1000}
        />

        <SectionTitle>Prioridad</SectionTitle>
        <View style={styles.chips}>
          {priorityOptions.map((value) => (
            <Chip
              key={value}
              label={priorities[value] ?? value}
              selected={priority === value}
              onPress={() => setPriority(value)}
            />
          ))}
        </View>

        {error ? <InlineNotice tone="danger" message={error} /> : null}

        <Button
          title="Enviar solicitud"
          icon="send"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!title.trim()}
        />
        <Muted>La empresa recibe la solicitud y te contacta para coordinar día y horario.</Muted>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  step: { ...typography.label, color: colors.text2 },
  header: { gap: spacing[1] },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
});