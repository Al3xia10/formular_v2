import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL, // URL-ul Supabase (necesar pentru conexiune)
  process.env.SUPABASE_SERVICE_ROLE_KEY // Cheia de serviciu pentru acces server-side
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

    // Creează intrarea nouă în tabelul "attendance"
    const now = new Date();
    const { data, error } = await supabase.from("attendance").insert([
      {
        email,
        nume,
        grupa,
        an,
        serie,
        disciplina,
        tipDisciplina,
        data: now.toLocaleDateString("ro-RO"),
        ora: now.toLocaleTimeString("ro-RO"),
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
