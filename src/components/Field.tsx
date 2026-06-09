import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function FieldGroup({ label, children, helper }: { label: string; children: ReactNode; helper?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-black text-slate-800">{label}</span>
      {children}
      {helper ? <span className="block text-xs leading-relaxed text-slate-500">{helper}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-hanwha-500 focus:ring-4 focus:ring-hanwha-100"
      {...props}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="min-h-28 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-hanwha-500 focus:ring-4 focus:ring-hanwha-100"
      {...props}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 shadow-sm outline-none transition focus:border-hanwha-500 focus:ring-4 focus:ring-hanwha-100"
      {...props}
    />
  );
}
