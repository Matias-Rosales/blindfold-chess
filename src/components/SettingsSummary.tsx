import { useSettings } from "../context/SettingsContext";
import { themeName } from "../data/themes";
import { routeHref } from "../hooks/useHashRoute";
import { Card } from "./ui/Card";
import { GearIcon } from "./ui/Icons";

/** Resumen de las opciones activas, con un enlace a Configuración para cambiarlas. */
export function SettingsSummary() {
  const { settings } = useSettings();
  const memText = settings.memTime ? `Memorizás ${settings.memTime} s` : "Las piezas no se ocultan";
  const styleText = settings.hideStyle === "checkers" ? "se vuelven círculos" : "desaparecen";
  return (
    <Card>
      <p className="text-sm">
        {memText}
        {settings.memTime > 0 && `, después las piezas ${styleText}`}.
        {settings.theme && ` Tema: ${themeName(settings.theme)}.`}
      </p>
      <a
        href={routeHref("settings")}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline dark:text-primary-dk"
      >
        <GearIcon className="size-4" /> Cambiar en Configuración
      </a>
    </Card>
  );
}
