import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, controlClass } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";

export default function SearchPage() {
  return (
    <>
      <PageHeader
        title="Buscar empresas"
        description="Punto de inicio de las búsquedas de prospección. El formulario queda visible como referencia de la Fase 2, deshabilitado."
      />

      <Alert variant="info" title="Disponible en Fase 2" className="mb-4">
        El descubrimiento con OpenStreetMap/Overpass, CSV y alta manual todavía
        no está implementado. No se ejecutan búsquedas ni se muestran resultados
        simulados.
      </Alert>

      <Card>
        <CardHeader
          title="Parámetros de búsqueda"
          description="Vista previa del formulario previsto por el SPEC. Todos los controles están deshabilitados."
        />
        <CardContent>
          <fieldset disabled className="grid gap-4 md:grid-cols-2">
            <Field label="País" htmlFor="search-country">
              <select id="search-country" className={controlClass} defaultValue="AR">
                <option value="AR">Argentina</option>
              </select>
            </Field>

            <Field label="Proveedor" htmlFor="search-provider">
              <select id="search-provider" className={controlClass}>
                <option>OpenStreetMap / Overpass</option>
                <option>CSV</option>
                <option>Alta manual</option>
              </select>
            </Field>

            <Field label="Provincia" htmlFor="search-province">
              <select id="search-province" className={controlClass}>
                <option>Todo el país</option>
              </select>
            </Field>

            <Field label="Localidad" htmlFor="search-locality">
              <input
                id="search-locality"
                className={controlClass}
                placeholder="Ej.: Rosario"
              />
            </Field>

            <Field
              label="Rubros"
              htmlFor="search-sectors"
              hint="Los rubros se cargan desde la base (seed de la Fase 1)."
            >
              <select id="search-sectors" className={controlClass} multiple size={7}>
                <option>Se cargan desde la base de datos</option>
              </select>
            </Field>

            <Field label="Palabras clave" htmlFor="search-keywords">
              <textarea
                id="search-keywords"
                rows={7}
                className={controlClass}
                placeholder="Una por línea"
              />
            </Field>

            <Field label="Campaña" htmlFor="search-campaign">
              <select id="search-campaign" className={controlClass}>
                <option>Sin campaña</option>
              </select>
            </Field>

            <Field label="Límite de resultados" htmlFor="search-limit">
              <input
                id="search-limit"
                type="number"
                className={controlClass}
                placeholder="100"
              />
            </Field>
          </fieldset>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-muted">
              Se priorizarán búsquedas pequeñas para respetar los límites de
              Overpass.
            </p>
            <Button disabled>Iniciar búsqueda</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
