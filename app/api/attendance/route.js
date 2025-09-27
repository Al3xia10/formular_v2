import { writeFile, readFile } from "fs/promises";
import path from "path";
import { generateOrUpdateExcel } from "@/lib/excel";

export async function POST(req) {
  try {
    const { email, nume, grupa, an, serie, disciplina, tipDisciplina } =
      await req.json();

    // Verifică dacă există datele necesare
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

    // Calea către fișierul JSON
    const filePath = path.join(process.cwd(), "data", "attendance.json");

    // Citește fișierul JSON existent
    const fileData = await readFile(filePath, "utf8");
    const attendance = JSON.parse(fileData);

    // Adaugă data și ora
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

    // Adaugă noua prezență la lista existentă
    attendance.push(newEntry);

    // Salvează fișierul JSON cu noile date
    await writeFile(filePath, JSON.stringify(attendance, null, 2));

    // Actualizează fișierul Excel cu noile date
    await generateOrUpdateExcel(attendance);

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
