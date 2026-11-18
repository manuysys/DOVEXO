import type { Metadata } from "next";

import { PortalApp } from "@/components/portal/portal-app";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Acceso al portal | ${brand.name}`,
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PortalAccessPage(props: PageProps<"/portal/[slug]">) {
  const { slug } = await props.params;
  const search = await props.searchParams;
  const rawToken = search.token;
  const token = Array.isArray(rawToken) ? (rawToken[0] ?? "") : (rawToken ?? "");

  return <PortalApp slug={slug} initialToken={token} />;
}
