"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  async function iniciarSesion() {
    try {
      await signInWithEmailAndPassword(
        auth,
        correo,
        password
      );

      router.push("/admin");
    } catch {
      setError("Correo o contraseña incorrectos");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md border border-pink-500 rounded-3xl p-8">
        <h1 className="text-3xl font-black mb-6 text-center">
          🔐 Login Admin
        </h1>

        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full mb-4 p-3 rounded-xl bg-gray-900"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded-xl bg-gray-900"
        />

        <button
          onClick={iniciarSesion}
          className="w-full bg-pink-600 py-3 rounded-xl font-bold"
        >
          Entrar
        </button>

        {error && (
          <p className="text-red-400 mt-4 text-center">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}