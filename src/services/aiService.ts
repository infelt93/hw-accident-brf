import { mockScenarios } from '@/data/mockScenarios';
import type {
  AccidentNarrativeResult,
  BasicAccidentInfo,
  ImpactArea,
  InterviewAnswers,
  PhotoAnalysisResult,
  PlaceType,
  Scenario,
  ScenarioDraft,
  UploadedPhoto
} from '@/types/accident';

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const cloneScenario = (scenario: Scenario): Scenario => ({
  ...scenario,
  summary: [...scenario.summary],
  replay: {
    ...scenario.replay,
    frames: scenario.replay.frames.map((frame) => ({
      ...frame,
      myCar: { ...frame.myCar },
      otherCar: { ...frame.otherCar },
      collision: frame.collision ? { ...frame.collision } : undefined
    })),
    arrows: scenario.replay.arrows.map((arrow) => ({
      ...arrow,
      from: { ...arrow.from },
      to: { ...arrow.to }
    }))
  }
});


function inferImpactFromFileName(fileName: string): ImpactArea {
  const lower = fileName.toLowerCase();
  if (/left|좌|왼/.test(lower) && /rear|후|뒤/.test(lower)) return '좌측 후면';
  if (/right|우|오른/.test(lower) && /rear|후|뒤/.test(lower)) return '우측 후면';
  if (/rear|back|후|뒤/.test(lower)) return '후면';
  if (/front|전면|앞/.test(lower)) return '전면';
  if (/left|좌|왼/.test(lower)) return '좌측면';
  if (/right|우|오른/.test(lower)) return '우측면';
  return '우측 후면';
}

function buildPhotoFinding(photo: UploadedPhoto, info?: BasicAccidentInfo) {
  if (photo.slot === 'ownDamage') {
    const inferredImpact = inferImpactFromFileName(photo.fileName);
    return {
      slot: photo.slot,
      label: photo.label,
      fileName: photo.fileName,
      finding: `내 차량 파손 사진에서 ${inferredImpact} 부위를 충돌 부위 후보로 반영했습니다.`,
      confidenceLabel: '파손 부위 후보'
    };
  }

  if (photo.slot === 'opponentVehicle') {
    return {
      slot: photo.slot,
      label: photo.label,
      fileName: photo.fileName,
      finding: '상대 차량 사진을 상대 차량 위치와 접근 방향 후보에 반영했습니다.',
      confidenceLabel: '상대 차량 단서'
    };
  }

  return {
    slot: photo.slot,
    label: photo.label,
    fileName: photo.fileName,
    finding: `사고 현장 사진을 ${info?.placeType ?? '사고 장소'} 환경과 차선/주차면 구조 단서로 반영했습니다.`,
    confidenceLabel: '현장 환경 단서'
  };
}

function normalizeImpactArea(value?: string): ImpactArea | undefined {
  const candidates: ImpactArea[] = ['전면', '후면', '좌측면', '우측면', '우측 후면', '좌측 후면'];
  return candidates.find((candidate) => candidate === value);
}

function placeToBackground(placeType: PlaceType): Scenario['replay']['background'] {
  if (placeType === '주차장') return 'parking';
  if (placeType === '교차로') return 'intersection';
  if (placeType === '골목길') return 'alley';
  return 'road';
}

