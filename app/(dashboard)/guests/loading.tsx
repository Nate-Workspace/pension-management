export default function GuestsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-52 animate-pulse rounded bg-slate-200" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={`guest-metric-${index}`} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-7 w-14 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-10 w-72 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-[360px] animate-pulse rounded bg-slate-100" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="h-[420px] animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
