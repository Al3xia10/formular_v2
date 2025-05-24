"use client";
import { useState } from "react";

export default function PrezentaPage() {
  const [formData, setFormData] = useState({
    nume: "",
    grupa: "",
    an: "",
    serie: "",
    disciplina: "",
    tipDisciplina: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trimis, setTrimis] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/save-prezenta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Eroare la trimiterea datelor.");

      setTrimis(true);
    } catch (err) {
      setError("A apărut o eroare. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  const resetFormular = () => {
    setFormData({
      nume: "",
      grupa: "",
      an: "",
      serie: "",
      disciplina: "",
      tipDisciplina: "",
    });
    setTrimis(false);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-green-700">
        Formular de Prezență
      </h1>

      {trimis ? (
        <div className="text-center space-y-4">
          <p className="text-green-600 text-lg font-medium">
            ✅ Prezența ta a fost înregistrată cu succes!
          </p>
          <button
            onClick={resetFormular}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Trimite altă prezență
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full max-w-sm bg-white p-6 rounded-lg shadow-md"
        >
          <input
            name="nume"
            value={formData.nume}
            onChange={handleChange}
            required
            placeholder="Nume complet"
            className="border px-3 py-2 rounded-md"
            disabled={loading}
          />

          <input
            name="grupa"
            value={formData.grupa}
            onChange={handleChange}
            required
            placeholder="Grupa"
            className="border px-3 py-2 rounded-md"
            disabled={loading}
          />

          <input
            name="an"
            value={formData.an}
            onChange={handleChange}
            required
            placeholder="An"
            className="border px-3 py-2 rounded-md"
            disabled={loading}
          />

          <input
            name="serie"
            value={formData.serie}
            onChange={handleChange}
            required
            placeholder="Serie"
            className="border px-3 py-2 rounded-md"
            disabled={loading}
          />

          <select
            name="disciplina"
            value={formData.disciplina}
            onChange={handleChange}
            required
            className="border px-3 py-2 rounded-md"
            disabled={loading}
          >
            <option value="">Selectează disciplina</option>
            <option value="Bazele psihologiei">Bazele psihologiei</option>
            <option value="Psihologie educațională">
              Psihologie educațională
            </option>
            <option value="Fundamentele psihologiei">
              Fundamentele psihologiei
            </option>
          </select>

          <select
            name="tipDisciplina"
            value={formData.tipDisciplina}
            onChange={handleChange}
            required
            className="border px-3 py-2 rounded-md"
            disabled={loading}
          >
            <option value="">Selectează tipul disciplinei</option>
            <option value="Curs">Curs</option>
            <option value="Seminar">Seminar</option>
            <option value="Laborator">Laborator</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className={`bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Se trimite..." : "Trimite prezența"}
          </button>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      )}
    </div>
  );
}
