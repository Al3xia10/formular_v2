import { writeFile, readFile } from "fs/promises";
import path from "path";
import { generateOrUpdateExcel } from "@/lib/excel"; // Funcția pentru Excel

export async function POST(req) {
  try {
    const { email, nume, grupa, an, serie, disciplina, tipDisciplina } =
      await req.json();

    // Verificare date lipsă
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

    const jsonPath = path.join(process.cwd(), "data", "attendance.json");

    // Creează fișierul JSON dacă nu există
    let attendance = [];
    try {
      const fileData = await readFile(jsonPath, "utf8");
      attendance = JSON.parse(fileData);
    } catch (err) {
      console.error("Eroare la citirea fișierului JSON:", err);
      attendance = []; // Dacă fișierul nu există sau este corupt, creează un array gol
    }

    // Creează intrarea nouă
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

    // Salvează în JSON
    attendance.push(newEntry);
    await writeFile(jsonPath, JSON.stringify(attendance, null, 2));

    // Comentat temporar pentru a verifica dacă există vreo eroare la actualizarea Excel-ului
    // await generateOrUpdateExcel(attendance);

    return new Response(
      JSON.stringify({ mesaj: "Prezența a fost salvată cu succes!" }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Eroare la salvare:", error);
    return new Response(
      JSON.stringify({ error: "Eroare internă la salvare" }),
      {
        status: 500,
      }
    );
  }
}
