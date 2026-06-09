# AI 사고 브리핑

한화손해보험 톤으로 구성한 보험사 바이브코딩 대회용 프론트엔드 중심 MVP입니다. 자동차 사고 접수 후 고객이 사고 상황을 다시 설명하기 어려운 문제를 줄이기 위해, 보상 시스템에서 기본 정보를 불러온 뒤 사진 업로드/촬영만으로 사고 상황 정리 장면을 구성하고 보상 담당자 검토에 활용할 수 있는 참고자료 초안을 생성합니다. AI 인터뷰는 필수가 아니라 사진으로 드러나지 않는 내용을 보완하는 선택 단계입니다.

> **중요 고지**  
> AI는 사고 원인, 과실, 책임을 판단하지 않습니다. 고객님의 사고 설명을 돕기 위한 보조 서비스입니다.

## 기술 스택

- Next.js App Router
- TypeScript
- Tailwind CSS
- React local state 기반 상태 관리
- 실제 API 연동 없이 프론트엔드 중심 데모 데이터 사용
- Hanwha Orange 중심의 웜톤 모바일 보험 UI

## 주요 구현 화면

- 홈 화면: 서비스 소개 및 시작 CTA

진행 단계는 총 6단계로 구성합니다.

1. Step 1: 접수된 사고 정보 조회 로딩 및 사진 업로드/카메라 촬영
2. Step 2: 사진 분석 내용 확인 및 선택 수정
3. Step 3: 상시 노출되는 추가 질문 및 선택형 추가 정보 입력
4. Step 4: 추천 사고 상황 정리 확인, 대안 시나리오 조회, 선택 수정
5. Step 5: 업로드 사진 기반 상황 정리 도식 참고자료 생성/확인
6. Step 6: 참고자료 생성 완료 및 PDF 다운로드

## 프로젝트 구조

```txt
app/
  globals.css          # Tailwind 및 전역 스타일
  layout.tsx           # 메타데이터/루트 레이아웃
  page.tsx             # MVP 전체 플로우
  step/[step]/page.tsx # /step/1~6 직접 진입 라우트
src/
  components/          # 공통 UI, 업로드, 상황 정리 장면 컴포넌트
  data/mockScenarios.ts# 인터뷰 질문 및 시나리오 mock 데이터
  services/aiService.ts# mockAI 함수. 추후 OpenAI API 교체 지점
  types/accident.ts    # 사고 정보/시나리오/상황 정리 장면 타입
```

## 실행 방법

요구 런타임: Node.js 20.9 이상

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 MVP를 확인합니다.

단계별 URL 직접 진입도 지원합니다.

```txt
http://localhost:3000/step/1  사진 업로드
http://localhost:3000/step/2  사진 분석 내용 확인
http://localhost:3000/step/3  추가 질문
http://localhost:3000/step/4  사고 상황 정리 확인
http://localhost:3000/step/5  참고자료 초안 확인
http://localhost:3000/step/6  참고자료 생성 완료
```

직접 진입 시 필요한 이전 단계 데이터는 `public/demo-photos`의 데모 사고 사진과 mock 분석 결과로 자동 보강됩니다.

## GitHub Pages 배포

이 프로젝트는 Vercel 없이 GitHub Pages 정적 배포도 지원합니다.

배포 URL:

```txt
https://infelt93.github.io/hw-accident-brf/
```

`main` 브랜치에 push되면 `.github/workflows/deploy-pages.yml` 워크플로우가 실행되어 `GITHUB_PAGES=true npm run build`로 정적 export를 생성하고, `out` 폴더를 GitHub Pages에 배포합니다.

GitHub Pages는 저장소 하위 경로(`/hw-accident-brf`)에서 서비스되므로, `GITHUB_PAGES=true`일 때 Next.js `basePath`와 정적 이미지 경로를 자동 보정합니다.

정적 검증 및 프로덕션 빌드 확인:

```bash
npm run lint
npm run build
npm run start
```

## AI 서비스 교체 가이드

현재 `src/services/aiService.ts`의 AI 서비스 함수가 다음 역할을 담당합니다.

- `analyzePhotos`: 사진 단서 분석 결과 생성
- `generateAccidentScenarios`: 기본정보/선택 입력값/사진 단서 기반으로 장소 유형이 맞는 시나리오 3개 생성·정렬
- `generateNarrative`: 사고 경위 문장과 구조화 데이터 생성. 화면에서는 업로드 사진 위 상황 정리 도식과 함께 한 화면에서 확인합니다.

OpenAI API 또는 백엔드 API를 붙일 때는 이 파일의 함수 구현만 교체하고, 반환 타입은 `src/types/accident.ts`의 타입을 유지하면 화면 코드를 크게 바꾸지 않아도 됩니다.

## MVP 한계

- 실제 사고 판단 아님
- 실제 과실 산정 아님
- 실제 보험 접수/보상 시스템 API 연동 없음
- 사진 분석은 실제 Vision API가 아닌 데모 데이터 처리
- 상황 정리 장면은 물리엔진/실제 좌표 정합이 아닌 템플릿 기반 2D 애니메이션

## 향후 확장 방향

- 실제 Vision AI 기반 사진 분석
- 모바일 네이티브 카메라/권한 연동 고도화
- 블랙박스 영상 요약 및 핵심 장면 추출
- 보험사 보상 시스템 API 연동
- 사고 유형별 과실 기준 설명 화면 추가
- 고객/보상담당자 양방향 커뮤니케이션
- 상황 정리 장면 저장/공유 및 담당자 검토용 도식 export
- 실제 3D 엔진 또는 블랙박스 기반 공간 재구성
