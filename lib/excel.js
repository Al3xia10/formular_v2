import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

export function generateOrUpdateExcel(attendanceData) {
  const filePath = path.join(process.cwd(), "data", "attendance.xlsx");

  // Verifică dacă fișierul există deja
  let workbook;
  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath); // Citește fișierul existent
  } else {
    // Creează un nou workbook
    workbook = XLSX.utils.book_new();
  }

  const worksheet = XLSX.utils.json_to_sheet(attendanceData);
  const sheetName = "Prezențe";

  // Dacă există deja foaia, o actualizăm, altfel o adăugăm
  if (workbook.Sheets[sheetName]) {
    XLSX.utils.sheet_add_json(workbook.Sheets[sheetName], attendanceData, {
      origin: -1,
    });
  } else {
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  // Scrie fișierul Excel actualizat pe disc
  XLSX.writeFile(workbook, filePath);
}
