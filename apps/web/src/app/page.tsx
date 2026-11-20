import type { Metadata } from "next";

import { Faq } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";
import { Hero } from "@/components/marketing/hero";
import { ModuleIndex } from "@/components/marketing/module-index";
import { OrderRail } from "@/components/marketing/order-rail";
import { Pricing } from "@/components/marketing/pricing";
import { ProductTour } from "@/components/marketing/product-tour";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { brand } from "@/lib/brand";
import { buildSoftwareJsonLd, serializeJsonLd } from "@/lib/marketing/json-ld";
import { siteUrl } from "@/lib/marketing/site";

const title = "Software para empresas de servicios técnicos";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { absolute: `${title} | ${brand.name}` },
  description: brand.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${brand.name} — ${title}`,
    description: brand.description,
    url: "/",
    siteName: brand.name,
    locale: "es_AR",
    type: "website",
  },
};

/* Landing: papel, tinta y una sola señal. Sin smooth scroll ni 3D. */
export default function HomePage() {
  return (
    <div className="mk-root bg-mk-paper text-mk-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildSoftwareJsonLd()) }}
      />
      <SiteHeader />
      <main className="overflow-x-clip">
        <Hero />
        <OrderRail />
        <ModuleIndex />
        <ProductTour />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
