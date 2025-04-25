// /pages/api/download-excel.js

import path from "path";
import fs from "fs";

export async function GET(req) {
  try {
    // Definim calea către fișierul Excel
    const filePath = path.join(process.cwd(), "data", "attendance.xlsx");

    // Verificăm dacă fișierul există
    if (!fs.existsSync(filePath)) {
      return new Response(
        JSON.stringify({ error: "Fișierul Excel nu a fost găsit" }),
        { status: 404 }
      );
    }

    // Citim fișierul și trimitem buffer-ul ca răspuns
    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="attendance.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Eroare:", error);
    return new Response(
      JSON.stringify({ error: "Eroare la accesarea fișierului Excel" }),
      {
        status: 500,
      }
    );
  }
}