function scenarioTextForPlace(placeType: PlaceType, scenarioId: Scenario['id']) {
  const map: Record<PlaceType, Record<Scenario['id'], Pick<Scenario, 'title' | 'estimatedType'> & { summary: string[] }>> = {
    일반도로: {
      A: {
        title: '직진 중 우측 차선 차량 진입',
        estimatedType: '차선 변경 접촉',
        summary: ['고객 차량은 일반도로에서 직진 중', '상대 차량이 내 차량 우측 후방 차선에서 진입', '충돌 지점: 우측 후면']
      },
      B: {
        title: '정차 중 후방 차량 추돌',
        estimatedType: '후방 추돌',
        summary: ['고객 차량은 일반도로에서 정차 중', '상대 차량이 후방에서 접근', '충돌 지점: 후면']
      },
      C: {
        title: '일반도로 합류 차량과 측면 접촉',
        estimatedType: '합류/진입 접촉',
        summary: ['고객 차량은 일반도로 통행 중', '상대 차량이 우측에서 합류 또는 진입', '충돌 지점: 우측면']
      }
    },
    교차로: {
      A: {
        title: '교차로 직진 중 우측 진입 차량 접촉',
        estimatedType: '교차로 진입 접촉',
        summary: ['고객 차량은 교차로에서 직진 중', '상대 차량이 내 차량 우측 후방 방향에서 진입', '충돌 지점: 우측 후면']
      },
      B: {
        title: '교차로 정차 중 후방 차량 추돌',
        estimatedType: '교차로 후방 추돌',
        summary: ['고객 차량은 교차로 부근에서 정차 중', '상대 차량이 후방에서 접근', '충돌 지점: 후면']
      },
      C: {
        title: '교차로 통과 중 측면 접촉',
        estimatedType: '교차로 측면 접촉',
        summary: ['고객 차량은 교차로를 통과 중', '상대 차량이 화면 기준 우측 방향에서 접근', '충돌 지점: 우측면']
      }
    },
    주차장: {
      A: {
        title: '주차장 통로 이동 중 우측 차량 진입',
        estimatedType: '주차장 통로 접촉',
        summary: ['고객 차량은 주차장 통로 이동 중', '상대 차량이 내 차량 우측 후방에서 진입', '충돌 지점: 우측 후면']
      },
      B: {
        title: '주차장 통로 정차 중 후방 접촉',
        estimatedType: '주차장 후방 접촉',
        summary: ['고객 차량은 주차장 통로에서 정차 중', '상대 차량이 후방에서 접근', '충돌 지점: 후면']
      },
      C: {
        title: '주차장 출차 중 측면 접촉',
        estimatedType: '주차장 출차 접촉',
        summary: ['고객 차량은 주차장 통로 이동 중', '상대 차량이 주차면에서 출차', '충돌 지점: 우측면']
      }
    },
    골목길: {
      A: {
        title: '골목길 직진 중 우측 차량 진입',
        estimatedType: '골목길 진입 접촉',
        summary: ['고객 차량은 골목길에서 직진 중', '상대 차량이 내 차량 우측 후방 방향에서 진입', '충돌 지점: 우측 후면']
      },
      B: {
        title: '골목길 정차 중 후방 차량 접촉',
        estimatedType: '골목길 후방 접촉',
        summary: ['고객 차량은 골목길에서 정차 중', '상대 차량이 후방에서 접근', '충돌 지점: 후면']
      },
      C: {
        title: '골목길 교행 중 측면 접촉',
        estimatedType: '골목길 교행 접촉',
        summary: ['고객 차량은 좁은 골목길을 이동 중', '상대 차량이 화면 기준 우측 방향에서 접근 또는 교행', '충돌 지점: 우측면']
      }
    }
  };

  return map[placeType][scenarioId];
}


function scenarioDefaultsForPlace(placeType: PlaceType, scenarioId: Scenario['id']): Pick<Scenario, 'myVehicleState' | 'otherVehicleDirection' | 'impactArea'> {
  if (scenarioId === 'B') {
    return {
      myVehicleState: '정차 중',
      otherVehicleDirection: '후방',
      impactArea: '후면'
    };
  }

  if (scenarioId === 'C') {
    return {
      myVehicleState: placeType === '주차장' ? '주차장 통로 이동 중' : '직진 중',
      otherVehicleDirection: '우측',
      impactArea: '우측면'
    };
  }

  return {
    myVehicleState: placeType === '주차장' ? '주차장 통로 이동 중' : '직진 중',
    otherVehicleDirection: '우측',
    impactArea: '우측 후면'
  };
}

function scoreScenario(scenario: Scenario, answers: InterviewAnswers) {
  let score = 0;

  if (answers.myVehicleState && answers.myVehicleState !== '잘 모르겠음') {
    if (scenario.myVehicleState === answers.myVehicleState) score += 4;
    if (answers.myVehicleState.includes('정차') && scenario.estimatedType.includes('후방')) score += 2;
    if ((answers.myVehicleState.includes('주차') || answers.myVehicleState.includes('후진')) && scenario.estimatedType.includes('주차')) score += 3;
  }

  if (answers.otherVehicleDirection && answers.otherVehicleDirection !== '잘 모르겠음') {
    if (scenario.otherVehicleDirection === answers.otherVehicleDirection) score += 3;
    if (answers.otherVehicleDirection === '후방' && scenario.estimatedType.includes('후방')) score += 3;
    if ((answers.otherVehicleDirection === '우측' || answers.otherVehicleDirection === '좌측') && scenario.estimatedType.includes('접촉')) score += 1;
  }

  const answeredImpact = normalizeImpactArea(answers.impactArea);
  if (answeredImpact) {
    if (scenario.impactArea === answeredImpact) score += 3;
    if (answeredImpact.includes('후면') && scenario.estimatedType.includes('후방')) score += 2;
    if (answeredImpact.includes('측면') && scenario.estimatedType.includes('측면')) score += 2;
  }

  if (answers.laneChange === '상대 차량' && /차선|진입|합류|출차/.test(scenario.estimatedType)) score += 2;
  if (answers.laneChange === '둘 다 아님' && scenario.estimatedType.includes('후방')) score += 1;

  return score;
}


