export function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 px-4 py-3 shadow-sm shadow-orange-950/5">
      <p className="text-[11px] font-black text-slate-500">{label}</p>
      <p className="mt-1 break-keep text-sm font-black leading-snug text-slate-950">{value || '-'}</p>
    </div>
  );
}
