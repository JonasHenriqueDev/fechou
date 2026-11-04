/** Esqueleto genérico das páginas do app enquanto o servidor carrega os dados. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Carregando" className="animate-fade-in">
      <div className="mb-5 flex items-end justify-between gap-3 md:pr-14">
        <div className="space-y-2">
          <div className="skeleton h-7 w-48" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="skeleton hidden h-10 w-36 rounded-xl sm:block" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card space-y-2 p-4">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-6 w-28" />
          </div>
        ))}
      </div>
      <div className="card divide-y divide-slate-100">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="skeleton h-10 w-10 flex-none rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4" style={{ width: `${70 - i * 7}%` }} />
              <div className="skeleton h-3 w-1/3" />
            </div>
            <div className="skeleton h-5 w-16" />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
