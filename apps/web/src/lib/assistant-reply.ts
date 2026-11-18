/**
 * Convierte la respuesta en texto plano del asistente en bloques visuales.
 *
 * El backend devuelve texto (determinista o LLM). No inventamos datos: solo
 * reconocemos estructuras que el propio texto ya trae (títulos, viñetas con
 * separadores, pares "etiqueta: valor" y tablas Markdown). Si una línea no
 * encaja en ningún patrón, se muestra como párrafo tal cual.
 */

export type AssistantFact = {
  label: string;
  value: string;
};

export type AssistantBlock =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "facts"; entries: AssistantFact[] }
  | { kind: "table"; headers: string[]; rows: string[][] };

export type AssistantEntity = {
  code: string;
  type: "quote" | "order";
};

const ENTITY_PATTERN = /\b(QT|OT)[-‑–]\d{4}[-‑–]\d{4}\b/g;
const BULLET_PATTERN = /^[-*•]\s+(.*)$/;
const NUMBERED_PATTERN = /^\d{1,3}[.)]\s+(.*)$/;
const MARKDOWN_HEADING_PATTERN = /^#{1,6}\s+(.+)$/;
const PIPE_LINE_PATTERN = /^\|(.+)\|$/;
const PIPE_SEPARATOR_PATTERN = /^:?-{2,}:?$/;
const FACT_PATTERN = /^([^:.!?/]{2,40}):\s+(\S.*)$/;
const MONEY_PATTERN = /^\$\s?[\d.,]+$/;

export function isMoneyValue(value: string): boolean {
  return MONEY_PATTERN.test(value.trim());
}

function isFactLine(line: string): { label: string; value: string } | null {
  const match = FACT_PATTERN.exec(line);
  if (!match) return null;
  const label = match[1].trim();
  const value = match[2].trim();
  if (label.split(/\s+/).length > 6) return null;
  if (value.startsWith("//")) return null;
  return { label, value };
}

/**
 * Los encabezados se infieren solo cuando la primera columna identifica el
 * tipo de fila. Si no se reconoce, se muestra como lista y no se inventan
 * nombres de columna.
 */
function inferHeaders(row: string[]): string[] | null {
  const first = row[0]?.trim() ?? "";
  const columns = row.length;

  if (/^QT[-‑–]/i.test(first)) {
    if (columns === 3) return ["Presupuesto", "Cliente", "Total"];
    if (columns === 2) return ["Presupuesto", "Detalle"];
  }
  if (/^\d{1,2}:\d{2}/.test(first)) {
    if (columns === 4) return ["Hora", "Orden", "Trabajo", "Técnico"];
    if (columns === 3) return ["Hora", "Orden", "Trabajo"];
    if (columns === 2) return ["Hora", "Detalle"];
  }
  if (/^OT[-‑–]/i.test(first)) {
    if (columns === 4) return ["Orden", "Título", "Cliente", "Estado"];
    if (columns === 3) return ["Orden", "Título", "Cliente"];
    if (columns === 2) return ["Orden", "Detalle"];
  }
  return null;
}

function toTable(rows: string[][], explicitHeaders: string[] | null): AssistantBlock {
  if (rows.length === 0) {
    return { kind: "list", items: [] };
  }

  const columns = rows[0].length;
  const consistent = rows.every((row) => row.length === columns);
  const headers = explicitHeaders ?? (consistent ? inferHeaders(rows[0]) : null);

  if (!headers) {
    return { kind: "list", items: rows.map((row) => row.join(" · ")) };
  }
  return { kind: "table", headers, rows };
}

export function extractAssistantEntities(text: string): AssistantEntity[] {
  const seen = new Set<string>();
  const entities: AssistantEntity[] = [];

  for (const match of text.matchAll(ENTITY_PATTERN)) {
    const code = match[0];
    if (seen.has(code)) continue;
    seen.add(code);
    entities.push({ code, type: match[1] === "QT" ? "quote" : "order" });
  }
  return entities;
}

export function parseAssistantReply(raw: string): AssistantBlock[] {
  const normalized = raw.replace(/\r\n?/g, "\n").trim();
  if (normalized === "") return [];

  const blocks: AssistantBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let facts: AssistantFact[] = [];
  let pipeRows: string[][] = [];
  let pipeHeader: string[] | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    blocks.push({ kind: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  }

  function flushList() {
    if (list.length === 0) return;
    blocks.push({ kind: "list", items: list });
    list = [];
  }

  function flushFacts() {
    if (facts.length === 0) return;
    blocks.push({ kind: "facts", entries: facts });
    facts = [];
  }

  function flushPipes() {
    if (pipeRows.length === 0) {
      pipeHeader = null;
      return;
    }
    blocks.push(toTable(pipeRows, pipeHeader));
    pipeRows = [];
    pipeHeader = null;
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushFacts();
    flushPipes();
  }

  for (const rawLine of normalized.split("\n")) {
    const line = rawLine.trim();

    if (line === "") {
      flushAll();
      continue;
    }

    const markdownHeading = MARKDOWN_HEADING_PATTERN.exec(line);
    if (markdownHeading) {
      flushAll();
      blocks.push({ kind: "heading", text: markdownHeading[1].trim() });
      continue;
    }

    const pipeLine = PIPE_LINE_PATTERN.exec(line);
    if (pipeLine) {
      const rawCells = pipeLine[1].split("|").map((cell) => cell.trim());
      const cells = rawCells.filter(
        (cell, index) =>
          !(cell === "" && (index === 0 || index === rawCells.length - 1)),
      );

      if (cells.length > 0) {
        if (cells.every((cell) => PIPE_SEPARATOR_PATTERN.test(cell))) {
          if (pipeHeader === null && pipeRows.length > 0) {
            pipeHeader = pipeRows[pipeRows.length - 1];
            pipeRows = pipeRows.slice(0, -1);
          }
          continue;
        }
        flushParagraph();
        flushList();
        flushFacts();
        pipeRows.push(cells);
      }
      continue;
    }

    const bullet = BULLET_PATTERN.exec(line) ?? NUMBERED_PATTERN.exec(line);
    if (bullet) {
      const content = bullet[1].trim();
      const cells = content.split("|").map((cell) => cell.trim());

      if (cells.length > 1 && cells.every((cell) => cell !== "")) {
        flushParagraph();
        flushList();
        flushFacts();
        pipeRows.push(cells);
        continue;
      }

      const fact = isFactLine(content);
      if (fact) {
        flushParagraph();
        flushList();
        flushPipes();
        facts.push(fact);
        continue;
      }

      flushParagraph();
      flushFacts();
      flushPipes();
      list.push(content);
      continue;
    }

    if (line.endsWith(":") && line.length <= 90) {
      flushAll();
      blocks.push({ kind: "heading", text: line.slice(0, -1).trim() });
      continue;
    }

    const fact = isFactLine(line);
    if (fact) {
      flushParagraph();
      flushList();
      flushPipes();
      facts.push(fact);
      continue;
    }

    flushList();
    flushFacts();
    flushPipes();
    paragraph.push(line);
  }

  flushAll();
  return blocks;
}
