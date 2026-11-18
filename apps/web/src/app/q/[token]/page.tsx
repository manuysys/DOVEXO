import type { Metadata } from "next";

import { PublicQuoteView } from "@/components/quotes/public-quote-view";

// Enlaces públicos por token: no deben indexarse en buscadores ni filtrar el
// token a través del `Referer`.
export const metadata: Metadata = {
  title: "Presupuesto",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PublicQuotePage(props: PageProps<"/q/[token]">) {
  const { token } = await props.params;

  return (
    <main className="min-h-screen bg-bg px-4 py-6 md:py-10 print:min-h-0 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto w-full max-w-3xl">
        <PublicQuoteView token={token} />
      </div>
    </main>
  );
}
