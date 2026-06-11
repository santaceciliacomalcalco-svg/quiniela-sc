import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <section className="max-w-4xl mx-auto text-center">
        <Image
          src="/logo-santa.png"
          alt="Santa Cecilia FC"
          width={180}
          height={180}
          className="mx-auto mb-6"
        />

        <h1 className="text-5xl font-black mb-4">
          Quiniela Santa Cecilia
        </h1>

        <p className="text-xl text-gray-400 mb-10">
          Mundial 2026 · Pronósticos, quinielas registradas y tabla general.
        </p>

        <div className="grid gap-4 max-w-md mx-auto">
          <Link
            href="/mi-quiniela"
            className="bg-pink-600 hover:bg-pink-500 rounded-2xl py-4 font-black text-xl"
          >
            ⚽ Mi Quiniela
          </Link>

          <Link
            href="/quinielas"
            className="border border-pink-500 rounded-2xl py-4 font-black text-xl"
          >
            👥 Ver Quinielas
          </Link>

          <Link
            href="/tabla"
            className="border border-yellow-400 text-yellow-300 rounded-2xl py-4 font-black text-xl"
          >
            🏆 Tabla General
          </Link>
        </div>
      </section>
    </main>
  );
}