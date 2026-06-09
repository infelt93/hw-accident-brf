'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/Button';
import { FieldGroup, SelectInput, TextArea } from '@/components/Field';
import { FileUploadCard } from '@/components/FileUploadCard';
import { InfoPill } from '@/components/InfoPill';
import { LoadingPanel } from '@/components/LoadingPanel';
import { ReplayScene } from '@/components/ReplayScene';
import { buildInterviewQuestions } from '@/data/mockScenarios';
import { mockAI } from '@/services/aiService';
import {
  DIRECTIONS,
  IMPACT_AREAS,
  PLACE_TYPES,
  VEHICLE_STATES,
  type AccidentNarrativeResult,
  type BasicAccidentInfo,
  type InterviewAnswers,
  type PhotoAnalysisResult,
  type PlaceType,
  type ReplayConfig,
  type Scenario,
  type ScenarioDraft,
  type UploadedPhoto,
  type UploadSlot
} from '@/types/accident';

type Step =
  | 'home'
  | 'photos'
  | 'analysis'
  | 'interview'
  | 'scenarios'
  | 'edit'
  | 'summary'
  | 'complete';

const initialInfo: BasicAccidentInfo = {
  accidentDateTime: '2026-06-07T14:20',
  location: '서울시 강남구 테헤란로 교차로 인근',
  placeType: '교차로',
  briefDescription: ''
};

const stepMeta: Record<Exclude<Step, 'home'>, { label: string; number: number }> = {
  photos: { label: '사진 업로드 및 기본정보 확인', number: 1 },
  analysis: { label: '사진 분석 내용 확인 및 수정', number: 2 },
  interview: { label: '추가 질문으로 설명 보완', number: 3 },
  scenarios: { label: '사고 상황 정리 장면 확인', number: 4 },
  edit: { label: '상황 정리 정보 수정', number: 4 },
  summary: { label: '참고자료 초안 최종 확인', number: 5 },
  complete: { label: '참고자료 생성 완료', number: 6 }
};

const routeStepToAppStep: Record<string, Step> = {
  '1': 'photos',
  '2': 'analysis',
  '3': 'interview',
  '4': 'scenarios',
  '5': 'summary',
  '6': 'complete'
};

const appStepToRoutePath: Record<Step, string> = {
  home: '/',
  photos: '/step/1',
  analysis: '/step/2',
  interview: '/step/3',
  scenarios: '/step/4',
  edit: '/step/4',
  summary: '/step/5',
  complete: '/step/6'
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const stepOrder: Record<Step, number> = {
  home: 0,
  photos: 1,
  analysis: 2,
  interview: 3,
  scenarios: 4,
  edit: 4,
  summary: 5,
  complete: 6
};

function withBasePath(path: string) {
  if (!BASE_PATH) return path;
  if (path === '/') return BASE_PATH || '/';
  return `${BASE_PATH}${path}`;
}

function stripBasePath(pathname: string) {
  if (!BASE_PATH) return pathname;
  if (pathname === BASE_PATH) return '/';
  if (pathname.startsWith(`${BASE_PATH}/`)) return pathname.slice(BASE_PATH.length) || '/';
  return pathname;
}

function publicAssetPath(path: string) {
  if (!BASE_PATH || path.startsWith('blob:') || path.startsWith('data:') || /^https?:\/\//.test(path)) return path;
  return `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

const uploadSlots: Array<{ slot: UploadSlot; label: string; description: string }> = [
  { slot: 'ownDamage', label: '내 차량 파손 사진', description: '파손 부위가 잘 보이는 사진을 추가하세요.' },
  { slot: 'opponentVehicle', label: '상대 차량 사진', description: '상대 차량 위치나 파손 부위를 기록합니다.' },
  { slot: 'scene', label: '사고 현장 사진', description: '도로, 차선, 주차면 등 현장 정보를 남깁니다.' }
];

const demoPhotos: Record<UploadSlot, UploadedPhoto> = {
  ownDamage: {
    slot: 'ownDamage',
    label: '내 차량 파손 사진',
    fileName: 'own-car.png',
    size: 625_895,
    previewUrl: publicAssetPath('/demo-photos/own-car.png'),
    source: 'upload'
  },
  opponentVehicle: {
    slot: 'opponentVehicle',
    label: '상대 차량 사진',
    fileName: 'opponent.png',
    size: 564_338,
    previewUrl: publicAssetPath('/demo-photos/opponent.png'),
    source: 'upload'
  },
  scene: {
    slot: 'scene',
    label: '사고 현장 사진',
    fileName: 'scene.png',
    size: 1_463_420,
    previewUrl: publicAssetPath('/demo-photos/scene.png'),
    source: 'upload'
  }
};

function createDemoPhoto(slot: UploadSlot, source: NonNullable<UploadedPhoto['source']> = 'upload'): UploadedPhoto {
  return {
    ...demoPhotos[slot],
    source
  };
}

function createCompleteDemoPhotos(
  currentPhotos: Partial<Record<UploadSlot, UploadedPhoto>> = {},
  fallbackSource: NonNullable<UploadedPhoto['source']> = 'upload'
): Record<UploadSlot, UploadedPhoto> {
  return uploadSlots.reduce(
    (acc, item) => {
      acc[item.slot] = createDemoPhoto(item.slot, currentPhotos[item.slot]?.source ?? fallbackSource);
      return acc;
    },
    {} as Record<UploadSlot, UploadedPhoto>
  );
}

function stepFromPathname(pathname: string): Step | null {
  const normalizedPathname = stripBasePath(pathname);

  if (normalizedPathname === '/') return 'home';

  const match = normalizedPathname.match(/^\/step\/([1-6])\/?$/);
  if (!match) return null;

  return routeStepToAppStep[match[1]] ?? null;
}

function previousStepFor(currentStep: Step): Step {
  if (currentStep === 'complete') return 'summary';
  if (currentStep === 'summary') return 'scenarios';
  if (currentStep === 'scenarios' || currentStep === 'edit') return 'interview';
  if (currentStep === 'interview') return 'analysis';
  if (currentStep === 'analysis') return 'photos';
  return 'home';
}

function updateBrowserPath(step: Step, mode: 'push' | 'replace' = 'push') {
  if (typeof window === 'undefined') return;

  const nextPath = withBasePath(appStepToRoutePath[step]);
  if (window.location.pathname === nextPath) return;

  if (mode === 'replace') {
    window.history.replaceState({ step }, '', nextPath);
    return;
  }

  window.history.pushState({ step }, '', nextPath);
}

function toDraft(scenario: Scenario): ScenarioDraft {
  return {
    scenarioId: scenario.id,
    title: scenario.title,
    placeType: scenario.placeType,
    myVehicleState: scenario.myVehicleState,
    otherVehicleDirection: scenario.otherVehicleDirection,
    impactArea: scenario.impactArea,
    estimatedType: scenario.estimatedType
  };
}

function backgroundForPlace(placeType: PlaceType): ReplayConfig['background'] {
  if (placeType === '주차장') return 'parking';
  if (placeType === '교차로') return 'intersection';
  if (placeType === '골목길') return 'alley';
  return 'road';
}

function applyDraftToScenario(scenario: Scenario, draft: ScenarioDraft): Scenario {
  return {
    ...scenario,
    placeType: draft.placeType,
    myVehicleState: draft.myVehicleState,
    otherVehicleDirection: draft.otherVehicleDirection,
    impactArea: draft.impactArea,
    estimatedType: draft.estimatedType,
    replay: {
      ...scenario.replay,
      background: backgroundForPlace(draft.placeType)
    },
    summary: [
      `고객 차량은 ${draft.placeType}에서 ${draft.myVehicleState}`,
      `상대 차량 위치/방향: ${draft.otherVehicleDirection}`,
      `충돌 지점: ${draft.impactArea}`
    ]
  };
}

function sectionTitle(eyebrow: string, title: string, description?: string) {
  return (
    <div className="rounded-[1.5rem] border border-white/80 bg-white/85 p-4 shadow-sm shadow-orange-950/5">
      <p className="inline-flex rounded-full bg-hanwha-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-hanwha-700">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p> : null}
    </div>
  );
}

function structuredRows(result: AccidentNarrativeResult | null, fallback?: ScenarioDraft) {
  const source = result?.structured ?? fallback;
  if (!source) return [];

  return [
    ['사고 장소 유형', source.placeType],
    ['내 차량 상태', source.myVehicleState],
    ['상대 차량 방향', source.otherVehicleDirection],
    ['충돌 부위', source.impactArea],
    ['추정 사고 유형', source.estimatedType]
  ];
}

function directionFromImpactArea(impactArea?: string) {
  if (!impactArea) return '';
  if (impactArea.includes('우측')) return '우측';
  if (impactArea.includes('좌측')) return '좌측';
  if (impactArea.includes('후면')) return '후방';
  if (impactArea.includes('전면')) return '전방';
  return '';
}

function defaultVehicleStateFromInfo(info: BasicAccidentInfo): ScenarioDraft['myVehicleState'] {
  const text = `${info.placeType} ${info.briefDescription}`;
  if (/정차|신호|멈/.test(text)) return '정차 중';
  if (/후진|뒤로/.test(text)) return '후진 중';
  if (/주차|출차|입차|주차면/.test(text)) return info.placeType === '주차장' ? '주차장 통로 이동 중' : '주차 중';
  if (info.placeType === '주차장') return '주차장 통로 이동 중';
  return '직진 중';
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  });

  if (line) {
    context.fillText(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function base64ToBytes(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function createSingleImagePdf(imageBytes: Uint8Array, imageWidth: number, imageHeight: number) {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;

  const addString = (value: string) => {
    const bytes = encoder.encode(value);
    chunks.push(bytes);
    offset += bytes.length;
  };

  const addBytes = (bytes: Uint8Array) => {
    chunks.push(bytes);
    offset += bytes.length;
  };

  const addObject = (id: number, writeBody: () => void) => {
    offsets[id] = offset;
    addString(`${id} 0 obj\n`);
    writeBody();
    addString('\nendobj\n');
  };

  const pageWidth = 595;
  const pageHeight = 842;
  const drawCommand = `q ${pageWidth} 0 0 ${pageHeight} 0 0 cm /Im0 Do Q`;

  addString('%PDF-1.4\n');
  addObject(1, () => addString('<< /Type /Catalog /Pages 2 0 R >>'));
  addObject(2, () => addString('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
  addObject(3, () => {
    addString(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  });
  addObject(4, () => {
    addString(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`);
    addBytes(imageBytes);
    addString('\nendstream');
  });
  addObject(5, () => {
    addString(`<< /Length ${encoder.encode(drawCommand).length} >>\nstream\n${drawCommand}\nendstream`);
  });

  const xrefOffset = offset;
  addString('xref\n0 6\n0000000000 65535 f \n');
  for (let id = 1; id <= 5; id += 1) {
    addString(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
  }
  addString(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  const blobParts = chunks.map((chunk) => chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength) as ArrayBuffer);
  return new Blob(blobParts, { type: 'application/pdf' });
}

