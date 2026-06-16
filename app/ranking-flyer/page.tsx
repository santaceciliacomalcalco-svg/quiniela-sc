"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getJornadaId } from "../lib/jornada";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";

type Participante = { id: string; nombre: string };
type Quiniela = { id: string; participanteId: string; selecciones?: Record<string, string> };
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
        const participantesSnap = await getDocs(collection(db, "jornadas", jornadaId, "participantes"));
        const quinielasSnap = await getDocs(collection(db, "jornadas", jornadaId, "quinielas"));
        const resultadosSnap = await getDoc(doc(db, "jornadas", jornadaId, "configuracion", "resultados"));

        setParticipantes(participantesSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Participante[]);
        setQuinielas(quinielasSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Quiniela[]);
        setResultados(resultadosSnap.exists() ? (resultadosSnap.data() as Resultado) : {});
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [jornadaId]);

  const top5 = useMemo(() => {
    return participantes
      .map((participante) => {
        const quiniela = quinielas.find((q) => q.participanteId === participante.id);
        let puntos = 0;

        if (quiniela?.selecciones && resultados?.resultados) {
          Object.entries(resultados.resultados).forEach(([partidoId, resultado]) => {
            if (quiniela.selecciones?.[partidoId] === resultado) puntos += 1;
          });
        }

        return { id: participante.id, nombre: participante.nombre, puntos };
      })
      .sort((a, b) => (b.puntos !== a.puntos ? b.puntos - a.puntos : a.nombre.localeCompare(b.nombre, "es")))
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

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

    ctx.fillStyle = "#020205";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grad = ctx.createLinearGradient(0, 0, 0, 1920);
    grad.addColorStop(0, "#080812");
    grad.addColorStop(0.5, "#000000");
    grad.addColorStop(1, "#100010");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.strokeStyle = "#ec008c";
    ctx.lineWidth = 8;
    ctx.strokeRect(25, 25, 1030, 1870);

    try {
      const logo = await cargarImagen("/logo-santa.png");
      ctx.drawImage(logo, 440, 80, 200, 200);
    } catch {}

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 95px Arial";
    ctx.fillText("TOP 5", 540, 390);

    ctx.fillStyle = "#ec008c";
    ctx.font = "900 80px Arial";
    ctx.fillText("QUINIELA SC", 540, 485);

    ctx.fillStyle = "#ffd000";
    ctx.font = "900 48px Arial";
    ctx.fillText(`${jornadaId.replace("jornada-", "Jornada ")} 🏆`, 540, 555);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "700 34px Arial";
    ctx.fillText("Ranking oficial · Mundial 2026", 540, 610);

    const startY = 690;
    const rowH = 170;

    top5.forEach((item, index) => {
      const y = startY + index * rowH;

      if (index === 0) ctx.fillStyle = "rgba(255, 208, 0, 0.16)";
      else if (index === 1) ctx.fillStyle = "rgba(180, 180, 180, 0.14)";
      else if (index === 2) ctx.fillStyle = "rgba(205, 127, 50, 0.14)";
      else ctx.fillStyle = "rgba(0,0,0,0.72)";

      ctx.strokeStyle = index <= 2 ? "#ffd000" : "#ec008c";
      ctx.lineWidth = 4;
      roundRect(ctx, 70, y, 940, 135, 28);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 62px Arial";
      const medalla = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}°`;
      ctx.fillText(medalla, 145, y + 88);

      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 52px Arial";
      const nombre = item.nombre.length > 18 ? item.nombre.slice(0, 18) + "…" : item.nombre;
      ctx.fillText(nombre, 245, y + 70);

      if (index === 0) {
        ctx.fillStyle = "#ffd000";
        ctx.font = "800 30px Arial";
        ctx.fillText("LÍDER ACTUAL", 245, y + 108);
      }

      ctx.textAlign = "center";
      ctx.strokeStyle = "#ec008c";
      ctx.fillStyle = "#000000";
      roundRect(ctx, 830, y + 25, 130, 88, 24);

      ctx.fillStyle = "#ec008c";
      ctx.font = "900 58px Arial";
      ctx.fillText(String(item.puntos), 895, y + 84);

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 25px Arial";
      ctx.fillText("PTS", 895, y + 110);
    });

    const qr = await QRCode.toDataURL(appUrl, { width: 260, margin: 1 });
    const qrImg = await cargarImagen(qr);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ec008c";
    ctx.font = "900 45px Arial";
    ctx.fillText("ESCANEA Y ENTRA", 90, 1630);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 34px Arial";
    ctx.fillText("Revisa la tabla completa en la app.", 90, 1685);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(745, 1530, 250, 250);
    ctx.drawImage(qrImg, 755, 1540, 230, 230);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd000";
    ctx.font = "900 38px Arial";
    ctx.fillText("QUINIELA SC · Santa Cecilia FC", 540, 1840);

    const dataUrl = canvas.toDataURL("image/png");
    setImagenGenerada(dataUrl);

    setTimeout(() => {
      document.getElementById("imagen-generada")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);

    setGenerando(false);
  }

  async function compartirImagen() {
    if (!imagenGenerada) {
      await generarFlyer();
      return;
    }

    const blob = await (await fetch(imagenGenerada)).blob();
    const file = new File([blob], `ranking-${jornadaId}.png`, { type: "image/png" });

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
          <img src="/logo-santa.png" alt="Santa Cecilia" className="w-24 h-24 mx-auto mb-3" />
          <h1 className="text-4xl font-black leading-tight">TOP 5</h1>
          <h2 className="text-3xl font-black text-pink-500 leading-tight">QUINIELA SC</h2>
          <p className="text-yellow-300 font-black text-xl mt-2">{jornadaId.replace("jornada-", "Jornada ")} 🏆</p>
          <p className="text-gray-400 text-sm mt-1">Ranking oficial · Mundial 2026</p>
        </div>

        <div className="px-5 mt-6 space-y-3 pb-6">
          {top5.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-pink-500 p-4 flex items-center justify-between bg-black/70">
              <div>
                <p className="font-black text-xl">{index + 1}. {item.nombre}</p>
                {index === 0 && <p className="text-yellow-300 text-sm font-bold">Líder actual</p>}
              </div>

              <div className="min-w-16 h-16 rounded-full border-2 border-pink-500 flex items-center justify-center bg-black">
                <span className="text-pink-400 text-2xl font-black">{item.puntos}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {imagenGenerada && (
        <div id="imagen-generada" className="mt-8 w-full max-w-[430px] border border-green-500 rounded-3xl p-4 bg-green-500/10">
          <p className="text-green-400 font-black text-center mb-3">
            ✅ Flyer generado. Mantén presionado para guardar o compartir.
          </p>
          <img src={imagenGenerada} alt="Ranking generado" className="w-full rounded-2xl border border-green-500" />
        </div>
      )}
    </main>
  );
}

export default function RankingFlyerPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black text-pink-400 flex items-center justify-center font-bold">Cargando flyer...</main>}>
      <RankingFlyerContent />
    </Suspense>
  );
}