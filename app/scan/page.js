"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function ScanPage() {
  const { data: session, status } = useSession();
  const [nume, setNume] = useState("");
  const [trimis, setTrimis] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const raspuns = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, nume }),
    });
    if (raspuns.ok) setTrimis(true);
  };

  if (status === "loading") return <p>Se încarcă...</p>;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <h1 className="text-xl font-bold mb-4">
          Autentifică-te pentru a completa prezența
        </h1>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Autentificare cu Google
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">Salut, {session.user.name}</h1>
      {trimis ? (
        <p className="text-green-600 font-semibold">
          Prezența ta a fost înregistrată!
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full max-w-sm"
        >
          <input
            type="text"
            value={nume}
            onChange={(e) => setNume(e.target.value)}
            required
            placeholder="Nume complet"
            className="border px-3 py-2 rounded-md"
          />
          <button className="bg-green-600 text-white px-4 py-2 rounded-md">
            Trimite prezența
          </button>
        </form>
      )}
    </div>
  );
}
