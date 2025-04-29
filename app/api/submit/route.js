import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { email, nume, grupa, an, serie, disciplina, tipDisciplina } =
      await req.json();

    // Verificare date lipsă
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
    const { data, error } = await supabase.from("attendance").insert([
      {
        email,
        nume,
        grupa,
        an,
        serie,
        disciplina,
        tip_disciplina: tipDisciplina, // 🟢 denumirea corectă conform tabelului SQL
        data: now.toISOString().split("T")[0], // YYYY-MM-DD
        ora: now.toISOString().split("T")[1].slice(0, 8), // HH:MM:SS
      },
    ]);

    if (error) {
      console.error("Eroare la salvare în Supabase:", error);
      return new Response(
        JSON.stringify({ error: "Eroare la salvare în Supabase" }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ mesaj: "Prezența a fost salvată cu succes!" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Eroare server:", error);
    return new Response(JSON.stringify({ error: "Eroare server" }), {
      status: 500,
    });
  }
}
