"use client";

import { Suspense, useEffect, useState } from "react";
import { db, auth } from "../lib/firebase";
import { getJornadaId } from "../lib/jornada";
import { getPartidos } from "../lib/partidos";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
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

type EstadoJornada = "venta" | "curso" | "finalizada" | "proximamente";

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const jornadaParam = getJornadaId(searchParams.get("jornada"));
  const jornadaId = jornadaParam.startsWith("jornada-")
    ? jornadaParam
    : `jornada-${jornadaParam}`;

  const numeroJornada = jornadaId.replace("jornada-", "");
  const partidos = getPartidos(jornadaId);

  const [nombre, setNombre] = useState("");
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [resultados, setResultados] = useState<Record<number, string>>({});
  const [mensaje, setMensaje] = useState("");

  const [estadosJornadas, setEstadosJornadas] = useState<
    Record<string, EstadoJornada>
  >({
    "jornada-1": "curso",
    "jornada-2": "venta",
    "jornada-3": "venta",
  });

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

  async function cargarEstadosJornadas() {
    const referencia = doc(db, "configuracion", "jornadas");
    const documento = await getDoc(referencia);

    if (documento.exists()) {
      const data = documento.data();

      setEstadosJornadas({
        "jornada-1": data["jornada-1"] || "curso",
        "jornada-2": data["jornada-2"] || "venta",
        "jornada-3": data["jornada-3"] || "venta",
      });
    }
  }

  useEffect(() => {
    cargarParticipantes();
    cargarResultados();
    cargarEstadosJornadas();
  }, [jornadaId]);

  async function guardarParticipante() {
    if (!nombre.trim()) {
      setMensaje("⚠️ Escribe un nombre.");
      return;
    }

    await addDoc(collection(db, "jornadas", jornadaId, "participantes"), {
      nombre: nombre.trim(),
      pagado: false,
      jornada: numeroJornada,
      jornadaId,
      creadoEn: new Date(),
    });

    setNombre("");
    setMensaje(`✅ Participante guardado en Jornada ${numeroJornada}.`);
    cargarParticipantes();
  }

  async function eliminarParticipante(id: string) {
    await deleteDoc(doc(db, "jornadas", jornadaId, "participantes", id));
    await deleteDoc(doc(db, "jornadas", jornadaId, "quinielas", id));

    setMensaje(`🗑️ Participante eliminado de Jornada ${numeroJornada}.`);
    cargarParticipantes();
  }

  async function cambiarPagado(id: string, pagadoActual: boolean) {
    await setDoc(
      doc(db, "jornadas", jornadaId, "participantes", id),
      { pagado: !pagadoActual },
      { merge: true }
    );

    cargarParticipantes();
  }

  async function guardarResultados() {
    await setDoc(doc(db, "jornadas", jornadaId, "configuracion", "resultados"), {
      resultados,
      actualizadoEn: new Date(),
    });

    setMensaje(`✅ Resultados guardados en Jornada ${numeroJornada}.`);
  }

  async function reiniciarResultados() {
    await setDoc(doc(db, "jornadas", jornadaId, "configuracion", "resultados"), {
      resultados: {},
      actualizadoEn: new Date(),
    });

    setResultados({});
    setMensaje(`🔄 Resultados reiniciados en Jornada ${numeroJornada}.`);
  }

