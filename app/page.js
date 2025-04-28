"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function HomePage() {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const url = "https://formular-v2.vercel.app/scan"; // Adresa unde se află formularul de prezență
    QRCode.toDataURL(url)
      .then((generatedUrl) => setQrCodeUrl(generatedUrl))
      .catch((err) => console.error("Eroare generare QR:", err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-6">
      <h1 className="text-3xl font-bold mb-4 text-center">
        Scanează codul QR pentru a completa prezența
      </h1>

      {qrCodeUrl ? (
        <img src={qrCodeUrl} alt="Cod QR prezență" className="w-64 h-64" />
      ) : (
        <p>Se generează codul QR...</p>
      )}
    </div>
  );
}
