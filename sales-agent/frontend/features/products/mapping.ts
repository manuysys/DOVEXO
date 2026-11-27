import type { Product, ProductInput } from "@/lib/api/types";
import { arrayToLines, splitTags } from "@/lib/utils";
import type { ProductFormValues } from "./schema";
import { parseJsonObject } from "./schema";

export const emptyProductValues: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  value_proposition: "",
  target_profile: "",
  pain_points: "",
  target_sectors: "",
  keywords: "",
  scoring_config: "{\n  \n}",
  messaging_config: "{\n  \n}",
  is_active: true,
};

export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    value_proposition: product.value_proposition,
    target_profile: product.target_profile,
    pain_points: arrayToLines(product.pain_points),
    target_sectors: product.target_sectors.join(", "),
    keywords: product.keywords.join(", "),
    scoring_config: JSON.stringify(product.scoring_config ?? {}, null, 2),
    messaging_config: JSON.stringify(product.messaging_config ?? {}, null, 2),
    is_active: product.is_active,
  };
}

export function formValuesToProductInput(
  values: ProductFormValues,
): ProductInput {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description.trim(),
    value_proposition: values.value_proposition.trim(),
    target_profile: values.target_profile.trim(),
    pain_points: splitTags(values.pain_points),
    target_sectors: splitTags(values.target_sectors),
    keywords: splitTags(values.keywords),
    scoring_config: parseJsonObject(values.scoring_config),
    messaging_config: parseJsonObject(values.messaging_config),
    is_active: values.is_active,
  };
}
