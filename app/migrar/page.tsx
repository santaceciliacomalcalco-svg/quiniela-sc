"use client";

import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";

export default function MigrarPage() {
  const [mensaje, setMensaje] = useState("");

  async function migrarJornada1() {
    try {
      setMensaje("Migrando datos...");

      const participantesSnap = await getDocs(collection(db, "participantes"));

      for (const documento of participantesSnap.docs) {
        await setDoc(
          doc(db, "jornadas", "jornada-1", "participantes", documento.id),
          documento.data(),
          { merge: true }
        );
      }

      const quinielasSnap = await getDocs(collection(db, "quinielas"));

      for (const documento of quinielasSnap.docs) {
        await setDoc(
          doc(db, "jornadas", "jornada-1", "quinielas", documento.id),
          documento.data(),
          { merge: true }
        );
      }

      const resultadosSnap = await getDoc(doc(db, "configuracion", "resultados"));

      if (resultadosSnap.exists()) {
        await setDoc(
          doc(db, "jornadas", "jornada-1", "configuracion", "resultados"),
          resultadosSnap.data(),
          { merge: true }
        );
      }

      setMensaje("✅ Jornada 1 migrada correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error migrando datos. Revisa consola.");
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="border border-pink-500 rounded-3xl p-8 max-w-xl text-center">
        <h1 className="text-4xl font-black mb-4">Migrar Jornada 1</h1>

        <p className="text-gray-400 mb-6">
          Esto copiará participantes, quinielas y resultados viejos a jornada-1.
        </p>

        <button
          onClick={migrarJornada1}
          className="bg-pink-600 hover:bg-pink-500 px-8 py-4 rounded-2xl font-black text-xl"
        >
          Migrar datos a Jornada 1
        </button>

        {mensaje && (
          <p className="text-yellow-300 font-bold mt-6">{mensaje}</p>
        )}
      </div>
    </main>
  );
}