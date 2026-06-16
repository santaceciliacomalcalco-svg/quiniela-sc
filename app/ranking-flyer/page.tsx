"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getJornadaId } from "../lib/jornada";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";

type Participante = { id: string; nombre: string };
type Quiniela = {
  id: string;
  participanteId: string;
  selecciones?: Record<string, string>;
};
type Resultado = { resultados?: Record<string, string> };

function RankingFlyerContent() {
  const searchParams = useSearchParams();
  const jornadaId = getJornadaId(searchParams.get("jornada"));

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [quinielas, setQuinielas] = useState<Quiniela[]>([]);
  const [resultados, setResultados] = useState<Resultado>({});
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [imagenGenerada, setImagenGenerada] = useState("");

  const appUrl = `https://quiniela-sc.vercel.app/tabla?jornada=${jornadaId}`;

  useEffect(() => {
    async function cargarDatos() {
      try {
        const participantesSnap = await getDocs(
          collection(db, "jornadas", jornadaId, "participantes")
        );

        const quinielasSnap = await getDocs(
          collection(db, "jornadas", jornadaId, "quinielas")
        );

        const resultadosSnap = await getDoc(
          doc(db, "jornadas", jornadaId, "configuracion", "resultados")
        );

        setParticipantes(
          participantesSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Participante[]
        );

        setQuinielas(
          quinielasSnap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })) as Quiniela[]
        );

        setResultados(
          resultadosSnap.exists() ? (resultadosSnap.data() as Resultado) : {}
        );
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [jornadaId]);

  const top5 = useMemo(() => {
    return participantes
      .map((participante, indexOriginal) => {
        const quiniela = quinielas.find(
          (q) => q.participanteId === participante.id
        );

        let puntos = 0;

        if (quiniela?.selecciones && resultados?.resultados) {
          Object.entries(resultados.resultados).forEach(
            ([partidoId, resultado]) => {
              if (quiniela.selecciones?.[partidoId] === resultado) puntos += 1;
            }
          );
        }

        return {
          id: participante.id,
          nombre: participante.nombre,
          puntos,
          indexOriginal,
        };
      })
      .sort((a, b) => {
        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
        return a.indexOriginal - b.indexOriginal;
      })
      .slice(0, 5);
  }, [participantes, quinielas, resultados]);

  function cargarImagen(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.stroke();
  }

async function generarFlyer() {
  setGenerando(true);

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  function nombreCorto(nombre: string) {
    return nombre.replace(/\s*\(.*?\)\s*/g, "").trim();
  }

  const bg = ctx.createLinearGradient(0, 0, 0, 1920);
  bg.addColorStop(0, "#050510");
  bg.addColorStop(0.45, "#000000");
  bg.addColorStop(1, "#160014");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.strokeStyle = "#ec008c";
  ctx.lineWidth = 10;
  ctx.shadowColor = "#ec008c";
  ctx.shadowBlur = 26;
  ctx.strokeRect(28, 28, 1024, 1864);
  ctx.shadowBlur = 0;

  for (let i = 0; i < 65; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#ec008c" : "#ffd000";
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(
      Math.random() * 1080,
      Math.random() * 1920,
      Math.random() * 3 + 1,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  try {
    const logo = await cargarImagen("/logo-santa.png");
    ctx.drawImage(logo, 65, 65, 180, 180);
  } catch {}

  try {
    const fifaLogo = await cargarImagen("/fifa-logo.png");
    ctx.drawImage(fifaLogo, 805, 50, 210, 210);
  } catch {}

  ctx.textAlign = "center";

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 78px Arial";
  ctx.fillText("QUINIELA", 500, 125);

  ctx.fillStyle = "#ec008c";
  ctx.font = "900 78px Arial";
  ctx.fillText("SC", 760, 125);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 39px Arial";
  ctx.fillText("★ RANKING OFICIAL ★", 540, 220);

  // Cuadro Jornada
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.strokeStyle = "#ffd000";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#ffd000";
  ctx.shadowBlur = 15;
  roundRect(ctx, 320, 250, 440, 82, 22);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#ffd000";
  ctx.font = "900 52px Arial";
  ctx.fillText(`${jornadaId.replace("jornada-", "Jornada ")} 🏆`, 540, 307);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 145px Arial";
  ctx.shadowColor = "#ec008c";
  ctx.shadowBlur = 25;
  ctx.fillText("TOP", 420, 500);

  ctx.fillStyle = "#ffd000";
  ctx.font = "900 160px Arial";
  ctx.fillText("5", 715, 500);
  ctx.shadowBlur = 0;

  const startY = 585;
  const rowH = 178;

  top5.forEach((item, index) => {
    const y = startY + index * rowH;

    const rowGrad = ctx.createLinearGradient(70, y, 1010, y + 145);

    if (index === 0) {
      rowGrad.addColorStop(0, "rgba(255,208,0,0.34)");
      rowGrad.addColorStop(1, "rgba(0,0,0,0.88)");
    } else if (index === 1) {
      rowGrad.addColorStop(0, "rgba(210,210,210,0.28)");
      rowGrad.addColorStop(1, "rgba(0,0,0,0.88)");
    } else if (index === 2) {
      rowGrad.addColorStop(0, "rgba(205,127,50,0.28)");
      rowGrad.addColorStop(1, "rgba(0,0,0,0.88)");
    } else {
      rowGrad.addColorStop(0, "rgba(0,0,0,0.88)");
      rowGrad.addColorStop(1, "rgba(25,0,20,0.90)");
    }

    ctx.fillStyle = rowGrad;
    ctx.strokeStyle = index <= 2 ? "#ffd000" : "#ec008c";
    ctx.lineWidth = 5;
    ctx.shadowColor = index <= 2 ? "#ffd000" : "#ec008c";
    ctx.shadowBlur = 12;
    roundRect(ctx, 70, y, 940, 145, 30);
    ctx.shadowBlur = 0;

    ctx.textAlign = "center";
    ctx.font = "900 66px Arial";

    const medalla =
      index === 0
        ? "🥇"
        : index === 1
        ? "🥈"
        : index === 2
        ? "🥉"
        : `${index + 1}°`;

    ctx.fillStyle = "#ffffff";
    ctx.fillText(medalla, 145, y + 92);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 50px Arial";

    const limpio = nombreCorto(item.nombre);
    const nombre = limpio.length > 24 ? limpio.slice(0, 24) + "…" : limpio;

    ctx.fillText(nombre, 250, y + 68);

    if (index === 0) {
      ctx.fillStyle = "#ffd000";
      ctx.font = "900 30px Arial";
      ctx.fillText("LÍDER ACTUAL ⭐", 250, y + 112);
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#ec008c";
    ctx.lineWidth = 5;
    ctx.shadowColor = "#ec008c";
    ctx.shadowBlur = 18;
    roundRect(ctx, 820, y + 25, 150, 100, 28);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 62px Arial";
    ctx.fillText(String(item.puntos), 895, y + 82);

    ctx.fillStyle = "#ec008c";
    ctx.font = "900 26px Arial";
    ctx.fillText("PTS", 895, y + 112);
  });

  const qr = await QRCode.toDataURL(appUrl, { width: 280, margin: 1 });
  const qrImg = await cargarImagen(qr);

  ctx.strokeStyle = "#ec008c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(70, 1495);
  ctx.lineTo(1010, 1495);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 54px Arial";
  ctx.fillText("ESCANEA Y ENTRA", 90, 1580);

  ctx.fillStyle = "#ffd000";
  ctx.font = "900 48px Arial";
  ctx.fillText("A LA APP", 90, 1640);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 30px Arial";
  ctx.fillText("Revisa la tabla completa,", 90, 1695);
  ctx.fillText("tu quiniela y más.", 90, 1735);

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "#ec008c";
  ctx.shadowBlur = 20;
  ctx.fillRect(735, 1540, 260, 260);
  ctx.shadowBlur = 0;
  ctx.drawImage(qrImg, 748, 1553, 234, 234);

  // Sin texto abajo para no tapar ni saturar
  const dataUrl = canvas.toDataURL("image/png");
  setImagenGenerada(dataUrl);

  setTimeout(() => {
    document
      .getElementById("imagen-generada")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300);

  setGenerando(false);
}

  async function compartirImagen() {
    if (!imagenGenerada) {
      await generarFlyer();
      return;
    }

    const blob = await (await fetch(imagenGenerada)).blob();
    const file = new File([blob], `ranking-${jornadaId}.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "Ranking Quiniela SC",
        text: "🏆 Ranking oficial Quiniela SC",
        files: [file],
      });
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">
        Cargando flyer...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-6">
      <div className="flex flex-col gap-3 mb-5">
        <button
          onClick={generarFlyer}
          disabled={generando}
          className="bg-pink-600 hover:bg-pink-500 disabled:bg-gray-700 px-6 py-3 rounded-2xl font-black text-lg"
        >
          {generando ? "⏳ Generando..." : "🎨 Generar flyer"}
        </button>

        {imagenGenerada && (
          <button
            onClick={compartirImagen}
            className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-2xl font-black text-lg"
          >
            📲 Compartir imagen
          </button>
        )}
      </div>

      <div className="w-full max-w-[430px] rounded-[32px] border-4 border-pink-500 bg-gradient-to-b from-gray-950 via-black to-gray-950 overflow-hidden shadow-2xl shadow-pink-500/40">
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
          <p className="text-yellow-300 font-black text-xl mt-2">
            {jornadaId.replace("jornada-", "Jornada ")} 🏆
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Ranking oficial · Mundial 2026
          </p>
        </div>

        <div className="px-5 mt-6 space-y-3 pb-6">
          {top5.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-pink-500 p-4 flex items-center justify-between bg-black/70"
            >
              <div>
                <p className="font-black text-xl">
                  {index + 1}. {item.nombre}
                </p>
                {index === 0 && (
                  <p className="text-yellow-300 text-sm font-bold">
                    Líder actual
                  </p>
                )}
              </div>

              <div className="min-w-16 h-16 rounded-full border-2 border-pink-500 flex items-center justify-center bg-black">
                <span className="text-pink-400 text-2xl font-black">
                  {item.puntos}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {imagenGenerada && (
        <div
          id="imagen-generada"
          className="mt-8 w-full max-w-[430px] border border-green-500 rounded-3xl p-4 bg-green-500/10"
        >
          <p className="text-green-400 font-black text-center mb-3">
            ✅ Flyer generado. Mantén presionado para guardar o compartir.
          </p>
          <img
            src={imagenGenerada}
            alt="Ranking generado"
            className="w-full rounded-2xl border border-green-500"
          />
        </div>
      )}
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