import { DISCLAIMER_TEXT } from '@/types/accident';

interface NoticeProps {
  compact?: boolean;
}

export function Notice({ compact = false }: NoticeProps) {
  return (
    <div className={`rounded-2xl border border-hanwha-200/80 bg-hanwha-50/90 text-hanwha-900 shadow-sm shadow-orange-950/5 ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'}`}>
      <div className="flex gap-2">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-hanwha-700" aria-hidden="true">i</span>
        <p className="leading-relaxed">{DISCLAIMER_TEXT}</p>
      </div>
    </div>
  );
}
