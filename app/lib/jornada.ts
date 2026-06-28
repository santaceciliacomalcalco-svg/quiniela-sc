export const JORNADA_DEFAULT = "16vos";

export function getJornadaId(jornadaParam?: string | null) {
  if (!jornadaParam) return JORNADA_DEFAULT;

  if (jornadaParam === "16vos") return "16vos";

  if (jornadaParam.startsWith("jornada-")) {
    return jornadaParam;
  }

  return `jornada-${jornadaParam}`;
}

export const JORNADAS_DISPONIBLES = [
  { id: "16vos", nombre: "16vos de Final" },
  { id: "jornada-3", nombre: "Jornada 3" },
  { id: "jornada-2", nombre: "Jornada 2" },
  { id: "jornada-1", nombre: "Jornada 1" },
];