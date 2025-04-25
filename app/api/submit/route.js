import { writeFile, readFile } from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";

export async function POST(req) {
  try {
    const { email, nume, grupa, an, serie, disciplina, tipDisciplina } =
      await req.json();

    if (
      !email ||
      !nume ||
      !grupa ||
      !an ||
      !serie ||
      !disciplina ||
      !tipDisciplina
    ) {
      return new Response(JSON.stringify({ error: "Date lipsă" }), {
        status: 400,
      });
    }

    const filePath = path.join(process.cwd(), "data", "attendance.json");
    const excelPath = path.join(process.cwd(), "data", "attendance.xlsx");

    let attendance = [];

    try {
      const fileData = await readFile(filePath, "utf8");
      attendance = JSON.parse(fileData);
    } catch {
      // Dacă fișierul nu există, începem cu un array gol
      attendance = [];
    }

    const now = new Date();
    const newEntry = {
      nume,
      email,
      grupa,
      an,
      serie,
      disciplina,
      tipDisciplina,
      data: now.toLocaleDateString("ro-RO"),
      ora: now.toLocaleTimeString("ro-RO"),
    };

    attendance.push(newEntry);

    // Salvează în JSON
    await writeFile(filePath, JSON.stringify(attendance, null, 2));

    // Generează fișier Excel
    const worksheet = XLSX.utils.json_to_sheet(attendance);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prezențe");

    XLSX.writeFile(workbook, excelPath);

    return new Response(
      JSON.stringify({ mesaj: "Prezența a fost salvată cu succes!" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Eroare:", error);
    return new Response(JSON.stringify({ error: "Eroare la salvare" }), {
      status: 500,
    });
  }
}
