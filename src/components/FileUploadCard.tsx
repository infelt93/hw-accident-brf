'use client';

import type { ChangeEvent } from 'react';
import type { UploadedPhoto, UploadSlot } from '@/types/accident';

interface FileUploadCardProps {
  slot: UploadSlot;
  label: string;
  description: string;
  photo?: UploadedPhoto;
  onChange: (photo: UploadedPhoto) => void;
}

export function FileUploadCard({ slot, label, description, photo, onChange }: FileUploadCardProps) {
  const isUploaded = Boolean(photo);

  const handleChange = (event: ChangeEvent<HTMLInputElement>, source: 'upload' | 'camera') => {
    const file = event.target.files?.[0];
    if (!file) return;

    onChange({
      slot,
      label,
      fileName: file.name || `${label}-${source === 'camera' ? '촬영' : '업로드'}.jpg`,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      source
    });
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.5rem] border px-4 py-4 transition ${
        isUploaded
          ? 'border-hanwha-200 bg-white shadow-sm shadow-orange-950/5 ring-1 ring-hanwha-100'
          : 'border-dashed border-slate-300 bg-slate-50 hover:border-hanwha-400 hover:bg-hanwha-50/40'
      }`}
    >
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-hanwha-50 opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-center gap-3">
        {photo?.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.previewUrl}
            alt={`${label} 미리보기`}
            className="relative h-16 w-16 shrink-0 rounded-2xl border border-white object-cover shadow-md shadow-orange-950/10"
          />
        ) : (
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
            <svg className="h-8 w-8 text-hanwha-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M8.2 6.5 9.4 4h5.2l1.2 2.5H18a3 3 0 0 1 3 3V17a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9.5a3 3 0 0 1 3-3h2.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M12 16.5a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6Z" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-900">{label}</p>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${isUploaded ? 'bg-hanwha-50 text-hanwha-700' : 'bg-white text-slate-500'}`}>
              {isUploaded ? '추가됨' : '대기'}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
          {photo ? (
            <div className="mt-2 space-y-1">
              <p className="truncate rounded-full bg-hanwha-50 px-3 py-1 text-xs font-black text-hanwha-700">{photo.fileName}</p>
              <p className="text-[11px] font-bold text-slate-500">
                {photo.source === 'camera' ? '카메라 촬영 이미지로 업로드됨' : '앨범/파일에서 업로드됨'}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-100 focus-within:ring-4 focus-within:ring-hanwha-100">
          <span aria-hidden="true">＋</span>사진 업로드
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => handleChange(event, 'upload')} />
        </label>
        <label className="flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-hanwha-500 to-hanwha-700 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:from-hanwha-600 hover:to-hanwha-700 focus-within:ring-4 focus-within:ring-hanwha-100">
          <span aria-hidden="true">●</span>카메라 촬영
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => handleChange(event, 'camera')}
          />
        </label>
      </div>
    </div>
  );
}
