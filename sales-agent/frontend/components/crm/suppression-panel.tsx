"use client";

import { useState } from "react";
import {
  useCreateSuppression,
  useDeleteSuppression,
  useSuppressions,
} from "@/hooks/use-suppressions";
import { getErrorMessage } from "@/lib/errors";
import { formatDate } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/** Lista de no contacto: alta y baja de teléfonos o emails. */
export function SuppressionPanel() {
  const suppressionsQuery = useSuppressions();
  const createSuppression = useCreateSuppression();
  const deleteSuppression = useDeleteSuppression();
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (contact.trim().length === 0) return;
    createSuppression.mutate(
      {
        normalized_contact: contact.trim(),
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          setContact("");
          setReason("");
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-muted">
          Los contactos de esta lista no deben recibir mensajes. Se guardan tal
          como los ingresás; el backend los normaliza.
        </p>
        {createSuppression.isError ? (
          <Alert variant="danger" title="No se pudo agregar el contacto">
            {getErrorMessage(createSuppression.error)}
          </Alert>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Teléfono o email" htmlFor="suppression-contact" required>
            <Input
              id="suppression-contact"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="+5493415550000 o contacto@empresa.com"
            />
          </Field>
          <Field label="Motivo de la baja" htmlFor="suppression-reason">
            <Input
              id="suppression-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Pidió no ser contactado"
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={createSuppression.isPending}
          >
            {createSuppression.isPending ? (
              <>
                <Spinner label="Guardando" />
                Guardando…
              </>
            ) : (
              "Agregar a no contacto"
            )}
          </Button>
        </div>
      </form>

      {suppressionsQuery.isPending ? (
        <p className="text-xs text-muted">Cargando lista de no contacto…</p>
      ) : suppressionsQuery.isError ? (
        <Alert variant="danger" title="No se pudo cargar la lista">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(suppressionsQuery.error)}</span>
            <button
              type="button"
              onClick={() => void suppressionsQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : suppressionsQuery.data.length === 0 ? (
        <p className="text-sm text-muted">
          La lista está vacía. Todo contacto con WhatsApp publicado puede
          recibir un mensaje manual.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {suppressionsQuery.data.map((suppression) => (
            <li
              key={suppression.id || suppression.value}
              className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium break-all text-ink">
                  {suppression.value}
                </p>
                <p className="text-xs text-muted">
                  {suppression.reason || "Sin motivo registrado"} ·{" "}
                  {formatDate(suppression.created_at)}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={deleteSuppression.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Quitar ${suppression.value} de la lista de no contacto?`,
                    )
                  ) {
                    deleteSuppression.mutate(suppression.id);
                  }
                }}
              >
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      )}

      {deleteSuppression.isError ? (
        <Alert variant="danger">{getErrorMessage(deleteSuppression.error)}</Alert>
      ) : null}
    </div>
  );
}
