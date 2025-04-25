import path from "path";
import fs from "fs";
import * as XLSX from "xlsx";

export async function generateOrUpdateExcel(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Prezențe");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const filePath = path.join(process.cwd(), "data", "attendance.xlsx");

  // Creează folderul dacă nu există
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, buffer);
}
