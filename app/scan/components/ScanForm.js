"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function ScanForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const rawToken = searchParams.get("token");

    // Suport fallback pentru cazuri când tokenul e trimis ca state=token%3DXYZ
    const stateParam = searchParams.get("state");
    const extractedToken = stateParam?.startsWith("token=")
      ? decodeURIComponent(stateParam.split("token=")[1])
      : null;

    const tokenFromQuery = rawToken || extractedToken;

    if (tokenFromQuery) {
      sessionStorage.setItem("qrToken", tokenFromQuery);
      localStorage.setItem("qrToken", tokenFromQuery);
      setQrToken(tokenFromQuery);
      console.log("🔐 Token detectat din URL sau state:", tokenFromQuery);
    } else {
      const savedToken = sessionStorage.getItem("qrToken");
      if (savedToken) {
        setQrToken(savedToken);
        console.log("💾 Token din sessionStorage:", savedToken);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      const savedToken =
        searchParams.get("token") || localStorage.getItem("qrToken");

      // Salvează tokenul în session/local storage dacă nu e deja salvat
      if (savedToken) {
        sessionStorage.setItem("qrToken", savedToken);
        localStorage.setItem("qrToken", savedToken);
      }

      const callback = savedToken
        ? `/scan?token=${encodeURIComponent(savedToken)}`
        : `/scan`;

      // ...existing code...
      if (!sessionStorage.getItem("redirectedToLogin")) {
        sessionStorage.setItem("redirectedToLogin", "true");
        router.replace(
          `/auth/signin?callbackUrl=${encodeURIComponent(callback)}`,
        );
      }
      // ...existing code...
    }

    if (status === "authenticated") {
      const hasTokenInUrl = !!searchParams.get("token");
      const savedToken = sessionStorage.getItem("qrToken");

      if (!hasTokenInUrl && savedToken) {
        router.replace(`/scan?token=${encodeURIComponent(savedToken)}`);
      }

      sessionStorage.removeItem("redirectedToLogin");
    }
  }, [status, searchParams]);

  const [formData, setFormData] = useState({
    nume: "",
    grupa: "",
    an: "",
    serie: "",
    disciplina: "",
    tipDisciplina: "",
  });
  const [poza, setPoza] = useState(null);
  const [trimis, setTrimis] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const compressImage = (
    file,
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
  ) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        image.src = e.target.result;
        image.onload = () => {
          let width = image.width;
          let height = image.height;

          if (width > height && width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          } else if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error("Compression failed"));
              }
            },
            file.type,
            quality,
          );
        };
        image.onerror = () => reject(new Error("Image load error"));
      };

      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  };

  const handlePoza = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setPoza(compressed);
        setError(null);
      } catch {
        setPoza(file);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!poza) {
      setError("Te rugăm să faci o poză în clasă.");
      return;
    }

    if (!qrToken) {
      setError(
        "Tokenul QR lipseste din link. Te rugăm să scanezi din nou codul.",
      );
      return;
    }

    setLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append("email", session?.user?.email || "");
    Object.keys(formData).forEach((key) =>
      formDataToSend.append(key, formData[key]),
    );
    formDataToSend.append("poza", poza);
    formDataToSend.append("qrToken", qrToken);

    try {
      const raspuns = await fetch("/api/submit", {
        method: "POST",
        body: formDataToSend,
      });
      const raspunsData = await raspuns.json();

      if (raspuns.ok) {
        setTrimis(true);
        setFormData({
          nume: "",
          grupa: "",
          an: "",
          serie: "",
          disciplina: "",
          tipDisciplina: "",
        });
        setPoza(null);
        setError(null);
      } else {
        throw new Error(
          raspunsData.error || "A apărut o eroare la trimiterea prezenței",
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <p className="text-center">Se încarcă...</p>;
  if (status !== "authenticated") return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">
        Salut{session?.user?.name ? `, ${session.user.name}` : ""}
      </h1>
      {!trimis && (
        <button
          onClick={() => signOut()}
          className="text-m text-blue-600 underline mb-6"
        >
          Deloghează-te
        </button>
      )}

      {trimis ? (
        <div className="text-center text-green-600 font-semibold">
          Prezența ta a fost înregistrată! ✅
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="nume"
            value={formData.nume}
            onChange={handleChange}
            required
            placeholder="Nume complet"
            className="border px-3 py-2 rounded-md w-full"
            disabled={loading}
          />
          <input
            name="grupa"
            value={formData.grupa}
            onChange={handleChange}
            required
            placeholder="Grupă"
            className="border px-3 py-2 rounded-md w-full"
            disabled={loading}
          />
          <input
            name="an"
            value={formData.an}
            onChange={handleChange}
            required
            placeholder="An"
            className="border px-3 py-2 rounded-md w-full"
            disabled={loading}
          />
          <input
            name="serie"
            value={formData.serie}
            onChange={handleChange}
            required
            placeholder="Seria"
            className="border px-3 py-2 rounded-md w-full"
            disabled={loading}
          />
          <select
            name="disciplina"
            value={formData.disciplina}
            onChange={handleChange}
            required
            className="border px-3 py-2 rounded-md w-full"
            disabled={loading}
          >
            <option value="">Selectează disciplina</option>
            <option value="Fiabilitate">Fiabilitate</option>
            <option value="SEPC">SEPC</option>
            <option value="TMIE">TMIE</option>
            <option value="Automatizari I">Automatizari I</option>
            <option value="Automatizari II">Automatizari II</option>
            <option value="SDAI">SDAI</option>
            <option value="SDAE">SDAE</option>
            <option value="SSV">SSV</option>
            <option value="Analiza integrata a sistemelor de securitate">
              Analiza integrata a sistemelor de securitate
            </option>
            <option value="CMRA">CMRA</option>
          </select>
          <select
            name="tipDisciplina"
            value={formData.tipDisciplina}
            onChange={handleChange}
            required
            className="border px-3 py-2 rounded-md w-full"
            disabled={loading}
          >
            <option value="">Selectează tipul disciplinei</option>
            <option value="Curs">Curs</option>
            <option value="Seminar">Proiect</option>
            <option value="Laborator">Laborator</option>
          </select>

          <label
            htmlFor="poza"
            className={`cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md text-center hover:bg-blue-700 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {poza ? "Poză selectată ✅" : "Faceți o poză din sala de curs"}
          </label>
          <input
            type="file"
            id="poza"
            name="poza"
            accept="image/*"
            capture="environment"
            onChange={handlePoza}
            className="hidden"
            disabled={loading}
            required
          />

          <input type="hidden" name="qrToken" value={qrToken} />

          <button
            type="submit"
            disabled={loading}
            className={`bg-green-600 text-white px-4 py-2 rounded-md mt-4 flex items-center justify-center gap-2 ${
              loading ? "opacity-60 cursor-not-allowed" : "hover:bg-green-700"
            }`}
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {loading ? "Se trimite prezența..." : "Trimite prezența"}
          </button>
        </form>
      )}
      {error && <p className="text-red-600 mt-4 text-center">{error}</p>}
    </div>
  );
}
