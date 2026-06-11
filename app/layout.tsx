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
        <nav className="sticky top-0 z-50 bg-black/95 border-b border-pink-500 px-4 py-4">
  <div className="max-w-7xl mx-auto flex flex-col gap-4">
    <Link
      href="/tabla"
      className="flex items-center justify-center gap-3 text-3xl font-black"
    >
      <span>🏆</span>
      <span>
        QUINIELA <span className="text-pink-500">SC</span>
      </span>
    </Link>

    <div className="flex justify-center gap-6 text-base font-bold">
      <Link href="/mi-quiniela" className="hover:text-pink-400">
        Mi Quiniela
      </Link>

      <Link href="/quinielas" className="hover:text-pink-400">
        Quinielas
      </Link>

      <Link href="/tabla" className="hover:text-pink-400">
        Tabla
      </Link>

      <Link href="/admin" className="text-yellow-400 hover:text-yellow-300">
        Admin
      </Link>
    </div>
  </div>
</nav>

        {children}
      </body>
    </html>
  );
}