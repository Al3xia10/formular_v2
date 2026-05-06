import { useState } from "react";

function PhotoPreviewModal({ photoUrl, onClose }) {
  const [imageError, setImageError] = useState(false);

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
              src={photoUrl}
              alt="Poză QR"
              onError={() => setImageError(true)}
              className="mx-auto h-auto max-h-[55vh] w-auto max-w-full object-contain"
            />
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <a
            href={photoUrl}
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

function StudentAttendanceCard({ student, isOpen, onToggle }) {
  const studentKey = student.email || student.nume;
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState("");

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
          <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-[#806d62]">
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
            onToggle={() => onToggleStudent(studentKey)}
          />
        );
      })}
    </div>
  );
}
