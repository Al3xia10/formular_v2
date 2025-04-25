import path from "path";
import fs from "fs";

export async function GET() {
  const filePath = path.join(process.cwd(), "data", "attendance.xlsx");

  try {
    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="attendance.xlsx"',
      },
    });
  } catch (error) {
    console.error("Eroare la descărcare:", error);
    return new Response("Fișierul nu a fost găsit.", { status: 404 });
  }
}
