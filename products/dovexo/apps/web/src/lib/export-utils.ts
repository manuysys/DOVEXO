import type { LucideIcon } from "lucide-react";
import { ClipboardList, FileText, Users, Wallet } from "lucide-react";

import { ApiError } from "@/lib/api";
import { MANAGEMENT_ROLES } from "@/lib/navigation";
import { ARGENTINA_TIME_ZONE } from "@/lib/utils";

export const EXPORT_KINDS = ["customers", "orders", "quotes", "payments"] as const;
export type ExportKind = (typeof EXPORT_KINDS)[number];

export type ExportDefinition = {
  title: string;
  description: string;
  /** Contenido general del archivo. No enumera columnas: las define el backend. */
  includes: readonly string[];
  buttonLabel: string;
  icon: LucideIcon;
};

export const EXPORT_DEFINITIONS: Record<ExportKind, ExportDefinition> = {
  customers: {
    title: "Clientes",
    description: "Cartera de clientes de la empresa activa.",
    includes: [
      "Nombre, teléfono y email de contacto",
      "Notas y estado de cada cliente",
      "Fechas de alta y última modificación",
    ],
    buttonLabel: "Descargar clientes (CSV)",
    icon: Users,
  },
  orders: {
    title: "Órdenes",
    description: "Órdenes de trabajo con sus estados y fechas.",
    includes: [
      "Código, título y prioridad",
      "Estados comerciales, operativos y de pago",
      "Técnico asignado (por identificador) y fecha programada",
    ],
    buttonLabel: "Descargar órdenes (CSV)",
    icon: ClipboardList,
  },
  quotes: {
    title: "Presupuestos",
    description: "Presupuestos emitidos por la empresa.",
    includes: [
      "Número, estado y moneda",
      "Total y fecha de vencimiento",
      "Fechas de envío, aprobación o rechazo",
    ],
    buttonLabel: "Descargar presupuestos (CSV)",
    icon: FileText,
  },
  payments: {
    title: "Pagos",
    description: "Pagos registrados contra órdenes de trabajo.",
    includes: [
      "Monto, moneda, método y estado",
      "Fecha de pago y referencia",
      "Orden de trabajo asociada",
    ],
    buttonLabel: "Descargar pagos (CSV)",
    icon: Wallet,
  },
};

/** Misma regla que el resto de la app: solo owner, admin y dispatcher exportan. */
export function canExportData(role: string | null | undefined): boolean {
  return role !== null && role !== undefined && MANAGEMENT_ROLES.includes(role);
}

export function exportPath(kind: ExportKind): string {
  return `/api/v1/exports/${kind}.csv`;
}

const SESSION_MESSAGE = "Tu sesión venció. Volvé a ingresar.";
const NETWORK_MESSAGE =
  "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.";
export const EXPORT_FALLBACK_MESSAGE =
  "No se pudo generar el archivo. Probá de nuevo en unos minutos.";
export const EXPORT_FORBIDDEN_MESSAGE =
  "No tenés permisos para exportar los datos de esta empresa. Pedí acceso a un owner o administrador.";

/**
 * Mensaje para el usuario al fallar la descarga. Requiere que `downloadExport` deje `detail`
 * vacío cuando el backend no informa un motivo, para no mostrar un texto genérico como si fuera
 * del servidor.
 */
export function exportErrorMessage(error: unknown): string {
  if (error instanceof TypeError) {
    return NETWORK_MESSAGE;
  }
  if (!(error instanceof ApiError)) {
    return EXPORT_FALLBACK_MESSAGE;
  }
  const detail = error.detail.trim();
  if (error.status === 401) {
    return detail || SESSION_MESSAGE;
  }
  if (error.status === 403) {
    return EXPORT_FORBIDDEN_MESSAGE;
  }
  if (error.status >= 400 && error.status < 500 && detail !== "") {
    return detail;
  }
  return EXPORT_FALLBACK_MESSAGE;
}

/** Fecha civil AAAA-MM-DD en la zona horaria de Argentina. */
export function argentinaDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(date);
}

/** Nombre de respaldo cuando el navegador no puede leer `Content-Disposition`. */
export function fallbackExportFilename(kind: ExportKind, now: Date): string {
  return `dovexo-${kind}-${argentinaDateKey(now)}.csv`;
}

const SAFE_FILENAME_PATTERN = /[^A-Za-z0-9._-]/g;

/**
 * Extrae el nombre de `Content-Disposition` (`filename*` tiene prioridad). Solo acepta nombres
 * `.csv` y descarta rutas: devuelve null si el valor no sirve y la UI usa el nombre de respaldo.
 */
export function filenameFromContentDisposition(value: string | null): string | null {
  if (!value) {
    return null;
  }
  let raw: string | null = null;
  const extended = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(value);
  if (extended?.[1]) {
    try {
      raw = decodeURIComponent(extended[1].trim().replace(/^"|"$/g, ""));
    } catch {
      return null;
    }
  } else {
    const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(value);
    raw = plain?.[1]?.trim() ?? null;
  }
  if (!raw) {
    return null;
  }
  const basename = raw.split(/[\\/]/).pop() ?? "";
  const safe = basename.replace(SAFE_FILENAME_PATTERN, "_");
  if (!/\.csv$/i.test(safe) || safe.length > 120) {
    return null;
  }
  return safe;
}
