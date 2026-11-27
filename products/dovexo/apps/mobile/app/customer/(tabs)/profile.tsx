import Constants from "expo-constants";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { ConfirmSheet } from "@/src/components/bottom-sheet";
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
import type { PortalSession } from "@/src/lib/types";

export default function CustomerProfileScreen() {
  const { customerSession } = useAuth();
  if (!customerSession) return <Redirect href="/customer" />;
  return <Profile session={customerSession} />;
}

function Profile({ session }: { session: PortalSession }) {
  const router = useRouter();
  const { customerLogout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const version = Constants.expoConfig?.version ?? "1.0.0";

  async function logout() {
    setLoggingOut(true);
    try {
      await customerLogout();
      router.replace("/customer");
    } finally {
      setLoggingOut(false);
      setConfirming(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader eyebrow="Perfil" title={session.customer.name} subtitle={session.tenant.name} />

      <Card>
        <SectionTitle>Mis datos</SectionTitle>
        <ListRow
          icon="mail-outline"
          title="Email"
          subtitle={session.customer.email ?? "Sin email registrado"}
        />
        <ListRow
          icon="call-outline"
          title="Teléfono"
          subtitle={session.customer.phone ?? "Sin teléfono registrado"}
          last
        />
        <Muted>Si necesitás cambiar estos datos, pedíselo a la empresa.</Muted>
      </Card>

      <Card>
        <SectionTitle>Empresa</SectionTitle>
        <ListRow
          icon="business-outline"
          title={session.tenant.name}
          subtitle={`Código: ${session.tenant.slug}`}
          right={<Badge label="Cliente" tone="primary" />}
          last
        />
      </Card>

      <Card>
        <SectionTitle>Aplicación</SectionTitle>
        <ListRow
          icon="phone-portrait-outline"
          title="DOVEXO para clientes"
          subtitle={`Versión ${version}`}
          last
        />
        <Muted>
          Tus datos se usan solo para gestionar tus solicitudes, trabajos y presupuestos.
        </Muted>
      </Card>

      <View>
        <Button
          title="Cerrar sesión"
          variant="danger"
          icon="log-out-outline"
          onPress={() => setConfirming(true)}
        />
      </View>

      <ConfirmSheet
        visible={confirming}
        title="¿Cerrar sesión?"
        message="Para volver a entrar vas a necesitar un código nuevo de la empresa."
        confirmLabel="Cerrar sesión"
        destructive
        loading={loggingOut}
        onConfirm={() => void logout()}
        onCancel={() => setConfirming(false)}
      />
    </Screen>
  );
}