export function LoadingPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-hanwha-100 bg-gradient-to-br from-hanwha-50 to-white px-5 py-6 text-center shadow-sm">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-hanwha-100/60" />
      <div className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-orange-100/50" />
      <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-hanwha-100">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-hanwha-100 border-t-hanwha-600" />
      </div>
      <p className="relative text-base font-black text-slate-950">{title}</p>
      <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      <div className="relative mt-5 h-2 overflow-hidden rounded-full bg-white ring-1 ring-orange-100">
        <div className="h-full w-2/3 animate-shimmer rounded-full bg-gradient-to-r from-hanwha-200 via-hanwha-500 to-hanwha-200" />
      </div>
    </div>
  );
}
