"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { getJornadaId } from "../lib/jornada";
import { getPartidos } from "../lib/partidos";
import { collection, getDocs } from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";

type Participante = {
  id: string;
  nombre: string;
};

type Quiniela = {
  participanteId: string;
  participanteNombre: string;
  selecciones: Record<number, string>;
};

type Partido = {
  id: number;
  local: string;
  visitante: string;
};

function QuinielasContent() {
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
  const [quinielas, setQuinielas] = useState<Record<string, Quiniela>>({});
  const [abierta, setAbierta] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargarDatos() {
    setCargando(true);
    setAbierta(null);

    const participantesSnapshot = await getDocs(
      collection(db, "jornadas", jornadaId, "participantes")
    );

    const quinielasSnapshot = await getDocs(
      collection(db, "jornadas", jornadaId, "quinielas")
    );

    const listaParticipantes = participantesSnapshot.docs.map((documento) => ({
      id: documento.id,
      nombre: documento.data().nombre,
    })) as Participante[];

    listaParticipantes.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

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
  }, [jornadaId]);

  function mostrarSeleccion(partido: Partido, seleccion?: string) {
    if (seleccion === "local") return partido.local;
    if (seleccion === "empate") return "Empate";
    if (seleccion === "visita") return partido.visitante;
    return "Sin guardar";
  }

  function contarPicks(participanteId: string) {
    return Object.keys(quinielas[participanteId]?.selecciones || {}).length;
  }

  function generarPDFTodasLasQuinielas() {
    const pdf = new jsPDF("p", "mm", "a4");
    const fecha = new Date().toLocaleString("es-MX");

    let y = 16;

    function pintarFondo() {
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, 210, 297, "F");
    }

    function encabezado() {
      pintarFondo();

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text("QUINIELA SC", 105, 16, { align: "center" });

      pdf.setTextColor(236, 72, 153);
      pdf.setFontSize(14);
      pdf.text(`PDF Todas las Quinielas - Jornada ${numeroJornada}`, 105, 25, {
        align: "center",
      });

      pdf.setTextColor(250, 204, 21);
      pdf.setFontSize(9);
      pdf.text(`Generado: ${fecha}`, 105, 32, { align: "center" });

      pdf.setTextColor(255, 255, 255);
      pdf.text(`Total de participantes: ${participantes.length}`, 105, 38, {
        align: "center",
      });
    }

    encabezado();
    y = 48;

    participantes.forEach((participante, index) => {
      const quiniela = quinielas[participante.id];

      if (y > 218) {
        pdf.addPage();
        encabezado();
        y = 48;
      }

      const altoCaja = 66;

      pdf.setDrawColor(236, 72, 153);
      pdf.setFillColor(15, 15, 18);
      pdf.roundedRect(10, y, 190, altoCaja, 3, 3, "FD");

      pdf.setFillColor(236, 72, 153);
      pdf.roundedRect(10, y, 190, 10, 3, 3, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(`${index + 1}. ${participante.nombre}`, 14, y + 7);

      pdf.setFontSize(8);
      pdf.text(
        `Picks: ${contarPicks(participante.id)}/${partidos.length}`,
        190,
        y + 7,
        { align: "right" }
      );

      let filaY = y + 16;

      partidos.forEach((partido) => {
        const seleccion = mostrarSeleccion(
          partido,
          quiniela?.selecciones?.[partido.id]
        );

        const columna = partido.id <= 12 ? 0 : 1;
        const xBase = columna === 0 ? 14 : 106;
        const yFila = y + 16 + ((partido.id - 1) % 12) * 4;

        pdf.setTextColor(180, 180, 180);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.text(`${partido.id}. ${partido.local} vs ${partido.visitante}`, xBase, yFila, {
          maxWidth: 50,
        });

        pdf.setTextColor(250, 204, 21);
        pdf.setFont("helvetica", "bold");
        pdf.text(seleccion, xBase + 57, yFila, {
          maxWidth: 28,
        });
      });

      y += altoCaja + 8;
    });

    pdf.setTextColor(150, 150, 150);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    if (y > 275) {
      pdf.addPage();
      pintarFondo();
      y = 20;
    }

    pdf.text("Documento generado automáticamente por QUINIELA SC.", 105, y, {
      align: "center",
    });

    pdf.save(`QUINIELA_SC_JORNADA_${numeroJornada}_TODAS_LAS_QUINIELAS.pdf`);
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


        <p className="text-yellow-400 mb-4">
          Revisa las quinielas guardadas de esta jornada.
        </p>
        <div className="flex flex-wrap gap-3 mb-6">
  <Link
    href="/quinielas?jornada=1"
    className={`px-5 py-2 rounded-full border text-sm font-black transition-all ${
      numeroJornada === "1"
        ? "bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-500/40 scale-105"
        : "bg-gray-950 text-gray-300 border-gray-700 hover:border-pink-500 hover:text-white"
    }`}
  ><Link
  href="/quinielas?jornada=16vos"
  className={`px-5 py-2 rounded-full border text-sm font-black transition-all ${
    numeroJornada === "16vos"
      ? "bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-500/40 scale-105"
      : "bg-gray-950 text-gray-300 border-gray-700 hover:border-pink-500 hover:text-white"
  }`}
>
  16vos
</Link>
    Jornada 1
  </Link>

  <Link
    href="/quinielas?jornada=2"
    className={`px-5 py-2 rounded-full border text-sm font-black transition-all ${
      numeroJornada === "2"
        ? "bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-500/40 scale-105"
        : "bg-gray-950 text-gray-300 border-gray-700 hover:border-pink-500 hover:text-white"
    }`}
  >
    Jornada 2
  </Link>

  <Link
    href="/quinielas?jornada=3"
    className={`px-5 py-2 rounded-full border text-sm font-black transition-all ${
      numeroJornada === "3"
        ? "bg-pink-600 text-white border-pink-400 shadow-lg shadow-pink-500/40 scale-105"
        : "bg-gray-950 text-gray-300 border-gray-700 hover:border-pink-500 hover:text-white"
    }`}
  >
    Jornada 3
  </Link>
</div>

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
                    onClick={() =>
                      setAbierta(estaAbierta ? null : participante.id)
                    }
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
                            quinielas[participante.id]?.selecciones?.[
                              partido.id
                            ]
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
          <div className="border border-gray-700 rounded-3xl p-8 text-center mt-8">
            <p className="text-gray-400">
              Todavía no hay participantes registrados en esta jornada.
            </p>
          </div>
        )}

        <div className="flex justify-center mt-12 mb-6">
          <button
            onClick={generarPDFTodasLasQuinielas}
            disabled={participantes.length === 0}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-400 text-black font-black text-xl px-10 py-4 rounded-2xl shadow-lg shadow-yellow-500/30 transition-all"
          >
            📄 PDF Todas las Quinielas
          </button>
        </div>
      </div>
    </main>
  );
}

export default function Quinielas() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">
          Cargando quinielas...
        </main>
      }
    >
      <QuinielasContent />
    </Suspense>
  );
}