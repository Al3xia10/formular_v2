"use client";
import { useEffect, useState } from "react";
import { exportToExcel } from "@/lib/excel";

export default function AdminPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchAttendance = async () => {
      const res = await fetch("/api/get-attendance");
      const json = await res.json();
      setData(json);
    };
    fetchAttendance();
  }, []);

  const handleExport = () => {
    exportToExcel(data); // Apel direct din lib
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Listă prezențe</h1>
      <button
        onClick={handleExport}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded-md"
      >
        Descarcă Excel
      </button>
      <table className="w-full text-left border border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Nume</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Data</th>
            <th className="border p-2">Ora</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => (
            <tr key={index}>
              <td className="border p-2">{entry.nume}</td>
              <td className="border p-2">{entry.email}</td>
              <td className="border p-2">{entry.data}</td>
              <td className="border p-2">{entry.ora}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
