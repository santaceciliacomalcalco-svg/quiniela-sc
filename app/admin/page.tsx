"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { getJornadaId } from "../lib/jornada";
import { getPartidos } from "../lib/partidos";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
} from "firebase/firestore";

type Participante = {
  id: string;
  nombre: string;
  pagado?: boolean;
};

export default function Admin() {
  const router = useRouter();
  const jornadaId = getJornadaId();
  const partidos = getPartidos(jornadaId);

  const [nombre, setNombre] = useState("");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [resultados, setResultados] = useState<Record<number, string>>({});
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== "santaceciliacomalcalco@gmail.com") {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  async function cargarParticipantes() {
    const snapshot = await getDocs(
      collection(db, "jornadas", jornadaId, "participantes")
    );

    const lista = snapshot.docs.map((documento) => ({
      id: documento.id,
      nombre: documento.data().nombre,
      pagado: documento.data().pagado || false,
    })) as Participante[];

    lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    setParticipantes(lista);
  }

  async function cambiarPagado(id: string, pagadoActual: boolean) {
    await setDoc(
      doc(db, "jornadas", jornadaId, "participantes", id),
      {
        pagado: !pagadoActual,
      },
      { merge: true }
    );

    cargarParticipantes();
  }

  async function cargarResultados() {
    const referencia = doc(
      db,
      "jornadas",
      jornadaId,
      "configuracion",
      "resultados"
    );

    const documento = await getDoc(referencia);

    if (documento.exists()) {
      setResultados(documento.data().resultados || {});
    } else {
      setResultados({});
    }
  }

  useEffect(() => {
    cargarParticipantes();
    cargarResultados();
  }, [jornadaId]);

  async function guardarParticipante() {
    if (!nombre.trim()) {
      setMensaje("⚠️ Escribe un nombre.");
      return;
    }

    await addDoc(collection(db, "jornadas", jornadaId, "participantes"), {
      nombre: nombre.trim(),
      pagado: false,
      creadoEn: new Date(),
    });

    setNombre("");
    setMensaje("✅ Participante guardado en Firebase.");
    cargarParticipantes();
  }

  async function eliminarParticipante(id: string) {
    await deleteDoc(doc(db, "jornadas", jornadaId, "participantes", id));
    await deleteDoc(doc(db, "jornadas", jornadaId, "quinielas", id));

    setMensaje("🗑️ Participante eliminado.");
    cargarParticipantes();
  }

  async function guardarResultados() {
    await setDoc(doc(db, "jornadas", jornadaId, "configuracion", "resultados"), {
      resultados,
      actualizadoEn: new Date(),
    });

    setMensaje("✅ Resultados guardados en Firebase.");
  }

  async function reiniciarResultados() {
    await setDoc(doc(db, "jornadas", jornadaId, "configuracion", "resultados"), {
      resultados: {},
      actualizadoEn: new Date(),
    });

    setResultados({});
    setMensaje("🔄 Resultados reiniciados en Firebase.");
  }

  function botonClase(
    tipo: "local" | "empate" | "visita",
    seleccionado: boolean
  ) {
    if (tipo === "local") {
      return seleccionado
        ? "bg-pink-500 text-white ring-4 ring-pink-200 scale-110 shadow-lg shadow-pink-500/60"
        : "bg-black text-pink-400 border border-pink-500 hover:bg-pink-600 hover:text-white";
    }

    if (tipo === "empate") {
      return seleccionado
        ? "bg-white text-black ring-4 ring-gray-300 scale-110 shadow-lg shadow-white/50"
        : "bg-black text-white border border-white hover:bg-white hover:text-black";
    }

    return seleccionado
      ? "bg-blue-600 text-white ring-4 ring-blue-300 scale-110 shadow-lg shadow-blue-500/60"
      : "bg-black text-blue-400 border border-blue-500 hover:bg-blue-700 hover:text-white";
  }

  function textoBoton(texto: string, seleccionado: boolean) {
    return seleccionado ? `✓ ${texto}` : texto;
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black mb-2">🛠️ Panel Admin</h1>

        <p className="text-pink-400 font-bold mb-2">
          Jornada activa: {jornadaId}
        </p>

        <p className="text-gray-400 mb-8">
          Agrega participantes y captura resultados reales.
        </p>

        <section className="border border-pink-500 rounded-3xl p-6 mb-10">
          <h2 className="text-3xl font-black mb-4">👥 Participantes</h2>

          <p className="text-green-400 font-bold mb-4">
            Total de participantes: {participantes.length}
          </p>

          <div className="flex gap-3 mb-6">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del participante"
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 w-full"
            />

            <button
              onClick={guardarParticipante}
              className="bg-pink-600 hover:bg-pink-500 px-6 py-3 rounded-xl font-bold"
            >
              Agregar
            </button>
          </div>

          <div className="space-y-2">
            {participantes.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-gray-950 border border-gray-800 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cambiarPagado(p.id, p.pagado || false)}
                    className={`w-5 h-5 rounded-full border-2 ${
                      p.pagado
                        ? "bg-green-500 border-green-400"
                        : "bg-transparent border-gray-500"
                    }`}
                    title={p.pagado ? "Pagado" : "Pendiente de pago"}
                  />

                  <span className="font-bold">{p.nombre}</span>

                  {p.pagado && (
                    <span className="text-green-400 text-sm font-bold">
                      Pagado
                    </span>
                  )}
                </div>

                <button
                  onClick={() => eliminarParticipante(p.id)}
                  className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg font-bold"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-3xl font-black">🏁 Resultados</h2>
              <p className="text-gray-400">
                Estos resultados se guardan en Firebase por jornada.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={guardarResultados}
                className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-pink-500/40"
              >
                💾 Guardar
              </button>

              <button
                onClick={reiniciarResultados}
                className="bg-red-700 hover:bg-red-600 text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-red-500/40"
              >
                🗑️ Reiniciar
              </button>
            </div>
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
                    onClick={() =>
                      setResultados({ ...resultados, [partido.id]: "local" })
                    }
                    className={`w-full min-h-[54px] px-2 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 leading-tight ${botonClase(
                      "local",
                      resultados[partido.id] === "local"
                    )}`}
                  >
                    {textoBoton(
                      partido.local,
                      resultados[partido.id] === "local"
                    )}
                  </button>

                  <button
                    onClick={() =>
                      setResultados({ ...resultados, [partido.id]: "empate" })
                    }
                    className={`w-full min-h-[54px] px-2 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 leading-tight ${botonClase(
                      "empate",
                      resultados[partido.id] === "empate"
                    )}`}
                  >
                    {textoBoton("Empate", resultados[partido.id] === "empate")}
                  </button>

                  <button
                    onClick={() =>
                      setResultados({ ...resultados, [partido.id]: "visita" })
                    }
                    className={`w-full min-h-[54px] px-2 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 leading-tight ${botonClase(
                      "visita",
                      resultados[partido.id] === "visita"
                    )}`}
                  >
                    {textoBoton(
                      partido.visitante,
                      resultados[partido.id] === "visita"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-10">
            <button
              onClick={guardarResultados}
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xl px-12 py-4 rounded-2xl shadow-lg shadow-pink-500/40 transition-all"
            >
              💾 Guardar Resultados
            </button>

            <button
              onClick={reiniciarResultados}
              className="bg-red-700 hover:bg-red-600 text-white font-bold text-xl px-12 py-4 rounded-2xl shadow-lg shadow-red-500/40 transition-all"
            >
              🗑️ Reiniciar Resultados
            </button>
          </div>

          {mensaje && (
            <p className="text-xl font-bold text-yellow-400 text-center mt-4">
              {mensaje}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}