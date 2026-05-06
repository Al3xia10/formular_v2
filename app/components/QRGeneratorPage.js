"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

export default function QRGeneratorPage() {
  const [qrUrl, setQrUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadQrToken() {
      try {
        setError("");
        const response = await fetch("/api/qr-token", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Nu am putut genera codul QR.");
        }

        const nextQrUrl = await QRCode.toDataURL(data.qrLink);

        if (!isMounted) {
          return;
        }

        setQrUrl(nextQrUrl);
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      }
    }

    loadQrToken();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#fffaf4] px-4 py-8 text-[#2f2a25]">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-orange-100 bg-white p-8 text-center shadow-2xl shadow-orange-100/60">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
            sesiune activa
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Cod QR pentru prezenta
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#806d62]">
            Afiseaza acest cod studentilor. Codul ramane valabil pana cand
            generezi unul nou.
          </p>

          <div className="mt-8 flex justify-center">
            {error ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-5 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : qrUrl ? (
              <div className="rounded-[2rem] border border-[#f4dfcb] bg-[#fffaf4] p-5 shadow-lg shadow-orange-50">
                <Image
                  src={qrUrl}
                  alt="QR pentru prezenta"
                  width={320}
                  height={320}
                  unoptimized
                  className="h-72 w-72 sm:h-80 sm:w-80"
                />
              </div>
            ) : (
              <p className="text-sm font-semibold text-[#806d62]">
                Se genereaza codul QR...
              </p>
            )}
          </div>

        </div>
      </section>
    </main>
  );
}
