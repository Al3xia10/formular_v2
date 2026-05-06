export default function DashboardHero() {
  return (
    <div className="mb-6 rounded-[2rem] bg-gradient-to-br from-orange-500 to-rose-400 p-6 text-white shadow-xl shadow-orange-200 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-white/80">
        dashboard profesor
      </p>
      <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
        Prezențe studenți
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
        Caută un student după nume sau email și vezi rapid câte prezențe are la
        o anumită disciplină.
      </p>
    </div>
  );
}
