"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

type Participante = {
  id: string;
  nombre: string;
};

type Quiniela = {
  id: string;
  participanteId: string;
  participanteNombre?: string;
  selecciones?: Record<string, string>;
};

type Resultado = {
  resultados?: Record<string, string>;
};

export default function TablaPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [resultados, setResultados] = useState<Resultado>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const participantesSnap = await getDocs(collection(db, "participantes"));
        const quinielasSnap = await getDocs(collection(db, "quinielas"));

        const participantesData = participantesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Participante[];

        const quinielasData = quinielasSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Quiniela[];

        const resultadosRef = doc(db, "configuracion", "resultados");
        const resultadosSnap = await getDoc(resultadosRef);

        setParticipantes(participantesData);
        setQuinielas(quinielasData);

        if (resultadosSnap.exists()) {
          setResultados(resultadosSnap.data() as Resultado);
        }
      } catch (error) {
        console.error("Error cargando tabla:", error);
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  const tabla = useMemo(() => {
    return participantes
      .map((participante) => {
        const quiniela = quinielas.find(
          (q) => q.participanteId === participante.id
        );

        let puntos = 0;

        if (quiniela?.selecciones && resultados?.resultados) {
          Object.entries(resultados.resultados).forEach(
            ([partidoId, resultado]) => {
              if (quiniela.selecciones?.[partidoId] === resultado) {
                puntos += 1;
              }
            }
          );
        }

        return {
          id: participante.id,
          nombre: participante.nombre,
          puntos,
        };
      })
      .sort((a, b) => b.puntos - a.puntos);
  }, [participantes, quinielas, resultados]);

  if (loading) {
    return <div className="p-6">Cargando tabla...</div>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tabla Quiniela SC</h1>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Posición</th>
              <th className="border p-2 text-left">Participante</th>
              <th className="border p-2 text-center">Puntos</th>
            </tr>
          </thead>

          <tbody>
            {tabla.map((item, index) => (
              <tr key={item.id}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{item.nombre}</td>
                <td className="border p-2 text-center font-bold">
                  {item.puntos}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}