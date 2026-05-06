"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const callbackUrlFromParams = searchParams.get("callbackUrl");

  const handleLogin = () => {
    const baseUrl = "/scan";
    const callbackUrl = callbackUrlFromParams
      ? callbackUrlFromParams
      : token
        ? `${baseUrl}?token=${encodeURIComponent(token)}`
        : baseUrl;

    signIn("google", { callbackUrl });
  };

  return (
    <main className="min-h-screen bg-[#fffaf4] px-4 py-8 text-[#2f2a25] sm:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-2xl shadow-orange-100/80">
          <div className="bg-gradient-to-br from-orange-500 to-rose-400 px-6 py-8 text-white">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/80">
              formular prezență
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight">
              Autentificare necesară
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/90">
              Conectează-te cu emailul tău Google pentru a continua către
              formular.
            </p>
          </div>

          <div className="p-6 sm:p-7">
            <div className="rounded-[1.5rem] bg-[#fffaf4] p-4 ring-1 ring-orange-100">
              <p className="text-sm font-bold text-[#4a3b33]">
                Acces securizat
              </p>
              <p className="mt-1 text-sm leading-6 text-[#806d62]">
                Autentificarea ne ajută să asociem prezența cu emailul corect și
                să păstrăm formularul protejat.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              style={{ backgroundColor: "#ff7a1a", color: "#ffffff" }}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-[1.75rem] px-5 text-sm font-black shadow-lg shadow-orange-200 transition hover:opacity-90"
            >
              Autentificare cu Google
            </button>

            <p className="mt-4 text-center text-xs font-semibold leading-5 text-[#806d62]">
              După autentificare, vei fi redirecționat automat înapoi în
              aplicație.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#fffaf4] px-4 text-[#2f2a25]">
          <div className="rounded-[1.75rem] bg-white px-6 py-4 text-sm font-black shadow-xl shadow-orange-100">
            Se încarcă...
          </div>
        </main>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
