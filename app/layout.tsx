import Link from "next/link";
import Image from "next/image";
import "./globals.css";

export const metadata = {
  title: "Quiniela SC",
  description: "Quiniela oficial de Santa Cecilia FC",

  manifest: "/manifest.json",

  icons: {
    icon: "/logo-santa.png",
    apple: "/logo-santa.png",
  },

  themeColor: "#ec008c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-black text-white">
        <nav className="sticky top-0 z-50 bg-black/95 border-b border-pink-500 px-4 py-4">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">

            <Link
              href="/tabla"
              className="flex items-center justify-center gap-3"
            >
              <Image
                src="/logo-santa.png"
                alt="Santa Cecilia FC"
                width={70}
                height={70}
              />

              <span className="text-3xl font-black">
                QUINIELA{" "}
                <span className="text-pink-500">SC</span>
                <span className="ml-2">🏆</span>
              </span>
            </Link>

            <div className="flex flex-col items-center gap-4">

              <Link
                href="/admin"
                className="text-sm font-bold text-yellow-400 border border-yellow-500 rounded-full px-5 py-2 hover:bg-yellow-500 hover:text-black transition"
              >
                🔒 Admin
              </Link>

              <div className="flex justify-center gap-3 flex-wrap">

                <Link
                  href="/mi-quiniela"
                  className="border border-pink-500 text-white font-bold rounded-full px-5 py-2 hover:bg-pink-500 transition"
                >
                  Mi Quiniela
                </Link>

                <Link
                  href="/quinielas"
                  className="border border-pink-500 text-white font-bold rounded-full px-5 py-2 hover:bg-pink-500 transition"
                >
                  Quinielas
                </Link>

                <Link
                  href="/tabla"
                  className="border border-pink-500 text-white font-bold rounded-full px-5 py-2 hover:bg-pink-500 transition"
                >
                  Tabla
                </Link>

              </div>

            </div>

          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}