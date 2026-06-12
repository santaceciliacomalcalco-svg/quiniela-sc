"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";

type Participante = {
  id: string;
  nombre: string;
};

export default function MiQuiniela() {
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

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participanteId, setParticipanteId] = useState("");
  const [selecciones, setSelecciones] = useState<Record<number, string>>({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [bloqueada, setBloqueada] = useState(false);

  async function cargarParticipantes() {
    const snapshot = await getDocs(collection(db, "participantes"));

    const lista = snapshot.docs
      .map((documento) => ({
        id: documento.id,
        nombre: documento.data().nombre,
      })) as Participante[];

    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    setParticipantes(lista);

    if (lista.length > 0 && !participanteId) {
      setParticipanteId(lista[0].id);
    }

    setCargando(false);
  }

  async function cargarQuiniela(id: string) {
    if (!id) return;

    const referencia = doc(db, "quinielas", id);
    const documento = await getDoc(referencia);

    if (documento.exists()) {
      setSelecciones(documento.data().selecciones || {});
      setBloqueada(true);
      setMensaje("🔒 Esta quiniela ya fue guardada y no se puede modificar.");
    } else {
      setSelecciones({});
      setBloqueada(false);
      setMensaje("");
    }
  }

  useEffect(() => {
    cargarParticipantes();
  }, []);

  useEffect(() => {
    if (participanteId) {
      cargarQuiniela(participanteId);
    }
  }, [participanteId]);

  function seleccionar(partidoId: number, valor: string) {
    if (bloqueada) {
      setMensaje("🔒 Esta quiniela ya está bloqueada.");
      return;
    }

    setSelecciones({ ...selecciones, [partidoId]: valor });
  }

  async function guardarQuiniela() {
    if (bloqueada) {
      setMensaje("🔒 Esta quiniela ya fue guardada y no se puede modificar.");
      return;
    }

    if (!participanteId) {
      setMensaje("⚠️ Primero selecciona un participante.");
      return;
    }

    if (Object.keys(selecciones).length < partidos.length) {
      setMensaje("⚠️ Te faltan partidos por seleccionar.");
      return;
    }

    const participante = participantes.find((p) => p.id === participanteId);

    await setDoc(doc(db, "quinielas", participanteId), {
      participanteId,
      participanteNombre: participante?.nombre || "Sin nombre",
      selecciones,
      bloqueada: true,
      actualizadoEn: new Date(),
    });

    setBloqueada(true);
    setMensaje("✅ Quiniela guardada y bloqueada correctamente.");
  }

  function botonClase(
    tipo: "local" | "empate" | "visita",
    seleccionado: boolean
  ) {
    if (bloqueada && !seleccionado) {
      return "bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed opacity-60";
    }

    if (tipo === "local") {
      return seleccionado
        ? "bg-pink-500 text-white ring-2 ring-pink-200 shadow-lg shadow-pink-500/40"
        : "bg-black text-pink-400 border border-pink-500 hover:bg-pink-600 hover:text-white";
    }

    if (tipo === "empate") {
      return seleccionado
        ? "bg-white text-black ring-2 ring-gray-300 shadow-lg shadow-white/40"
        : "bg-black text-white border border-white hover:bg-white hover:text-black";
    }

    return seleccionado
      ? "bg-blue-600 text-white ring-2 ring-blue-300 shadow-lg shadow-blue-500/40"
      : "bg-black text-blue-400 border border-blue-500 hover:bg-blue-700 hover:text-white";
  }

  function textoBoton(texto: string, seleccionado: boolean) {
    return seleccionado ? `✓ ${texto}` : texto;
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black mb-2 flex items-center gap-3">
          ⚽ Mi Quiniela
        </h1>

        <p className="text-pink-400 text-xl font-bold mb-2">
          🔍 Busca tu nombre y rellena tu quiniela
        </p>

        <p className="text-gray-400 mb-6">
          Selecciona Local, Empate o Visita. Cada acierto vale 1 punto.
        </p>

        {bloqueada && (
          <div className="bg-yellow-500/10 border border-yellow-400 text-yellow-300 rounded-2xl p-4 mb-6 font-bold">
            🔒 Esta quiniela ya está guardada. Puedes verla, pero ya no
            modificarla.
          </div>
        )}

        <div className="border border-pink-500 rounded-2xl p-5 mb-8">
          <label className="block text-gray-400 mb-2 font-bold">
            Participante
          </label>

          <select
            value={participanteId}
            onChange={(e) => setParticipanteId(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 w-full max-w-md"
          >
            {cargando && <option value="">Cargando...</option>}

            {!cargando && participantes.length === 0 && (
              <option value="">No hay participantes</option>
            )}

            {participantes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <p className="text-pink-400 mt-4 font-bold">
            Seleccionados: {Object.keys(selecciones).length} / {partidos.length}
          </p>
        </div>

        <div className="space-y-4">
          {partidos.map((partido) => (
            <div
              key={partido.id}
              className="border border-pink-500 rounded-2xl p-4 bg-black"
            >
              <p className="text-pink-400 font-black text-sm">
                Partido {partido.id}
              </p>

              <h2 className="text-xl font-black mt-1 mb-4">
                {partido.local} vs {partido.visitante}
              </h2>

              <div className="grid grid-cols-3 gap-2">
                <button
                  disabled={bloqueada}
                  onClick={() => seleccionar(partido.id, "local")}
                  className={`w-full min-h-[54px] px-2 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 leading-tight ${botonClase(
                    "local",
                    selecciones[partido.id] === "local"
                  )}`}
                >
                  {textoBoton(
                    partido.local,
                    selecciones[partido.id] === "local"
                  )}
                </button>

                <button
                  disabled={bloqueada}
                  onClick={() => seleccionar(partido.id, "empate")}
                  className={`w-full min-h-[54px] px-2 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 leading-tight ${botonClase(
                    "empate",
                    selecciones[partido.id] === "empate"
                  )}`}
                >
                  {textoBoton("Empate", selecciones[partido.id] === "empate")}
                </button>

                <button
                  disabled={bloqueada}
                  onClick={() => seleccionar(partido.id, "visita")}
                  className={`w-full min-h-[54px] px-2 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 leading-tight ${botonClase(
                    "visita",
                    selecciones[partido.id] === "visita"
                  )}`}
                >
                  {textoBoton(
                    partido.visitante,
                    selecciones[partido.id] === "visita"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center mt-10 gap-4">
          {!bloqueada && (
            <button
              onClick={guardarQuiniela}
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xl px-12 py-4 rounded-2xl shadow-lg shadow-pink-500/40 transition-all"
            >
              💾 Guardar Quiniela
            </button>
          )}

          {mensaje && (
            <p className="text-xl font-bold text-yellow-400 text-center">
              {mensaje}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}