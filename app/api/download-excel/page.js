import path from "path";
import { readFile } from "fs/promises";

export async function GET(req) {
  try {
    const filePath = path.join(process.cwd(), "data", "attendance.xlsx");

    const fileBuffer = await readFile(filePath);

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
      JSON.stringify({ error: "Fișierul Excel nu a fost găsit" }),
      {
        status: 500,
      }
    );
  }
}
