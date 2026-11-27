"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api, type TeamInvitationCreated, type TeamRole } from "@/lib/api";
import { userFacingError } from "@/lib/errors";
import { TEAM_ROLE_DESCRIPTIONS, TEAM_ROLE_LABELS, isTeamRole } from "@/lib/team";

const schema = z.object({
  full_name: z.string().trim().min(2, "Ingresá el nombre de la persona"),
  email: z.string().trim().email("Ingresá un email válido").max(254, "El email es demasiado largo"),
  role: z.string(),
});

type FormValues = z.infer<typeof schema>;

type InviteFormProps = {
  tenantId: string;
  roles: TeamRole[];
  onCreated: (invitation: TeamInvitationCreated) => void;
};

const selectClass =
  "border-border text-text focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-ds-md border bg-surface px-3 text-sm outline-none focus:ring-2 disabled:opacity-60";

export function InviteForm({ tenantId, roles, onCreated }: InviteFormProps) {
  const defaultRole: TeamRole = roles.includes("technician")
    ? "technician"
    : (roles[0] ?? "viewer");
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", role: defaultRole },
  });

  const selectedRole = useWatch({ control, name: "role" });
  const selectedRoleLabel =
    selectedRole && isTeamRole(selectedRole) ? TEAM_ROLE_LABELS[selectedRole] : null;
  const selectedDescription =
    selectedRole && isTeamRole(selectedRole) ? TEAM_ROLE_DESCRIPTIONS[selectedRole] : null;

  const inviteMutation = useMutation({
    mutationFn: (values: { email: string; full_name: string; role: TeamRole }) =>
      api.team.createInvitation(tenantId, values),
    onSuccess: (invitation) => {
      setServerError(null);
      reset({ full_name: "", email: "", role: defaultRole });
      onCreated(invitation);
    },
    onError: (error) => {
      setServerError(userFacingError(error, "No se pudo crear la invitación. Intentá de nuevo."));
    },
  });

  async function onSubmit(values: FormValues) {
    const role = roles.find((candidate) => candidate === values.role);
    if (!role) {
      setServerError("Elegí un rol permitido para tu cuenta.");
      return;
    }
    setServerError(null);
    inviteMutation.mutate({ email: values.email, full_name: values.full_name, role });
  }

  if (roles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="border-border border-b">
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="text-primary h-4 w-4" aria-hidden="true" />
          Invitar integrante
        </CardTitle>
        <p className="text-text-2 text-sm">
          La persona recibe un enlace para crear su acceso. La invitación vence en 7 días.
        </p>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div>
            <label htmlFor="invite-full-name" className="text-text mb-1 block text-sm font-medium">
              Nombre y apellido *
            </label>
            <Input
              id="invite-full-name"
              autoComplete="off"
              aria-invalid={errors.full_name ? true : undefined}
              aria-describedby={errors.full_name ? "invite-full-name-error" : undefined}
              {...register("full_name")}
            />
            {errors.full_name && (
              <p id="invite-full-name-error" className="text-danger mt-1 text-xs">
                {errors.full_name.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="invite-email" className="text-text mb-1 block text-sm font-medium">
              Email *
            </label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              inputMode="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "invite-email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="invite-email-error" className="text-danger mt-1 text-xs">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="invite-role" className="text-text mb-1 block text-sm font-medium">
              Rol *
            </label>
            <select
              id="invite-role"
              className={selectClass}
              aria-describedby="invite-role-help"
              {...register("role")}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {TEAM_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
            <p id="invite-role-help" className="text-text-2 mt-1 text-xs">
              {selectedDescription && selectedRoleLabel
                ? `${selectedRoleLabel}: ${selectedDescription}`
                : "Elegí qué puede hacer esta persona dentro de la empresa."}
            </p>
          </div>
          {serverError && (
            <p
              role="alert"
              className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm sm:col-span-2"
            >
              {serverError}
            </p>
          )}
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={isSubmitting || inviteMutation.isPending}>
              {inviteMutation.isPending ? "Creando invitación..." : "Crear invitación"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
