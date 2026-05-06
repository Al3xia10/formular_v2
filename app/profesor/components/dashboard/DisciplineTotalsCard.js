export default function DisciplineTotalsCard({
  hasSearched,
  disciplineTotals,
  onSelectDiscipline,
}) {
  if (!hasSearched || disciplineTotals.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 rounded-[1.75rem] border border-orange-100 bg-[#fffaf4] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
        Totaluri pe materie
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {disciplineTotals.map((item) => (
          <button
            key={item.disciplina}
            type="button"
            onClick={() => onSelectDiscipline(item.disciplina)}
            className="rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-orange-100 transition hover:bg-orange-50"
          >
            <p className="text-sm font-black text-[#2f2a25]">{item.disciplina}</p>
            <p className="mt-1 text-xs font-semibold text-[#806d62]">
              {item.attendanceCount} prezențe • {item.studentCount} student
              {item.studentCount === 1 ? "" : "i"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
