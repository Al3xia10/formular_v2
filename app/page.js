"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRPage() {
  const [token, setToken] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  // Generează token QR zilnic, determinist, local
  useEffect(() => {
    function getDailyToken(dateString) {
      const base = dateString + "ALEXYA2024_QRCHECK"; // folosește un salt fix pentru stabilitate
      let hash = 0;
      for (let i = 0; i < base.length; i++) {
        hash = base.charCodeAt(i) + ((hash << 5) - hash);
      }
      const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
      return code;
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const dailyToken = getDailyToken(today);
    setToken(dailyToken);
    const isProd = process.env.NODE_ENV === "production";
    const origin = isProd
      ? "https://formular-v2.vercel.app"
      : "http://localhost:3000";
    const qrLink = `${origin}/scan?token=${encodeURIComponent(dailyToken)}`;
    QRCode.toDataURL(qrLink).then(setQrUrl);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black p-4">
      <h1 className="text-2xl font-bold mb-6">Cod QR pentru ziua de azi</h1>
      {qrUrl ? (
        <img src={qrUrl} alt="QR" className="w-64 h-64 mb-4" />
      ) : (
        <p>Se generează codul QR...</p>
      )}
      <p className="text-xl text-gray-700">
        Cod: <strong>{token}</strong>
      </p>
    </div>
  );
}
