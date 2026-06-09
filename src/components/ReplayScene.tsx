'use client';

import { useMemo, useState } from 'react';
import type { Scenario } from '@/types/accident';
import { Button } from './Button';

interface ReplaySceneProps {
  scenario: Scenario;
  mode?: 'mini' | 'full' | 'static';
  title?: string;
  backgroundImageUrl?: string;
}

function Background({ type, mini }: { type: Scenario['replay']['background']; mini?: boolean }) {
  const labelClass = mini
    ? 'absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black text-slate-500 shadow-sm'
    : 'absolute left-4 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-black text-slate-500 shadow-sm';

  if (type === 'parking') {
    return (
      <>
        <div className="absolute inset-0 bg-slate-100 replay-grid" />
        <div className="absolute inset-x-0 top-[56%] h-[30%] -translate-y-1/2 bg-slate-400 shadow-inner" />
        <div className="absolute inset-x-0 top-[56%] h-px -translate-y-1/2 bg-white/70" />
        <div className="absolute left-[56%] top-0 h-[48%] w-[37%] border-x-2 border-b-2 border-white/90 bg-slate-200/90 shadow-sm" />
        <div className="absolute left-[68%] top-0 h-[48%] w-0 border-l-2 border-white/90" />
        <div className="absolute left-[80%] top-0 h-[48%] w-0 border-l-2 border-white/90" />
        <div className="absolute bottom-5 left-5 h-7 w-20 rounded-full bg-white/40 blur-sm" />
        <span className={labelClass}>PARKING</span>
      </>
    );
  }

  if (type === 'intersection') {
    return (
      <>
        <div className="absolute inset-0 bg-slate-200 replay-grid" />
        <div className="absolute left-0 right-0 top-[52%] h-24 -translate-y-1/2 bg-slate-500 shadow-inner" />
        <div className="absolute bottom-0 left-[47%] top-0 w-24 -translate-x-1/2 bg-slate-500 shadow-inner" />
        <div className="road-lane absolute left-0 right-0 top-[52%] h-1 -translate-y-1/2 opacity-80" />
        <div className="absolute bottom-0 left-[47%] top-0 w-1 -translate-x-1/2 bg-white/70" />
        <div className="absolute left-[35%] top-[31%] h-[13%] w-1 bg-white/70" />
        <div className="absolute left-[54%] top-[31%] h-[13%] w-1 bg-white/70" />
        <div className="absolute left-[35%] top-[62%] h-[13%] w-1 bg-white/70" />
        <div className="absolute left-[54%] top-[62%] h-[13%] w-1 bg-white/70" />
        <div className="absolute left-[27%] top-[40%] h-1 w-[16%] bg-white/70" />
        <div className="absolute left-[53%] top-[40%] h-1 w-[16%] bg-white/70" />
        <div className="absolute left-[27%] top-[63%] h-1 w-[16%] bg-white/70" />
        <div className="absolute left-[53%] top-[63%] h-1 w-[16%] bg-white/70" />
        <span className={labelClass}>INTERSECTION</span>
      </>
    );
  }

  if (type === 'alley') {
    return (
      <>
        <div className="absolute inset-0 bg-stone-100 replay-grid" />
        <div className="absolute left-0 right-0 top-[54%] h-[38%] -translate-y-1/2 bg-stone-500 shadow-inner" />
        <div className="absolute left-3 top-4 h-10 w-20 rounded-xl bg-white/65 shadow-sm" />
        <div className="absolute bottom-5 right-4 h-14 w-24 rounded-xl bg-white/65 shadow-sm" />
        <div className="absolute left-0 right-0 top-[54%] h-px -translate-y-1/2 bg-white/50" />
        <span className={labelClass}>ALLEY</span>
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-0 bg-slate-200 replay-grid" />
      <div className="absolute left-0 right-0 top-[50%] h-[46%] -translate-y-1/2 bg-slate-500 shadow-inner" />
      <div className="road-lane absolute left-0 right-0 top-[50%] h-1 -translate-y-1/2 opacity-90" />
      <div className="absolute left-0 right-0 top-[30%] h-px bg-white/50" />
      <div className="absolute left-0 right-0 top-[70%] h-px bg-white/50" />
      <div className="absolute left-5 top-[18%] h-12 w-24 rounded-2xl bg-white/35 blur-sm" />
      <span className={labelClass}>ROAD</span>
    </>
  );
}


type ReplayActorKey = 'myCar' | 'otherCar';

function angleFromPoints(from: { x: number; y: number }, to: { x: number; y: number }) {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}

function distanceBetween(from: { x: number; y: number }, to: { x: number; y: number }) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function firstMovementAngle(frames: Scenario['replay']['frames'], actorKey: ReplayActorKey) {
  for (let index = 0; index < frames.length - 1; index += 1) {
    const from = frames[index][actorKey];
    const to = frames[index + 1][actorKey];
    if (distanceBetween(from, to) > 0.4) return angleFromPoints(from, to);
  }

  return undefined;
}

function arrowAngle(scenario: Scenario, actorKey: ReplayActorKey) {
  const actor = actorKey === 'myCar' ? 'my' : 'other';
  const arrow = scenario.replay.arrows.find((item) => item.actor === actor && distanceBetween(item.from, item.to) > 0.4);
  return arrow ? angleFromPoints(arrow.from, arrow.to) : undefined;
}

function vehicleRotationForFrame(scenario: Scenario, frameIndex: number, actorKey: ReplayActorKey) {
  const frames = scenario.replay.frames;
  const current = frames[frameIndex]?.[actorKey];
  const next = frames[frameIndex + 1]?.[actorKey];
  const previous = frames[frameIndex - 1]?.[actorKey];

  if (current && next && distanceBetween(current, next) > 0.4) return angleFromPoints(current, next);
  if (previous && current && distanceBetween(previous, current) > 0.4) return angleFromPoints(previous, current);

  const ownMovement = firstMovementAngle(frames, actorKey);
  if (ownMovement !== undefined) return ownMovement;

  const ownArrow = arrowAngle(scenario, actorKey);
  if (ownArrow !== undefined) return ownArrow;

  // 정차 중 후방 추돌처럼 내 차량 좌표가 움직이지 않는 경우,
  // 상대 차량의 진행 방향을 차로 방향으로 간주해 정차 차량도 같은 방향을 보게 한다.
  if (actorKey === 'myCar' && scenario.estimatedType.includes('후방')) {
    const otherMovement = firstMovementAngle(frames, 'otherCar') ?? arrowAngle(scenario, 'otherCar');
    if (otherMovement !== undefined) return otherMovement;
  }

  // SVG 차량은 0도가 오른쪽을 향하도록 그려져 있다.
  return 0;
}

function poseWithAutoRotation(scenario: Scenario, frameIndex: number, actorKey: ReplayActorKey) {
  const pose = scenario.replay.frames[frameIndex]?.[actorKey] ?? scenario.replay.frames[0][actorKey];
  return {
    ...pose,
    rotation: vehicleRotationForFrame(scenario, frameIndex, actorKey)
  };
}

function Car({ pose, actor, mini }: { pose: { x: number; y: number; rotation: number }; actor: 'my' | 'other'; mini: boolean }) {
  const isMine = actor === 'my';
  const bodyFill = isMine ? '#f37321' : '#e11d48';
  const bodyStroke = isMine ? '#7c2d12' : '#9f1239';
  const roofFill = isMine ? '#fed7aa' : '#fecdd3';
  const label = isMine ? '내 차' : '상대';
  const width = mini ? 50 : 54;
  const height = mini ? 31 : 33;

  return (
    <div
      className="absolute z-20 transition-all duration-500 ease-out"
      style={{
        left: `${pose.x}%`,
        top: `${pose.y}%`,
        transform: `translate(-50%, -50%) rotate(${pose.rotation}deg)`
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 88 52"
        role="img"
        aria-label={label}
        className="overflow-visible"
        style={{ filter: mini ? 'drop-shadow(5px 7px 5px rgba(15, 23, 42, 0.34))' : 'drop-shadow(0 7px 6px rgba(15, 23, 42, 0.24))' }}
      >
        <rect x="13" y="2" width="15" height="7" rx="3" fill="#111827" />
        <rect x="13" y="43" width="15" height="7" rx="3" fill="#111827" />
        <rect x="60" y="2" width="15" height="7" rx="3" fill="#111827" />
        <rect x="60" y="43" width="15" height="7" rx="3" fill="#111827" />

        <path
          d="M14 9 H54 C70 9 82 16 84 25 C82 34 70 43 54 43 H14 C8 43 4 38 4 26 C4 14 8 9 14 9 Z"
          fill={bodyFill}
          stroke={bodyStroke}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M53 11 C67 12 78 17 82 25 C77 24 70 23 62 23 C59 18 56 14 53 11 Z" fill="rgba(255,255,255,0.22)" />
        <path d="M17 14 H45 C51 18 54 22 55 26 C54 30 51 35 45 39 H17 C13 36 11 31 11 26 C11 21 13 17 17 14 Z" fill={roofFill} opacity="0.92" />
        <path d="M25 16 H43 C47 19 49 23 50 26 H25 Z" fill="#dbeafe" opacity="0.92" />
        <path d="M25 27 H50 C49 31 47 34 43 37 H25 Z" fill="#c7d2fe" opacity="0.82" />
        <path d="M10 18 L16 15 L16 41 L10 38 C8 34 7 30 7 26 C7 22 8 20 10 18 Z" fill="rgba(15, 23, 42, 0.18)" />
        <rect x="78" y="18" width="5" height="6" rx="2" fill="#fef3c7" />
        <rect x="78" y="28" width="5" height="6" rx="2" fill="#fef3c7" />
        <rect x="5" y="18" width="4" height="5" rx="2" fill="#fecaca" />
        <rect x="5" y="29" width="4" height="5" rx="2" fill="#fecaca" />
        <path d="M69 25 L84 25" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>

      {!mini ? (
        <span
          className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-slate-700 shadow"
          style={{ transform: `translateX(-50%) rotate(${-pose.rotation}deg)` }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function ReplayScene({ scenario, mode = 'full', title, backgroundImageUrl }: ReplaySceneProps) {
  const [frameIndex, setFrameIndex] = useState(mode === 'static' ? scenario.replay.frames.length - 1 : 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const frames = scenario.replay.frames;
  const safeFrameIndex = mode === 'static' ? frames.length - 1 : Math.min(frameIndex, frames.length - 1);
  const currentFrame = frames[safeFrameIndex] ?? frames[0];
  const myCarPose = poseWithAutoRotation(scenario, safeFrameIndex, 'myCar');
  const otherCarPose = poseWithAutoRotation(scenario, safeFrameIndex, 'otherCar');
  const mini = mode === 'mini';
  const height = mini ? 'h-56' : mode === 'static' ? 'h-72' : 'h-80';

  const arrowMarkerIdMy = useMemo(() => `arrow-my-${scenario.id}-${mode}`, [scenario.id, mode]);
  const arrowMarkerIdOther = useMemo(() => `arrow-other-${scenario.id}-${mode}`, [scenario.id, mode]);

  const play = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setFrameIndex(0);
    let next = 0;
    const timer = window.setInterval(() => {
      next += 1;
      setFrameIndex(Math.min(next, frames.length - 1));
      if (next >= frames.length - 1) {
        window.clearInterval(timer);
        setIsPlaying(false);
      }
    }, mini ? 760 : 650);
  };

  return (
    <div className={mini ? 'space-y-3' : 'space-y-4'}>
      {title ? (
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          {!mini ? (
            <span className="rounded-full bg-hanwha-50 px-2.5 py-1 text-[10px] font-black text-hanwha-700">Top view</span>
          ) : null}
        </div>
      ) : null}
      <div className={`relative overflow-hidden rounded-[1.6rem] border border-orange-100 ${height} bg-gradient-to-b from-orange-50 to-stone-100 shadow-inner`}>
        {!mini ? (
          <div className="absolute right-3 top-3 z-30 rounded-2xl bg-white/92 px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm backdrop-blur">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-hanwha-500" />내 차량</div>
            <div className="mt-1 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />상대 차량</div>
            <div className="mt-1 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-300" />충돌 지점</div>
          </div>
        ) : null}
        {mini ? (
          <div className="absolute left-3 top-3 z-30 rounded-2xl bg-white/92 px-3 py-2 text-[10px] font-black text-slate-700 shadow-sm">
            <p className="mb-1 text-[9px] text-slate-500">상황 정리 미리보기</p>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-hanwha-500" />내 차량</div>
            <div className="mt-1 flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />상대 차량</div>
          </div>
        ) : null}

        <div
          className={mini
            ? 'absolute inset-x-3 bottom-4 top-10 rounded-[1.25rem] border border-white/70 shadow-lg overflow-hidden'
            : 'absolute inset-0 overflow-hidden'}
        >
          {backgroundImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={backgroundImageUrl}
                alt="업로드한 사고 현장 사진 배경"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/24" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-slate-950/20" />
              <div className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black text-slate-600 shadow-sm">현장 사진 기반 표시</div>
            </>
          ) : (
            <Background type={scenario.replay.background} mini={mini} />
          )}
          <svg className="absolute inset-0 z-10 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <marker id={arrowMarkerIdMy} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L6,3 z" fill="#f37321" />
              </marker>
              <marker id={arrowMarkerIdOther} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L6,3 z" fill="#e11d48" />
              </marker>
            </defs>
            {scenario.replay.arrows.map((arrow) => (
              <g key={arrow.id} opacity={mini ? 0.88 : 0.85}>
                <line
                  x1={arrow.from.x}
                  y1={arrow.from.y}
                  x2={arrow.to.x}
                  y2={arrow.to.y}
                  stroke={arrow.actor === 'my' ? '#f37321' : '#e11d48'}
                  strokeWidth={mini ? 3.2 : 2.8}
                  strokeDasharray="5 4"
                  markerEnd={`url(#${arrow.actor === 'my' ? arrowMarkerIdMy : arrowMarkerIdOther})`}
                />
                {!mini ? (
                  <text x={(arrow.from.x + arrow.to.x) / 2} y={(arrow.from.y + arrow.to.y) / 2 - 4} fill="#334155" fontSize="4" fontWeight="700">
                    {arrow.label}
                  </text>
                ) : null}
              </g>
            ))}
          </svg>
          <Car pose={myCarPose} actor="my" mini={mini} />
          <Car pose={otherCarPose} actor="other" mini={mini} />
          {currentFrame.collision ? (
            <div
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${currentFrame.collision.x}%`, top: `${currentFrame.collision.y}%` }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-amber-300 bg-amber-300/25 text-lg font-black text-amber-700 shadow-lg animate-pulseRing">
                !
              </div>
              <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-800 shadow-sm">
                충돌: {scenario.impactArea}
              </div>
            </div>
          ) : null}
        </div>

        <div className="absolute bottom-3 left-3 z-30 rounded-full bg-white/92 px-3 py-1 text-[11px] font-black text-slate-700 shadow">
          {currentFrame.label}
        </div>
      </div>

      {mode === 'mini' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-[11px] font-black text-hanwha-700">현재 장면 · {currentFrame.label}</span>
            <div className="flex gap-1" aria-label="미리보기 타임라인">
              {frames.map((frame, index) => (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => setFrameIndex(index)}
                  className={`h-2 w-5 rounded-full transition ${safeFrameIndex === index ? 'bg-hanwha-600' : 'bg-orange-100'}`}
                  aria-label={`${frame.label} 보기`}
                />
              ))}
            </div>
          </div>
          <Button fullWidth variant="secondary" onClick={play} disabled={isPlaying}>
            {isPlaying ? '미리보기 재생 중...' : '▶ 이 시나리오 수동 재생'}
          </Button>
        </div>
      ) : null}

      {mode === 'full' ? (
        <>
          <div className="rounded-3xl border border-orange-100 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black text-slate-900">타임라인</p>
              <p className="text-[11px] font-bold text-slate-500">{currentFrame.label}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
            {frames.map((frame, index) => (
              <button
                key={frame.id}
                className={`rounded-2xl px-2 py-2 text-[11px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hanwha-100 ${safeFrameIndex === index ? 'bg-hanwha-600 text-white shadow-md shadow-hanwha-600/20' : 'bg-orange-50 text-stone-600 hover:bg-orange-100'}`}
                onClick={() => setFrameIndex(index)}
                type="button"
              >
                {frame.label}
              </button>
            ))}
            </div>
          </div>
          <Button fullWidth onClick={play} disabled={isPlaying}>
            {isPlaying ? '상황 정리 재생 중...' : '▶ 사고 상황 정리 재생'}
          </Button>
        </>
      ) : null}
    </div>
  );
}
