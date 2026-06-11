"use client";

import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
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
};

export default function Admin() {
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

  const [nombre, setNombre] = useState("");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [resultados, setResultados] = useState<Record<number, string>>({});
  const [mensaje, setMensaje] = useState("");

  async function cargarParticipantes() {
    const snapshot = await getDocs(collection(db, "participantes"));

    const lista = snapshot.docs.map((documento) => ({
      id: documento.id,
      nombre: documento.data().nombre,
    })) as Participante[];

    setParticipantes(lista);
  }

  async function cargarResultados() {
    const referencia = doc(db, "configuracion", "resultados");
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
  }, []);

  async function guardarParticipante() {
    if (!nombre.trim()) {
      setMensaje("⚠️ Escribe un nombre.");
      return;
    }

    await addDoc(collection(db, "participantes"), {
      nombre: nombre.trim(),
      creadoEn: new Date(),
    });

    setNombre("");
    setMensaje("✅ Participante guardado en Firebase.");
    cargarParticipantes();
  }

  async function eliminarParticipante(id: string) {
    await deleteDoc(doc(db, "participantes", id));
    await deleteDoc(doc(db, "quinielas", id));

    setMensaje("🗑️ Participante eliminado.");
    cargarParticipantes();
  }

  async function guardarResultados() {
    await setDoc(doc(db, "configuracion", "resultados"), {
      resultados,
      actualizadoEn: new Date(),
    });

    setMensaje("✅ Resultados guardados en Firebase.");
  }

  async function reiniciarResultados() {
    await setDoc(doc(db, "configuracion", "resultados"), {
      resultados: {},
      actualizadoEn: new Date(),
    });

    setResultados({});
    setMensaje("🔄 Resultados reiniciados en Firebase.");
  }

  function botonClase(tipo: "local" | "empate" | "visita", seleccionado: boolean) {
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

        <p className="text-gray-400 mb-8">
          Agrega participantes y captura resultados reales.
        </p>

        <section className="border border-pink-500 rounded-3xl p-6 mb-10">
          <h2 className="text-3xl font-black mb-4">👥 Participantes</h2>

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
                <span className="font-bold">{p.nombre}</span>

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
                Estos resultados se guardan en Firebase.
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

          <div className="border border-pink-500 rounded-3xl overflow-hidden">
            <div className="grid grid-cols-[70px_1fr_180px_180px_180px] bg-black border-b border-pink-500">
              <div className="p-4 font-bold text-center text-pink-400">#</div>
              <div className="p-4 font-bold">PARTIDO</div>
              <div className="p-4 font-bold text-center text-pink-400">LOCAL</div>
              <div className="p-4 font-bold text-center text-white">EMPATE</div>
              <div className="p-4 font-bold text-center text-blue-400">VISITA</div>
            </div>

            {partidos.map((partido) => (
              <div
                key={partido.id}
                className="grid grid-cols-[70px_1fr_180px_180px_180px] border-b border-gray-800 items-center hover:bg-gray-950"
              >
                <div className="text-center text-pink-400 font-bold">
                  {partido.id}
                </div>

                <div className="p-4 font-medium">
                  {partido.local} vs {partido.visitante}
                </div>

                <div className="p-2">
                  <button
                    onClick={() =>
                      setResultados({ ...resultados, [partido.id]: "local" })
                    }
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${botonClase(
                      "local",
                      resultados[partido.id] === "local"
                    )}`}
                  >
                    {textoBoton(partido.local, resultados[partido.id] === "local")}
                  </button>
                </div>

                <div className="p-2">
                  <button
                    onClick={() =>
                      setResultados({ ...resultados, [partido.id]: "empate" })
                    }
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${botonClase(
                      "empate",
                      resultados[partido.id] === "empate"
                    )}`}
                  >
                    {textoBoton("Empate", resultados[partido.id] === "empate")}
                  </button>
                </div>

                <div className="p-2">
                  <button
                    onClick={() =>
                      setResultados({ ...resultados, [partido.id]: "visita" })
                    }
                    className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${botonClase(
                      "visita",
                      resultados[partido.id] === "visita"
                    )}`}
                  >
                    {textoBoton(partido.visitante, resultados[partido.id] === "visita")}
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