import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, Linking, StyleSheet, Text, View } from "react-native";

import { BottomSheet, ConfirmSheet } from "@/src/components/bottom-sheet";
import { SyncStatusBanner, SyncStatusPill } from "@/src/components/sync-status";
import {
  Badge,
  BottomBar,
  Button,
  Card,
  Divider,
  ErrorState,
  IconButton,
  InlineNotice,
  Input,
  ListRow,
  Muted,
  Screen,
  SectionTitle,
  SkeletonList,
  type NoticeTone,
} from "@/src/components/ui";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/lib/auth";
import { formatDateTime, formatQuantity, formatTime, relativeDayLabel } from "@/src/lib/format";
import { clientId } from "@/src/lib/id";
import {
  enqueueAction,
  errorMessage,
  isRetryableError,
  type PendingAction,
} from "@/src/lib/offline";
import { techTransitions, workOrderStatusMeta, type TechTransition } from "@/src/lib/status";
import { useSync } from "@/src/lib/sync";
import { orderAddress } from "@/src/lib/work-orders";
import { colors, radius, spacing, typography } from "@/src/theme/tokens";

type SheetName = "note" | "material" | "photo" | null;
type Feedback = { tone: NoticeTone; message: string };

function isPhotoAction(
  action: PendingAction,
): action is Extract<PendingAction, { type: "photo" }> {
  return action.type === "photo";
}