async function guardarEstadosJornadas() {
  alert("ENTRÉ A GUARDAR");

  try {
    await setDoc(
      doc(db, "configuracion", "jornadas"),
      {
        ...estadosJornadas,
        actualizadoEn: new Date(),
      },
      { merge: true }
    );

    alert("GUARDADO OK");

    setMensaje("✅ Estados de jornadas guardados.");
  } catch (error) {
    console.error(error);
    alert("ERROR AL GUARDAR");
  }
}

  function cambiarEstadoJornada(jornada: string, estado: EstadoJornada) {
    setEstadosJornadas({
      ...estadosJornadas,
      [jornada]: estado,
    });
  }

  function botonClase(
    tipo: "local" | "empate" | "visita",
    seleccionado: boolean
  ) {
    if (tipo === "local") {
      return seleccionado
        ? "bg-pink-500 text-white border-2 border-pink-200 shadow-lg shadow-pink-500/60"
        : "bg-black text-pink-400 border border-pink-500 hover:bg-pink-600 hover:text-white";
    }

    if (tipo === "empate") {
      return seleccionado
       ? "bg-white text-black border-2 border-gray-300 shadow-lg shadow-white/50"
        : "bg-black text-white border border-white hover:bg-white hover:text-black";
    }

    return seleccionado
      ? "bg-blue-600 text-white border-2 border-blue-300 shadow-lg shadow-blue-500/60"
      : "bg-black text-blue-400 border border-blue-500 hover:bg-blue-700 hover:text-white";
  }

  function textoBoton(texto: string, seleccionado: boolean) {
    return seleccionado ? `✓ ${texto}` : texto;
  }

  function etiquetaEstado(estado: EstadoJornada) {
    if (estado === "venta") return "🟢 En venta";
    if (estado === "curso") return "🔒 En curso";
    if (estado === "finalizada") return "✅ Finalizada";
    return "⏳ Próximamente";
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-black mb-2">🛠️ Panel Admin</h1>

        <div className="bg-yellow-400 text-black text-center p-5 rounded-3xl mb-6 border-4 border-yellow-200 shadow-lg shadow-yellow-500/30">
          <h2 className="text-3xl md:text-4xl font-black">
            ⚠️ ESTÁS ADMINISTRANDO LA JORNADA {numeroJornada}
          </h2>
          <p className="font-bold mt-2">
            Todo lo que agregues o edites aquí pertenece únicamente a esta jornada.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
  <button
    onClick={() => router.push("/admin?jornada=1")}
    className={`px-6 py-3 rounded-2xl font-black transition-all ${
      numeroJornada === "1"
        ? "bg-yellow-400 text-black shadow-lg shadow-yellow-500/40"
        : "bg-gray-900 text-white border border-gray-700 hover:border-yellow-400"
    }`}
  >
    ⚽ Jornada 1
  </button>

  <button
    onClick={() => router.push("/admin?jornada=2")}
    className={`px-6 py-3 rounded-2xl font-black transition-all ${
      numeroJornada === "2"
        ? "bg-yellow-400 text-black shadow-lg shadow-yellow-500/40"
        : "bg-gray-900 text-white border border-gray-700 hover:border-yellow-400"
    }`}
  >
    ⚽ Jornada 2
  </button>

  <button
    onClick={() => router.push("/admin?jornada=3")}
    className={`px-6 py-3 rounded-2xl font-black transition-all ${
      numeroJornada === "3"
        ? "bg-yellow-400 text-black shadow-lg shadow-yellow-500/40"
        : "bg-gray-900 text-white border border-gray-700 hover:border-yellow-400"
    }`}
  >
    ⚽ Jornada 3
  </button>
</div>

        <p className="text-pink-400 font-bold mb-2">
          Jornada activa: {numeroJornada}
        </p>

        <p className="text-gray-400 mb-8">
          Agrega participantes, captura resultados y controla el estado de cada jornada.
        </p>

        <section className="border border-cyan-500 rounded-3xl p-6 mb-10 bg-cyan-950/10">
          <h2 className="text-3xl font-black mb-4">⚙️ Estados de Jornadas</h2>

          <p className="text-gray-400 mb-6">
            Cambia desde aquí si una jornada está en venta, en curso, finalizada o próximamente.
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {["jornada-1", "jornada-2", "jornada-3"].map((jornada) => (
              <div
                key={jornada}
                className={`border rounded-2xl p-4 bg-gray-950 ${
                  jornada === jornadaId
                    ? "border-yellow-400 shadow-lg shadow-yellow-500/30"
                    : "border-gray-700"
                }`}
              >
                <h3 className="font-black text-xl mb-3">
                  {jornada.replace("jornada-", "Jornada ")}
                </h3>

                {jornada === jornadaId && (
                  <p className="text-yellow-300 font-black mb-3">
                    ⭐ Jornada que estás editando ahora
                  </p>
                )}

                <p className="text-yellow-300 font-bold mb-3">
                  Actual: {etiquetaEstado(estadosJornadas[jornada])}
                </p>

                <select
                  value={estadosJornadas[jornada]}
                  onChange={(e) =>
                    cambiarEstadoJornada(
                      jornada,
                      e.target.value as EstadoJornada
                    )
                  }
                  className="w-full bg-black border border-gray-700 rounded-xl p-3 text-white font-bold"
                >
                  <option value="venta">🟢 En venta</option>
                  <option value="curso">🔒 En curso</option>
                  <option value="finalizada">✅ Finalizada</option>
                  <option value="proximamente">⏳ Próximamente</option>
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={guardarEstadosJornadas}
            className="mt-6 bg-cyan-600 hover:bg-cyan-500 px-8 py-4 rounded-2xl font-black"
          >
            💾 Guardar Estados de Jornadas
          </button>
        </section>

        <section className="border border-pink-500 rounded-3xl p-6 mb-10">
          <h2 className="text-3xl font-black mb-4">
            👥 Participantes Jornada {numeroJornada}
          </h2>

          <p className="text-green-400 font-bold mb-2">
            Total de participantes Jornada {numeroJornada}: {participantes.length}
          </p>

          <p className="text-yellow-300 font-bold mb-4">
            ➕ Los nuevos participantes se agregarán a Jornada {numeroJornada}.
          </p>

          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`Nombre del participante para Jornada ${numeroJornada}`}
              className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 w-full"
            />

            <button
              onClick={guardarParticipante}
              className="bg-pink-600 hover:bg-pink-500 px-6 py-3 rounded-xl font-bold"
            >
              Agregar a J{numeroJornada}
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

                  <div>
                    <span className="font-bold">{p.nombre}</span>
                    <p className="text-xs text-gray-400 font-bold">
                      Jornada {numeroJornada}
                    </p>
                  </div>

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
              <h2 className="text-3xl font-black">
                🏁 Resultados Jornada {numeroJornada}
              </h2>
              <p className="text-gray-400">
                Estos resultados se guardan en Firebase únicamente para Jornada {numeroJornada}.
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
                  Partido {partido.id} · Jornada {numeroJornada}
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

          <div className="flex flex-col md:flex-row justify-center gap-4 mt-10">
            <button
              onClick={guardarResultados}
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xl px-12 py-4 rounded-2xl shadow-lg shadow-pink-500/40 transition-all"
            >
              💾 Guardar Resultados J{numeroJornada}
            </button>

            <button
              onClick={reiniciarResultados}
              className="bg-red-700 hover:bg-red-600 text-white font-bold text-xl px-12 py-4 rounded-2xl shadow-lg shadow-red-500/40 transition-all"
            >
              🗑️ Reiniciar Resultados J{numeroJornada}
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

export default function Admin() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">
          Cargando admin...
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}