async function createReferenceMaterialPdf({
  receiptNo,
  info,
  narrative,
  rows,
  photoNames
}: {
  receiptNo: string;
  info: BasicAccidentInfo;
  narrative: string;
  rows: Array<[string, string]>;
  photoNames: string[];
}) {
  const canvas = document.createElement('canvas');
  const width = 1240;
  const height = 1754;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('PDF 생성을 위한 캔버스를 만들 수 없습니다.');

  context.fillStyle = '#fffaf5';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#ffffff';
  context.roundRect(70, 70, width - 140, height - 140, 42);
  context.fill();

  context.fillStyle = '#f37321';
  context.font = '700 30px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('AI 사고 브리핑', 120, 145);
  context.fillStyle = '#0f172a';
  context.font = '900 54px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('사고 참고자료', 120, 220);

  context.fillStyle = '#64748b';
  context.font = '700 24px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText(`자료번호 ${receiptNo || '-'}`, 120, 278);
  context.fillText(`생성일시 ${new Date().toLocaleString('ko-KR')}`, 120, 318);

  context.fillStyle = '#fff7ed';
  context.roundRect(120, 365, 1000, 116, 24);
  context.fill();
  context.fillStyle = '#3f2412';
  context.font = '700 24px -apple-system, BlinkMacSystemFont, sans-serif';
  drawWrappedText(context, 'AI는 사고 원인, 과실, 책임을 판단하지 않습니다. 고객님의 사고 설명을 돕기 위한 보조 서비스입니다.', 155, 422, 920, 34);

  context.fillStyle = '#0f172a';
  context.font = '900 34px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('접수된 사고 정보', 120, 565);

  const infoRows: Array<[string, string]> = [
    ['사고 일시', info.accidentDateTime.replace('T', ' ')],
    ['사고 장소', info.location],
    ...rows
  ];

  let y = 610;
  infoRows.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? 120 : 640;
    if (index % 2 === 0 && index > 0) y += 118;
    context.fillStyle = '#f8fafc';
    context.roundRect(x, y, 480, 88, 20);
    context.fill();
    context.fillStyle = '#64748b';
    context.font = '700 20px -apple-system, BlinkMacSystemFont, sans-serif';
    context.fillText(label, x + 26, y + 32);
    context.fillStyle = '#0f172a';
    context.font = '900 25px -apple-system, BlinkMacSystemFont, sans-serif';
    drawWrappedText(context, value || '-', x + 26, y + 64, 420, 30);
  });

  y += 150;
  context.fillStyle = '#0f172a';
  context.font = '900 34px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('사고 설명 초안', 120, y);
  context.fillStyle = '#fff7ed';
  context.roundRect(120, y + 32, 1000, 210, 24);
  context.fill();
  context.fillStyle = '#1f2937';
  context.font = '700 25px -apple-system, BlinkMacSystemFont, sans-serif';
  const afterNarrativeY = drawWrappedText(context, narrative, 155, y + 85, 930, 38);

  const diagramY = Math.max(afterNarrativeY + 70, y + 300);
  context.fillStyle = '#0f172a';
  context.font = '900 34px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('상황 정리 도식', 120, diagramY);
  context.fillStyle = '#e2e8f0';
  context.roundRect(120, diagramY + 36, 1000, 290, 28);
  context.fill();
  context.fillStyle = '#64748b';
  context.fillRect(120, diagramY + 144, 1000, 86);
  context.fillRect(580, diagramY + 36, 88, 290);
  context.fillStyle = '#f37321';
  context.roundRect(370, diagramY + 165, 145, 48, 18);
  context.fill();
  context.fillStyle = '#e11d48';
  context.roundRect(610, diagramY + 190, 48, 145, 18);
  context.fill();
  context.fillStyle = '#fbbf24';
  context.beginPath();
  context.arc(610, diagramY + 205, 32, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#ffffff';
  context.font = '900 20px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('내 차량', 390, diagramY + 198);
  context.fillText('상대 차량', 675, diagramY + 270);
  context.fillStyle = '#0f172a';
  context.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('화면의 2D 상황 정리 장면을 간략 도식화한 참고 이미지입니다.', 155, diagramY + 374);

  const photoY = diagramY + 450;
  context.fillStyle = '#0f172a';
  context.font = '900 34px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('첨부 사진', 120, photoY);
  context.fillStyle = '#475569';
  context.font = '700 24px -apple-system, BlinkMacSystemFont, sans-serif';
  const photoText = photoNames.length ? photoNames.join(' / ') : '첨부 사진 없음';
  drawWrappedText(context, photoText, 120, photoY + 52, 1000, 34);

  context.fillStyle = '#94a3b8';
  context.font = '700 20px -apple-system, BlinkMacSystemFont, sans-serif';
  context.fillText('본 자료는 고객 설명 정리를 돕는 참고자료이며, 최종 보상 판단은 담당자 검토 후 결정됩니다.', 120, height - 125);

  const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const imageBytes = base64ToBytes(jpegDataUrl.split(',')[1]);
  return createSingleImagePdf(imageBytes, width, height);
}

