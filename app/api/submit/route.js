import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Funcție pentru extragerea codului QR din imagine
async function extractQrFromImage(buffer) {
  const form = new FormData();
  form.append("file", new Blob([buffer]), "image.jpg");

  const response = await fetch("https://api.qrserver.com/v1/read-qr-code/", {
    method: "POST",
    body: form,
  });

  const result = await response.json();
  const qrData = result?.[0]?.symbol?.[0]?.data;
  return qrData || null;
}

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
      const base = dateString + "ALEXYA2024_QRCHECK"; // salt sincronizat cu QR generator
      let hash = 0;
      for (let i = 0; i < base.length; i++) {
        hash = base.charCodeAt(i) + ((hash << 5) - hash);
      }
      const code = Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
      return code;
    }

    // Verificare cod QR valid pentru astăzi sau ieri (flexibilitate 1 zi)
    const today = new Date();
    const dateFormat = (date) =>
      date.toLocaleDateString("sv-SE", { timeZone: "Europe/Bucharest" });

    const todayToken = getDailyToken(dateFormat(today));
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayToken = getDailyToken(dateFormat(yesterday));

    if (![todayToken, yesterdayToken].includes(qrToken)) {
      return new Response(
        JSON.stringify({ error: "Codul QR este invalid sau expirat" }),
        { status: 403 }
      );
    }

    // Extragere și verificare QR direct din imagine
    const arrayBuffer = await poza.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const scannedToken = await extractQrFromImage(buffer);
    console.log("📸 Token extras din poză:", scannedToken);
    console.log("🔐 Token primit din URL:", qrToken);
    if (!scannedToken) {
      return new Response(
        JSON.stringify({ error: "Codul QR nu a fost detectat în poză" }),
        { status: 403 }
      );
    }

    // Dacă tokenul extras este un URL, extrage doar codul qr din el
    let extractedCode = scannedToken;
    if (scannedToken?.startsWith("http")) {
      try {
        const url = new URL(scannedToken);
        extractedCode = url.searchParams.get("token");
      } catch (e) {
        console.log("⚠️ Eroare la parsarea URL-ului:", e);
      }
    }

    if (extractedCode?.trim() !== qrToken?.trim()) {
      console.log("❌ Token diferit:", extractedCode, "vs", qrToken);
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
