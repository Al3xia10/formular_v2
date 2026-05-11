export default function SearchPanel({
  search,
  disciplina,
  loading,
  error,
  disciplineOptions,
  onSearchChange,
  onDisciplinaChange,
  onSubmit,
  onShowAllStudents,
  onOpenManualAttendance,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-xl shadow-orange-100/70 sm:p-6"
    >
      <h2 className="text-xl font-black text-[#2f2a25]">Caută prezențe</h2>
      <p className="mt-2 text-sm leading-6 text-[#806d62]">
        Poți căuta după nume, email sau poți filtra doar după disciplină.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
            Student
          </label>
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ex: Popescu Ana"
            className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none transition placeholder:text-[#b8a599] focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#4a3b33]">
            Disciplina
          </label>
          <select
            value={disciplina}
            onChange={(e) => onDisciplinaChange(e.target.value)}
            className="h-12 w-full rounded-2xl border border-[#ead8c8] bg-[#fffaf4] px-4 text-sm font-semibold text-[#2f2a25] outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
          >
            <option value="">Toate disciplinele</option>
            {disciplineOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`flex h-12 w-full items-center justify-center rounded-2xl bg-[#2f2a25] px-5 text-sm font-black text-white shadow-lg shadow-stone-300/70 transition ${
            loading ? "cursor-not-allowed opacity-60" : "hover:bg-black"
          }`}
        >
          {loading ? "Se caută..." : "Caută student"}
        </button>

        <div className="grid gap-2">
          <button
            type="button"
            onClick={onOpenManualAttendance}
            disabled={loading}
            className={`flex h-10 w-full items-center justify-center rounded-2xl border border-orange-200 bg-[#fffaf4] px-4 text-sm font-black text-orange-600 transition hover:bg-orange-50 ${
              loading ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            Adaugă prezență manual
          </button>

          <button
            type="button"
            onClick={onShowAllStudents}
            disabled={loading}
            style={{ backgroundColor: "#ff7a1a", color: "#ffffff" }}
            className={`mb-2 flex h-10 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff7a1a] to-[#ff4f6d] px-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl ${
              loading ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            Vezi toți studenții
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}
    </form>
  );
}