function replayForPlaceAndScenario(scenario: Scenario, placeType: PlaceType): Scenario['replay'] {
  const background = placeToBackground(placeType);

  if (placeType === '교차로') {
    if (scenario.id === 'B') {
      return {
        background,
        arrows: [
          { id: 'my-intersection-stop', actor: 'my', from: { x: 52, y: 58 }, to: { x: 52, y: 58 }, label: '교차로 부근 정차' },
          { id: 'other-intersection-rear', actor: 'other', from: { x: 18, y: 58 }, to: { x: 43, y: 58 }, label: '후방 접근' }
        ],
        frames: [
          {
            id: 'i-b-5',
            label: '사고 5초 전',
            myCar: { x: 52, y: 58, rotation: 90 },
            otherCar: { x: 18, y: 58, rotation: 90 }
          },
          {
            id: 'i-b-3',
            label: '사고 3초 전',
            myCar: { x: 52, y: 58, rotation: 90 },
            otherCar: { x: 30, y: 58, rotation: 90 }
          },
          {
            id: 'i-b-1',
            label: '사고 1초 전',
            myCar: { x: 52, y: 58, rotation: 90 },
            otherCar: { x: 40, y: 58, rotation: 90 }
          },
          {
            id: 'i-b-impact',
            label: '충돌',
            myCar: { x: 53, y: 58, rotation: 90 },
            otherCar: { x: 45, y: 58, rotation: 90 },
            collision: { x: 49, y: 58 }
          }
        ]
      };
    }

    if (scenario.id === 'C') {
      return {
        background,
        arrows: [
          { id: 'my-intersection-cross', actor: 'my', from: { x: 22, y: 58 }, to: { x: 58, y: 58 }, label: '교차로 통과' },
          { id: 'other-intersection-side', actor: 'other', from: { x: 82, y: 50 }, to: { x: 58, y: 56 }, label: '우측 방향 접근' }
        ],
        frames: [
          {
            id: 'i-c-5',
            label: '사고 5초 전',
            myCar: { x: 22, y: 58, rotation: 90 },
            otherCar: { x: 82, y: 50, rotation: 270 }
          },
          {
            id: 'i-c-3',
            label: '사고 3초 전',
            myCar: { x: 36, y: 58, rotation: 90 },
            otherCar: { x: 72, y: 52, rotation: 265 }
          },
          {
            id: 'i-c-1',
            label: '사고 1초 전',
            myCar: { x: 48, y: 58, rotation: 90 },
            otherCar: { x: 63, y: 55, rotation: 260 }
          },
          {
            id: 'i-c-impact',
            label: '충돌',
            myCar: { x: 55, y: 58, rotation: 90 },
            otherCar: { x: 59, y: 56, rotation: 260 },
            collision: { x: 58, y: 57 }
          }
        ]
      };
    }

    return {
      background,
      arrows: [
        { id: 'my-intersection-forward', actor: 'my', from: { x: 18, y: 52 }, to: { x: 60, y: 52 }, label: '교차로 직진' },
        { id: 'other-intersection-right', actor: 'other', from: { x: 52, y: 86 }, to: { x: 54, y: 62 }, label: '교차로 하단 차로 진입' }
      ],
      frames: [
        {
          id: 'i-a-5',
          label: '사고 5초 전',
          myCar: { x: 18, y: 52, rotation: 0 },
          otherCar: { x: 52, y: 86, rotation: 0 }
        },
        {
          id: 'i-a-3',
          label: '사고 3초 전',
          myCar: { x: 34, y: 52, rotation: 0 },
          otherCar: { x: 52, y: 76, rotation: 0 }
        },
        {
          id: 'i-a-1',
          label: '사고 1초 전',
          myCar: { x: 50, y: 52, rotation: 0 },
          otherCar: { x: 53, y: 67, rotation: 0 }
        },
        {
          id: 'i-a-impact',
          label: '충돌',
          myCar: { x: 58, y: 52, rotation: 0 },
          otherCar: { x: 54, y: 62, rotation: 0 },
          collision: { x: 55, y: 60 }
        }
      ]
    };
  }

  if (placeType === '골목길') {
    return {
      ...scenario.replay,
      background,
      frames: scenario.replay.frames.map((frame) => ({
        ...frame,
        myCar: { ...frame.myCar, y: Math.min(64, Math.max(48, frame.myCar.y)) },
        otherCar: { ...frame.otherCar, y: Math.min(64, Math.max(44, frame.otherCar.y)) },
        collision: frame.collision ? { ...frame.collision, y: Math.min(62, Math.max(50, frame.collision.y)) } : undefined
      }))
    };
  }

  return {
    ...scenario.replay,
    background
  };
}

