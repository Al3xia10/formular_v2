import { writeFile, readFile } from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";

// Funcția pentru actualizarea fișierului Excel
export async function updateExcelWithNewData(data) {
  const excelPath = path.join(process.cwd(), "data", "attendance.xlsx");

  // Verifică dacă fișierul Excel există deja
  let workbook;
  try {
    // Citește fișierul existent
    const fileBuffer = await readFile(excelPath);
    workbook = XLSX.read(fileBuffer, { type: "buffer" });
  } catch (error) {
    // Dacă fișierul nu există, creează un workbook nou
    workbook = XLSX.utils.book_new();
  }

  // Convertește datele într-un worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Verifică dacă sheet-ul "Prezențe" există deja
  if (workbook.Sheets["Prezențe"]) {
    const existingSheet = workbook.Sheets["Prezențe"];
    const existingData = XLSX.utils.sheet_to_json(existingSheet);

    // Adaugă noile date la cele existente
    const updatedData = [...existingData, ...data];
    const updatedWorksheet = XLSX.utils.json_to_sheet(updatedData);
    workbook.Sheets["Prezențe"] = updatedWorksheet;
  } else {
    // Dacă sheet-ul nu există, creează-l
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prezențe");
  }

  // Salvează fișierul Excel actualizat
  const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  await writeFile(excelPath, fileBuffer);
}

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

    attendance.push(newEntry);

    await writeFile(filePath, JSON.stringify(attendance, null, 2));

    // Actualizează fișierul Excel cu noile date
    await updateExcelWithNewData([newEntry]);

    return new Response(JSON.stringify({ mesaj: "Salvat cu succes!" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Eroare:", error);
    return new Response(JSON.stringify({ error: "Eroare la salvare" }), {
      status: 500,
    });
  }
}
