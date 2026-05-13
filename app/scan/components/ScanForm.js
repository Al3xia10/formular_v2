"use client";

import NextImage from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const EMPTY_ACADEMIC_OPTIONS = {
  disciplines: [],
  disciplineTypes: [],
  studyYears: [],
  series: [],
  groupCodes: [],
};

const SELECT_ARROW_ICON = "/down-arrow.png";

export default function ScanForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef(null);
  const activeStreamRef = useRef(null);

  useEffect(() => {
    const rawToken = searchParams.get("token");

    // Suport fallback pentru cazuri când tokenul e trimis ca state=token%3DXYZ
    const stateParam = searchParams.get("state");
    const extractedToken = stateParam?.startsWith("token=")
      ? decodeURIComponent(stateParam.split("token=")[1])
      : null;

    const tokenFromQuery = rawToken || extractedToken;

    if (tokenFromQuery) {
      sessionStorage.setItem("qrToken", tokenFromQuery);
      setQrToken(tokenFromQuery);
      console.log("🔐 Token detectat din URL sau state:", tokenFromQuery);
    } else {
      const savedToken = sessionStorage.getItem("qrToken");
      if (savedToken) {
        setQrToken(savedToken);
        console.log("💾 Token din sessionStorage:", savedToken);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === "unauthenticated") {
      const savedToken =
        searchParams.get("token") || sessionStorage.getItem("qrToken");

      // Salvează tokenul în session storage pentru a supraviețui redirectului de login
      if (savedToken) {
        sessionStorage.setItem("qrToken", savedToken);
      }

      const callback = savedToken
        ? `/scan?token=${encodeURIComponent(savedToken)}`
        : `/scan`;

      // ...existing code...
      if (!sessionStorage.getItem("redirectedToLogin")) {
        sessionStorage.setItem("redirectedToLogin", "true");
        router.replace(
          `/auth/signin?callbackUrl=${encodeURIComponent(callback)}`,
        );
      }
      // ...existing code...
    }

    if (status === "authenticated") {
      const hasTokenInUrl = !!searchParams.get("token");
      const savedToken = sessionStorage.getItem("qrToken");

      if (!hasTokenInUrl && savedToken) {
        router.replace(`/scan?token=${encodeURIComponent(savedToken)}`);
      }

      sessionStorage.removeItem("redirectedToLogin");
    }
  }, [status, searchParams, router]);

  const [formData, setFormData] = useState({
    nume: "",
    grupa: "",
    an: "",
    serie: "",
    disciplina: "",
    tipDisciplina: "",
  });
  const [poza, setPoza] = useState(null);
  const [trimis, setTrimis] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [academicOptions, setAcademicOptions] = useState(
    EMPTY_ACADEMIC_OPTIONS,
  );
  const [academicOptionsLoading, setAcademicOptionsLoading] = useState(true);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState([]);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [isSeriesLocked, setIsSeriesLocked] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") {
      return undefined;
    }

    let isCancelled = false;

    async function loadAcademicOptions() {
      setAcademicOptionsLoading(true);

      try {
        const response = await fetch("/api/academic-options", {
          cache: "no-store",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Nu am putut încărca opțiunile formularului.",
          );
        }

        if (!isCancelled) {
          setAcademicOptions(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setAcademicOptionsLoading(false);
        }
      }
    }

    loadAcademicOptions();

    return () => {
      isCancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return undefined;
    }

    const query = studentSearch.trim();

    if (query.length < 2) {
      if (!studentId) {
        setStudentOptions([]);
      }
      return undefined;
    }

    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      setStudentSearchLoading(true);

      try {
        const response = await fetch(
          `/api/students/search?q=${encodeURIComponent(query)}`,
          {
            cache: "no-store",
          },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Nu am putut căuta studenții.");
        }

        if (!isCancelled) {
          setStudentOptions(data.students || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setStudentSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [status, studentId, studentSearch]);

  useEffect(() => {
    if (!poza) {
      setPhotoPreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(poza);
    setPhotoPreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [poza]);

  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "serie" ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleStudentSearchChange = (value) => {
    setStudentSearch(value);
    setStudentId("");
    setIsSeriesLocked(false);
    setFormData((current) => ({
      ...current,
      nume: value,
      grupa: "",
      an: "",
      serie: "",
    }));
  };

  const handleSelectStudent = (student) => {
    setStudentId(student.id);
    setStudentSearch(student.fullName);
    setStudentOptions([]);
    setError(null);
    setIsSeriesLocked(Boolean(student.series));
    setFormData((current) => ({
      ...current,
      nume: student.fullName,
      grupa: student.groupCode,
      an: student.studyYear,
      serie: student.series || "",
    }));
  };

  const MAX_UPLOAD_SIZE = 2 * 1024 * 1024;
  const TARGET_UPLOAD_SIZE = Math.round(1.8 * 1024 * 1024);

  const stopCameraStream = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setError(null);
    setIsStartingCamera(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera nu este disponibilă în acest browser. Deschide formularul din Chrome sau Safari pe telefon.",
        );
      }

      stopCameraStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      activeStreamRef.current = stream;
      setIsCameraOpen(true);
    } catch (cameraError) {
      setError(
        cameraError?.message ||
          "Nu am putut porni camera. Verifică permisiunea pentru cameră și încearcă din nou.",
      );
      stopCameraStream();
      setIsCameraOpen(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  useEffect(() => {
    if (!isCameraOpen || !videoRef.current || !activeStreamRef.current) {
      return;
    }

    videoRef.current.srcObject = activeStreamRef.current;
    videoRef.current
      .play()
      .catch(() => setError("Nu am putut porni previzualizarea camerei."));
  }, [isCameraOpen]);

  const renderCompressedImage = (file, maxWidth, maxHeight, quality) => {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        image.src = e.target.result;
        image.onload = () => {
          let width = image.width;
          let height = image.height;

          if (width > height && width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          } else if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas not supported"));
            return;
          }

          ctx.drawImage(image, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error("Compression failed"));
              }
            },
            file.type,
            quality,
          );
        };
        image.onerror = () => reject(new Error("Image load error"));
      };

      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsDataURL(file);
    });
  };

  const prepareImageForUpload = async (file) => {
    if (file.size <= TARGET_UPLOAD_SIZE) {
      return file;
    }

    const attempts = [
      { maxWidth: 1800, maxHeight: 1800, quality: 0.92 },
      { maxWidth: 1600, maxHeight: 1600, quality: 0.9 },
      { maxWidth: 1440, maxHeight: 1440, quality: 0.88 },
      { maxWidth: 1280, maxHeight: 1280, quality: 0.86 },
      { maxWidth: 1120, maxHeight: 1120, quality: 0.84 },
    ];

    let bestCandidate = file;

    for (const attempt of attempts) {
      const candidate = await renderCompressedImage(
        file,
        attempt.maxWidth,
        attempt.maxHeight,
        attempt.quality,
      );

      if (candidate.size < bestCandidate.size) {
        bestCandidate = candidate;
      }

      if (candidate.size <= TARGET_UPLOAD_SIZE) {
        return candidate;
      }
    }

    if (bestCandidate.size <= MAX_UPLOAD_SIZE) {
      return bestCandidate;
    }

    throw new Error(
      "Poza este prea mare. Încearcă din nou cu lumină mai bună sau puțin mai departe, fără zoom digital.",
    );
  };

  const capturePhoto = async () => {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("Camera nu este pregătită încă. Așteaptă o clipă și încearcă din nou.");
      return;
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Nu am putut captura cadrul camerei.");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (nextBlob) => {
            if (nextBlob) {
              resolve(nextBlob);
              return;
            }

            reject(new Error("Nu am putut genera poza din cameră."));
          },
          "image/jpeg",
          0.96,
        );
      });

      const capturedFile = new File([blob], `camera-${Date.now()}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const preparedFile = await prepareImageForUpload(capturedFile);
      setPoza(preparedFile);
      setError(null);
      setIsCameraOpen(false);
      stopCameraStream();
    } catch (photoError) {
      setPoza(null);
      setError(photoError.message || "Nu am putut pregăti poza pentru upload.");
    }
  };

  const closeCamera = () => {
    setIsCameraOpen(false);
    stopCameraStream();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!poza) {
      setError("Te rugăm să faci o poză în clasă.");
      return;
    }

    if (!studentId) {
      setError("Te rugăm să selectezi numele din lista de studenți.");
      return;
    }

    setLoading(true);
    setError(null);

    const formDataToSend = new FormData();
    formDataToSend.append("email", session?.user?.email || "");
    Object.keys(formData).forEach((key) =>
      formDataToSend.append(key, formData[key]),
    );
    formDataToSend.append("studentId", studentId);
    formDataToSend.append("poza", poza);
    if (qrToken) {
      formDataToSend.append("qrToken", qrToken);
    }

    try {
      const raspuns = await fetch("/api/submit", {
        method: "POST",
        body: formDataToSend,
      });
      const raspunsData = await raspuns.json();

      if (raspuns.ok) {
        setTrimis(true);
        setFormData((current) => ({
          nume: current.nume,
          grupa: current.grupa,
          an: current.an,
          serie: current.serie,
          disciplina: "",
          tipDisciplina: "",
        }));
        setPoza(null);
        setQrToken("");
        sessionStorage.removeItem("qrToken");
        setError(null);
      } else {
        throw new Error(
          raspunsData.error || "A apărut o eroare la trimiterea prezenței",
        );
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes("codul qr")) {
        sessionStorage.removeItem("qrToken");
        setQrToken("");
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <p className="text-center">Se încarcă...</p>;
  if (status !== "authenticated") return null;

  return (
    <main className="min-h-screen bg-[#fffaf4] px-3 py-4 text-[#2f2a25] sm:px-4 sm:py-8">
      <section className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-start justify-center sm:items-center">
        <div className="w-full overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white shadow-2xl shadow-orange-100/70">
          <div className="p-4 sm:p-6">
            <div className="mb-3 text-center">
              <h1 className="text-2xl font-black tracking-tight text-[#2f2a25] sm:text-3xl mt-4">
                Salut{session?.user?.name ? `, ${session.user.name}` : ""} 👋
              </h1>
              <p className="mx-auto mt-1 max-w-xs text-[14px] leading-5 text-[#806d62] sm:text-sm">
                Completează datele de mai jos și atașează poza făcută în sală.
              </p>

              {!trimis && (
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="mb-4 mt-4 rounded-full bg-[#f7efe7] px-4 py-2 text-xs font-bold text-[#7b5d4b] transition hover:bg-[#f0dfcf] hover:text-[#3a2b22]"
                >
                  Deloghează-te
                </button>
              )}
            </div>

            {trimis ? (
              <div className="rounded-[1.75rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-8 text-center shadow-lg shadow-emerald-100/60">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white shadow-lg shadow-emerald-200">
                  ✓
                </div>
                <h2 className="text-2xl font-black text-emerald-800">
                  Prezența ta a fost înregistrată!
                </h2>
                <p className="mt-3 text-sm leading-6 text-emerald-700">
                  Mulțumim. Datele au fost trimise cu succes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 pb-2">
                <div className="grid gap-3">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                      Nume
                    </label>
                    <div className="relative">
                      <input
                        value={studentSearch}
                        onChange={(e) =>
                          handleStudentSearchChange(e.target.value)
                        }
                        required
                        placeholder="Scrie numele și alege-l din lista afișată"
                        className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none transition placeholder:text-[#b8a599] focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        disabled={loading || academicOptionsLoading}
                      />

                      {studentOptions.length > 0 && !studentId && (
                        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-2xl shadow-orange-100/70">
                          {studentOptions.map((student) => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => handleSelectStudent(student)}
                              className="flex w-full flex-col items-start px-4 py-3 text-left transition hover:bg-orange-50"
                            >
                              <span className="text-sm font-black text-[#2f2a25]">
                                {student.fullName}
                              </span>
                              <span className="text-xs font-semibold text-[#806d62]">
                                Grupa {student.groupCode} • Anul{" "}
                                {student.studyYear} • Seria {student.series}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input type="hidden" name="studentId" value={studentId} />
                    <input type="hidden" name="nume" value={formData.nume} />
                    <p className="mt-2 text-xs font-semibold text-[#806d62]">
                      {studentId
                        ? "Numele a fost selectat din catalogul studenților."
                        : studentSearchLoading
                          ? "Se caută în catalogul studenților..."
                          : "Scrie cel puțin 2 litere și selectează numele din lista din catalog."}
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                      Email
                    </label>
                    <input
                      value={session?.user?.email || ""}
                      readOnly
                      className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#f7efe7] px-4 text-sm font-semibold text-[#7b5d4b] outline-none"
                    />
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                        Grupă
                      </label>
                      <input
                        name="grupa"
                        value={formData.grupa}
                        readOnly
                        required
                        placeholder="Se completează după selectarea studentului"
                        className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#f7efe7] px-4 text-sm font-semibold text-[#7b5d4b] outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                        An
                      </label>
                      <input
                        name="an"
                        value={formData.an}
                        readOnly
                        required
                        placeholder="Se completează după selectarea studentului"
                        className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#f7efe7] px-4 text-sm font-semibold text-[#7b5d4b] outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                        Serie
                      </label>
                      {isSeriesLocked ? (
                        <input
                          name="serie"
                          value={formData.serie}
                          readOnly
                          required
                          className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#f7efe7] px-4 text-sm font-semibold text-[#7b5d4b] outline-none"
                        />
                      ) : (
                        <div className="relative">
                          <select
                            name="serie"
                            value={formData.serie}
                            onChange={handleChange}
                            required
                            className="h-12 w-full appearance-none rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 pr-12 text-sm font-semibold text-[#2f2a25] outline-none transition placeholder:text-[#b8a599] focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                            disabled={
                              loading || academicOptionsLoading || !studentId
                            }
                          >
                            <option value="">Selectează seria</option>
                            {academicOptions.series.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                          <NextImage
                            src={SELECT_ARROW_ICON}
                            alt=""
                            width={16}
                            height={16}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                      Disciplina
                    </label>
                    <div className="relative">
                      <select
                        name="disciplina"
                        value={formData.disciplina}
                        onChange={handleChange}
                        required
                        className="h-12 w-full appearance-none rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 pr-12 text-sm font-semibold text-[#2f2a25] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        disabled={loading || academicOptionsLoading}
                      >
                        <option value="">Selectează disciplina</option>
                        {academicOptions.disciplines.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <NextImage
                        src={SELECT_ARROW_ICON}
                        alt=""
                        width={16}
                        height={16}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                      Tipul disciplinei
                    </label>
                    <div className="relative">
                      <select
                        name="tipDisciplina"
                        value={formData.tipDisciplina}
                        onChange={handleChange}
                        required
                        className="h-12 w-full appearance-none rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 pr-12 text-sm font-semibold text-[#2f2a25] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                        disabled={loading || academicOptionsLoading}
                      >
                        <option value="">Selectează tipul disciplinei</option>
                        {academicOptions.disciplineTypes.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <NextImage
                        src={SELECT_ARROW_ICON}
                        alt=""
                        width={16}
                        height={16}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50/70 p-3">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-xl shadow-sm">
                      📸
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#4a3b33]">
                        Poză făcută în sala de curs
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#8a7062]">
                        După scanare, fă poza direct din cameră. Imaginea trebuie să conțină QR-ul afișat acum de profesor, altfel prezența va fi respinsă.
                      </p>
                    </div>
                  </div>

                  {photoPreviewUrl && (
                    <div className="overflow-hidden rounded-2xl border border-orange-200 bg-white">
                      <NextImage
                        src={photoPreviewUrl}
                        alt="Preview poză prezență"
                        width={640}
                        height={416}
                        unoptimized
                        className="h-52 w-full object-cover"
                      />
                    </div>
                  )}

                  {isCameraOpen && (
                    <div className="mb-3 overflow-hidden rounded-2xl border border-orange-200 bg-[#2f2a25]">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-64 w-full object-cover"
                      />
                      <div className="flex gap-2 border-t border-white/10 p-3">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="flex-1 rounded-2xl bg-[#ff8a3d] px-4 py-3 text-sm font-black text-white transition hover:bg-[#f97316]"
                        >
                          Capturează poza
                        </button>
                        <button
                          type="button"
                          onClick={closeCamera}
                          className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-bold text-white/90 transition hover:bg-white/10"
                        >
                          Închide
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={startCamera}
                    disabled={loading || isStartingCamera}
                    className={`flex h-12 cursor-pointer items-center justify-center rounded-2xl bg-[#ff8a3d] px-4 text-center text-sm font-black text-white shadow-lg shadow-orange-200 transition active:scale-95 hover:bg-[#f97316] ${
                      loading || isStartingCamera
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    {isStartingCamera
                      ? "Se pornește camera..."
                      : poza
                        ? "Refă poza din cameră"
                        : "Deschide camera"}
                  </button>
                  <p className="mt-2 text-xs leading-5 text-[#8a7062]">
                    Formularul acceptă doar poze capturate în acest ecran, nu upload din galerie.
                  </p>
                </div>

                <input type="hidden" name="qrToken" value={qrToken} />

                {error && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-bold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || academicOptionsLoading}
                  className={`flex h-13 min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#2f2a25] px-5 py-4 text-base font-black text-white shadow-xl shadow-stone-300/80 transition ${
                    loading || academicOptionsLoading
                      ? "cursor-not-allowed opacity-60"
                      : "hover:-translate-y-0.5 hover:bg-black"
                  }`}
                >
                  {loading && (
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                  )}
                  {loading ? "Se trimite prezența..." : "Trimite prezența"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