function applyPlaceAndAnswerContext(scenario: Scenario, info: BasicAccidentInfo): Scenario {
  const text = scenarioTextForPlace(info.placeType, scenario.id);
  const defaults = scenarioDefaultsForPlace(info.placeType, scenario.id);

  return {
    ...scenario,
    ...text,
    ...defaults,
    placeType: info.placeType,
    replay: replayForPlaceAndScenario(scenario, info.placeType),
    summary: text.summary
  };
}

export const mockAI = {
  async analyzePhotos(photos: UploadedPhoto[], info?: BasicAccidentInfo): Promise<PhotoAnalysisResult> {
    await wait(900);

    const findings = photos.map((photo) => buildPhotoFinding(photo, info));
    const ownDamagePhoto = photos.find((photo) => photo.slot === 'ownDamage');
    const inferredImpact = ownDamagePhoto ? inferImpactFromFileName(ownDamagePhoto.fileName) : undefined;

    return {
      detectedHints: [
        photos.length > 0 ? `${photos.length}개 사진을 사고 상황 단서로 연결했습니다.` : '첨부 사진이 없어 인터뷰 답변 중심으로 구성합니다.',
        ownDamagePhoto ? `내 차량 파손 사진 기준 충돌 부위 후보: ${inferredImpact}` : '내 차량 파손 사진이 없어 충돌 부위는 인터뷰 답변으로 확인합니다.',
        photos.some((photo) => photo.slot === 'scene') ? `현장 사진을 ${info?.placeType ?? '입력 장소'} 환경 단서로 사용합니다.` : '현장 사진이 없어 장소 구조는 기본정보를 우선 사용합니다.',
        '사진 단서는 사고 설명을 돕기 위한 참고 정보입니다.'
      ],
      findings,
      suggested: {
        placeType: info?.placeType,
        impactArea: inferredImpact,
        note: '사진 단서는 사고 원인·과실 판단이 아니라, 고객 설명을 더 구체화하기 위한 질문/시나리오 보조 정보로만 사용됩니다.'
      }
    };
  },

  async generateAccidentScenarios(info: BasicAccidentInfo, answers: InterviewAnswers, photoAnalysis?: PhotoAnalysisResult): Promise<Scenario[]> {
    await wait(1200);

    const placeCompatibleScenarios = mockScenarios
      .map(cloneScenario)
      .map((scenario) => applyPlaceAndAnswerContext(scenario, info))
      .sort((a, b) => {
        const photoImpact = photoAnalysis?.suggested.impactArea;
        const photoScoreA = photoImpact && a.impactArea === photoImpact ? 2 : 0;
        const photoScoreB = photoImpact && b.impactArea === photoImpact ? 2 : 0;
        return scoreScenario(b, answers) + photoScoreB - (scoreScenario(a, answers) + photoScoreA);
      });

    return placeCompatibleScenarios.map((scenario, index) => ({
      ...scenario,
      confidenceLabel: index === 0
        ? photoAnalysis?.findings.length
          ? '입력 정보·사진 단서와 가장 가까운 후보'
          : '입력 정보와 가장 가까운 후보'
        : `${info.placeType} 조건 내 대안 후보 ${index + 1}`
    }));
  },

  async generateNarrative(info: BasicAccidentInfo, draft: ScenarioDraft): Promise<AccidentNarrativeResult> {
    await wait(550);

    const directionPhrase = draft.otherVehicleDirection === '잘 모르겠음'
      ? '확인되지 않은 방향에서 접근한 상대 차량'
      : `${draft.otherVehicleDirection} 방향의 상대 차량`;

    return {
      narrative: `고객 차량은 ${draft.placeType}에서 ${draft.myVehicleState}이었으며, ${directionPhrase}과 고객 차량 ${draft.impactArea} 부위가 접촉한 사고로 설명됩니다. 이 문장은 고객님의 사고 설명 정리를 돕기 위한 초안이며, 사고 원인·과실·책임 판단을 포함하지 않습니다.`,
      structured: {
        placeType: draft.placeType,
        myVehicleState: draft.myVehicleState,
        otherVehicleDirection: draft.otherVehicleDirection,
        impactArea: draft.impactArea,
        estimatedType: draft.estimatedType
      }
    };
  }
};
