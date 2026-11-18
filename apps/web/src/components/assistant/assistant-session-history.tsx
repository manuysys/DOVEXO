"use client";

import { CornerDownLeft, History } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export type AssistantSessionQuestion = {
  id: string;
  content: string;
  createdAt: string;
};

type AssistantSessionHistoryProps = {
  questions: AssistantSessionQuestion[];
  onSelect: (question: string) => void;
};

export function AssistantSessionHistory({ questions, onSelect }: AssistantSessionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="text-violet h-4 w-4" aria-hidden="true" />
          Historial de la sesión
        </CardTitle>
        <p className="text-text-2 text-xs">
          Tus preguntas de esta sesión. Se borran al recargar la página.
        </p>
      </CardHeader>

      <CardContent>
        {questions.length === 0 ? (
          <p className="text-text-2 text-sm">Todavía no hiciste consultas en esta sesión.</p>
        ) : (
          <ul className="divide-border divide-y">
            {questions.map((question) => (
              <li key={question.id} className="py-2 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => onSelect(question.content)}
                  aria-label={`Volver a preguntar: ${question.content}`}
                  className="group hover:bg-surface-2 focus-visible:ring-primary -mx-2 flex w-full items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-left focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="min-w-0">
                    <span className="text-text block text-xs font-medium break-words">
                      {question.content}
                    </span>
                    <time
                      dateTime={question.createdAt}
                      className="text-text-2 mt-0.5 block text-[11px]"
                    >
                      {formatDate(question.createdAt)}
                    </time>
                  </span>
                  <CornerDownLeft
                    className="text-text-2 group-hover:text-primary mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
