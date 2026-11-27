"use client";

import { Download, Loader2, ShieldAlert } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/lib/auth";
import { downloadExport } from "@/lib/export-api";
import {
  EXPORT_DEFINITIONS,
  EXPORT_KINDS,
  canExportData,
  exportErrorMessage,
  type ExportKind,
} from "@/lib/export-utils";
import { downloadBlob } from "@/lib/utils";

type ExportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; filename: string }
  | { status: "error"; message: string };

const INITIAL_STATES: Record<ExportKind, ExportState> = {
  customers: { status: "idle" },
  orders: { status: "idle" },
  quotes: { status: "idle" },
  payments: { status: "idle" },
};

/**
 * Cada empresa tiene su propia sesión de exportación: al cambiar de tenant se remonta el contenido,
 * así que estados y archivos de la empresa anterior no aparecen en la nueva.
 */
export function DataExport() {
  const { activeTenantId } = useAuth();
  return <DataExportSession key={activeTenantId ?? "sin-empresa"} />;
}

function DataExportSession() {
  const { activeTenantId, tenants } = useAuth();
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const tenantName = activeTenant?.name ?? "la empresa activa";
  const canExport = canExportData(activeTenant?.role);

  const [states, setStates] = useState<Record<ExportKind, ExportState>>(INITIAL_STATES);
  /** Evita dos descargas simultáneas del mismo archivo (doble clic antes de re-render). */
  const inFlight = useRef(new Set<ExportKind>());

  async function download(kind: ExportKind) {
    if (!activeTenantId || inFlight.current.has(kind)) {
      return;
    }
    inFlight.current.add(kind);
    setStates((current) => ({ ...current, [kind]: { status: "loading" } }));
    try {
      const file = await downloadExport(activeTenantId, kind);
      downloadBlob(file.blob, file.filename);
      setStates((current) => ({
        ...current,
        [kind]: { status: "success", filename: file.filename },
      }));
    } catch (error) {
      setStates((current) => ({
        ...current,
        [kind]: { status: "error", message: exportErrorMessage(error) },
      }));
    } finally {
      inFlight.current.delete(kind);
    }
  }

  if (!activeTenantId) {
    return (
      <Card className="p-8 text-sm text-text-2">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  if (!canExport) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-lg bg-warning-soft text-warning-strong">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-text">No tenés permisos para exportar datos</p>
          <p className="mt-1 text-sm text-text-2">
            Solo owner, administradores y coordinadores pueden exportar los datos de {tenantName}.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuración"
        title="Exportar datos"
        description="Descargá copias en CSV de los datos de la empresa activa."
      />

      <p className="rounded-ds-md border border-border bg-surface px-4 py-3 text-sm text-text-2">
        Cada archivo contiene solo los datos de{" "}
        <span className="font-semibold text-text">{tenantName}</span>. Incluyen datos personales de
        tus clientes: guardalos en un lugar seguro y compartilos solo con quien corresponda.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {EXPORT_KINDS.map((kind) => {
          const definition = EXPORT_DEFINITIONS[kind];
          const state = states[kind];
          const loading = state.status === "loading";
          const Icon = definition.icon;
          return (
            <Card key={kind} className="flex min-w-0 flex-col">
              <CardHeader className="border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md bg-surface-2 text-text-2">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <CardTitle>{definition.title}</CardTitle>
                </div>
                <p className="text-sm text-text-2">{definition.description}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4 pt-5">
                <div>
                  <p className="text-xs font-semibold tracking-wide text-text-2 uppercase">
                    El archivo incluye
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-2">
                    {definition.includes.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto flex flex-col gap-3">
                  {loading && (
                    <p role="status" className="flex items-center gap-2 text-sm text-text-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                      Generando el archivo. Esperá a que termine la descarga.
                    </p>
                  )}
                  {state.status === "success" && (
                    <p
                      role="status"
                      className="rounded-ds-md bg-success-soft px-3 py-2 text-sm text-success-strong"
                    >
                      Se generó <span className="font-semibold">{state.filename}</span>. Revisá tu
                      carpeta de descargas.
                    </p>
                  )}
                  {state.status === "error" && (
                    <p
                      role="alert"
                      className="rounded-ds-md bg-danger-soft px-3 py-2 text-sm text-danger-strong"
                    >
                      {state.message}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto sm:self-start"
                    disabled={loading}
                    aria-busy={loading}
                    onClick={() => void download(kind)}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {loading ? "Descargando..." : definition.buttonLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
