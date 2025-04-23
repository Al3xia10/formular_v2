import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "attendance.json");
    const fileData = await readFile(filePath, "utf8");
    const attendance = JSON.parse(fileData);
    return new Response(JSON.stringify(attendance), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Eroare citire:", error);
    return new Response(
      JSON.stringify({ error: "Eroare la citirea fișierului" }),
      {
        status: 500,
      }
    );
  }
}
