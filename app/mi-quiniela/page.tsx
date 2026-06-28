"use client";

import { Suspense, useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { getJornadaId } from "../lib/jornada";
import { getPartidos } from "../lib/partidos";
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Participante = {
  id: string;
  nombre: string;
};

function MiQuinielaContent() {
  const searchParams = useSearchParams();

 const jornadaId = getJornadaId(searchParams.get("jornada"));

const nombreJornada =
  jornadaId === "16vos"
    ? "16vos de Final"
    : jornadaId.replace("jornada-", "Jornada ");

const numeroJornada =
  jornadaId === "16vos"
    ? "16vos"
    : jornadaId.replace("jornada-", "");

const partidos = getPartidos(jornadaId); 

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participanteId, setParticipanteId] = useState("");
  const [selecciones, setSelecciones] = useState<Record<number, string>>({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [bloqueada, setBloqueada] = useState(false);

  async function cargarParticipantes() {
    setCargando(true);
    setParticipanteId("");
    setSelecciones({});
    setBloqueada(false);
    setMensaje("");

    const snapshot = await getDocs(
      collection(db, "jornadas", jornadaId, "participantes")
    );

    const lista = snapshot.docs.map((documento) => ({
      id: documento.id,
      nombre: documento.data().nombre,
    })) as Participante[];

    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    setParticipantes(lista);

    setCargando(false);
  }

  async function cargarQuiniela(id: string) {
    if (!id) return;

    const referencia = doc(db, "jornadas", jornadaId, "quinielas", id);
    const documento = await getDoc(referencia);

    if (documento.exists()) {
      setSelecciones(documento.data().selecciones || {});
      setBloqueada(true);
      setMensaje("");
    } else {
      setSelecciones({});
      setBloqueada(false);
      setMensaje("");
    }
  }

  useEffect(() => {
    cargarParticipantes();
  }, [jornadaId]);

  useEffect(() => {
    if (participanteId) {
      cargarQuiniela(participanteId);
    }
  }, [participanteId, jornadaId]);

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

    await setDoc(doc(db, "jornadas", jornadaId, "quinielas", participanteId), {
      participanteId,
      participanteNombre: participante?.nombre || "Sin nombre",
      jornadaId,
      jornada: numeroJornada,
      selecciones,
      bloqueada: true,
      actualizadoEn: new Date(),
    });

    setBloqueada(true);
    setMensaje(`✅ Quiniela de Jornada ${numeroJornada} guardada y bloqueada correctamente.`);
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

  function claseBotonJornada(numero: string) {
    return numeroJornada === numero
      ? "bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-500/40 scale-105"
      : "bg-gray-950 text-gray-300 border-gray-700 hover:border-pink-500 hover:text-white";
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black mb-2 flex items-center gap-3">
          ⚽ Mi Quiniela
        </h1>

        <p className="text-gray-400 mb-4">
          Elige tu jornada, busca tu nombre y rellena tu quiniela.
        </p>

      <div className="flex flex-wrap gap-3 mb-6">
  <Link
    href="/mi-quiniela?jornada=1"
    className={`px-5 py-2 rounded-full border text-sm font-black transition-all ${claseBotonJornada(
      "1"
    )}`}
  >
    Jornada 1
  </Link>

  <Link
    href="/mi-quiniela?jornada=2"
    className={`px-5 py-2 rounded-full border text-sm font-black transition-all ${claseBotonJornada(
      "2"
    )}`}
  >
    Jornada 2
  </Link>

  <Link
    href="/mi-quiniela?jornada=3"
    className={`px-5 py-2 rounded-full border text-sm font-black transition-all ${claseBotonJornada(
      "3"
    )}`}
  >
    Jornada 3
  </Link>
</div>

        <p className="text-gray-400 mb-6">
          Selecciona Local, Empate o Visita. Cada acierto vale 1 punto.
        </p>

        {bloqueada && (
          <div className="bg-yellow-500/10 border border-yellow-400 text-yellow-300 rounded-2xl p-4 mb-6 font-bold">
  🔒 Esta quiniela ya está guardada. Puedes verla, pero ya no modificarla.
</div>
        )}

        <div className="border border-pink-500 rounded-2xl p-5 mb-8">
          <label className="block text-gray-400 mb-2 font-bold">
            Participante de Jornada {numeroJornada}
          </label>

          <select
            value={participanteId}
            onChange={(e) => setParticipanteId(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 w-full max-w-md"
            
          >
            <option value="">
  Selecciona tu Nombre
</option>
            {cargando && <option value="">Cargando...</option>}

            {!cargando && participantes.length === 0 && (
              <option value="">No hay participantes en esta jornada</option>
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

        {!partidos.length && (
          <div className="border border-yellow-500 bg-yellow-500/10 rounded-2xl p-5 text-yellow-300">
            ⚠️ No hay partidos cargados para esta jornada.
          </div>
        )}

        <div className="space-y-4">
          {partidos.map((partido) => (
            <div
              key={partido.id}
              className="border border-pink-500 rounded-2xl p-4 bg-black"
            >
              <p className="text-pink-400 font-black text-sm">
                Partido {partido.id} · Jornada {numeroJornada}
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
                  {textoBoton(partido.local, selecciones[partido.id] === "local")}
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
                  {textoBoton(partido.visitante, selecciones[partido.id] === "visita")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center mt-10 gap-4">
          {!bloqueada && participantes.length > 0 && partidos.length > 0 && (
            <button
              onClick={guardarQuiniela}
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xl px-12 py-4 rounded-2xl shadow-lg shadow-pink-500/40 transition-all"
            >
              💾 Guardar Quiniela J{numeroJornada}
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

export default function MiQuiniela() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">
          Cargando quiniela...
        </main>
      }
    >
      <MiQuinielaContent />
    </Suspense>
  );
}