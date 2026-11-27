import type { Metadata } from "next";
import { LoginView } from "@/components/auth/login-view";

export const metadata: Metadata = {
  title: "Ingresar",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <section className="hidden flex-col justify-between bg-sidebar px-10 py-12 text-slate-300 lg:flex lg:w-[44%]">
        <div>
          <p className="text-sm font-semibold tracking-[0.22em] text-white">
            ARVOKTA
          </p>
          <p className="text-[11px] font-medium tracking-widest text-slate-400 uppercase">
            Sales Agent
          </p>
        </div>

        <div className="max-w-md space-y-5">
          <h1 className="text-2xl leading-snug font-semibold text-white">
            Prospección comercial con datos verificables.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            Investigación de empresas, scoring por producto y seguimiento
            comercial en una sola herramienta interna. Sin datos inventados y
            sin envíos automáticos.
          </p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>· Productos y campañas configurables</li>
            <li>· Fuentes públicas y trazabilidad</li>
            <li>· Aprobación humana antes de contactar</li>
          </ul>
        </div>

        <p className="text-xs text-slate-500">
          Uso interno de ARVOKTA · Sin registro público
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-semibold tracking-[0.22em] text-ink">
              ARVOKTA
            </p>
            <p className="text-[11px] font-medium tracking-widest text-muted uppercase">
              Sales Agent
            </p>
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-ink">
            Ingresar
          </h2>
          <p className="mt-1 mb-6 text-sm leading-relaxed text-muted">
            Acceso restringido a usuarios habilitados. Las cuentas se crean
            desde el backend con las variables de administrador inicial.
          </p>

          <LoginView />
        </div>
      </section>
    </main>
  );
}
