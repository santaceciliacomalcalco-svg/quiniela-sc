"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getJornadaId, JORNADAS_DISPONIBLES } from "../lib/jornada";
import { useRouter, useSearchParams } from "next/navigation";

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

function TablaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jornadaId = getJornadaId(searchParams.get("jornada"));

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [resultados, setResultados] = useState<Resultado>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);

        const participantesSnap = await getDocs(
          collection(db, "jornadas", jornadaId, "participantes")
        );

        const quinielasSnap = await getDocs(
          collection(db, "jornadas", jornadaId, "quinielas")
        );

        const participantesData = participantesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Participante[];

        const quinielasData = quinielasSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Quiniela[];

        const resultadosRef = doc(
          db,
          "jornadas",
          jornadaId,
          "configuracion",
          "resultados"
        );

        const resultadosSnap = await getDoc(resultadosRef);

        setParticipantes(participantesData);
        setQuinielas(quinielasData);

        if (resultadosSnap.exists()) {
          setResultados(resultadosSnap.data() as Resultado);
        } else {
          setResultados({});
        }
      } catch (error) {
        console.error("Error cargando tabla:", error);
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [jornadaId]);

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

  function cambiarJornada(nuevaJornada: string) {
    router.push(`/tabla?jornada=${nuevaJornada}`);
  }

  function medalla(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
  }

  async function compartirRanking(
    nombre: string,
    posicion: number,
    puntos: number
  ) {
    const mensaje = `🏆 Voy en el lugar #${posicion} de la Quiniela SC con ${puntos} puntos ⚽\n\nCheca la tabla aquí:`;
    const url = `https://quiniela-sc.vercel.app/tabla?jornada=${jornadaId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Quiniela SC",
          text: mensaje,
          url,
        });
      } catch {
        // Usuario canceló compartir
      }
    } else {
      await navigator.clipboard.writeText(`${mensaje}\n${url}`);
      alert("Link copiado para compartir.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl font-bold text-pink-400">Cargando tabla...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2">🏆 Tabla General</h1>
          <p className="text-gray-400">
            Ranking oficial de la Quiniela Santa Cecilia
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {JORNADAS_DISPONIBLES.map((jornada) => (
              <button
                key={jornada.id}
                onClick={() => cambiarJornada(jornada.id)}
                className={`px-5 py-3 rounded-xl font-black border transition-all ${
                  jornadaId === jornada.id
                    ? "bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-500/40"
                    : "bg-black text-pink-400 border-pink-500 hover:bg-pink-600 hover:text-white"
                }`}
              >
                {jornada.nombre}
              </button>
            ))}
          </div>

          <p className="text-pink-400 font-bold mt-4">
            Jornada activa: {jornadaId}
          </p>
        </div>

        <div className="border border-pink-500 rounded-3xl overflow-hidden shadow-2xl shadow-pink-500/20">
          <div className="grid grid-cols-[80px_1fr_120px] md:grid-cols-[90px_1fr_120px] bg-pink-600 text-white font-black text-sm md:text-base">
            <div className="p-4 text-center">POS</div>
            <div className="p-4">PARTICIPANTE</div>
            <div className="p-4 text-center">PTS</div>
          </div>

          {tabla.map((item, index) => (
            <div
              key={item.id}
              className={`grid grid-cols-[80px_1fr_120px] md:grid-cols-[90px_1fr_120px] items-center border-b border-gray-800 ${
                index === 0
                  ? "bg-yellow-500/10"
                  : index === 1
                  ? "bg-gray-400/10"
                  : index === 2
                  ? "bg-orange-500/10"
                  : "bg-gray-950"
              }`}
            >
              <div className="p-4 text-center text-2xl font-black">
                {medalla(index)}
              </div>

              <div className="p-4">
                <p className="font-black text-base md:text-lg">{item.nombre}</p>

                {index === 0 && (
                  <p className="text-yellow-400 text-sm font-bold">
                    Líder actual
                  </p>
                )}

                <button
                  onClick={() =>
                    compartirRanking(item.nombre, index + 1, item.puntos)
                  }
                  className="mt-2 px-3 py-1 rounded-full border border-pink-500 text-pink-400 hover:bg-pink-500 hover:text-white text-xs md:text-sm font-bold"
                >
                  📲 Compartir
                </button>
              </div>

              <div className="p-4 text-center">
                <span className="inline-flex items-center justify-center min-w-14 rounded-full bg-black border border-pink-500 px-4 py-2 text-xl font-black text-pink-400">
                  {item.puntos}
                </span>
              </div>
            </div>
          ))}

          {tabla.length === 0 && (
            <div className="p-8 text-center text-gray-400 font-bold bg-gray-950">
              No hay participantes en esta jornada.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function TablaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">Cargando...</div>}>
      <TablaContent />
    </Suspense>
  );
}