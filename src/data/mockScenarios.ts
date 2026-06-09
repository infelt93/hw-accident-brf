import type { BasicAccidentInfo, InterviewQuestion, PhotoAnalysisResult, Scenario } from '@/types/accident';

const defaultInterviewQuestions: InterviewQuestion[] = [
  {
    id: 'myVehicleState',
    question: '사고 당시 내 차량은 어떤 상태였나요?',
    options: ['직진 중', '정차 중', '후진 중', '주차 중', '잘 모르겠음']
  },
  {
    id: 'otherVehicleDirection',
    question: '상대 차량은 어느 방향에 있었나요?',
    options: ['전방', '후방', '좌측', '우측', '잘 모르겠음']
  },
  {
    id: 'impactArea',
    question: '충돌 부위는 어디였나요?',
    options: ['전면', '후면', '좌측면', '우측면', '우측 후면', '좌측 후면']
  },
  {
    id: 'laneChange',
    question: '차선 변경이 있었나요?',
    options: ['내 차량', '상대 차량', '둘 다 아님', '잘 모르겠음']
  }
];

export function buildInterviewQuestions(info: BasicAccidentInfo, photoAnalysis?: PhotoAnalysisResult): InterviewQuestion[] {
  const text = `${info.placeType} ${info.briefDescription}`;
  const hasStopHint = /정차|멈|신호/.test(text);
  const hasReverseHint = /후진|뒤로/.test(text);
  const hasParkingHint = /주차|출차|입차|주차면/.test(text);
  const hasRightHint = /우측|오른쪽|우회전/.test(text);
  const hasRearHint = /후방|뒤|후면|추돌/.test(text);
  const photoImpact = photoAnalysis?.suggested.impactArea;

  const myVehicleOptions = info.placeType === '주차장' || hasParkingHint
    ? ['주차장 통로 이동 중', '주차 중', '후진 중', '정차 중', '잘 모르겠음']
    : ['직진 중', '정차 중', '후진 중', '주차 중', '잘 모르겠음'];

  return [
    {
      id: 'myVehicleState',
      question: hasStopHint
        ? '입력하신 설명에 정차/신호 대기 단서가 있습니다. 사고 당시 내 차량은 실제로 어떤 상태였나요?'
        : hasReverseHint
          ? '입력하신 설명에 후진 단서가 있습니다. 사고 당시 내 차량 이동 상태를 확인해주세요.'
          : info.placeType === '주차장'
            ? '주차장 사고로 입력하셨습니다. 사고 당시 내 차량은 어떤 상태였나요?'
            : '사고 당시 내 차량은 어떤 상태였나요?',
      options: myVehicleOptions
    },
    {
      id: 'otherVehicleDirection',
      question: hasRightHint
        ? '입력하신 설명에 우측/오른쪽 단서가 있습니다. 상대 차량은 어느 방향에 있었나요?'
        : hasRearHint
          ? '입력하신 설명에 후방/뒤쪽 단서가 있습니다. 상대 차량의 위치를 확인해주세요.'
          : '상대 차량은 어느 방향에 있었나요?',
      options: ['전방', '후방', '좌측', '우측', '잘 모르겠음']
    },
    {
      id: 'impactArea',
      question: photoImpact
        ? `사진 단서 분석이 충돌 부위 후보를 ${photoImpact}로 표시했습니다. 실제 충돌 부위가 맞나요?`
        : '사진과 설명을 참고자료에 연결하기 위해 충돌 부위를 확인해주세요. 충돌 부위는 어디였나요?',
      options: photoImpact
        ? [photoImpact, ...['전면', '후면', '좌측면', '우측면', '우측 후면', '좌측 후면'].filter((area) => area !== photoImpact)]
        : ['전면', '후면', '좌측면', '우측면', '우측 후면', '좌측 후면']
    },
    {
      id: 'laneChange',
      question: info.placeType === '주차장'
        ? '사고 직전 출차, 후진, 통로 진입처럼 차량 위치 변화가 있었나요?'
        : '사고 직전 차선 변경이나 진입 움직임이 있었나요?',
      options: info.placeType === '주차장'
        ? ['내 차량', '상대 차량', '둘 다 아님', '잘 모르겠음']
        : ['내 차량', '상대 차량', '둘 다 아님', '잘 모르겠음']
    }
  ];
}

export const interviewQuestions = defaultInterviewQuestions;


