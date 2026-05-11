"use client";

import { useEffect, useMemo, useState } from "react";

const EMPTY_FORM = {
  search: "",
  disciplina: "",
  tipDisciplina: "",
  serie: "",
};

function SelectedStudentSummary({ student }) {
  if (!student) {
    return (
      <div className="rounded-2xl border border-dashed border-orange-200 bg-[#fffaf4] px-4 py-3 text-sm font-semibold text-[#806d62]">
        Selectează studentul din lista afișată pentru a completa automat anul,
        grupa și seria.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-[#fffaf4] px-4 py-3">
      <p className="text-sm font-black text-[#2f2a25]">{student.fullName}</p>
      <p className="mt-1 text-xs font-semibold text-[#806d62]">
        Grupa {student.groupCode} • Anul {student.studyYear}
        {student.series ? ` • Seria ${student.series}` : ""}
      </p>
    </div>
  );
}

export default function ManualAttendanceModal({
  show,
  loading,
  disciplineOptions,
  disciplineTypes,
  seriesOptions,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTouched, setSearchTouched] = useState(false);

  const effectiveSeries = selectedStudent?.series || form.serie;
  const isSeriesLocked = Boolean(selectedStudent?.series);
  const filteredSeriesOptions = useMemo(
    () => [...new Set(seriesOptions.filter(Boolean))],
    [seriesOptions],
  );

  useEffect(() => {
    if (!show) {
      setForm(EMPTY_FORM);
      setSelectedStudent(null);
      setSuggestions([]);
      setSearchLoading(false);
      setError("");
      setSearchTouched(false);
      return;
    }

    setForm((current) => ({
      ...current,
      tipDisciplina: current.tipDisciplina || disciplineTypes[0] || "",
    }));
  }, [disciplineTypes, show]);

  useEffect(() => {
    if (!show) {
      return undefined;
    }

    const query = form.search.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setSearchLoading(false);
      return undefined;
    }

    let isCancelled = false;
    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await fetch(
          `/api/students/search?q=${encodeURIComponent(query)}`,
          { cache: "no-store" },
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Nu am putut încărca lista de studenți.",
          );
        }

        if (!isCancelled) {
          setSuggestions(data.students || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setSuggestions([]);
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [form.search, show]);

  if (!show) {
    return null;
  }

  const handleChange = (key, value) => {
    setError("");

    if (key === "search") {
      setSearchTouched(true);
      setSelectedStudent(null);
      setSuggestions([]);
      setForm((current) => ({
        ...current,
        search: value,
        serie: "",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSuggestions([]);
    setSearchTouched(false);
    setForm((current) => ({
      ...current,
      search: student.fullName,
      serie: student.series || current.serie || "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!selectedStudent) {
      setError("Selectează studentul din lista afișată.");
      return;
    }

    if (!form.disciplina) {
      setError("Selectează disciplina.");
      return;
    }

    if (!form.tipDisciplina) {
      setError("Selectează tipul disciplinei.");
      return;
    }

    if (!effectiveSeries) {
      setError("Selectează seria studentului.");
      return;
    }

    try {
      await onSubmit({
        studentId: selectedStudent.id,
        disciplina: form.disciplina,
        tipDisciplina: form.tipDisciplina,
        serie: effectiveSeries,
      });
      setForm(EMPTY_FORM);
      setSelectedStudent(null);
      setSuggestions([]);
      setSearchTouched(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#2f2a25]/55 px-4 py-6 backdrop-blur-sm"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-2xl shadow-orange-200/70 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-500">
              Prezență manuală
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#2f2a25]">
              Adaugă studentul în dashboard
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#806d62]">
              Folosește această opțiune dacă un student nu reușește să trimită
              prezența din formular. Studentul trebuie selectat din catalog.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fffaf4] text-2xl font-black leading-none text-[#2f2a25] ring-1 ring-orange-100 transition hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Închide"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="relative">
            <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
              Nume student
            </label>
            <input
              value={form.search}
              onChange={(event) => handleChange("search", event.target.value)}
              placeholder="Scrie cel puțin 2 litere și alege studentul din listă"
              className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none transition placeholder:text-[#b8a599] focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
            />

            {searchTouched && suggestions.length > 0 && (
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-orange-100 bg-white p-2 shadow-xl shadow-orange-100/70">
                {suggestions.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => handleSelectStudent(student)}
                    className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-[#fffaf4]"
                  >
                    <p className="text-sm font-black text-[#2f2a25]">
                      {student.fullName}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#806d62]">
                      Grupa {student.groupCode} • Anul {student.studyYear}
                      {student.series ? ` • Seria ${student.series}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {searchTouched &&
              form.search.trim().length >= 2 &&
              !searchLoading &&
              suggestions.length === 0 && (
                <p className="mt-2 text-xs font-semibold text-[#806d62]">
                  Nu am găsit studentul în catalog pentru textul introdus.
                </p>
              )}

            {searchLoading && (
              <p className="mt-2 text-xs font-semibold text-[#806d62]">
                Se caută studentul în catalog...
              </p>
            )}
          </div>

          <SelectedStudentSummary student={selectedStudent} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                Disciplina
              </label>
              <select
                value={form.disciplina}
                onChange={(event) =>
                  handleChange("disciplina", event.target.value)
                }
                className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Alege disciplina</option>
                {disciplineOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                Tipul disciplinei
              </label>
              <select
                value={form.tipDisciplina}
                onChange={(event) =>
                  handleChange("tipDisciplina", event.target.value)
                }
                className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
              >
                <option value="">Alege tipul</option>
                {disciplineTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                An
              </label>
              <input
                value={selectedStudent?.studyYear || ""}
                readOnly
                className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#f7efe6] px-4 text-sm font-semibold text-[#806d62] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                Grupa
              </label>
              <input
                value={selectedStudent?.groupCode || ""}
                readOnly
                className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#f7efe6] px-4 text-sm font-semibold text-[#806d62] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
                Seria
              </label>
              {isSeriesLocked ? (
                <input
                  value={effectiveSeries}
                  readOnly
                  className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#f7efe6] px-4 text-sm font-semibold text-[#806d62] outline-none"
                />
              ) : (
                <select
                  value={form.serie}
                  onChange={(event) =>
                    handleChange("serie", event.target.value)
                  }
                  className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                >
                  <option value="">Alege seria</option>
                  {filteredSeriesOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-11 rounded-2xl border border-[#ead8c8] bg-white px-5 text-sm font-black text-[#806d62] transition hover:bg-[#fffaf4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Renunță
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`h-11 rounded-2xl bg-[#2f2a25] px-5 text-sm font-black text-white shadow-lg shadow-stone-300/70 transition ${
                loading ? "cursor-not-allowed opacity-60" : "hover:bg-black"
              }`}
            >
              {loading ? "Se salvează..." : "Adaugă prezența manual"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
