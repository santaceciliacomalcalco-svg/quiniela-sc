export const JORNADA_DEFAULT = "jornada-1";

export function getJornadaId(jornadaParam?: string | null) {
  return jornadaParam || JORNADA_DEFAULT;
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