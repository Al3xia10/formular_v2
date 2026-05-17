import { useEffect, useState } from "react";

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4.75 18.25L5.55 14.35C5.63 13.96 5.82 13.6 6.1 13.32L15.2 4.22C15.96 3.46 17.2 3.46 17.96 4.22L19.78 6.04C20.54 6.8 20.54 8.04 19.78 8.8L10.68 17.9C10.4 18.18 10.04 18.37 9.65 18.45L5.75 19.25C5.15 19.37 4.63 18.85 4.75 18.25Z"
        stroke="#ea580c"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.25 5.25L18.75 9.75"
        stroke="#ea580c"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M9.25 4.75H14.75L15.45 6.75H20"
        stroke="#ef4444"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 6.75H20"
        stroke="#ef4444"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.75 9.25L7.45 18.15C7.55 19.35 8.55 20.25 9.75 20.25H14.25C15.45 20.25 16.45 19.35 16.55 18.15L17.25 9.25"
        stroke="#ef4444"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.25 11.25V17.25M13.75 11.25V17.25"
        stroke="#ef4444"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhotoPreviewModal({ photoUrl, onClose }) {
  const [imageError, setImageError] = useState(false);
  const previewUrl = photoUrl
    ? `/api/profesor/photo-preview?url=${encodeURIComponent(photoUrl)}`
    : "";

  useEffect(() => {
    setImageError(false);
  }, [photoUrl]);

  if (!photoUrl) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "rgba(47, 42, 37, 0.5)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-orange-100 bg-white p-4 shadow-2xl shadow-orange-200/70">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-2xl font-black leading-none text-[#2f2a25] shadow-lg shadow-orange-100 transition hover:text-orange-600"
          aria-label="Închide poza"
        >
          ×
        </button>

        <div className="mx-auto max-w-md overflow-hidden rounded-[1.25rem] border border-orange-100 bg-[#fffaf4] p-3">
          {imageError ? (
            <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-white px-6 text-center text-sm font-semibold text-[#806d62]">
              Nu am putut afișa poza în preview. O poți deschide în tab nou din
              butonul de mai jos.
            </div>
          ) : (
            <img
              src={previewUrl}
              alt="Poză QR"
              onError={() => setImageError(true)}
              className="mx-auto h-auto max-h-[55vh] w-auto max-w-full object-contain"
            />
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full bg-[#fffaf4] px-4 py-2 text-xs font-black text-orange-600 ring-1 ring-orange-100 transition hover:bg-orange-50"
          >
            Deschide poza într-un tab nou
          </a>
        </div>
      </div>
    </div>
  );
}

function StudentAttendanceCard({
  student,
  isOpen,
  observationSavingStudentId,
  attendanceGradeSavingId,
  onCreateObservation,
  onUpdateObservation,
  onDeleteObservation,
  onSaveAttendanceGrade,
  onToggle,
}) {
  const studentKey = student.email || student.nume;
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState("");
  const [observationDraft, setObservationDraft] = useState("");
  const [editingObservationId, setEditingObservationId] = useState("");
  const [attendanceGradeDrafts, setAttendanceGradeDrafts] = useState({});

  useEffect(() => {
    setObservationDraft("");
    setEditingObservationId("");
  }, [student.observations]);

  useEffect(() => {
    setAttendanceGradeDrafts(
      Object.fromEntries(
        (student.attendance || []).map((item) => [
          item.id,
          item.grade ?? "",
        ]),
      ),
    );
  }, [student.attendance]);

  return (
    <section
      key={studentKey}
      className="rounded-2xl border border-[#ead8c8] bg-[#fffaf4] p-4"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-orange-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-[#2f2a25]">{student.nume}</h3>
          <p className="mt-1 text-xs font-semibold text-[#806d62]">
            {student.email}
          </p>
          <p className="mt-2 text-sm font-bold text-[#4a3b33]">
            Grupa {student.grupa} • Anul {student.an} • Seria {student.serie}
          </p>
          {student.observations?.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-orange-100 bg-white/90 shadow-[0_12px_30px_rgba(255,122,26,0.08)]">
              <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#fff4ea] to-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-orange-500">
                    Observații salvate
                  </p>
                  <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-[11px] font-black text-orange-600 ring-1 ring-orange-100">
                    {student.observations.length}
                  </div>
                </div>
              </div>
              <div className="space-y-2 px-4 py-3">
                {student.observations.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1rem] border border-orange-100 bg-[#fffaf4] px-3 py-2.5 text-sm font-bold leading-6 text-[#5c4c42] shadow-sm"
                  >
                    {item.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-fit rounded-2xl bg-white px-4 py-2 text-center ring-1 ring-orange-100">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-500">
              total
            </p>
            <p className="text-xl font-black text-[#2f2a25]">
              {student.attendance.length}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggle}
            style={{
              backgroundColor: "#ff7a1a",
              color: "#ffffff",
            }}
            className="rounded-full px-4 py-2 text-xs font-black shadow-md shadow-orange-100 transition"
          >
            {isOpen ? "Ascunde detalii" : "Vezi detalii"}
          </button>
        </div>
      </div>

      {isOpen && (
        <>
          <p className="mb-4 mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#806d62]">
            Cele mai recente prezențe
          </p>

          <div className="space-y-3">
            {student.attendance.map((item) => (
              <article
                key={item.id || `${item.email}-${item.data}-${item.ora}`}
                className="rounded-2xl bg-white p-4 ring-1 ring-orange-100"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black text-[#2f2a25]">
                      {item.disciplina}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#806d62]">
                      {item.tip_disciplina}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                      item.valid_qr
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.valid_qr ? "QR valid" : "QR invalid"}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-[#4a3b33] sm:grid-cols-2">
                  <p>
                    <span className="font-black">Data:</span> {item.data}
                  </p>
                  <p>
                    <span className="font-black">Ora:</span> {item.ora}
                  </p>
                </div>

                <div className="mt-4 rounded-[1.25rem] bg-[#fffaf4] p-3 ring-1 ring-orange-100">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-500">
                    Notă pentru această prezență
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.01"
                      value={attendanceGradeDrafts[item.id] ?? ""}
                      onChange={(event) =>
                        setAttendanceGradeDrafts((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      placeholder="Ex: 10"
                      className="h-11 w-full rounded-2xl border border-[#ead8c8] bg-white px-4 text-sm font-bold text-[#2f2a25] outline-none transition placeholder:text-[#b8a599] focus:border-orange-400 focus:ring-4 focus:ring-orange-100 sm:max-w-[160px]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onSaveAttendanceGrade(
                          item.id,
                          attendanceGradeDrafts[item.id] ?? "",
                        )
                      }
                      disabled={attendanceGradeSavingId === item.id}
                      className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-black text-white transition ${
                        attendanceGradeSavingId === item.id
                          ? "cursor-not-allowed bg-[#7f746d] opacity-60"
                          : "bg-[#2f2a25] hover:bg-black"
                      }`}
                    >
                      {attendanceGradeSavingId === item.id
                        ? "Se salvează..."
                        : "Salvează nota"}
                    </button>
                    {item.grade !== null && item.grade !== undefined && item.grade !== "" && (
                      <p className="text-xs font-semibold text-[#806d62]">
                        Nota salvată:{" "}
                        <span className="font-black text-[#2f2a25]">
                          {item.grade}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {item.poza_url && (
                  <button
                    type="button"
                    onClick={() => setPreviewPhotoUrl(item.poza_url)}
                    className="mt-4 inline-flex rounded-full bg-[#fffaf4] px-4 py-2 text-xs font-black text-orange-600 ring-1 ring-orange-100 transition hover:bg-orange-50"
                  >
                    Vezi poza QR
                  </button>
                )}
              </article>
            ))}
          </div>

          <div className="mb-5 mt-5 overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_24px_60px_rgba(255,122,26,0.10)]">
            <div className="flex flex-col gap-4 bg-gradient-to-r from-[#fff4ea] via-white to-[#fffaf4] px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-orange-600 ring-1 ring-orange-100 shadow-sm">
                  Observații
                </div>
                <p className="mt-3 max-w-md text-sm font-bold leading-7 text-[#806d62]">
                  Adaugă, modifică sau șterge observații despre student.
                </p>
              </div>
              {student.observations?.length > 0 && (
                <div className="inline-flex items-center gap-2 rounded-[1.5rem] bg-white px-4 py-3 ring-1 ring-orange-100 shadow-sm">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-500">
                    observații salvate
                  </p>
                  <p className="text-lg font-black text-[#2f2a25]">
                    {student.observations?.length || 0}
                  </p>
                </div>
              )}
            </div>

            {student.observations?.length > 0 && (
              <div className="space-y-3 px-5 pb-2 pt-5">
                {student.observations.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col gap-4 rounded-[1.5rem] px-5 py-4 shadow-sm transition hover:-translate-y-0.5 sm:flex-row sm:items-start sm:justify-between"
                    style={{
                      border: "1px solid #fed7aa",
                      backgroundColor: "#fffaf4",
                    }}
                  >
                    <p className="text-sm font-bold leading-7 text-[#5c4c42]">
                      {item.content}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingObservationId(item.id);
                          setObservationDraft(item.content);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition hover:-translate-y-0.5"
                        style={{
                          border: "1px solid #fed7aa",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteObservation(student.id, item.id)}
                        disabled={observationSavingStudentId === student.id}
                        className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition hover:-translate-y-0.5 ${
                          observationSavingStudentId === student.id
                            ? "cursor-not-allowed opacity-60"
                            : "hover:shadow-lg"
                        }`}
                        style={{
                          border: "1px solid #fecaca",
                          backgroundColor:
                            observationSavingStudentId === student.id
                              ? "#f2e8de"
                              : "#ffffff",
                        }}
                        aria-label="Șterge observația"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 pb-5 pt-4 sm:px-5">
              <div
                className="mx-auto max-w-3xl rounded-[1.75rem] bg-[linear-gradient(180deg,#fffdf9_0%,#fff8f1_100%)] px-4 py-4 sm:px-5"
                style={{
                  border: "1px solid #f2decf",
                }}
              >
                <textarea
                  value={observationDraft}
                  onChange={(e) => setObservationDraft(e.target.value)}
                  rows={4}
                  placeholder="Adaugă o observație pentru acest student"
                  className="w-full rounded-[1.4rem] bg-white px-5 py-5 text-sm font-bold leading-7 text-[#5c4c42] outline-none transition placeholder:text-[#b8a599] focus:bg-white focus:shadow-lg focus:shadow-orange-100/30"
                  style={{
                    border: "1px solid #ead8c8",
                    color: "#5c4c42",
                  }}
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingObservationId) {
                        onUpdateObservation(
                          student.id,
                          editingObservationId,
                          observationDraft,
                        );
                        return;
                      }
                      onCreateObservation(student.id, observationDraft);
                    }}
                    disabled={observationSavingStudentId === student.id}
                    className={`inline-flex h-12 w-full items-center justify-center rounded-[1.4rem] px-6 text-sm font-black text-white transition hover:-translate-y-0.5 sm:w-[220px] ${
                      observationSavingStudentId === student.id
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                    style={{
                      background:
                        observationSavingStudentId === student.id
                          ? "#7f746d"
                          : "linear-gradient(135deg, #ff8a2a 0%, #ff6a1a 100%)",
                      color: "#ffffff",
                      boxShadow: "0 14px 30px rgba(255, 122, 26, 0.24)",
                    }}
                    >
                    {observationSavingStudentId === student.id
                      ? "Se salvează..."
                      : editingObservationId
                        ? "Actualizează observația"
                        : "Adaugă observația"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingObservationId("");
                      setObservationDraft("");
                    }}
                    className="inline-flex h-12 w-full items-center justify-center rounded-[1.4rem] px-6 text-sm font-black transition hover:-translate-y-0.5 sm:w-[220px]"
                    style={{
                      border: "1px solid #f3d7c1",
                      backgroundColor: "#ffffff",
                      color: "#b8662c",
                      boxShadow: "0 10px 24px rgba(232, 142, 56, 0.08)",
                    }}
                  >
                    Resetează
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <PhotoPreviewModal
        photoUrl={previewPhotoUrl}
        onClose={() => setPreviewPhotoUrl("")}
      />
    </section>
  );
}

export default function StudentsList({
  hasSearched,
  totalStudents,
  students,
  expandedStudent,
  observationSavingStudentId,
  attendanceGradeSavingId,
  onCreateObservation,
  onUpdateObservation,
  onDeleteObservation,
  onSaveAttendanceGrade,
  onToggleStudent,
}) {
  if (!hasSearched) {
    return (
      <div className="rounded-2xl border border-dashed border-orange-200 bg-[#fffaf4] p-6 text-center text-sm font-semibold text-[#806d62]">
        Introdu un nume/email și apasă pe „Caută student”.
      </div>
    );
  }

  if (totalStudents === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-orange-200 bg-[#fffaf4] p-6 text-center text-sm font-semibold text-[#806d62]">
        Nu există prezențe pentru criteriile alese.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {students.map((student) => {
        const studentKey = student.email || student.nume;

        return (
          <StudentAttendanceCard
            key={studentKey}
            student={student}
            isOpen={expandedStudent === studentKey}
            observationSavingStudentId={observationSavingStudentId}
            attendanceGradeSavingId={attendanceGradeSavingId}
            onCreateObservation={onCreateObservation}
            onUpdateObservation={onUpdateObservation}
            onDeleteObservation={onDeleteObservation}
            onSaveAttendanceGrade={onSaveAttendanceGrade}
            onToggle={() => onToggleStudent(studentKey)}
          />
        );
      })}
    </div>
  );
}
