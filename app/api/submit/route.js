import { writeFile, readFile } from "fs/promises";
import path from "path";

export async function POST(req) {
  try {
    const { email, nume } = await req.json();

    if (!email || !nume) {
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
      data: now.toLocaleDateString("ro-RO"),
      ora: now.toLocaleTimeString("ro-RO"),
    };

    attendance.push(newEntry);

    await writeFile(filePath, JSON.stringify(attendance, null, 2));

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
