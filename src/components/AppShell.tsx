import Image from 'next/image';
import type { ReactNode } from 'react';
import { Notice } from './Notice';

interface AppShellProps {
  children: ReactNode;
  stepLabel?: string;
  stepNumber?: number;
  totalSteps?: number;
  canGoBack?: boolean;
  onBack?: () => void;
  floatingAction?: ReactNode;
}

export function AppShell({ children, stepLabel, stepNumber, totalSteps = 6, canGoBack, onBack, floatingAction }: AppShellProps) {
  const stepMarkers = Array.from({ length: totalSteps }, (_, index) => index + 1);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-3 py-4 sm:py-8">
      <section className="relative flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/90 bg-[#fffdf9]/95 shadow-soft ring-1 ring-orange-100/70 backdrop-blur">
        <header className="border-b border-orange-100/80 bg-white/95 px-5 pb-4 pt-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            {canGoBack && onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hanwha-100"
                aria-label="이전 단계로 이동"
              >
                ←
              </button>
            ) : null}
            <div className="flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-orange-100 bg-white p-1 shadow-sm">
              <Image
                src="/hanwha-logo.png"
                alt="한화손해보험 로고"
                width={58}
                height={53}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-hanwha-500">Accident Briefing</p>
              <h1 className="mt-1 truncate text-lg font-black text-slate-950">AI 사고 브리핑</h1>
            </div>
          </div>

          {stepNumber ? (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <span className="shrink-0 rounded-full bg-hanwha-50 px-2.5 py-1 text-[10px] font-black text-hanwha-700">
                  STEP {stepNumber}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-black text-slate-950">{stepLabel}</p>
                <span className="shrink-0 text-xs font-black text-slate-500">{stepNumber}/{totalSteps}</span>
              </div>
              <div
                className="mt-3 flex gap-1"
                role="progressbar"
                aria-label="진행 단계"
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-valuenow={stepNumber}
              >
                {stepMarkers.map((marker) => {
                  const isDone = marker < stepNumber;
                  const isCurrent = marker === stepNumber;

                  return (
                    <div
                      key={marker}
                      className={`h-2 flex-1 rounded-full transition ${
                        isCurrent
                          ? 'bg-gradient-to-r from-hanwha-500 to-hanwha-700 shadow-sm shadow-hanwha-600/20'
                          : isDone
                            ? 'bg-slate-400'
                            : 'bg-slate-200'
                      }`}
                      aria-label={`${marker}단계 ${isCurrent ? '현재' : isDone ? '완료' : '대기'}`}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}
        </header>

        <div className={`flex-1 overflow-y-auto bg-gradient-to-b from-white to-orange-50/30 px-5 py-5 ${floatingAction ? 'pb-36' : ''}`}>
          <div className="space-y-5">
            <Notice compact={Boolean(stepNumber)} />
            {children}
          </div>
        </div>

        {floatingAction ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 bg-gradient-to-t from-[#fffdf9] via-[#fffdf9]/95 to-transparent px-5 pb-5 pt-10">
            <div className="pointer-events-auto rounded-[1.6rem] border border-white/90 bg-white/95 p-3 shadow-2xl shadow-orange-950/15 backdrop-blur">
              {floatingAction}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
