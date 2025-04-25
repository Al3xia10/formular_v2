import path from "path";
import { readFile } from "fs/promises";

export async function GET(req) {
  try {
    const filePath = path.join(process.cwd(), "data", "attendance.json");
    const fileData = await readFile(filePath, "utf8");
    const attendance = JSON.parse(fileData);

    return new Response(JSON.stringify(attendance), {
      status: 200,
    });
  } catch (error) {
    console.error("Eroare:", error);
    return new Response(
      JSON.stringify({ error: "Fișierul cu prezențele nu a fost găsit" }),
      {
        status: 500,
      }
    );
  }
}
