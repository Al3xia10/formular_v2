"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AttendanceFormPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status]);

  if (status === "loading" || !session) return <div>Se încarcă...</div>;

  const handleSubmit = () => {
    console.log("Prezență înregistrată pentru:", session?.user?.email);

    setSubmitted(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Formular Prezență</h1>
      {submitted ? (
        <p className="text-green-600">Prezența a fost trimisă. Mulțumim!</p>
      ) : (
        <>
          <p className="mb-4">
            Ești autentificat ca{" "}
            <strong>{session?.user?.email || "Utilizator necunoscut"}</strong>.
          </p>

          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded-md"
          >
            Trimite Prezența
          </button>
        </>
      )}
    </div>
  );
}
