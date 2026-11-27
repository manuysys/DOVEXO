import { z } from "zod";
import type { CompanyInput } from "@/lib/api/types";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_PATTERN = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i;

export const companyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ingresá un nombre de al menos 2 caracteres.")
    .max(255, "El nombre no puede superar los 255 caracteres."),
  website: z
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres.")
    .refine(
      (value) => value.length === 0 || URL_PATTERN.test(value),
      "Ingresá una URL completa, por ejemplo https://empresa.com.ar.",
    ),
  province: z.string(),
  locality: z.string().trim().max(160, "Máximo 160 caracteres."),
  address: z.string().trim().max(500, "Máximo 500 caracteres."),
  sector_slugs: z.array(z.string()).min(1, "Seleccioná al menos un rubro."),
  phone: z
    .string()
    .trim()
    .max(60, "Máximo 60 caracteres.")
    .refine(
      (value) => value.length === 0 || /^[+()\d\s.-]{6,}$/.test(value),
      "Ingresá un teléfono con al menos 6 dígitos.",
    ),
  email: z
    .string()
    .trim()
    .max(200, "Máximo 200 caracteres.")
    .refine(
      (value) => value.length === 0 || EMAIL_PATTERN.test(value),
      "Ingresá un email válido.",
    ),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;

export function emptyCompanyValues(province = ""): CompanyFormValues {
  return {
    name: "",
    website: "",
    province,
    locality: "",
    address: "",
    sector_slugs: [],
    phone: "",
    email: "",
  };
}

export function formValuesToCompanyInput(
  values: CompanyFormValues,
): CompanyInput {
  return {
    name: values.name.trim(),
    website: values.website.trim(),
    province: values.province,
    locality: values.locality.trim(),
    address: values.address.trim(),
    sector_slugs: values.sector_slugs,
    phone: values.phone.trim(),
    email: values.email.trim(),
  };
}
