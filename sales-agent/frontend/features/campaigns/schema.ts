import { z } from "zod";

export const campaignSources = ["osm", "csv", "manual"] as const;

export type CampaignSource = (typeof campaignSources)[number];

export const SOURCE_LABELS: Record<CampaignSource, string> = {
  osm: "OpenStreetMap / Overpass",
  csv: "Importación CSV",
  manual: "Alta manual",
};

export const campaignSchema = z
  .object({
    product_id: z.string().min(1, "Seleccioná un producto."),
    name: z
      .string()
      .trim()
      .min(3, "Ingresá un nombre de al menos 3 caracteres.")
      .max(160, "El nombre no puede superar los 160 caracteres."),
    description: z.string().trim().max(2000, "Máximo 2000 caracteres."),
    country: z.string().trim().min(2, "Ingresá el país."),
    provinces: z.array(z.string()),
    localities: z.string(),
    selected_sectors: z.array(z.string()),
    manual_sectors: z.string(),
    max_results: z
      .number({ error: "Ingresá un número." })
      .int("Usá un número entero.")
      .min(1, "El mínimo es 1 resultado.")
      .max(1000, "El máximo es 1000 resultados."),
    sources: z.array(z.enum(campaignSources)),
    status: z.enum(["draft", "active"]),
  })
  .superRefine((values, context) => {
    const sectors = [
      ...values.selected_sectors,
      ...values.manual_sectors
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    ];
    if (sectors.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["manual_sectors"],
        message: "Seleccioná al menos un rubro o escribí uno.",
      });
    }
    if (values.sources.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["sources"],
        message: "Elegí al menos una fuente.",
      });
    }
  });

export type CampaignFormValues = z.infer<typeof campaignSchema>;