export default function TechJobScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = String(params.id ?? "");
  const { techSession } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const syncState = useSync();

  const [sheet, setSheet] = useState<SheetName>(null);
  const [note, setNote] = useState("");
  const [material, setMaterial] = useState({ description: "", quantity: "1", unit: "u" });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<TechTransition | null>(null);

  const tenantId = techSession?.tenantId ?? "";

  const jobQuery = useQuery({
    queryKey: ["tech-job", tenantId, id],
    queryFn: () => api.techWorkOrder(tenantId, id),
    enabled: Boolean(tenantId && id),
  });
  const materialsQuery = useQuery({
    queryKey: ["tech-materials", tenantId, id],
    queryFn: () => api.techMaterials(tenantId, id),
    enabled: Boolean(tenantId && id),
  });
  const attachmentsQuery = useQuery({
    queryKey: ["tech-attachments", tenantId, id],
    queryFn: () => api.techAttachments(tenantId, id),
    enabled: Boolean(tenantId && id),
  });

  const transition = useMutation({
    mutationFn: (to: string) => api.techTransition(tenantId, id, to),
    onSuccess: (_data, to) => {
      setPendingTransition(null);
      setFeedback({
        tone: "success",
        message: `Estado actualizado: ${workOrderStatusMeta(to).label.toLowerCase()}.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["tech-job", tenantId, id] });
      void queryClient.invalidateQueries({ queryKey: ["tech-jobs"] });
    },
    onError: (error) => {
      setPendingTransition(null);
      setFeedback({ tone: "danger", message: errorMessage(error) });
    },
  });

  const noteMutation = useMutation({
    mutationFn: () => api.techNote(tenantId, id, note.trim(), clientId()),
    onSuccess: () => {
      setNote("");
      setSheet(null);
      setFeedback({ tone: "success", message: "Nota guardada en la orden." });
    },
    onError: async (error) => {
      if (!isRetryableError(error)) {
        setFeedback({ tone: "danger", message: errorMessage(error) });
        return;
      }
      try {
        await enqueueAction(tenantId, {
          id: clientId(),
          type: "note",
          orderId: id,
          notes: note.trim(),
          createdAt: new Date().toISOString(),
        });
        await syncState.refresh();
        setNote("");
        setSheet(null);
        setFeedback({
          tone: "warning",
          message:
            "Sin conexión: la nota quedó guardada en el teléfono. Se envía sola al volver la red.",
        });
      } catch {
        setFeedback({ tone: "danger", message: "No pudimos guardar la nota en el teléfono." });
      }
    },
  });

  const materialMutation = useMutation({
    mutationFn: () =>
      api.techCreateMaterial(
        tenantId,
        id,
        {
          description: material.description.trim(),
          quantity: material.quantity,
          unit: material.unit,
        },
        clientId(),
      ),
    onSuccess: () => {
      setMaterial({ description: "", quantity: "1", unit: "u" });
      setSheet(null);
      setFeedback({ tone: "success", message: "Material registrado en la orden." });
      void queryClient.invalidateQueries({ queryKey: ["tech-materials", tenantId, id] });
    },
    onError: async (error) => {
      if (!isRetryableError(error)) {
        setFeedback({ tone: "danger", message: errorMessage(error) });
        return;
      }
      try {
        await enqueueAction(tenantId, {
          id: clientId(),
          type: "material",
          orderId: id,
          description: material.description.trim(),
          quantity: material.quantity,
          unit: material.unit,
          createdAt: new Date().toISOString(),
        });
        await syncState.refresh();
        setMaterial({ description: "", quantity: "1", unit: "u" });
        setSheet(null);
        setFeedback({
          tone: "warning",
          message:
            "Sin conexión: el material quedó guardado en el teléfono. Se envía solo al volver la red.",
        });
      } catch {
        setFeedback({ tone: "danger", message: "No pudimos guardar el material en el teléfono." });
      }
    },
  });

  async function pickPhoto(fromCamera: boolean) {
    setFeedback(null);
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permiso denegado",
            "Necesitamos acceso a la cámara para documentar el trabajo.",
          );
          return;
        }
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ["images"] });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const name = asset.fileName ?? `foto-${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? "image/jpeg";
      setSheet(null);
      setUploading(true);

      try {
        await api.techUploadAttachment(tenantId, id, { uri: asset.uri, name, type: mimeType }, clientId());
        setFeedback({ tone: "success", message: "Foto subida a la orden." });
        void queryClient.invalidateQueries({ queryKey: ["tech-attachments", tenantId, id] });
      } catch (error) {
        if (!isRetryableError(error)) {
          setFeedback({ tone: "danger", message: errorMessage(error) });
          return;
        }
        const directory = FileSystem.documentDirectory;
        if (!directory) {
          setFeedback({ tone: "danger", message: "No pudimos guardar la foto en el teléfono." });
          return;
        }
        try {
          const actionId = clientId();
          const extension = (asset.fileName?.split(".").pop() ?? "jpg").toLowerCase();
          const target = `${directory}dovexo-${actionId}.${extension}`;
          await FileSystem.copyAsync({ from: asset.uri, to: target });
          await enqueueAction(tenantId, {
            id: actionId,
            type: "photo",
            orderId: id,
            uri: target,
            name,
            mimeType,
            createdAt: new Date().toISOString(),
          });
          await syncState.refresh();
          setFeedback({
            tone: "warning",
            message:
              "Sin conexión: la foto quedó guardada en el teléfono. Se envía sola al volver la red.",
          });
        } catch {
          setFeedback({ tone: "danger", message: "No pudimos guardar la foto en el teléfono." });
        }
      }
    } finally {
      setUploading(false);
    }
  }

  if (!techSession) return <Redirect href="/tech" />;

  if (jobQuery.isLoading) {
    return (
      <Screen>
        <SkeletonList count={3} />
      </Screen>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <Screen>
        <ErrorState
          message="No pudimos cargar el trabajo. Revisá la conexión e intentá de nuevo."
          onRetry={() => void jobQuery.refetch()}
        />
      </Screen>
    );
  }

  const job = jobQuery.data;
  const meta = workOrderStatusMeta(job.operational_status);
  const transitions = techTransitions[job.operational_status] ?? [];
  const primary = transitions[0] ?? null;
  const secondary = transitions.slice(1);
  const address = orderAddress(job);
  const materials = materialsQuery.data ?? [];
  const attachments = attachmentsQuery.data ?? [];
  const orderActions = syncState.actionsForOrder(id);
  const queuedPhotos = orderActions.filter(isPhotoAction);
  const failedActions = orderActions.filter((action) => Boolean(action.lastError));
  const orderPending = syncState.pendingForOrder(id);
  const orderFailed = syncState.failedForOrder(id);
  const when = job.scheduled_at
    ? `${relativeDayLabel(job.scheduled_at)} · ${formatTime(job.scheduled_at)}`
    : "Sin programar";

  return (
    <Screen contentStyle={styles.content} footer={
      <BottomBar>
        {primary ? (
          <Button
            title={primary.label}
            icon={primary.icon}
            onPress={() => setPendingTransition(primary)}
            loading={transition.isPending}
            disabled={!syncState.online}
            accessibilityHint={
              syncState.online ? undefined : "Necesitás conexión para cambiar el estado"
            }
          />
        ) : (
          <Button
            title="Trabajo sin acciones pendientes"
            variant="outline"
            disabled
            onPress={() => undefined}
          />
        )}
      </BottomBar>
    }>
      <View style={styles.topBar}>
        <IconButton
          icon="arrow-back"
          onPress={() => router.back()}
          accessibilityLabel="Volver a mis trabajos"
        />
        <Text style={styles.code}>{job.code}</Text>
        <SyncStatusPill />
      </View>

      <Card>
        <Badge label={meta.label} tone={meta.tone} icon={meta.icon} />
        <Text style={styles.title}>{job.title}</Text>
        {job.description ? <Muted>{job.description}</Muted> : null}

        <Divider />

        <Text style={styles.fieldLabel}>Cliente</Text>
        <Text style={styles.fieldValue}>{job.customer_name ?? "Cliente"}</Text>
        <View style={styles.row}>
          {job.customer_phone ? (
            <Button
              title="Llamar"
              variant="outline"
              size="sm"
              icon="call-outline"
              onPress={() => void Linking.openURL(`tel:${job.customer_phone}`)}
              style={styles.rowButton}
            />
          ) : null}
          {address ? (
            <Button
              title="Ver mapa"
              variant="outline"
              size="sm"
              icon="navigate-outline"
              onPress={() =>
                void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)
              }
              style={styles.rowButton}
            />
          ) : null}
        </View>

        <Text style={styles.fieldLabel}>Dirección</Text>
        <Text style={styles.fieldValue}>{address || "Sin dirección cargada"}</Text>

        <Text style={styles.fieldLabel}>Horario</Text>
        <Text style={styles.fieldValue}>{when}</Text>
      </Card>

      <SyncStatusBanner />

      {feedback ? <InlineNotice tone={feedback.tone} message={feedback.message} /> : null}

      {orderPending + orderFailed > 0 ? (
        <Card>
          <SectionTitle>Guardado en el teléfono</SectionTitle>
          <Muted>
            {orderPending > 0
              ? `${orderPending} cambio${orderPending === 1 ? "" : "s"} esperando conexión.`
              : "No hay cambios esperando conexión."}
          </Muted>
          {failedActions.map((action) => (
            <View key={action.id} style={styles.failedRow}>
              <Ionicons name="alert-circle" size={16} color={colors.dangerInk} />
              <Text style={styles.failedText}>
                {action.lastError ?? "No se pudo sincronizar este cambio."}
              </Text>
              <Button
                title="Descartar"
                variant="ghost"
                size="sm"
                onPress={() => void syncState.discard(action.id)}
              />
            </View>
          ))}
          <Button
            title="Sincronizar ahora"
            variant="outline"
            icon="sync"
            onPress={() => void syncState.sync()}
            loading={syncState.syncing}
          />
        </Card>
      ) : null}

      <Card>
        <SectionTitle>Acciones</SectionTitle>
        {transitions.length === 0 ? (
          <Muted>Este trabajo no tiene acciones disponibles.</Muted>
        ) : null}
        {!syncState.online && transitions.length > 0 ? (
          <InlineNotice
            tone="warning"
            message="Necesitás conexión para cambiar el estado del trabajo. Las notas, materiales y fotos se pueden cargar igual."
          />
        ) : null}
        {secondary.map((action) => (
          <Button
            key={action.to}
            title={action.label}
            variant="outline"
            icon={action.icon}
            onPress={() => setPendingTransition(action)}
            disabled={!syncState.online}
          />
        ))}
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <SectionTitle>Materiales</SectionTitle>
          <Text style={styles.count}>{materials.length}</Text>
        </View>
        <Button
          title="Agregar material"
          variant="outline"
          icon="add"
          onPress={() => setSheet("material")}
        />
        {materials.length === 0 ? (
          <Muted>Todavía no cargaste materiales en esta visita.</Muted>
        ) : (
          materials.map((item, index) => (
            <ListRow
              key={item.id}
              icon="cube-outline"
              title={item.description}
              subtitle={`${formatQuantity(item.quantity)} ${item.unit}`}
              last={index === materials.length - 1}
            />
          ))
        )}
      </Card>

      <Card>
        <View style={styles.cardHeader}>
          <SectionTitle>Fotos</SectionTitle>
          <Text style={styles.count}>{attachments.length + queuedPhotos.length}</Text>
        </View>
        <Button
          title="Agregar foto"
          variant="outline"
          icon="camera-outline"
          onPress={() => setSheet("photo")}
          loading={uploading}
        />
        {queuedPhotos.length > 0 ? (
          <View style={styles.thumbs}>
            {queuedPhotos.map((photo) => (
              <View key={photo.id} style={styles.thumbWrap}>
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.thumb}
                  accessibilityLabel="Foto guardada en el teléfono"
                />
                <View style={[styles.thumbBadge, photo.lastError ? styles.thumbBadgeError : null]}>
                  <Text style={styles.thumbBadgeText}>
                    {photo.lastError ? "Error" : "Pendiente"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {attachments.length === 0 ? (
          <Muted>Las fotos documentan el trabajo y quedan en la orden.</Muted>
        ) : (
          attachments.map((item, index) => (
            <ListRow
              key={item.id}
              icon="image-outline"
              title={item.filename}
              subtitle={`${Math.round(item.size_bytes / 1024)} KB · ${formatDateTime(item.created_at)}`}
              last={index === attachments.length - 1}
            />
          ))
        )}
      </Card>

      <Card>
        <SectionTitle>Notas</SectionTitle>
        <Muted>Las notas quedan en el historial de la orden y las ve tu empresa.</Muted>
        <Button
          title="Agregar nota"
          variant="outline"
          icon="create-outline"
          onPress={() => setSheet("note")}
        />
      </Card>

      <Card>
        <SectionTitle>Historial</SectionTitle>
        <ListRow icon="add-circle-outline" title="Creada" subtitle={formatDateTime(job.created_at)} />
        {job.started_at ? (
          <ListRow
            icon="play-circle-outline"
            title="Iniciada"
            subtitle={formatDateTime(job.started_at)}
          />
        ) : null}
        {job.finished_at ? (
          <ListRow
            icon="checkmark-done-outline"
            title="Finalizada"
            subtitle={formatDateTime(job.finished_at)}
            last
          />
        ) : null}
      </Card>

      <BottomSheet
        visible={sheet === "note"}
        onClose={() => setSheet(null)}
        title="Agregar nota"
        description="Contá qué pasó en la visita. Queda registrada con fecha y hora."
        dismissible={!noteMutation.isPending}
        footer={
          <Button
            title="Guardar nota"
            icon="checkmark"
            onPress={() => noteMutation.mutate()}
            loading={noteMutation.isPending}
            disabled={!note.trim()}
          />
        }
      >
        <Input
          value={note}
          onChangeText={setNote}
          placeholder="Ej.: Se revisó el tablero y se cambió el térmico."
          multiline
          autoFocus
          accessibilityLabel="Nota de la visita"
        />
      </BottomSheet>

      <BottomSheet
        visible={sheet === "material"}
        onClose={() => setSheet(null)}
        title="Agregar material"
        description="Registrá lo que usaste en la visita."
        dismissible={!materialMutation.isPending}
        footer={
          <Button
            title="Registrar material"
            icon="checkmark"
            onPress={() => materialMutation.mutate()}
            loading={materialMutation.isPending}
            disabled={!material.description.trim()}
          />
        }
      >
        <Input
          label="Descripción"
          value={material.description}
          onChangeText={(value) => setMaterial((current) => ({ ...current, description: value }))}
          placeholder="Cable UTP categoría 6"
          autoFocus
        />
        <View style={styles.row}>
          <Input
            label="Cantidad"
            value={material.quantity}
            onChangeText={(value) => setMaterial((current) => ({ ...current, quantity: value }))}
            keyboardType="decimal-pad"
            containerStyle={styles.rowButton}
          />
          <Input
            label="Unidad"
            value={material.unit}
            onChangeText={(value) => setMaterial((current) => ({ ...current, unit: value }))}
            placeholder="u, m, kg"
            containerStyle={styles.rowButton}
          />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheet === "photo"}
        onClose={() => setSheet(null)}
        title="Agregar foto"
        description="Se adjunta a la orden. Si no hay conexión, queda guardada en el teléfono."
      >
        <Button
          title="Tomar foto"
          icon="camera"
          onPress={() => void pickPhoto(true)}
          loading={uploading}
        />
        <Button
          title="Elegir de la galería"
          variant="outline"
          icon="images-outline"
          onPress={() => void pickPhoto(false)}
          loading={uploading}
        />
      </BottomSheet>

      <ConfirmSheet
        visible={pendingTransition !== null}
        title={pendingTransition?.confirmTitle ?? ""}
        message={pendingTransition?.confirmMessage}
        confirmLabel={pendingTransition?.label ?? "Confirmar"}
        loading={transition.isPending}
        onConfirm={() => {
          if (pendingTransition) transition.mutate(pendingTransition.to);
        }}
        onCancel={() => setPendingTransition(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 150 },
  topBar: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  code: { ...typography.mono, color: colors.text2, flex: 1 },
  title: { ...typography.title, color: colors.text },
  fieldLabel: { ...typography.overline, color: colors.text2 },
  fieldValue: { ...typography.bodyStrong, color: colors.text },
  row: { flexDirection: "row", gap: spacing[2] },
  rowButton: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  count: { ...typography.caption, color: colors.text2 },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  thumbWrap: { borderRadius: radius.md, overflow: "hidden" },
  thumb: { width: 96, height: 96, backgroundColor: colors.surface2 },
  thumbBadge: {
    position: "absolute",
    left: spacing[1],
    bottom: spacing[1],
    borderRadius: radius.sm,
    backgroundColor: "rgba(23,36,61,0.78)",
    paddingHorizontal: spacing[1] + 2,
    paddingVertical: 1,
  },
  thumbBadgeError: { backgroundColor: colors.dangerInk },
  thumbBadgeText: { ...typography.caption, fontSize: 10, lineHeight: 14, color: colors.textInverse },
  failedRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  failedText: { ...typography.caption, color: colors.dangerInk, flex: 1 },
});