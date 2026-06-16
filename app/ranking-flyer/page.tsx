"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getJornadaId } from "../lib/jornada";
import { useSearchParams } from "next/navigation";
import html2canvas from "html2canvas";

type Participante = {
  id: string;
  nombre: string;
};

type Quiniela = {
  id: string;
  participanteId: string;
  selecciones?: Record<string, string>;
};

type Resultado = {
  resultados?: Record<string, string>;
};

function RankingFlyerContent() {
  const searchParams = useSearchParams();
  const jornadaId = getJornadaId(searchParams.get("jornada"));
  const flyerRef = useRef<HTMLDivElement>(null);

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [resultados, setResultados] = useState<Resultado>({});
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);

  const appUrl = `https://quiniela-sc.vercel.app/tabla?jornada=${jornadaId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    appUrl
  )}`;

  useEffect(() => {
    async function cargarDatos() {
      try {
        const participantesSnap = await getDocs(
          collection(db, "jornadas", jornadaId, "participantes")
        );

        const quinielasSnap = await getDocs(
          collection(db, "jornadas", jornadaId, "quinielas")
        );

        const resultadosRef = doc(
          db,
          "jornadas",
          jornadaId,
          "configuracion",
          "resultados"
        );

        const resultadosSnap = await getDoc(resultadosRef);

        const participantesData = participantesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Participante[];

        const quinielasData = quinielasSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Quiniela[];

        setParticipantes(participantesData);
        setQuinielas(quinielasData);

        if (resultadosSnap.exists()) {
          setResultados(resultadosSnap.data() as Resultado);
        } else {
          setResultados({});
        }
      } catch (error) {
        console.error("Error cargando ranking flyer:", error);
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [jornadaId]);

  const top5 = useMemo(() => {
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
      .sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        return a.nombre.localeCompare(b.nombre, "es");
      })
      .slice(0, 5);
  }, [participantes, quinielas, resultados]);

  function medalla(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}°`;
  }

  async function generarBlob() {
    if (!flyerRef.current) return null;

    const canvas = await html2canvas(flyerRef.current, {
      scale: 3,
      backgroundColor: "#000000",
      useCORS: true,
      allowTaint: true,
    });

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });
  }

  async function compartirFlyer() {
    try {
      setGenerando(true);

      const blob = await generarBlob();
      if (!blob) return;

      const file = new File([blob], `ranking-${jornadaId}.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Ranking Quiniela SC",
          text: "🏆 Ranking oficial Quiniela SC",
          files: [file],
        });
      } else {
        descargarBlob(blob);
      }
    } catch (error) {
      console.error("Error compartiendo flyer:", error);
      alert("No se pudo compartir. Se descargará la imagen.");
      const blob = await generarBlob();
      if (blob) descargarBlob(blob);
    } finally {
      setGenerando(false);
    }
  }

  async function descargarFlyer() {
    try {
      setGenerando(true);
      const blob = await generarBlob();
      if (blob) descargarBlob(blob);
    } catch (error) {
      console.error("Error descargando flyer:", error);
    } finally {
      setGenerando(false);
    }
  }

  function descargarBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ranking-${jornadaId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-pink-400 font-black text-2xl">Cargando flyer...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-6">
      <div className="flex flex-col sm:flex-row gap-3 mb-5 print:hidden">
        <button
          onClick={compartirFlyer}
          disabled={generando}
          className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-400 px-6 py-3 rounded-2xl font-black text-lg"
        >
          {generando ? "⏳ Generando..." : "📲 Compartir flyer"}
        </button>

        <button
          onClick={descargarFlyer}
          disabled={generando}
          className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 disabled:text-gray-400 px-6 py-3 rounded-2xl font-black text-lg"
        >
          ⬇️ Descargar PNG
        </button>
      </div>

      <div
        ref={flyerRef}
        className="w-[430px] min-h-[760px] rounded-[32px] border-4 border-pink-500 bg-gradient-to-b from-gray-950 via-black to-gray-950 overflow-hidden shadow-2xl shadow-pink-500/40"
      >
        <div className="px-6 pt-6 text-center">
          <img
            src="/logo-santa.png"
            alt="Santa Cecilia"
            className="w-24 h-24 mx-auto mb-3"
          />

          <h1 className="text-4xl font-black leading-tight">TOP 5</h1>

          <h2 className="text-3xl font-black text-pink-500 leading-tight">
            QUINIELA SC
          </h2>

          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-yellow-300 font-black text-xl">
              {jornadaId.replace("jornada-", "Jornada ")}
            </p>
            <span className="text-2xl">🏆</span>
          </div>

          <p className="text-gray-400 text-sm mt-1">
            Ranking oficial · Mundial 2026
          </p>
        </div>

        <div className="px-5 mt-6 space-y-3">
          {top5.map((item, index) => (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 flex items-center justify-between ${
                index === 0
                  ? "bg-yellow-500/15 border-yellow-400"
                  : index === 1
                  ? "bg-gray-400/15 border-gray-300"
                  : index === 2
                  ? "bg-orange-500/15 border-orange-400"
                  : "bg-black/70 border-pink-500"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-3xl font-black w-12 text-center shrink-0">
                  {medalla(index)}
                </div>

                <div className="min-w-0">
                  <p className="font-black text-xl leading-tight truncate max-w-[230px]">
                    {item.nombre}
                  </p>

                  {index === 0 && (
                    <p className="text-yellow-300 text-sm font-bold">
                      Líder actual
                    </p>
                  )}
                </div>
              </div>

              <div className="min-w-16 h-16 rounded-full border-2 border-pink-500 flex items-center justify-center bg-black ml-3">
                <span className="text-pink-400 text-2xl font-black">
                  {item.puntos}
                </span>
              </div>
            </div>
          ))}

          {top5.length === 0 && (
            <div className="rounded-2xl border border-gray-700 p-6 text-center">
              <p className="text-gray-400 font-bold">
                Todavía no hay participantes en esta jornada.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 mt-6 flex items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-pink-400 font-black text-lg">Escanea y entra</p>
            <p className="text-gray-400 text-sm">
              Revisa la tabla completa en la app.
            </p>
          </div>

          <div className="bg-white p-2 rounded-xl">
            <img src={qrUrl} alt="QR Quiniela SC" className="w-24 h-24" />
          </div>
        </div>

        <div className="text-center mt-5 px-6 pb-6">
          <p className="text-yellow-300 font-black">
            QUINIELA SC · Santa Cecilia FC
          </p>
          <p className="text-gray-500 text-xs">
            Transparencia, ranking y resultados oficiales.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function RankingFlyerPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">
          Cargando flyer...
        </main>
      }
    >
      <RankingFlyerContent />
    </Suspense>
  );
}