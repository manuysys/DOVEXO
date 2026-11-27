import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { ConfirmSheet } from "@/src/components/bottom-sheet";
import { SyncDetailsCard, SyncStatusBanner } from "@/src/components/sync-status";
import {
  Badge,
  Button,
  Card,
  ListRow,
  Muted,
  Screen,
  ScreenHeader,
  SectionTitle,
} from "@/src/components/ui";
import { useAuth } from "@/src/lib/auth";

export default function TechProfileScreen() {
  const router = useRouter();
  const { techSession, techLogout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const tenant = techSession?.tenants.find((item) => item.id === techSession.tenantId);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  async function logout() {
    setLoggingOut(true);
    try {
      await techLogout();
      router.replace("/tech");
    } finally {
      setLoggingOut(false);
      setConfirming(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Perfil"
        title="Tu cuenta"
        subtitle={tenant?.name ?? "Empresa"}
      />

      <SyncStatusBanner />

      <Card>
        <SectionTitle>Empresa</SectionTitle>
        <ListRow icon="business-outline" title={tenant?.name ?? "Empresa"} subtitle="Tu empresa" />
        <ListRow
          icon="shield-checkmark-outline"
          title="Rol"
          subtitle="Técnico"
          right={<Badge label="Técnico" tone="primary" />}
          last
        />
        {techSession && techSession.tenants.length > 1 ? (
          <Muted>
            Tenés acceso a {techSession.tenants.length} empresas. La app usa la primera de la
            lista.
          </Muted>
        ) : null}
      </Card>

      <SyncDetailsCard />

      <Card>
        <SectionTitle>Aplicación</SectionTitle>
        <ListRow icon="phone-portrait-outline" title="DOVEXO para técnicos" subtitle={`Versión ${version}`} last />
        <Muted>
          Las fotos y los materiales se guardan en el teléfono cuando no hay conexión y se envían
          solos al volver la red.
        </Muted>
      </Card>

      <Button
        title="Cerrar sesión"
        variant="danger"
        icon="log-out-outline"
        onPress={() => setConfirming(true)}
      />

      <ConfirmSheet
        visible={confirming}
        title="¿Cerrar sesión?"
        message="Los cambios pendientes quedan guardados en el teléfono hasta que vuelvas a entrar."
        confirmLabel="Cerrar sesión"
        destructive
        loading={loggingOut}
        onConfirm={() => void logout()}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}
