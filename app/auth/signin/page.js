"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const handleLogin = () => {
    const callback = token
      ? `/scan?token=${encodeURIComponent(token)}`
      : "/scan";
    signIn("google", { callbackUrl: callback });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">Autentificare necesară</h1>
        <p className="mb-4 text-gray-700">
          Folosește emailul instituțional pentru a continua.
        </p>
        <button
          onClick={handleLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Autentificare cu Google
        </button>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Se încarcă...</div>}>
      <SignInContent />
    </Suspense>
  );
}
