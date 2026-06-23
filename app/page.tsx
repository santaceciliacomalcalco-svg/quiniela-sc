"use client";

import Link from "next/link";
import { useState } from "react";

const numeroTarjeta = "4152314480160061";

const jornadas = [
{
  id: "jornada-1",
  numero: "1",
  nombre: "Jornada 1",
  flyer: "/jornada-1.jpg",
  estado: "curso",
  etiqueta: "En curso",
  cierre: "Cerró: 11 de junio · 1:00 PM",
},
{
  id: "jornada-2",
  numero: "2",
  nombre: "Jornada 2",
  flyer: "/jornada-2.jpg",
  estado: "venta",
  etiqueta: "En venta",
  cierre: "Cierra: 18 de junio · 10:00 AM",
},
{
  id: "jornada-3",
  numero: "3",
  nombre: "Jornada 3",
  flyer: "/jornada-3.jpg",
  estado: "venta",
  etiqueta: "En venta",
  cierre: "Cierra: 24 de junio · 1:00 PM",
}, 
];

function estilosEstado(estado: string) {
  if (
    estado === "curso" ||
    estado === "cerrada" ||
    estado === "finalizada"
  ) {
    return {
      card: "border-yellow-400 bg-yellow-950/10 shadow-yellow-500/20",
      textoEstado: "text-yellow-300",
      boton: "bg-gray-800 text-gray-500 cursor-not-allowed",
      iconoEstado: "🔒",
    };
  }

  return {
    card: "border-green-500 bg-green-950/20 shadow-green-500/20",
    textoEstado: "text-green-400",
    boton: "bg-pink-600 hover:bg-pink-500 text-white",
    iconoEstado: "🟢",
  };
}

