import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Quiniela SC",
  description: "Plataforma de quinielas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-black text-white">
        <nav className="sticky top-0 z-50 bg-black/90 border-b border-pink-500 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-2xl font-black">
              🏆 QUINIELA <span className="text-pink-500">SC</span>
            </Link>

            <div className="flex gap-4 text-sm font-bold">
              <Link href="/mi-quiniela" className="hover:text-pink-400">Mi Quiniela</Link>
              <Link href="/quinielas" className="hover:text-pink-400">Quinielas</Link>
              <Link href="/tabla" className="hover:text-pink-400">Tabla</Link>
              <Link href="/admin" className="text-yellow-400 hover:text-yellow-300">Admin</Link>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}