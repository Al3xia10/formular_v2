import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Folosește cheia service_role DOAR pe server.
);

export async function POST(req) {
  try {
    const form = formidable({ multiples: false });

    const data = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const { fields, files } = data;

    // Preluăm imaginea
    const pozaFile = files.poza?.[0];
    if (!pozaFile) {
      return NextResponse.json({ error: "Lipsă imagine" }, { status: 400 });
    }

    const fileData = fs.readFileSync(pozaFile.filepath);
    const fileExt = pozaFile.originalFilename.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;

    // Upload imagine în Supabase bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("poze-prezenta")
      .upload(fileName, fileData, {
        contentType: pozaFile.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Eroare upload:", uploadError);
      return NextResponse.json(
        { error: "Eroare la încărcarea pozei" },
        { status: 500 }
      );
    }

    // Obține URL public
    const { data: publicUrlData } = supabase.storage
      .from("poze-prezenta")
      .getPublicUrl(fileName);

    const poza_url = publicUrlData.publicUrl;

    // Salvăm toate datele în tabelul attendance
    const { error: insertError } = await supabase.from("attendance").insert({
      email: fields.email,
      nume: fields.nume,
      grupa: fields.grupa,
      an: fields.an,
      serie: fields.serie,
      disciplina: fields.disciplina,
      tip_disciplina: fields.tipDisciplina,
      poza_url: poza_url,
    });

    if (insertError) {
      console.error("Eroare la insert:", insertError);
      return NextResponse.json(
        { error: "Eroare la salvarea datelor" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Eroare server:", error);
    return NextResponse.json(
      { error: "Eroare internă server" },
      { status: 500 }
    );
  }
}