export default function Home() {
  const [copiado, setCopiado] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);

  async function copiarTarjeta() {
    await navigator.clipboard.writeText(numeroTarjeta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <main className="min-h-screen bg-black text-white px-4 py-4">
      <section className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black mb-4 flex items-center justify-center gap-3 whitespace-nowrap">
            <span>
              QUINIELA <span className="text-pink-500">SC</span>
            </span>
            <span>🏆</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400">
            Elige la jornada para meter tu quiniela, ver tabla o revisar registros.
          </p>

          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-pink-400 text-3xl md:text-4xl font-black">
              Mundial 2026
            </p>
            <img
              src="/fifa-logo.png"
              alt="FIFA"
              className="h-24 w-24 md:h-32 md:w-32 object-contain"
            />
          </div>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <button
            onClick={() => setMostrarPago(!mostrarPago)}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black text-base md:text-lg rounded-3xl px-6 py-4 transition-all shadow-lg shadow-yellow-500/10"
          >
            💳 Datos de pago y activación
          </button>

          {mostrarPago && (
            <div className="w-full border border-yellow-400 bg-yellow-500/10 rounded-3xl p-5 mt-4 text-center">
              <h2 className="text-3xl font-black text-yellow-300 mb-4">
                💳 Datos de pago
              </h2>

              <div className="grid md:grid-cols-2 gap-4 text-left mb-5">
                <div className="bg-black/40 rounded-2xl p-4 border border-yellow-400/30">
                  <p className="text-gray-400 text-sm font-bold">Banco</p>
                  <p className="text-white font-black text-lg">BBVA Bancomer</p>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 border border-yellow-400/30">
                  <p className="text-gray-400 text-sm font-bold">Titular</p>
                  <p className="text-pink-400 font-black text-lg">
                    Pablo Emiliano Magaña García
                  </p>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 border border-yellow-400/30 md:col-span-2">
                  <p className="text-gray-400 text-sm font-bold mb-2">
                    Número de tarjeta
                  </p>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <p className="text-xl md:text-3xl font-black tracking-widest">
                      4152 3144 8016 0061
                    </p>

                    <button
                      onClick={copiarTarjeta}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-xl px-5 py-3"
                    >
                      {copiado ? "✅ Copiado" : "📋 Copiar"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-5">
                <div className="bg-black/40 rounded-2xl p-4 border border-yellow-400/30">
                  <p className="text-yellow-300 text-2xl font-black">
                    💰 $100 MXN
                  </p>
                  <p className="text-gray-300 font-bold">por quiniela</p>
                </div>

                <div className="bg-black/40 rounded-2xl p-4 border border-yellow-400/30">
                  <p className="text-gray-300 font-bold">
                    Concepto: Tu nombre + apellido
                  </p>
                  <p className="text-green-400 font-bold">
                    Ejemplo: Javier Torres
                  </p>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500 rounded-2xl p-4 mb-5">
                <p className="text-gray-200 font-bold">
                  📲 Envía tu comprobante por WhatsApp.
                </p>
                <p className="text-green-400 font-black">
                  ✅ Una vez validado el pago podrás llenar tu quiniela en la app.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="https://wa.me/529332085158?text=Hola%2C%20ya%20realic%C3%A9%20el%20pago%20de%20mi%20quiniela.%20Te%20env%C3%ADo%20mi%20comprobante."
                  target="_blank"
                  className="bg-green-600 hover:bg-green-500 rounded-2xl py-4 font-black text-lg"
                >
                  📲 9332085158
                </a>

                <a
                  href="https://wa.me/529331840125?text=Hola%2C%20ya%20realic%C3%A9%20el%20pago%20de%20mi%20quiniela.%20Te%20env%C3%ADo%20mi%20comprobante."
                  target="_blank"
                  className="bg-green-600 hover:bg-green-500 rounded-2xl py-4 font-black text-lg"
                >
                  📲 9331840125
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4">
          {jornadas.map((jornada) => {
            const estilos = estilosEstado(jornada.estado);
            const cerrada =
  jornada.estado === "cerrada" ||
  jornada.estado === "curso" ||
  jornada.estado === "finalizada";

            return (
              <div
                key={jornada.id}
                className={`border rounded-3xl p-5 shadow-xl ${estilos.card}`}
              >
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-pink-600 flex items-center justify-center font-black text-2xl">
                      {jornada.numero}
                    </div>

                    <div>
                      <h3 className="text-3xl font-black leading-none">
                        {jornada.nombre}
                      </h3>

                      <p className="text-yellow-300 font-bold text-sm mt-2">
                        ⏰ {jornada.cierre}
                      </p>
                    </div>
                  </div>

                  <img
                    src="/fifa-logo.png"
                    alt="FIFA"
                    className="h-24 w-24 object-contain"
                  />
                </div>

                <div className="flex justify-center mb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{estilos.iconoEstado}</span>

                    <span
                      className={`text-xl font-black tracking-wide ${estilos.textoEstado}`}
                    >
                      {jornada.etiqueta}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <Link
                    href={jornada.flyer}
                    target="_blank"
                    className="border border-blue-500 text-blue-300 text-center rounded-xl py-3 font-bold hover:bg-blue-600 hover:text-white transition-all"
                  >
                    📄 Flyer
                  </Link>

                  <Link
                    href={`/tabla?jornada=${jornada.id}`}
                    className="border border-yellow-400 text-yellow-300 text-center rounded-xl py-3 font-bold hover:bg-yellow-500 hover:text-black transition-all"
                  >
                    🏆 Tabla
                  </Link>

                  <Link
                    href={`/quinielas?jornada=${jornada.id}`}
                    className="border border-pink-500 text-center rounded-xl py-3 font-bold hover:bg-pink-500 transition-all"
                  >
                    👥 Quin
                  </Link>
                </div>

                {cerrada ? (
                  <div
                    className={`text-center rounded-xl py-3 font-black ${estilos.boton}`}
                  >
                    🔒 Registro Cerrado
                  </div>
                ) : (
                  <Link
                    href={`/mi-quiniela?jornada=${jornada.id}`}
                    className={`block text-center rounded-xl py-3 font-black transition-all ${estilos.boton}`}
                  >
                    ⚽ Meter Quiniela
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}