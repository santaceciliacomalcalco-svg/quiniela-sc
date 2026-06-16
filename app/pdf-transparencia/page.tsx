"use client";

import { Suspense, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getJornadaId } from "../lib/jornada";
import { getPartidos } from "../lib/partidos";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Participante = {
  id: string;
  nombre: string;
};

type Quiniela = {
  participanteId: string;
  participanteNombre?: string;
  selecciones?: Record<string, string>;
};

function PdfTransparenciaContent() {
  const searchParams = useSearchParams();
  const jornadaId = getJornadaId(searchParams.get("jornada"));
  const partidos = getPartidos(jornadaId);

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [quinielas, setQuinielas] = useState<Record<string, Quiniela>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      const participantesSnap = await getDocs(
        collection(db, "jornadas", jornadaId, "participantes")
      );

      const quinielasSnap = await getDocs(
        collection(db, "jornadas", jornadaId, "quinielas")
      );

      const lista = participantesSnap.docs.map((d) => ({
        id: d.id,
        nombre: d.data().nombre,
      })) as Participante[];

      lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

      const mapa: Record<string, Quiniela> = {};

      quinielasSnap.docs.forEach((d) => {
        const data = d.data();
        mapa[d.id] = {
          participanteId: data.participanteId,
          participanteNombre: data.participanteNombre,
          selecciones: data.selecciones || {},
        };
      });

      setParticipantes(lista);
      setQuinielas(mapa);
      setLoading(false);
    }

    cargarDatos();
  }, [jornadaId]);

  function mostrarSeleccion(
    partido: { local: string; visitante: string },
    seleccion?: string
  ) {
    if (seleccion === "local") return partido.local;
    if (seleccion === "empate") return "Empate";
    if (seleccion === "visita") return partido.visitante;
    return "Sin guardar";
  }

  async function imagenBase64(src: string) {
    const res = await fetch(src);
    const blob = await res.blob();

    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  async function generarPDF() {
    const pdf = new jsPDF("p", "mm", "a4");
    const fecha = new Date().toLocaleString("es-MX");

    let logo = "";

    try {
      logo = await imagenBase64("/logo-santa.png");
    } catch {}

    if (logo) {
      pdf.addImage(logo, "PNG", 15, 10, 25, 25);
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("QUINIELA SC", 105, 18, { align: "center" });

    pdf.setFontSize(14);
    pdf.text("PDF de Transparencia", 105, 27, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Jornada: ${jornadaId}`, 15, 45);
    pdf.text(`Generado: ${fecha}`, 15, 51);
    pdf.text(`Total de participantes: ${participantes.length}`, 15, 57);
    pdf.text(`Partidos de la jornada: ${partidos.length}`, 15, 63);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(
      "Documento generado para transparentar las quinielas registradas antes del cierre de la jornada.",
      15,
      73
    );

    let y = 82;

    participantes.forEach((participante, index) => {
      const quiniela = quinielas[participante.id];
      const selecciones = quiniela?.selecciones || {};

      if (index > 0) {
        pdf.addPage();
        y = 15;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(`${index + 1}. ${participante.nombre}`, 15, y);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(
        `Picks guardados: ${Object.keys(selecciones).length}/${partidos.length}`,
        15,
        y + 6
      );

      autoTable(pdf, {
        startY: y + 11,
        head: [["#", "Partido", "Selección registrada"]],
        body: partidos.map((partido) => [
          partido.id,
          `${partido.local} vs ${partido.visitante}`,
          mostrarSeleccion(partido, selecciones[String(partido.id)]),
        ]),
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [236, 0, 140],
          textColor: 255,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 12, halign: "center" },
          1: { cellWidth: 105 },
          2: { cellWidth: 55, halign: "center" },
        },
        margin: { left: 15, right: 15 },
      });
    });

    pdf.save(`quinielas-transparencia-${jornadaId}.pdf`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">
        Cargando PDF...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-xl w-full border border-pink-500 rounded-3xl p-8 text-center bg-gray-950">
        <h1 className="text-4xl font-black mb-3">
          📄 PDF de Transparencia
        </h1>

        <p className="text-pink-400 font-bold mb-2">
          Jornada: {jornadaId}
        </p>

        <p className="text-gray-400 mb-2">
          Participantes: {participantes.length}
        </p>

        <p className="text-gray-400 mb-6">
          Partidos: {partidos.length}
        </p>

        <button
          onClick={generarPDF}
          className="bg-pink-600 hover:bg-pink-500 px-8 py-4 rounded-2xl font-black text-xl"
        >
          📥 Descargar PDF
        </button>
      </div>
    </main>
  );
}

export default function PdfTransparenciaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">
          Cargando...
        </main>
      }
    >
      <PdfTransparenciaContent />
    </Suspense>
  );
}