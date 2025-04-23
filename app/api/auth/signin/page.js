"use client";

import { signIn } from "next-auth/react"; // Importăm funcția de autentificare

export default function SignInPage() {
  const handleLogin = () => {
    signIn("google"); // Se folosește Google pentru autentificare (poți folosi alt provider)
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Autentificare</h1>
      <button
        onClick={handleLogin}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        Autentifică-te cu Google
      </button>
    </div>
  );
}
