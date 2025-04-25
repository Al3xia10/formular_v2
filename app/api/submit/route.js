import { writeFile, readFile } from "fs/promises";
import path from "path";
import * as XLSX from "xlsx"; // Importăm biblioteca XLSX pentru a crea fișiere Excel

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
    const fileData = await readFile(filePath, "utf8");
    const attendance = JSON.parse(fileData);

    // Adaugă data, ora și informațiile suplimentare
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

    // Salvează actualizările în JSON
    await writeFile(filePath, JSON.stringify(attendance, null, 2));

    // Actualizează fișierul Excel
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(attendance);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prezențe");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const excelPath = path.join(process.cwd(), "data", "attendance.xlsx");
    await writeFile(excelPath, Buffer.from(excelBuffer));

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
