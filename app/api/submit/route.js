import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_SHEETS_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxgEF83JNA6oiuJ0qI3Lu4tIq9eMUq3nbEydFdBviil-sU4QCnXgmsZoNwV_dhyE97Oug/exec"; // 🔁 Înlocuiește cu URL-ul tău real

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

    const now = new Date();
    const dateFormatted = now.toISOString().split("T")[0];
    const timeFormatted = now.toISOString().split("T")[1].slice(0, 8);

    const { data, error } = await supabase.from("attendance").insert([
      {
        email,
        nume,
        grupa,
        an,
        serie,
        disciplina,
        tip_disciplina: tipDisciplina,
        data: dateFormatted,
        ora: timeFormatted,
      },
    ]);

    if (error) {
      console.error("Eroare la salvare în Supabase:", error.message);
      return new Response(
        JSON.stringify({ error: "Eroare la salvare în Supabase" }),
        { status: 500 }
      );
    }

    // 🔁 Trimite datele și către Google Sheets
    await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        nume,
        grupa,
        an,
        serie,
        disciplina,
        tip_disciplina: tipDisciplina,
        data: dateFormatted,
        ora: timeFormatted,
      }),
    });

    return new Response(
      JSON.stringify({ mesaj: "Prezența a fost salvată și în Google Sheets!" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Eroare server:", error);
    return new Response(JSON.stringify({ error: "Eroare server" }), {
      status: 500,
    });
  }
}