export default function Home() {
  const pathname = usePathname();
  const initialRouteStep = stepFromPathname(pathname) ?? 'home';

  const [step, setStep] = useState<Step>(initialRouteStep);
  const [history, setHistory] = useState<Step[]>([]);
  const [info, setInfo] = useState<BasicAccidentInfo>(initialInfo);
  const [photos, setPhotos] = useState<Partial<Record<UploadSlot, UploadedPhoto>>>({});
  const [answers, setAnswers] = useState<InterviewAnswers>({});
  const [photoAnalysis, setPhotoAnalysis] = useState<PhotoAnalysisResult | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showAlternativeScenarios, setShowAlternativeScenarios] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [draft, setDraft] = useState<ScenarioDraft | null>(null);
  const [narrativeResult, setNarrativeResult] = useState<AccidentNarrativeResult | null>(null);
  const [isBasicInfoLoading, setIsBasicInfoLoading] = useState(false);
  const [basicInfoProgress, setBasicInfoProgress] = useState(0);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [isScenarioLoading, setIsScenarioLoading] = useState(false);
  const [isNarrativeLoading, setIsNarrativeLoading] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [isAnalysisEditOpen, setIsAnalysisEditOpen] = useState(false);
  const [customerChecked, setCustomerChecked] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');

  const uploadedPhotos = useMemo(
    () => Object.values(photos).filter((photo): photo is UploadedPhoto => Boolean(photo)),
    [photos]
  );

  const scenePhoto = photos.scene;
  const scenePhotoUrl = scenePhoto?.previewUrl;
  const referencePhotoUrl = scenePhotoUrl ?? uploadedPhotos[0]?.previewUrl;

  const activeInterviewQuestions = useMemo(() => buildInterviewQuestions(info, photoAnalysis ?? undefined), [info, photoAnalysis]);
  const confirmedAnswerLabels: Record<string, string> = {
    myVehicleState: '내 차량 상태',
    otherVehicleDirection: '상대 차량 방향',
    impactArea: '충돌 부위'
  };
  const pendingInterviewQuestions = activeInterviewQuestions.filter((question) => !confirmedAnswerLabels[question.id] || !answers[question.id] || answers[question.id] === '잘 모르겠음');
  const autoAnalysisRows = useMemo(() => {
    if (!photoAnalysis) return [];

    const impactArea = answers.impactArea || photoAnalysis.suggested.impactArea || '잘 모르겠음';
    const otherVehicleDirection = answers.otherVehicleDirection || directionFromImpactArea(impactArea) || '잘 모르겠음';
    const myVehicleState = answers.myVehicleState || defaultVehicleStateFromInfo(info);

    return [
      { label: '사고 장소 유형', value: info.placeType },
      { label: '내 차량 상태', value: myVehicleState },
      { label: '상대 차량 방향', value: otherVehicleDirection },
      { label: '충돌 부위', value: impactArea }
    ];
  }, [answers.impactArea, answers.myVehicleState, answers.otherVehicleDirection, info, photoAnalysis]);

  const currentScenario = useMemo(() => {
    if (!selectedScenario) return null;
    return draft ? applyDraftToScenario(selectedScenario, draft) : selectedScenario;
  }, [draft, selectedScenario]);

  const alternativeScenarios = scenarios.filter((scenario) => scenario.id !== selectedScenario?.id);
  const visibleAlternativeScenarios = showAlternativeScenarios ? alternativeScenarios : [];
  const alternativeScenarioCount = alternativeScenarios.length;
  const currentScenarioLabel = selectedScenario?.id === scenarios[0]?.id ? '추천 상황 정리' : '선택한 상황 정리';

  const meta = step === 'home' ? undefined : stepMeta[step];

  const hydrateRoutePrerequisites = async (targetStep: Step) => {
    const targetOrder = stepOrder[targetStep];
    if (targetOrder <= 1) return;

    let nextPhotos = photos;
    const hasPhotos = Object.values(nextPhotos).some(Boolean);
    if (!hasPhotos) {
      nextPhotos = createCompleteDemoPhotos();
      setPhotos(nextPhotos);
    }

    const photoList = Object.values(nextPhotos).filter((photo): photo is UploadedPhoto => Boolean(photo));

    let nextPhotoAnalysis = photoAnalysis;
    if (targetOrder >= 2 && !nextPhotoAnalysis) {
      setIsPhotoLoading(targetStep === 'analysis');
      nextPhotoAnalysis = await mockAI.analyzePhotos(photoList, info);
      setPhotoAnalysis(nextPhotoAnalysis);
      setIsPhotoLoading(false);
    }

    let nextAnswers = answers;
    if (targetOrder >= 3) {
      const confirmedImpact = nextAnswers.impactArea || nextPhotoAnalysis?.suggested.impactArea || '우측 후면';
      const confirmedDirection = nextAnswers.otherVehicleDirection || directionFromImpactArea(confirmedImpact) || '우측';
      nextAnswers = {
        ...nextAnswers,
        myVehicleState: nextAnswers.myVehicleState || defaultVehicleStateFromInfo(info),
        impactArea: confirmedImpact,
        otherVehicleDirection: confirmedDirection,
        laneChange: nextAnswers.laneChange || (confirmedDirection === '우측' || confirmedDirection === '좌측' ? '상대 차량' : '잘 모르겠음')
      };
      setAnswers(nextAnswers);
    }

    let nextScenarios = scenarios;
    let nextSelectedScenario = selectedScenario;
    let nextDraft = draft;
    if (targetOrder >= 4 && (!nextScenarios.length || !nextSelectedScenario || !nextDraft)) {
      setIsScenarioLoading(targetStep === 'scenarios');
      nextScenarios = await mockAI.generateAccidentScenarios(info, nextAnswers, nextPhotoAnalysis ?? undefined);
      nextSelectedScenario = nextScenarios[0] ?? null;
      nextDraft = nextSelectedScenario ? toDraft(nextSelectedScenario) : null;
      setScenarios(nextScenarios);
      setSelectedScenario(nextSelectedScenario);
      setDraft(nextDraft);
      setShowAlternativeScenarios(false);
      setIsScenarioLoading(false);
    }

    if (targetOrder >= 5 && nextDraft && !narrativeResult) {
      setIsNarrativeLoading(targetStep === 'summary');
      const result = await mockAI.generateNarrative(info, nextDraft);
      setNarrativeResult(result);
      setIsNarrativeLoading(false);
    }

    if (targetOrder >= 6) {
      setCustomerChecked(true);
      setReceiptNo((prev) => prev || `AIMR-${new Date().getFullYear()}-DEMO01`);
    }
  };

  useEffect(() => {
    const routeStep = stepFromPathname(pathname);

    if (!routeStep) {
      const invalidRouteTimer = window.setTimeout(() => {
        updateBrowserPath('home', 'replace');
        setStep('home');
      }, 0);

      return () => window.clearTimeout(invalidRouteTimer);
    }

    const syncFromRoute = () => {
      setStep((current) => {
        if (current === 'edit' && routeStep === 'scenarios') return current;
        return current === routeStep ? current : routeStep;
      });
      void hydrateRoutePrerequisites(routeStep);
    };

    const syncTimer = window.setTimeout(syncFromRoute, 0);
    return () => window.clearTimeout(syncTimer);
    // URL 변경 시에만 내부 단계를 동기화합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    const handlePopState = () => {
      const routeStep = stepFromPathname(window.location.pathname);
      if (!routeStep) {
        updateBrowserPath('home', 'replace');
        setStep('home');
        return;
      }

      setStep((current) => {
        if (current === 'edit' && routeStep === 'scenarios') return current;
        return current === routeStep ? current : routeStep;
      });
      void hydrateRoutePrerequisites(routeStep);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // 브라우저 뒤로가기/앞으로가기만 구독합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info, answers, photos, photoAnalysis, scenarios, selectedScenario, draft, narrativeResult]);

  const navigate = (nextStep: Step) => {
    if (nextStep === step) return;
    setHistory((prev) => [...prev, step]);
    setStep(nextStep);
    updateBrowserPath(nextStep);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  const goBack = () => {
    const previousStep = history[history.length - 1] ?? previousStepFor(step);
    setHistory((prev) => prev.slice(0, -1));
    setStep(previousStep);
    updateBrowserPath(previousStep);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  /*
   * URL 라우팅은 Next router.push 대신 native history API를 사용한다.
   * 이유: router.push('/step/2')는 page segment를 교체하면서 파일 업로드 previewUrl 등
   * 로컬 MVP 상태를 잃을 수 있다. history.pushState는 URL만 바꾸고 현재 클라이언트
   * 상태를 유지하므로, 사진 기반 합성 이미지가 계속 표시된다.
   */
  const updateInfo = <K extends keyof BasicAccidentInfo>(key: K, value: BasicAccidentInfo[K]) => {
    setInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartPhotoFlow = () => {
    setBasicInfoProgress(8);
    setIsBasicInfoLoading(true);
    navigate('photos');

    let progress = 8;
    const timer = window.setInterval(() => {
      progress = Math.min(100, progress + 14);
      setBasicInfoProgress(progress);

      if (progress >= 100) {
        window.clearInterval(timer);
        window.setTimeout(() => setIsBasicInfoLoading(false), 260);
      }
    }, 420);
  };

  const handlePhotoAnalysis = async () => {
    const demoPhotoSet = createCompleteDemoPhotos(photos);

    setPhotos(demoPhotoSet);
    setIsPhotoLoading(true);
    setIsAnalysisEditOpen(false);
    const result = await mockAI.analyzePhotos(Object.values(demoPhotoSet), info);
    setPhotoAnalysis(result);
    setIsPhotoLoading(false);
    navigate('analysis');
  };

  const resetPhotoDerivedState = () => {
    setPhotoAnalysis(null);
    setIsAnalysisEditOpen(false);
    setScenarios([]);
    setShowAlternativeScenarios(false);
    setSelectedScenario(null);
    setDraft(null);
    setNarrativeResult(null);
    setCustomerChecked(false);
  };

  const handleApplyDemoPhoto = (slot: UploadSlot, source: NonNullable<UploadedPhoto['source']>) => {
    setPhotos((prev) => ({ ...prev, [slot]: createDemoPhoto(slot, source) }));
    resetPhotoDerivedState();
  };

  const handleRemovePhoto = (slot: UploadSlot) => {
    setPhotos((prev) => {
      const nextPhotos = { ...prev };
      delete nextPhotos[slot];
      return nextPhotos;
    });
    resetPhotoDerivedState();
  };

  const handleConfirmAnalysis = () => {
    if (photoAnalysis) {
      setAnswers((prev) => {
        const confirmedImpact = prev.impactArea || photoAnalysis.suggested.impactArea || '';
        const confirmedDirection = prev.otherVehicleDirection || directionFromImpactArea(confirmedImpact) || '잘 모르겠음';

        return {
          ...prev,
          myVehicleState: prev.myVehicleState || defaultVehicleStateFromInfo(info),
          impactArea: confirmedImpact,
          otherVehicleDirection: confirmedDirection,
          laneChange: prev.laneChange || (confirmedDirection === '우측' || confirmedDirection === '좌측' ? '상대 차량' : '잘 모르겠음')
        };
      });
    }

    navigate('interview');
  };

  const handleGenerateScenarios = async () => {
    setIsScenarioLoading(true);
    const generated = await mockAI.generateAccidentScenarios(info, answers, photoAnalysis ?? undefined);
    const recommended = generated[0] ?? null;
    setScenarios(generated);
    setSelectedScenario(recommended);
    setDraft(recommended ? toDraft(recommended) : null);
    setNarrativeResult(null);
    setCustomerChecked(false);
    setShowAlternativeScenarios(false);
    setIsScenarioLoading(false);
    navigate('scenarios');
  };

  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setDraft(toDraft(scenario));
    setNarrativeResult(null);
    setCustomerChecked(false);
    setShowAlternativeScenarios(false);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  const handleGenerateNarrative = async () => {
    if (!draft) return;
    setIsNarrativeLoading(true);
    setCustomerChecked(false);
    const result = await mockAI.generateNarrative(info, draft);
    setNarrativeResult(result);
    setIsNarrativeLoading(false);
    navigate('summary');
  };

  const handleSubmitReceipt = () => {
    setReceiptNo(`AIMR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
    navigate('complete');
  };

  const handleDownloadPdf = async () => {
    setIsPdfDownloading(true);

    try {
      const rows = structuredRows(narrativeResult, draft ?? undefined).map(([label, value]) => [label, value] as [string, string]);
      const blob = await createReferenceMaterialPdf({
        receiptNo,
        info,
        narrative: narrativeResult?.narrative ?? '사고 설명 초안이 생성되지 않았습니다.',
        rows,
        photoNames: uploadedPhotos.map((photo) => `${photo.label}: ${photo.fileName}`)
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${receiptNo || 'AI-accident-briefing'}-reference.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setIsPdfDownloading(false);
    }
  };

  const reset = () => {
    setStep('home');
    setHistory([]);
    setInfo(initialInfo);
    setPhotos({});
    setPhotoAnalysis(null);
    setAnswers({});
    setScenarios([]);
    setShowAlternativeScenarios(false);
    setSelectedScenario(null);
    setDraft(null);
    setNarrativeResult(null);
    setIsBasicInfoLoading(false);
    setBasicInfoProgress(0);
    setIsPdfDownloading(false);
    setIsAnalysisEditOpen(false);
    setCustomerChecked(false);
    setReceiptNo('');
    updateBrowserPath('home');
  };

  const floatingAction = (() => {
    if (step === 'home') {
      return <Button fullWidth onClick={handleStartPhotoFlow}>사진으로 사고 상황 정리하기</Button>;
    }

    if (step === 'photos' && !isBasicInfoLoading && !isPhotoLoading) {
      return <Button fullWidth onClick={handlePhotoAnalysis}>사진 업로드 완료하고 분석하기</Button>;
    }

    if (step === 'analysis') {
      if (!photoAnalysis) {
        return <Button fullWidth variant="secondary" onClick={() => navigate('photos')}>사진 업로드로 돌아가기</Button>;
      }

      return (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => navigate('photos')}>사진 다시 선택</Button>
          <Button onClick={handleConfirmAnalysis}>다음</Button>
        </div>
      );
    }

    if (step === 'interview' && !isScenarioLoading) {
      return <Button fullWidth onClick={handleGenerateScenarios}>사진 기반 상황 정리 생성하기</Button>;
    }

    if (step === 'scenarios') {
      if (!currentScenario) {
        return <Button fullWidth variant="secondary" onClick={() => navigate('interview')}>추가 정보 단계로 돌아가기</Button>;
      }

      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleGenerateNarrative} disabled={isNarrativeLoading}>{isNarrativeLoading ? '생성 중...' : '이 장면으로 생성'}</Button>
            <Button variant="secondary" onClick={() => navigate('edit')}>조금 달라요</Button>
          </div>
          {!showAlternativeScenarios && alternativeScenarioCount > 0 ? (
            <Button fullWidth variant="secondary" onClick={() => setShowAlternativeScenarios(true)}>
              다른 시나리오 {alternativeScenarioCount}개 추가 조회
            </Button>
          ) : null}
        </div>
      );
    }

    if (step === 'edit' && draft) {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => navigate('scenarios')}>장면 다시 보기</Button>
          <Button onClick={handleGenerateNarrative} disabled={isNarrativeLoading}>
            {isNarrativeLoading ? '생성 중...' : '이 내용으로 생성'}
          </Button>
        </div>
      );
    }

    if (step === 'summary' && currentScenario && draft) {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => navigate('edit')}>내용 수정하기</Button>
          <Button disabled={!customerChecked} onClick={handleSubmitReceipt}>참고자료 생성하기</Button>
        </div>
      );
    }

    if (step === 'complete') {
      return (
        <div className="space-y-2">
          <Button fullWidth onClick={handleDownloadPdf} disabled={isPdfDownloading}>
            {isPdfDownloading ? 'PDF 생성 중...' : '참고자료 PDF 다운로드'}
          </Button>
          <Button fullWidth variant="secondary" onClick={reset}>다시 시작하기</Button>
        </div>
      );
    }

    return null;
  })();

  return (
    <AppShell
      stepLabel={meta?.label}
      stepNumber={meta?.number}
      totalSteps={6}
      canGoBack={step !== 'home'}
      onBack={goBack}
      floatingAction={floatingAction}
    >
      {step === 'home' ? (
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-hanwha-500 via-hanwha-700 to-stone-950 p-6 text-white shadow-2xl shadow-hanwha-700/25">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/12" />
            <div className="absolute right-9 top-10 h-16 w-16 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-orange-200/10" />
            <div className="relative inline-flex rounded-full border border-white/20 bg-white/14 px-3 py-1 text-xs font-black backdrop-blur">
              한화손해보험 사고 참고자료 생성 MVP
            </div>
            <h2 className="relative mt-7 text-3xl font-black leading-tight">
              사고 사진으로<br />
              사고 상황을 정리해드려요
            </h2>
            <p className="relative mt-4 text-sm leading-relaxed text-orange-50">
              접수된 사고 정보와 사고 사진을 바탕으로 사고 상황을 정리하고,
              고객님이 확인한 사고 설명을 참고자료로 정리합니다.
            </p>

            <div className="relative mt-6 rounded-[1.5rem] border border-white/15 bg-white/12 p-3 backdrop-blur">
              <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-[11px] font-black text-orange-50">
                <div className="rounded-2xl bg-white/12 p-3">
                  <p className="text-4xl leading-none">📷</p>
                  <p className="mt-1">사진</p>
                </div>
                <span className="text-orange-100">→</span>
                <div className="rounded-2xl bg-white/12 p-3">
                  <p className="text-4xl leading-none">🧭</p>
                  <p className="mt-1">상황 정리</p>
                </div>
                <span className="text-orange-100">→</span>
                <div className="rounded-2xl bg-white/12 p-3">
                  <p className="text-4xl leading-none">✓</p>
                  <p className="mt-1">참고자료</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {step === 'photos' ? (
        <div className="space-y-5">
          {sectionTitle('Step 1', '사진 업로드', '사고 장면을 떠올리는 데 도움이 되는 사진을 추가해 주세요.')}
          {isBasicInfoLoading ? (
            <div className="relative overflow-hidden rounded-3xl border border-hanwha-100 bg-gradient-to-br from-hanwha-50 to-white px-5 py-6 shadow-sm">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-hanwha-100/70" />
              <div className="flex items-start gap-3">
                <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-hanwha-100">
                  <div className="h-5 w-5 animate-spin rounded-full border-4 border-hanwha-100 border-t-hanwha-600" />
                </div>
                <div className="relative min-w-0 flex-1">
                  <p className="text-sm font-black text-hanwha-900">한화손해보험 보상 시스템 연결 중</p>
                  <p className="mt-1 text-xs leading-relaxed text-stone-600">기 접수된 사고 기본정보를 불러오고 있습니다.</p>
                </div>
                <span className="relative rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-hanwha-700 shadow-sm">연동</span>
              </div>
              <div className="relative mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-stone-500">
                  <span>계약/사고 접수 정보 조회</span>
                  <span>{basicInfoProgress}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-hanwha-600 transition-all duration-300" style={{ width: `${basicInfoProgress}%` }} />
                </div>
              </div>
              <div className="relative mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-white/75 p-3">
                  <p className="h-2 w-14 rounded-full bg-orange-100" />
                  <p className="mt-3 h-3 w-24 rounded-full bg-orange-200" />
                </div>
                <div className="rounded-2xl bg-white/75 p-3">
                  <p className="h-2 w-14 rounded-full bg-orange-100" />
                  <p className="mt-3 h-3 w-28 rounded-full bg-orange-200" />
                </div>
              </div>
            </div>
          ) : isPhotoLoading ? (
            <LoadingPanel title="AI가 사고 단서를 확인 중입니다" description="파손 사진, 차량 위치, 현장 단서를 고객 설명에 도움이 되는 단서로 정리하고 있어요." />
          ) : (
            <>
              <div className="rounded-3xl border border-orange-100 bg-white p-4 shadow-sm shadow-orange-950/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">한화손해보험 보상 시스템 연동 정보</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">이미 접수된 사고의 기본정보를 불러왔습니다.</p>
                  </div>
                  <span className="rounded-full bg-hanwha-50 px-2.5 py-1 text-[10px] font-black text-hanwha-700">불러오기 완료</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <InfoPill label="사고 일시" value={info.accidentDateTime.replace('T', ' ')} />
                  <InfoPill label="사고 장소" value={info.location} />
                </div>
              </div>

              <div className="space-y-3">
                {uploadSlots.map((slot) => (
                  <FileUploadCard
                    key={slot.slot}
                    {...slot}
                    photo={photos[slot.slot]}
                    onApplyDemoPhoto={(source) => handleApplyDemoPhoto(slot.slot, source)}
                    onRemove={() => handleRemovePhoto(slot.slot)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}

      {step === 'analysis' ? (
        <div className="space-y-5">
          {sectionTitle('Step 2', '사진 분석 내용 확인', '사고 상황 정리에 사용할 사진 분석 내용을 먼저 확인합니다.')}
          {!photoAnalysis ? (
            <div className="space-y-3">
              <LoadingPanel title="사진 분석 내역이 없습니다" description="사진 업로드 단계에서 먼저 분석을 실행해 주세요." />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-[1.7rem] border border-hanwha-100 bg-white p-4 shadow-sm shadow-orange-950/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-hanwha-700">시나리오 생성 기준</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">아래 분석 내용을 바탕으로 상황을 정리합니다</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">사진과 기본 사고 정보를 바탕으로 정리한 값입니다. 다르면 수정할 수 있습니다.</p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-full bg-hanwha-50 px-3 py-1 text-[11px] font-black text-hanwha-700">완료</span>
                </div>

                <div className="mt-4 rounded-3xl border border-hanwha-100 bg-gradient-to-br from-hanwha-50 to-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">상황 정리에 반영할 사진 분석 내용</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">장소, 차량 상태, 상대 방향, 충돌 부위를 시나리오 생성에 사용합니다.</p>
                    </div>
                    <Button
                      className="min-h-10 shrink-0 rounded-2xl px-4 py-2 text-xs"
                      variant={isAnalysisEditOpen ? 'secondary' : 'primary'}
                      onClick={() => setIsAnalysisEditOpen((prev) => !prev)}
                    >
                      {isAnalysisEditOpen ? '수정 닫기' : '분석 내용 수정'}
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {autoAnalysisRows.map((item) => (
                      <InfoPill key={item.label} label={item.label} value={item.value} />
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-black text-slate-500">사진 분석에 참고한 단서</p>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-500">{photoAnalysis.findings.length || 0}개 사진</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {photoAnalysis.findings.length ? photoAnalysis.findings.map((finding) => (
                      <p key={finding.slot} className="text-xs font-semibold leading-relaxed text-slate-600">
                        <span className="font-black text-slate-700">{finding.label}</span>
                        <span className="text-slate-400"> · {finding.confidenceLabel} · </span>
                        {finding.finding}
                      </p>
                    )) : (
                      <p className="text-xs font-semibold leading-relaxed text-slate-600">첨부 사진이 없어 접수된 사고 정보와 선택 입력값 중심으로 분석 내용을 구성합니다.</p>
                    )}
                  </div>
                </div>

                {isAnalysisEditOpen ? (
                  <div className="mt-4 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-xs font-bold leading-relaxed text-slate-500">실제 기억과 다른 값이 있을 때만 수정해 주세요. 수정하지 않아도 바로 다음으로 진행할 수 있습니다.</p>
                    <FieldGroup label="사고 장소 유형">
                      <SelectInput value={info.placeType} onChange={(event) => updateInfo('placeType', event.target.value as PlaceType)}>
                        {PLACE_TYPES.map((type) => <option key={type}>{type}</option>)}
                      </SelectInput>
                    </FieldGroup>
                    <FieldGroup label="내 차량 상태">
                      <SelectInput
                        value={answers.myVehicleState || defaultVehicleStateFromInfo(info)}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, myVehicleState: event.target.value }))}
                      >
                        {VEHICLE_STATES.map((state) => <option key={state}>{state}</option>)}
                      </SelectInput>
                    </FieldGroup>
                    <FieldGroup label="상대 차량 방향">
                      <SelectInput
                        value={answers.otherVehicleDirection || directionFromImpactArea(answers.impactArea || photoAnalysis.suggested.impactArea) || '잘 모르겠음'}
                        onChange={(event) => setAnswers((prev) => ({ ...prev, otherVehicleDirection: event.target.value }))}
                      >
                        {DIRECTIONS.map((direction) => <option key={direction}>{direction}</option>)}
                      </SelectInput>
                    </FieldGroup>
                    <FieldGroup label="충돌 부위">
                      <SelectInput
                        value={answers.impactArea || photoAnalysis.suggested.impactArea || '잘 모르겠음'}
                        onChange={(event) => {
                          const nextImpactArea = event.target.value;
                          setAnswers((prev) => ({
                            ...prev,
                            impactArea: nextImpactArea,
                            otherVehicleDirection: directionFromImpactArea(nextImpactArea) || prev.otherVehicleDirection || '잘 모르겠음'
                          }));
                        }}
                      >
                        <option>잘 모르겠음</option>
                        {IMPACT_AREAS.map((area) => <option key={area}>{area}</option>)}
                      </SelectInput>
                    </FieldGroup>
                    <Button fullWidth variant="secondary" onClick={() => setIsAnalysisEditOpen(false)}>수정 완료</Button>
                  </div>
                ) : null}
              </div>

            </div>
          )}
        </div>
      ) : null}

      {step === 'interview' ? (
        <div className="space-y-5">
          {sectionTitle('Step 3', '추가 질문 확인', '사진 분석 결과를 바탕으로 필요한 질문을 정리했습니다. 기억나는 내용만 선택해 주세요.')}
          {isScenarioLoading ? (
            <LoadingPanel title="가능한 사고 장면을 구성하고 있어요" description="사진 단서와 선택 입력값을 바탕으로 가장 가까운 상황 정리 장면을 준비하고 있습니다." />
          ) : (
            <>
              {pendingInterviewQuestions.length ? (
                <div className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm shadow-orange-950/5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">추가 확인 질문</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">상황 정리 정확도를 높이기 위한 질문입니다. 기억나지 않으면 선택하지 않고 진행할 수 있습니다.</p>
                    </div>
                    <span className="rounded-full bg-hanwha-50 px-2.5 py-1 text-[10px] font-black text-hanwha-700">선택</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    {pendingInterviewQuestions.map((question, index) => (
                      <div key={question.id} className="rounded-3xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white p-3">
                        <p className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-hanwha-600 shadow-sm">Q{index + 1}</p>
                        <p className="mt-1 text-sm font-black leading-relaxed text-slate-900">{question.question}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {question.options.map((option) => {
                            const selected = answers[question.id] === option;
                            return (
                              <button
                                key={option}
                                className={`rounded-2xl px-3 py-3 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-hanwha-100 ${selected ? 'bg-hanwha-600 text-white shadow-md shadow-hanwha-600/20' : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100'}`}
                                type="button"
                                onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm shadow-orange-950/5">
                <p className="text-sm font-black text-slate-950">사고 추가 정보</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">사진으로 드러나지 않는 상황이 있다면 자유롭게 입력해 주세요. 입력하지 않아도 진행할 수 있습니다.</p>
                <div className="mt-4">
                  <FieldGroup label="추가 설명(선택)">
                    <TextArea
                      value={info.briefDescription}
                      onChange={(event) => updateInfo('briefDescription', event.target.value)}
                      placeholder="예: 신호 대기 후 출발한 직후였고, 오른쪽 뒤쪽에서 차량이 들어온 것 같습니다."
                    />
                  </FieldGroup>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      {step === 'scenarios' ? (
        <div className="space-y-5">
          {currentScenario ? (
            <>
              {sectionTitle('Step 4', '사고 상황 정리 확인', '사진 기반으로 구성한 사고 장면을 확인합니다. 주황색 차량은 내 차량, 빨간 차량은 상대 차량입니다.')}

              <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-lg shadow-orange-950/10">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-hanwha-600">{currentScenarioLabel} · {currentScenario.confidenceLabel}</p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">{currentScenario.title}</h3>
                  </div>
                  <span className="rounded-full bg-hanwha-50 px-3 py-1 text-[10px] font-black text-hanwha-700 shadow-sm">수동 재생</span>
                </div>

                <ReplayScene scenario={currentScenario} title="2D 사고 시뮬레이션" />

                <ul className="mt-4 grid gap-2 text-xs font-bold text-slate-700">
                  {currentScenario.summary.map((line) => (
                    <li key={line} className="flex gap-2 rounded-2xl bg-slate-50 p-3">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-hanwha-500" />
                      <span className="leading-relaxed">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-white p-4 text-center shadow-sm shadow-orange-950/5">
                <p className="text-base font-black text-slate-950">이 장면이 실제 사고 상황과 가장 유사한가요?</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">다르면 차량 상태, 방향, 충돌 부위, 장소 유형을 수정할 수 있습니다.</p>
              </div>

              {visibleAlternativeScenarios.length ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-sm font-black text-slate-900">대안 시나리오</p>
                    <Button variant="ghost" onClick={() => setShowAlternativeScenarios(false)}>접기</Button>
                  </div>
                  {visibleAlternativeScenarios.map((scenario, index) => (
                    <div key={scenario.id} className="rounded-[1.7rem] border border-slate-200 bg-white p-3 shadow-sm shadow-orange-950/5">
                      <div className="mb-3 flex items-start justify-between gap-3 px-1">
                        <div>
                          <p className="text-xs font-black text-hanwha-600">대안 시나리오 {index + 1} · {scenario.confidenceLabel}</p>
                          <h3 className="mt-1 text-base font-black text-slate-950">{scenario.title}</h3>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">수동 재생</span>
                      </div>
                      <ReplayScene scenario={scenario} mode="mini" />
                      <ul className="mt-3 space-y-1 px-1 text-xs font-semibold text-slate-600">
                        {scenario.summary.map((line) => <li key={line}>• {line}</li>)}
                      </ul>
                      <Button className="mt-3" fullWidth onClick={() => handleSelectScenario(scenario)}>
                        이 장면으로 바꾸기
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-3">
              {sectionTitle('Step 4', '사고 상황 정리 확인', '상황 정리 후보를 먼저 생성해 주세요.')}
              <LoadingPanel title="상황 정리 후보가 없습니다" description="사진 분석과 선택 정보 입력을 거쳐 상황 정리 장면을 생성할 수 있습니다." />
            </div>
          )}
        </div>
      ) : null}

      {step === 'edit' && draft ? (
        <div className="space-y-5">
          {sectionTitle('Step 4', '상황 정리 정보 수정', '실제 사고 상황과 다른 항목만 수정한 뒤 참고자료를 생성할 수 있습니다.')}
          <div className="space-y-4 rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm shadow-orange-950/5">
            <div className="rounded-2xl border border-hanwha-100 bg-hanwha-50 px-4 py-3">
              <p className="text-sm font-black text-hanwha-900">이 내용으로 참고자료를 만들까요?</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">수정하지 않아도 하단의 참고자료 만들기 버튼으로 바로 진행할 수 있습니다.</p>
            </div>
            <FieldGroup label="내 차량 상태">
              <SelectInput value={draft.myVehicleState} onChange={(event) => setDraft((prev) => prev ? { ...prev, myVehicleState: event.target.value as ScenarioDraft['myVehicleState'] } : prev)}>
                {VEHICLE_STATES.map((state) => <option key={state}>{state}</option>)}
              </SelectInput>
            </FieldGroup>
            <FieldGroup label="상대 차량 방향">
              <SelectInput value={draft.otherVehicleDirection} onChange={(event) => setDraft((prev) => prev ? { ...prev, otherVehicleDirection: event.target.value as ScenarioDraft['otherVehicleDirection'] } : prev)}>
                {DIRECTIONS.map((direction) => <option key={direction}>{direction}</option>)}
              </SelectInput>
            </FieldGroup>
            <FieldGroup label="충돌 부위">
              <SelectInput value={draft.impactArea} onChange={(event) => setDraft((prev) => prev ? { ...prev, impactArea: event.target.value as ScenarioDraft['impactArea'] } : prev)}>
                {IMPACT_AREAS.map((area) => <option key={area}>{area}</option>)}
              </SelectInput>
            </FieldGroup>
            <FieldGroup label="사고 장소 유형">
              <SelectInput value={draft.placeType} onChange={(event) => setDraft((prev) => prev ? { ...prev, placeType: event.target.value as PlaceType } : prev)}>
                {PLACE_TYPES.map((type) => <option key={type}>{type}</option>)}
              </SelectInput>
            </FieldGroup>
          </div>
        </div>
      ) : null}

      {step === 'summary' && (!currentScenario || !draft) ? (
        <div className="space-y-3">
          {sectionTitle('Step 5', '사고 참고자료 생성', '사고 상황 정리 장면과 사고 설명 초안을 준비하고 있습니다.')}
          <LoadingPanel title="참고자료 초안을 준비하고 있습니다" description="직접 진입에 필요한 사진 분석 내용과 사고 상황 정리 데이터를 데모용 mock으로 구성하고 있어요." />
        </div>
      ) : null}

      {step === 'summary' && currentScenario && draft ? (
        <div className="space-y-5">
          {sectionTitle('Step 5', '사고 참고자료 생성', '생성 전 내용을 한 화면에서 확인하고, 필요하면 바로 수정할 수 있습니다.')}

          <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-lg shadow-orange-950/10">
            <div className="mb-4 flex items-center justify-between border-b border-orange-100 pb-3">
              <div>
                <p className="text-xs font-black text-hanwha-600">사고 참고자료</p>
                <h3 className="text-lg font-black text-slate-950">보상 담당자 검토용 초안</h3>
              </div>
              <span className="rounded-full bg-hanwha-50 px-3 py-1 text-xs font-black text-hanwha-700 shadow-sm">초안</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <InfoPill label="사고 일시" value={info.accidentDateTime.replace('T', ' ') || '-'} />
                <InfoPill label="사고 장소" value={info.location || '-'} />
              </div>

              <div className="rounded-2xl border border-hanwha-100 bg-gradient-to-br from-hanwha-50 to-white px-4 py-3">
                <p className="text-[11px] font-bold text-hanwha-700">사고 경위 요약</p>
                <p className="mt-1 text-sm font-bold leading-relaxed text-slate-900">
                  {narrativeResult?.narrative ?? '사고 경위 문장을 생성하고 있습니다.'}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500">업로드 사진 기반 상황 정리 도식</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                      {referencePhotoUrl ? '업로드한 사고 사진 위에 선택한 상황 정리 도식을 얹어 참고자료에 포함합니다.' : '업로드한 현장 사진이 없으면 2D 도식으로 참고자료에 포함합니다.'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-hanwha-700 shadow-sm">합성 이미지</span>
                </div>
                <ReplayScene scenario={currentScenario} mode="static" title="사고 장면 참고 이미지" backgroundImageUrl={referencePhotoUrl} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-sm font-black text-slate-950">구조화된 사고 정보</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {structuredRows(narrativeResult, draft).map(([label, value]) => (
                    <InfoPill key={label} label={label} value={value} />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[11px] font-bold text-slate-500">참고 사진 목록</p>
                {uploadedPhotos.length ? (
                  <ul className="mt-2 space-y-1 text-xs font-bold text-slate-700">
                    {uploadedPhotos.map((photo) => (
                      <li key={photo.slot} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-2">
                        {photo.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={photo.previewUrl} alt={`${photo.label} 첨부 이미지`} className="h-10 w-10 rounded-xl object-cover" />
                        ) : null}
                        <span className="min-w-0 flex-1 truncate">{photo.label}: {photo.fileName}</span>
                      </li>
                    ))}
                    <li className="flex items-center gap-2 rounded-2xl bg-hanwha-50 p-2 text-hanwha-800">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base">🧭</span>
                      <span className="min-w-0 flex-1 truncate">AI 상황 정리 이미지: 참고자료에 자동 포함</span>
                    </li>
                  </ul>
                ) : (
                  <p className="mt-1 text-sm font-bold text-slate-900">첨부 사진 없음 · 2D 도식으로 참고자료 생성</p>
                )}
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <input
              className="mt-1 h-5 w-5 rounded border-slate-300 text-hanwha-600 focus:ring-hanwha-500"
              type="checkbox"
              checked={customerChecked}
              onChange={(event) => setCustomerChecked(event.target.checked)}
            />
            <span className="text-sm font-semibold leading-relaxed text-slate-700">
              위 내용은 제가 확인한 사고 설명이며, 보상 담당자 검토를 위한 참고자료로 활용될 수 있음을 확인합니다.
            </span>
          </label>

        </div>
      ) : null}

      {step === 'complete' ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-hanwha-50 to-white text-4xl shadow-lg shadow-orange-950/10 ring-1 ring-hanwha-100">✅</div>
          <div className="rounded-[1.7rem] border border-slate-100 bg-white p-5 shadow-sm shadow-orange-950/5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-hanwha-600">Created</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">사고 참고자료가 생성되었습니다</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">보상 담당자가 사고 내용과 참고자료를 함께 확인할 예정입니다.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black text-slate-500">가상 자료번호</p>
            <p className="mt-2 text-xl font-black text-hanwha-700">{receiptNo}</p>
          </div>
          <div className="rounded-3xl border border-hanwha-100 bg-hanwha-50 p-4 text-left">
            <p className="text-sm font-black text-hanwha-900">PDF 참고자료 다운로드</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              사고 설명 초안, 사진 분석 내용, 상황 정리 도식을 PDF로 저장할 수 있습니다.
            </p>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
