import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();

    const email = formData.get("email");
    const nume = formData.get("nume");
    const grupa = formData.get("grupa");
    const an = formData.get("an");
    const serie = formData.get("serie");
    const disciplina = formData.get("disciplina");
    const tipDisciplina = formData.get("tipDisciplina");
    const poza = formData.get("poza");

    // Verificare date lipsă
    if (
      !email ||
      !nume ||
      !grupa ||
      !an ||
      !serie ||
      !disciplina ||
      !tipDisciplina ||
      !poza
    ) {
      return new Response(JSON.stringify({ error: "Date lipsă" }), {
        status: 400,
      });
    }

    // 🔁 Încarcă poza în Supabase Storage
    const fileName = `${email}_${Date.now()}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("prezente")
      .upload(fileName, poza, {
        contentType: poza.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Eroare la upload:", uploadError);
      return new Response(
        JSON.stringify({ error: "Eroare la încărcarea pozei" }),
        { status: 500 }
      );
    }

    // ✅ Construiește URL-ul imaginii
    const publicURLResponse = supabase.storage
      .from("prezente")
      .getPublicUrl(fileName);
    const pozaURL = publicURLResponse.data.publicUrl;

    // 🕒 Obține data și ora locală din România
    const now = new Date();
    const dataLocala = now.toLocaleDateString("sv-SE", {
      timeZone: "Europe/Bucharest",
    }); // format: YYYY-MM-DD
    const oraLocala = now.toLocaleTimeString("it-IT", {
      timeZone: "Europe/Bucharest",
      hour12: false,
    }); // format: HH:MM:SS

    // 🔃 Salvează toate datele, inclusiv poza
    const { data, error } = await supabase.from("attendance").insert([
      {
        email,
        nume,
        grupa,
        an,
        serie,
        disciplina,
        tip_disciplina: tipDisciplina,
        data: dataLocala,
        ora: oraLocala,
        poza_url: pozaURL,
      },
    ]);

    if (error) {
      console.error("Eroare la salvare în Supabase:", error);
      return new Response(
        JSON.stringify({ error: "Eroare la salvarea datelor" }),
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
