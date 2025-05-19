"use client";
import { useSession, signIn } from "next-auth/react";
import { useState } from "react";

export default function ScanPage() {
  const { data: session, status } = useSession();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePoza = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // comprimare poză
      const compressedFile = await compressImage(file);
      setPoza(compressedFile);
      setError(null);
    }
  };

  // funcție pentru comprimare imagine
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxWidth = 800;
          const scaleSize = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleSize;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            },
            "image/jpeg",
            0.7
          );
        };
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!poza) {
      setError("Te rugăm să faci o poză în clasă.");
      return;
    }
    setLoading(true);
    const formDataToSend = new FormData();
    formDataToSend.append("email", session.user.email);
    for (let key in formData) {
      formDataToSend.append(key, formData[key]);
    }
    formDataToSend.append("poza", poza);

    try {
      const raspuns = await fetch("/api/submit", {
        method: "POST",
        body: formDataToSend,
      });
      const raspunsData = await raspuns.json();
      if (raspuns.ok) {
        setTrimis(true);
        setError(null);
        // ** NU RESETĂM FORMULARUL **
      } else {
        throw new Error(
          raspunsData.error || "A apărut o eroare la trimiterea prezenței"
        );
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
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
            name="nume"
            value={formData.nume}
            onChange={handleChange}
            required
            placeholder="Nume complet"
            className="border px-3 py-2 rounded-md"
          />
          <input
            name="grupa"
            value={formData.grupa}
            onChange={handleChange}
            required
            placeholder="Grupă"
            className="border px-3 py-2 rounded-md"
          />
          <input
            name="an"
            value={formData.an}
            onChange={handleChange}
            required
            placeholder="An"
            className="border px-3 py-2 rounded-md"
          />
          <input
            name="serie"
            value={formData.serie}
            onChange={handleChange}
            required
            placeholder="Seria"
            className="border px-3 py-2 rounded-md"
          />
          <select
            name="disciplina"
            value={formData.disciplina}
            onChange={handleChange}
            required
            className="border px-3 py-2 rounded-md"
          >
            <option value="">Selectează disciplina</option>
            <option value="Fiabilitate">Fiabilitate</option>
            <option value="TMI I">TMI I</option>
            <option value="TMI II">TMI II</option>
            <option value="Automatizari">Automatizari</option>
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
            className="border px-3 py-2 rounded-md"
          >
            <option value="">Selectează tipul disciplinei</option>
            <option value="Curs">Curs</option>
            <option value="Seminar">Seminar</option>
            <option value="Laborator">Laborator</option>
          </select>

          <label
            htmlFor="poza"
            className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-md inline-block text-center hover:bg-blue-700"
          >
            Faceți o poză din sala de curs
          </label>
          <input
            type="file"
            id="poza"
            name="poza"
            accept="image/*"
            capture="environment"
            onChange={handlePoza}
            className="hidden"
            required
          />
          {poza && (
            <p className="mt-1 text-sm text-gray-700">
              Fișier selectat: <strong>{poza.name}</strong>
            </p>
          )}

          <button
            className="bg-green-600 text-white px-4 py-2 rounded-md mt-4"
            disabled={loading}
          >
            {loading ? "Se trimite..." : "Trimite prezența"}
          </button>
        </form>
      )}
      {error && <p className="text-red-600 font-semibold mt-4">{error}</p>}
    </div>
  );
}
