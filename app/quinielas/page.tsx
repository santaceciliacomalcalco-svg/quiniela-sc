"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

type Participante = {
  id: string;
  nombre: string;
};

type Quiniela = {
  participanteId: string;
  participanteNombre: string;
  selecciones: Record<number, string>;
};

export default function Quinielas() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [quinielas, setQuinielas] = useState<Record<string, Quiniela>>({});
  const [abierta, setAbierta] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const partidos = [
    { id: 1, local: "México", visitante: "Sudáfrica" },
    { id: 2, local: "Corea del Sur", visitante: "República Checa" },
    { id: 3, local: "Canadá", visitante: "Bosnia y Herzegovina" },
    { id: 4, local: "Estados Unidos", visitante: "Paraguay" },
    { id: 5, local: "Qatar", visitante: "Suiza" },
    { id: 6, local: "Haití", visitante: "Escocia" },
    { id: 7, local: "Brasil", visitante: "Marruecos" },
    { id: 8, local: "Australia", visitante: "Turquía" },
    { id: 9, local: "Costa de Marfil", visitante: "Ecuador" },
    { id: 10, local: "Alemania", visitante: "Curazao" },
    { id: 11, local: "Países Bajos", visitante: "Japón" },
    { id: 12, local: "Suecia", visitante: "Túnez" },
    { id: 13, local: "España", visitante: "Cabo Verde" },
    { id: 14, local: "Bélgica", visitante: "Egipto" },
    { id: 15, local: "Arabia Saudita", visitante: "Uruguay" },
    { id: 16, local: "Irán", visitante: "Nueva Zelanda" },
    { id: 17, local: "Francia", visitante: "Senegal" },
    { id: 18, local: "Irak", visitante: "Noruega" },
    { id: 19, local: "Argentina", visitante: "Argelia" },
    { id: 20, local: "Austria", visitante: "Jordania" },
    { id: 21, local: "Portugal", visitante: "RD Congo" },
    { id: 22, local: "Inglaterra", visitante: "Croacia" },
    { id: 23, local: "Ghana", visitante: "Panamá" },
    { id: 24, local: "Uzbekistán", visitante: "Colombia" },
  ];

  async function cargarDatos() {
    const participantesSnapshot = await getDocs(collection(db, "participantes"));
    const quinielasSnapshot = await getDocs(collection(db, "quinielas"));

    const listaParticipantes = participantesSnapshot.docs.map((documento) => ({
      id: documento.id,
      nombre: documento.data().nombre,
    })) as Participante[];

    const mapaQuinielas: Record<string, Quiniela> = {};

    quinielasSnapshot.docs.forEach((documento) => {
      const data = documento.data();

      mapaQuinielas[documento.id] = {
        participanteId: data.participanteId,
        participanteNombre: data.participanteNombre,
        selecciones: data.selecciones || {},
      };
    });

    setParticipantes(listaParticipantes);
    setQuinielas(mapaQuinielas);
    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function mostrarSeleccion(
    partido: { local: string; visitante: string },
    seleccion?: string
  ) {
    if (seleccion === "local") return partido.local;
    if (seleccion === "empate") return "Empate";
    if (seleccion === "visita") return partido.visitante;
    return "Sin guardar";
  }

  function contarPicks(participanteId: string) {
    return Object.keys(quinielas[participanteId]?.selecciones || {}).length;
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-black text-white p-6">
        <h1 className="text-5xl font-black">Cargando quinielas...</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black mb-2">👥 Quinielas Registradas</h1>

        <p className="text-yellow-400 mb-8">
          Revisa las quinielas guardadas de la semana.
        </p>
        <p className="text-pink-400 font-bold mb-6">
  Total de participantes: {participantes.length}
</p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {participantes.map((participante) => {
            const estaAbierta = abierta === participante.id;
            const picks = contarPicks(participante.id);

            return (
              <div
                key={participante.id}
                className="border border-pink-500 rounded-3xl bg-gray-950 overflow-hidden"
              >
                <div className="p-5">
                  <h2 className="text-2xl font-black">
                    👤 {participante.nombre}
                  </h2>

                  <p className="text-gray-400 mt-2">
                    Picks guardados:{" "}
                    <span className="text-pink-400 font-bold">
                      {picks}/{partidos.length}
                    </span>
                  </p>

                  <button
                    onClick={() => setAbierta(estaAbierta ? null : participante.id)}
                    className="mt-4 w-full bg-pink-600 hover:bg-pink-500 py-3 rounded-xl font-bold"
                  >
                    {estaAbierta ? "Ocultar Quiniela" : "Ver Quiniela"}
                  </button>
                </div>

                {estaAbierta && (
                  <div className="border-t border-pink-500 max-h-[500px] overflow-y-auto">
                    {partidos.map((partido) => (
                      <div
                        key={partido.id}
                        className="grid grid-cols-[40px_1fr_140px] border-b border-gray-800 text-sm"
                      >
                        <div className="p-3 text-pink-400 font-bold text-center">
                          {partido.id}
                        </div>

                        <div className="p-3">
                          {partido.local} vs {partido.visitante}
                        </div>

                        <div className="p-3 text-yellow-400 font-bold text-center">
                          {mostrarSeleccion(
                            partido,
                            quinielas[participante.id]?.selecciones?.[partido.id]
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {participantes.length === 0 && (
          <div className="border border-gray-700 rounded-3xl p-8 text-center">
            <p className="text-gray-400">
              Todavía no hay participantes registrados en Firebase.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}