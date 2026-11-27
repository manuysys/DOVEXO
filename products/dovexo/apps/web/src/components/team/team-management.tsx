"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Link2,
  Mail,
  RotateCcw,
  ShieldAlert,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CopyLinkField } from "@/components/copy-link-field";
import { InviteForm } from "@/components/team/invite-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { api, type TeamInvitation, type TeamInvitationCreated, type TeamMember } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { emailDeliveryFeedback, type EmailFeedback } from "@/lib/email-delivery";
import { userFacingError } from "@/lib/errors";
import {
  INVITATION_STATUS_LABELS,
  INVITATION_STATUS_VARIANTS,
  assignableRoles,
  canManageTeam,
  canResendInvitation,
  canRevokeInvitation,
  invitationDisplayStatus,
  roleLabel,
  type InvitationStatus,
} from "@/lib/team";
import { cn, formatDate } from "@/lib/utils";

type LatestInvitation = {
  kind: "created" | "resent";
  invitation: TeamInvitationCreated;
};

const FEEDBACK_TONE_CLASSES: Record<EmailFeedback["tone"], string> = {
  success: "text-success-strong",
  warning: "text-warning-strong",
  info: "text-text-2",
};

export function TeamManagement() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const role = activeTenant?.role ?? "";
  const canManage = canManageTeam(role);
  const roles = assignableRoles(role);
  const [now] = useState(() => new Date());
  const [latest, setLatest] = useState<LatestInvitation | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<TeamInvitation | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const teamQuery = useQuery({
    queryKey: ["team", activeTenantId],
    queryFn: () => api.team.get(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManage,
  });

  function refreshTeam() {
    void queryClient.invalidateQueries({ queryKey: ["team", activeTenantId] });
  }

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) =>
      api.team.resendInvitation(activeTenantId ?? "", invitationId),
    onSuccess: (invitation) => {
      setActionError(null);
      setLatest({ kind: "resent", invitation });
      refreshTeam();
      toast.success("Invitación reenviada");
    },
    onError: (error) => {
      setActionError(
        userFacingError(error, "No se pudo reenviar la invitación. Intentá de nuevo."),
      );
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) =>
      api.team.revokeInvitation(activeTenantId ?? "", invitationId),
    onSuccess: () => {
      setRevokeTarget(null);
      setActionError(null);
      refreshTeam();
      toast.success("Invitación revocada. Ya no se puede aceptar.");
    },
  });

  if (!activeTenantId) {
    return (
      <Card className="p-8 text-sm text-text-2">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="bg-warning-soft text-warning-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-lg">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-text text-sm font-semibold">
            No tenés permisos para gestionar el equipo
          </p>
          <p className="text-text-2 mt-1 text-sm">
            Solo el propietario o un administrador de {activeTenant?.name ?? "la empresa"} puede
            invitar y administrar integrantes.
          </p>
        </div>
      </Card>
    );
  }

  const data = teamQuery.data;
  const members = data?.members ?? [];
  const invitations = data?.invitations ?? [];
  const openInvitations = invitations.filter(
    (invitation) => invitationDisplayStatus(invitation, now) === "pending",
  ).length;
  const technicians = members.filter((member) => member.role === "technician").length;
  const statsValue = (value: number) =>
    teamQuery.isLoading ? "…" : teamQuery.isError ? "—" : value;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuración"
        title="Equipo"
        description={`Quién accede a ${activeTenant?.name ?? "tu empresa"}, con qué rol y cómo ingresa.`}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Integrantes"
          value={statsValue(members.length)}
          hint="Accesos activos"
          icon={Users}
        />
        <StatCard
          label="Técnicos"
          value={statsValue(technicians)}
          hint="Usan la app en el celular"
          icon={Wrench}
          tone="teal"
        />
        <StatCard
          label="Invitaciones pendientes"
          value={statsValue(openInvitations)}
          hint="Esperando aceptación"
          icon={Mail}
          tone={openInvitations > 0 ? "amber" : "default"}
        />
      </div>

      <InviteForm
        tenantId={activeTenantId}
        roles={roles}
        onCreated={(invitation) => {
          setLatest({ kind: "created", invitation });
          setActionError(null);
          refreshTeam();
          toast.success("Invitación creada");
        }}
      />

      {latest && <LatestInvitationCard latest={latest} onDismiss={() => setLatest(null)} />}

      {actionError && (
        <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-4 py-3 text-sm">
          {actionError}
        </p>
      )}

      {teamQuery.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-danger-strong text-sm">
            {userFacingError(teamQuery.error, "No se pudo cargar el equipo.")}
          </p>
          <Button variant="outline" onClick={() => void teamQuery.refetch()}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex-col gap-2 border-border border-b sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Integrantes activos</CardTitle>
                <p className="text-text-2 mt-1 text-sm">
                  Personas que ya pueden ingresar con su cuenta.
                </p>
              </div>
              <Badge variant="neutral" className="numeric self-start sm:self-auto">
                {teamQuery.isLoading ? "…" : `${members.length} en total`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              {teamQuery.isLoading ? (
                <MemberListSkeleton />
              ) : members.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={Users}
                    title="Todavía no hay integrantes"
                    description="Invitá a tu primer técnico o coordinador desde el formulario de arriba."
                    className="border-0 bg-transparent py-8"
                  />
                </div>
              ) : (
                <>
                  <ul className="divide-border divide-y md:hidden">
                    {members.map((member) => (
                      <MemberMobileRow key={member.id} member={member} />
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <caption className="sr-only">Integrantes de la empresa</caption>
                      <thead className="bg-surface-2 text-text text-label">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Nombre
                          </th>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Email
                          </th>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Rol
                          </th>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Estado
                          </th>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Último acceso
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-border divide-y">
                        {members.map((member) => (
                          <tr key={member.id} className="hover:bg-surface-2/50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <MemberAvatar name={member.full_name} />
                                <span className="text-text font-semibold">{member.full_name}</span>
                              </div>
                            </td>
                            <td className="text-text-2 px-5 py-3">{member.email}</td>
                            <td className="text-text px-5 py-3">{roleLabel(member.role)}</td>
                            <td className="px-5 py-3">
                              <MemberStatusBadge status={member.status} />
                            </td>
                            <td className="text-text-2 px-5 py-3 text-xs">
                              {member.last_login_at
                                ? formatDate(member.last_login_at)
                                : "Sin accesos todavía"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-border border-b">
              <CardTitle>Invitaciones</CardTitle>
              <p className="text-text-2 text-sm">
                El enlace solo se muestra al crear o reenviar la invitación. Si se perdió, reenviala
                para generar uno nuevo.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {teamQuery.isLoading ? (
                <MemberListSkeleton />
              ) : invitations.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    icon={Mail}
                    title="No hay invitaciones"
                    description="Las invitaciones que envíes aparecen acá con su estado y vencimiento."
                    className="border-0 bg-transparent py-8"
                  />
                </div>
              ) : (
                <>
                  <ul className="divide-border divide-y md:hidden">
                    {invitations.map((invitation) => (
                      <InvitationMobileRow
                        key={invitation.id}
                        invitation={invitation}
                        now={now}
                        resendPending={resendMutation.isPending}
                        onResend={() => resendMutation.mutate(invitation.id)}
                        onRevoke={() => {
                          revokeMutation.reset();
                          setRevokeTarget(invitation);
                        }}
                      />
                    ))}
                  </ul>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[820px] text-left text-sm">
                      <caption className="sr-only">Invitaciones enviadas</caption>
                      <thead className="bg-surface-2 text-text text-label">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Email
                          </th>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Rol
                          </th>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Estado
                          </th>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Enviada
                          </th>
                          <th scope="col" className="px-5 py-3 font-semibold">
                            Vence
                          </th>
                          <th scope="col" className="px-5 py-3 text-right font-semibold">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-border divide-y">
                        {invitations.map((invitation) => {
                          const status = invitationDisplayStatus(invitation, now);
                          return (
                            <tr
                              key={invitation.id}
                              className="hover:bg-surface-2/50 transition-colors"
                            >
                              <td className="text-text px-5 py-3 font-medium">{invitation.email}</td>
                              <td className="text-text px-5 py-3">{roleLabel(invitation.role)}</td>
                              <td className="px-5 py-3">
                                <InvitationStatusBadge status={status} />
                              </td>
                              <td className="text-text-2 px-5 py-3 text-xs">
                                {formatDate(invitation.created_at)}
                              </td>
                              <td className="text-text-2 px-5 py-3 text-xs">
                                {formatDate(invitation.expires_at)}
                              </td>
                              <td className="px-5 py-3">
                                <InvitationActions
                                  email={invitation.email}
                                  status={status}
                                  resendPending={resendMutation.isPending}
                                  onResend={() => resendMutation.mutate(invitation.id)}
                                  onRevoke={() => {
                                    revokeMutation.reset();
                                    setRevokeTarget(invitation);
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revocar invitación</DialogTitle>
            <DialogDescription>
              ¿Confirmás que querés revocar la invitación a {revokeTarget?.email}? El enlace deja de
              funcionar y no se puede aceptar. Podés volver a invitar después.
            </DialogDescription>
          </DialogHeader>
          {revokeMutation.isError && (
            <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm">
              {userFacingError(revokeMutation.error, "No se pudo revocar la invitación.")}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="danger"
              disabled={revokeMutation.isPending}
              onClick={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
            >
              {revokeMutation.isPending ? "Revocando..." : "Revocar invitación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberAvatar({ name }: { name: string }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "?";
  return (
    <span
      aria-hidden="true"
      className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
    >
      {initials}
    </span>
  );
}

const MEMBER_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  invited: "Invitado",
  suspended: "Suspendido",
};

function MemberStatusBadge({ status }: { status: string }) {
  if (status === "active") {
    return <Badge variant="success">Activo</Badge>;
  }
  return <Badge variant="neutral">{MEMBER_STATUS_LABELS[status] ?? status}</Badge>;
}

function MemberMobileRow({ member }: { member: TeamMember }) {
  return (
    <li className="flex items-start gap-3 px-5 py-4">
      <MemberAvatar name={member.full_name} />
      <div className="min-w-0 flex-1">
        <p className="text-text truncate text-sm font-semibold">{member.full_name}</p>
        <p className="text-text-2 truncate text-xs">{member.email}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{roleLabel(member.role)}</Badge>
          <MemberStatusBadge status={member.status} />
        </div>
        <p className="text-text-2 mt-2 text-xs">
          {member.last_login_at
            ? `Último acceso: ${formatDate(member.last_login_at)}`
            : "Sin accesos todavía"}
        </p>
      </div>
    </li>
  );
}

function InvitationMobileRow({
  invitation,
  now,
  resendPending,
  onResend,
  onRevoke,
}: {
  invitation: TeamInvitation;
  now: Date;
  resendPending: boolean;
  onResend: () => void;
  onRevoke: () => void;
}) {
  const status = invitationDisplayStatus(invitation, now);
  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-text truncate text-sm font-semibold">{invitation.email}</p>
          <p className="text-text-2 text-xs">{roleLabel(invitation.role)}</p>
        </div>
        <InvitationStatusBadge status={status} />
      </div>
      <p className="text-text-2 text-xs">
        Enviada el {formatDate(invitation.created_at)} · Vence el{" "}
        {formatDate(invitation.expires_at)}
      </p>
      <InvitationActions
        email={invitation.email}
        status={status}
        resendPending={resendPending}
        onResend={onResend}
        onRevoke={onRevoke}
        align="start"
      />
    </li>
  );
}

function InvitationActions({
  email,
  status,
  resendPending,
  onResend,
  onRevoke,
  align = "end",
}: {
  email: string;
  status: InvitationStatus | null;
  resendPending: boolean;
  onResend: () => void;
  onRevoke: () => void;
  align?: "start" | "end";
}) {
  const canResend = canResendInvitation(status);
  const canRevoke = canRevokeInvitation(status);
  if (!canResend && !canRevoke) {
    return <p className={cn("text-text-2 text-xs", align === "end" && "text-right")}>Sin acciones</p>;
  }
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1",
        align === "end" ? "justify-end" : "justify-start",
      )}
    >
      {canResend && (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Reenviar invitación a ${email}`}
          disabled={resendPending}
          onClick={onResend}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reenviar
        </Button>
      )}
      {canRevoke && (
        <Button
          variant="ghost"
          size="sm"
          className="text-danger-strong hover:bg-danger-soft"
          aria-label={`Revocar invitación a ${email}`}
          onClick={onRevoke}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Revocar
        </Button>
      )}
    </div>
  );
}

function InvitationStatusBadge({ status }: { status: InvitationStatus | null }) {
  if (!status) {
    return <Badge variant="neutral">Sin estado</Badge>;
  }
  return (
    <Badge variant={INVITATION_STATUS_VARIANTS[status]}>{INVITATION_STATUS_LABELS[status]}</Badge>
  );
}

function MemberListSkeleton() {
  return (
    <div className="space-y-3 p-5" role="status" aria-label="Cargando equipo">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LatestInvitationCard({
  latest,
  onDismiss,
}: {
  latest: LatestInvitation;
  onDismiss: () => void;
}) {
  const { invitation, kind } = latest;
  const feedback: EmailFeedback = emailDeliveryFeedback(invitation.email_status, invitation.email);

  return (
    <Card className="border-success/30 bg-success-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="text-success h-4 w-4" aria-hidden="true" />
          {kind === "created" ? "Invitación creada" : "Invitación reenviada"} para{" "}
          <span className="break-all">{invitation.email}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("text-sm", FEEDBACK_TONE_CLASSES[feedback.tone])}>{feedback.message}</p>
        <CopyLinkField
          id="latest-invitation-url"
          label="Enlace de invitación"
          value={invitation.invitation_url}
          helpText={`Se muestra una sola vez. Vence el ${formatDate(invitation.expires_at)}.`}
        />
        <p className="text-text-2 flex items-center gap-1.5 text-xs">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Compartí el enlace solo con la persona invitada.
        </p>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Entendido, ocultar enlace
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
