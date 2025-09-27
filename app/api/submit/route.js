import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    // Debug: log all form entries
    for (let [key, value] of formData.entries()) {
      console.log(
        `${key}:`,
        value instanceof File
          ? `File: ${value.name}, ${value.size} bytes`
          : value
      );
    }

    const email = formData.get("email");
    const nume = formData.get("nume");
    const grupa = formData.get("grupa");
    const an = formData.get("an");
    const serie = formData.get("serie");
    const disciplina = formData.get("disciplina");
    const tipDisciplina = formData.get("tipDisciplina");
    const poza = formData.get("poza");
    const qrToken = formData.get("qrToken");

    // Validare suplimentară pentru fișierul poza
    if (!(poza instanceof File)) {
      return new Response(JSON.stringify({ error: "Fișier invalid" }), {
        status: 400,
      });
    }

    if (poza.size > 2 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: "Fișier prea mare (max 2MB)" }),
        { status: 400 }
      );
    }

    // Verificare date lipsă
    if (
      !email ||
      !nume ||
      !grupa ||
      !an ||
      !serie ||
      !disciplina ||
      !tipDisciplina ||
      !poza ||
      !qrToken
    ) {
      return new Response(JSON.stringify({ error: "Date lipsă" }), {
        status: 400,
      });
    }

    // Validare locală deterministă a codului QR pe baza datei curente
    function getDailyToken(dateString) {
      const base = dateString + "SECRET_SALT"; // același salt ca în QR generator
      let hash = 0;
      for (let i = 0; i < base.length; i++) {
        hash = base.charCodeAt(i) + ((hash << 5) - hash);
      }
      const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
      return code;
    }

    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Europe/Bucharest",
    });
    const expectedToken = getDailyToken(today);

    if (qrToken !== expectedToken) {
      return new Response(
        JSON.stringify({ error: "Codul QR este invalid sau expirat" }),
        { status: 403 }
      );
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
        qr_token: qrToken,
        valid_qr: true,
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
    console.error("Eroare server:", error.stack || error);
    return new Response(JSON.stringify({ error: "Eroare server" }), {
      status: 500,
    });
  }
}
