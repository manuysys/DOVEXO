import { Fragment, type ReactNode } from "react";

import { isMoneyValue, type AssistantBlock } from "@/lib/assistant-reply";
import { cn } from "@/lib/utils";

const INLINE_PATTERN = /(\*\*[^*]+\*\*|\b(?:QT|OT)[-‑–]\d{4}[-‑–]\d{4}\b|\$\s?[\d.,]+)/g;
const ENTITY_PATTERN = /^(?:QT|OT)[-‑–]\d{4}[-‑–]\d{4}$/;

/**
 * Texto de una respuesta con referencias resaltadas: códigos de entidad,
 * importes, negritas y cursivas simples. No interpreta HTML ni enlaces externos.
 */
export function AssistantInlineText({ text }: { text: string }) {
  const parts = text.split(INLINE_PATTERN);

  function renderPlain(plain: string): ReactNode[] {
    return plain.split(/(\*[^*\n]+\*)/g).map((segment, segmentIndex) => {
      if (segment.startsWith("*") && segment.endsWith("*") && segment.length > 2) {
        return <em key={segmentIndex}>{segment.slice(1, -1)}</em>;
      }
      return <Fragment key={segmentIndex}>{segment}</Fragment>;
    });
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part === "") return null;

        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={index} className="text-text font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }

        if (ENTITY_PATTERN.test(part)) {
          return (
            <span
              key={index}
              className="border-border bg-surface-2 text-text rounded-md border px-1.5 py-0.5 font-mono text-[0.8em] whitespace-nowrap"
            >
              {part}
            </span>
          );
        }

        if (isMoneyValue(part)) {
          return (
            <span key={index} className="numeric font-medium whitespace-nowrap">
              {part}
            </span>
          );
        }

        return <Fragment key={index}>{renderPlain(part)}</Fragment>;
      })}
    </>
  );
}

function TableBlock({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="border-border overflow-x-auto rounded-ds-md border">
      <table className="w-full min-w-[420px] text-left text-sm">
        <caption className="sr-only">Resultado de la consulta</caption>
        <thead className="bg-surface-2 text-text-2">
          <tr>
            {headers.map((header, headerIndex) => (
              <th
                key={headerIndex}
                scope="col"
                className="text-caption px-3 py-2 font-semibold tracking-wide uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-surface-2/60">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "text-text px-3 py-2 align-top",
                    isMoneyValue(cell) && "numeric text-right whitespace-nowrap",
                  )}
                >
                  <AssistantInlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renderiza los bloques detectados en la respuesta. Es deliberadamente
 * estático: sin animación de escritura ni efectos que retrasen la lectura.
 */
export function AssistantReplyView({ blocks }: { blocks: AssistantBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case "heading":
            return (
              <h3 key={index} className="text-text text-h4">
                <AssistantInlineText text={block.text} />
              </h3>
            );

          case "paragraph":
            return (
              <p key={index} className="text-text text-sm leading-relaxed">
                <AssistantInlineText text={block.text} />
              </p>
            );

          case "list":
            return (
              <ul key={index} className="space-y-1.5">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-text flex gap-2 text-sm">
                    <span
                      aria-hidden="true"
                      className="bg-text-2/50 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    />
                    <span className="min-w-0">
                      <AssistantInlineText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            );

          case "facts":
            return (
              <dl key={index} className="grid gap-2 sm:grid-cols-2">
                {block.entries.map((entry, entryIndex) => (
                  <div
                    key={entryIndex}
                    className="border-border bg-surface-2/60 rounded-ds-md border px-3 py-2"
                  >
                    <dt className="text-text-2 text-caption">
                      <AssistantInlineText text={entry.label} />
                    </dt>
                    <dd
                      className={cn(
                        "text-text mt-0.5 text-sm font-semibold",
                        isMoneyValue(entry.value) && "numeric",
                      )}
                    >
                      <AssistantInlineText text={entry.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            );

          case "table":
            return <TableBlock key={index} headers={block.headers} rows={block.rows} />;
        }
      })}
    </div>
  );
}
