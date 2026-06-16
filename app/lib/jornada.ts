export const JORNADA_DEFAULT = "jornada-1";

export function getJornadaId(jornadaParam?: string | null) {
  if (!jornadaParam) return JORNADA_DEFAULT;

  if (jornadaParam.startsWith("jornada-")) {
    return jornadaParam;
  }

  return `jornada-${jornadaParam}`;
}

export const JORNADAS_DISPONIBLES = [
  {
    id: "jornada-1",
    nombre: "Jornada 1",
  },
  {
    id: "jornada-2",
    nombre: "Jornada 2",
  },
  {
    id: "jornada-3",
    nombre: "Jornada 3",
  },
];