export const mockScenarios: Scenario[] = [
  {
    id: 'A',
    title: '직진 중 우측 차선 차량 진입',
    confidenceLabel: '인터뷰 답변과 가장 유사',
    summary: ['고객 차량은 직진 중', '상대 차량이 내 차량 우측 후방에서 진입', '충돌 지점: 우측 후면'],
    placeType: '일반도로',
    myVehicleState: '직진 중',
    otherVehicleDirection: '우측',
    impactArea: '우측 후면',
    estimatedType: '차선 변경 접촉',
    replay: {
      background: 'road',
      arrows: [
        { id: 'my-forward', actor: 'my', from: { x: 24, y: 52 }, to: { x: 64, y: 52 }, label: '내 차량 직진' },
        { id: 'other-merge', actor: 'other', from: { x: 84, y: 70 }, to: { x: 59, y: 62 }, label: '내 차량 우측 후방 접근' }
      ],
      frames: [
        {
          id: 'a-5',
          label: '사고 5초 전',
          myCar: { x: 24, y: 52, rotation: 0 },
          otherCar: { x: 84, y: 70, rotation: 0 }
        },
        {
          id: 'a-3',
          label: '사고 3초 전',
          myCar: { x: 42, y: 52, rotation: 0 },
          otherCar: { x: 74, y: 68, rotation: 0 }
        },
        {
          id: 'a-1',
          label: '사고 1초 전',
          myCar: { x: 57, y: 52, rotation: 0 },
          otherCar: { x: 64, y: 65, rotation: 0 }
        },
        {
          id: 'a-impact',
          label: '충돌',
          myCar: { x: 63, y: 52, rotation: 0 },
          otherCar: { x: 59, y: 63, rotation: 0 },
          collision: { x: 57, y: 60 }
        }
      ]
    }
  },
  {
    id: 'B',
    title: '정차 중 후방 차량 추돌',
    confidenceLabel: '후방 충돌 가능 장면',
    summary: ['고객 차량은 정차 중', '상대 차량이 후방에서 접근', '충돌 지점: 후면'],
    placeType: '일반도로',
    myVehicleState: '정차 중',
    otherVehicleDirection: '후방',
    impactArea: '후면',
    estimatedType: '후방 추돌',
    replay: {
      background: 'road',
      arrows: [
        { id: 'my-stop', actor: 'my', from: { x: 58, y: 58 }, to: { x: 58, y: 58 }, label: '내 차량 정차' },
        { id: 'other-rear', actor: 'other', from: { x: 18, y: 58 }, to: { x: 48, y: 58 }, label: '상대 차량 후방 접근' }
      ],
      frames: [
        {
          id: 'b-5',
          label: '사고 5초 전',
          myCar: { x: 58, y: 58, rotation: 90 },
          otherCar: { x: 18, y: 58, rotation: 90 }
        },
        {
          id: 'b-3',
          label: '사고 3초 전',
          myCar: { x: 58, y: 58, rotation: 90 },
          otherCar: { x: 32, y: 58, rotation: 90 }
        },
        {
          id: 'b-1',
          label: '사고 1초 전',
          myCar: { x: 58, y: 58, rotation: 90 },
          otherCar: { x: 44, y: 58, rotation: 90 }
        },
        {
          id: 'b-impact',
          label: '충돌',
          myCar: { x: 59, y: 58, rotation: 90 },
          otherCar: { x: 50, y: 58, rotation: 90 },
          collision: { x: 54, y: 58 }
        }
      ]
    }
  },
  {
    id: 'C',
    title: '주차장 출차 중 측면 접촉',
    confidenceLabel: '주차장 사고 후보',
    summary: ['고객 차량은 주차장 통로 이동 중', '상대 차량이 내 차량 우측 주차면에서 출차', '충돌 지점: 우측면'],
    placeType: '주차장',
    myVehicleState: '주차장 통로 이동 중',
    otherVehicleDirection: '우측',
    impactArea: '우측면',
    estimatedType: '주차장 출차 접촉',
    replay: {
      background: 'parking',
      arrows: [
        { id: 'my-aisle', actor: 'my', from: { x: 18, y: 56 }, to: { x: 60, y: 56 }, label: '통로 이동' },
        { id: 'other-exit', actor: 'other', from: { x: 82, y: 74 }, to: { x: 61, y: 63 }, label: '내 차량 우측 주차면 출차' }
      ],
      frames: [
        {
          id: 'c-5',
          label: '사고 5초 전',
          myCar: { x: 18, y: 56, rotation: 0 },
          otherCar: { x: 82, y: 74, rotation: 0 }
        },
        {
          id: 'c-3',
          label: '사고 3초 전',
          myCar: { x: 34, y: 56, rotation: 0 },
          otherCar: { x: 74, y: 70, rotation: 0 }
        },
        {
          id: 'c-1',
          label: '사고 1초 전',
          myCar: { x: 52, y: 56, rotation: 0 },
          otherCar: { x: 66, y: 66, rotation: 0 }
        },
        {
          id: 'c-impact',
          label: '충돌',
          myCar: { x: 60, y: 56, rotation: 0 },
          otherCar: { x: 61, y: 63, rotation: 0 },
          collision: { x: 58, y: 62 }
        }
      ]
    }
  }
];
