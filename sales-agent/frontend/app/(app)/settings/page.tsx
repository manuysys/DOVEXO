"use client";

import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { API_BASE_URL } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsPage() {
  const currentUser = useCurrentUser();
  const logoutMutation = useLogout();

  return (
    <>
      <PageHeader
        title="Configuración"
        description="Datos de la sesión actual y accesos a la documentación del proyecto. La configuración ampliada llega en fases posteriores."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sesión" description="Usuario autenticado en esta instancia." />
          <CardContent className="space-y-4">
            {currentUser.isPending ? (
              <p className="text-sm text-muted">Cargando usuario…</p>
            ) : currentUser.isError ? (
              <p className="text-sm text-danger">
                No se pudo leer el usuario actual.
              </p>
            ) : (
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted">Email</dt>
                  <dd className="mt-0.5 text-sm break-all text-ink">
                    {currentUser.data.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted">Nombre</dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    {currentUser.data.name ?? "Sin nombre"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted">Rol</dt>
                  <dd className="mt-0.5 text-sm text-ink">
                    {currentUser.data.role ?? "Sin rol informado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted">API</dt>
                  <dd className="mt-0.5 font-mono text-xs text-ink">
                    {API_BASE_URL}/api/v1
                  </dd>
                </div>
              </dl>
            )}

            <Button
              variant="secondary"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Cerrando sesión…" : "Cerrar sesión"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Documentación"
            description="Referencias locales y de la API en ejecución."
          />
          <CardContent className="space-y-4 text-sm">
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Badge variant="neutral">API</Badge>
                <a
                  href={`${API_BASE_URL}/docs`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline"
                >
                  Swagger de FastAPI
                </a>
              </li>
              <li>
                <span className="text-muted">Especificación: </span>
                <code className="font-mono text-xs">
                  sales-agent/docs/SPEC.md
                </code>
              </li>
              <li>
                <span className="text-muted">Arquitectura: </span>
                <code className="font-mono text-xs">
                  sales-agent/docs/ARCHITECTURE.md
                </code>
              </li>
              <li>
                <span className="text-muted">Seguridad: </span>
                <code className="font-mono text-xs">
                  sales-agent/docs/SECURITY.md
                </code>
              </li>
              <li>
                <span className="text-muted">Desarrollo: </span>
                <code className="font-mono text-xs">
                  sales-agent/docs/DEVELOPMENT.md
                </code>
              </li>
            </ul>
            <p className="border-t border-line pt-3 text-xs leading-relaxed text-muted">
              Los usuarios se crean desde el backend con las variables de
              administrador inicial. No hay registro público.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
