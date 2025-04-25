"use client";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      const res = await fetch("/api/get-attendance");
      const json = await res.json();
      setData(json);
      setIsLoading(false);
    };
    fetchAttendance();
  }, []);

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/download-excel");
      if (res.ok) {
        const blob = await res.blob();
        const link = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = link;
        a.download = "attendance.xlsx"; // Numele fișierului Excel
        a.click();
      } else {
        console.error("Nu s-a putut descărca fișierul.");
      }
    } catch (error) {
      console.error("Eroare la descărcare:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Listă prezențe</h1>
      <button
        onClick={handleExport}
        disabled={isLoading}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded-md"
      >
        {isLoading ? "Se încarcă..." : "Descarcă Excel"}
      </button>
      <table className="w-full text-left border border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nume</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Data</th>
            <th className="border p-2">Ora</th>
            <th className="border p-2">Grupa</th>
            <th className="border p-2">An</th>
            <th className="border p-2">Serie</th>
            <th className="border p-2">Disciplina</th>
            <th className="border p-2">Tip Disciplina</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => (
            <tr key={index}>
              <td className="border p-2">{entry.nume}</td>
              <td className="border p-2">{entry.email}</td>
              <td className="border p-2">{entry.data}</td>
              <td className="border p-2">{entry.ora}</td>
              <td className="border p-2">{entry.grupa}</td>
              <td className="border p-2">{entry.an}</td>
              <td className="border p-2">{entry.serie}</td>
              <td className="border p-2">{entry.disciplina}</td>
              <td className="border p-2">{entry.tipDisciplina}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
