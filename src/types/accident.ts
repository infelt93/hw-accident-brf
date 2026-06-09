export const DISCLAIMER_TEXT =
  'AI는 사고 원인, 과실, 책임을 판단하지 않습니다. 고객님의 사고 설명을 돕기 위한 보조 서비스입니다.';

export const PLACE_TYPES = ['일반도로', '교차로', '주차장', '골목길'] as const;
export type PlaceType = (typeof PLACE_TYPES)[number];

export const VEHICLE_STATES = ['직진 중', '정차 중', '후진 중', '주차 중', '주차장 통로 이동 중', '잘 모르겠음'] as const;
export type VehicleState = (typeof VEHICLE_STATES)[number];

export const DIRECTIONS = ['전방', '후방', '좌측', '우측', '잘 모르겠음'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const IMPACT_AREAS = ['전면', '후면', '좌측면', '우측면', '우측 후면', '좌측 후면'] as const;
export type ImpactArea = (typeof IMPACT_AREAS)[number];

export type UploadSlot = 'ownDamage' | 'opponentVehicle' | 'scene';

export interface BasicAccidentInfo {
  accidentDateTime: string;
  location: string;
  placeType: PlaceType;
  briefDescription: string;
}

export interface UploadedPhoto {
  slot: UploadSlot;
  label: string;
  fileName: string;
  size: number;
  previewUrl?: string;
  source?: 'upload' | 'camera';
}


export interface PhotoFinding {
  slot: UploadSlot;
  label: string;
  fileName: string;
  finding: string;
  confidenceLabel: string;
}

export interface PhotoAnalysisResult {
  detectedHints: string[];
  findings: PhotoFinding[];
  suggested: {
    placeType?: PlaceType;
    impactArea?: ImpactArea;
    note: string;
  };
}

export interface InterviewQuestion {
  id: string;
  question: string;
  options: readonly string[];
}

export type InterviewAnswers = Record<string, string>;

export interface ReplayVehiclePose {
  x: number;
  y: number;
  rotation: number;
}

export interface ReplayFrame {
  id: string;
  label: '사고 5초 전' | '사고 3초 전' | '사고 1초 전' | '충돌';
  myCar: ReplayVehiclePose;
  otherCar: ReplayVehiclePose;
  collision?: {
    x: number;
    y: number;
  };
}

export interface ReplayArrow {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  label: string;
  actor: 'my' | 'other';
}

export interface ReplayConfig {
  background: 'road' | 'intersection' | 'parking' | 'alley';
  frames: ReplayFrame[];
  arrows: ReplayArrow[];
}

export interface Scenario {
  id: 'A' | 'B' | 'C';
  title: string;
  confidenceLabel: string;
  summary: string[];
  placeType: PlaceType;
  myVehicleState: VehicleState;
  otherVehicleDirection: Direction;
  impactArea: ImpactArea;
  estimatedType: string;
  replay: ReplayConfig;
}

export interface ScenarioDraft {
  scenarioId: Scenario['id'];
  title: string;
  placeType: PlaceType;
  myVehicleState: VehicleState;
  otherVehicleDirection: Direction;
  impactArea: ImpactArea;
  estimatedType: string;
}

export interface AccidentNarrativeResult {
  narrative: string;
  structured: {
    placeType: PlaceType;
    myVehicleState: VehicleState;
    otherVehicleDirection: Direction;
    impactArea: ImpactArea;
    estimatedType: string;
  };
}
