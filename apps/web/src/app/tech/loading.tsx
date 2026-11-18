import { Skeleton } from "@/components/ui/skeleton";

export default function TechLoading() {
  return (
    <div className="bg-bg min-h-dvh">
      <header className="border-border bg-surface sticky top-0 z-20 border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando trabajos…</span>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="rounded-ds-lg h-32 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}
