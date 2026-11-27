/**
 * Provincias de Argentina (24 jurisdicciones). Es información geográfica
 * estable, no datos comerciales: se usa para los filtros de campañas.
 */
export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type ArgentinaProvince = (typeof ARGENTINA_PROVINCES)[number];

/**
 * Códigos ISO 3166-2:AR que usa la API en `GET /meta/provinces`.
 * Es la misma información geográfica estable que `ARGENTINA_PROVINCES` y se
 * usa solo como respaldo si esa consulta falla; el formulario avisa cuando
 * está mostrando la lista local.
 */
export const ARGENTINA_PROVINCE_CODES: ReadonlyArray<{
  code: string;
  name: string;
}> = [
  { code: "AR-C", name: "Ciudad Autónoma de Buenos Aires" },
  { code: "AR-B", name: "Buenos Aires" },
  { code: "AR-K", name: "Catamarca" },
  { code: "AR-H", name: "Chaco" },
  { code: "AR-U", name: "Chubut" },
  { code: "AR-X", name: "Córdoba" },
  { code: "AR-W", name: "Corrientes" },
  { code: "AR-E", name: "Entre Ríos" },
  { code: "AR-P", name: "Formosa" },
  { code: "AR-Y", name: "Jujuy" },
  { code: "AR-L", name: "La Pampa" },
  { code: "AR-F", name: "La Rioja" },
  { code: "AR-M", name: "Mendoza" },
  { code: "AR-N", name: "Misiones" },
  { code: "AR-Q", name: "Neuquén" },
  { code: "AR-R", name: "Río Negro" },
  { code: "AR-A", name: "Salta" },
  { code: "AR-J", name: "San Juan" },
  { code: "AR-D", name: "San Luis" },
  { code: "AR-Z", name: "Santa Cruz" },
  { code: "AR-S", name: "Santa Fe" },
  { code: "AR-G", name: "Santiago del Estero" },
  {
    code: "AR-V",
    name: "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  },
  { code: "AR-T", name: "Tucumán" },
];
