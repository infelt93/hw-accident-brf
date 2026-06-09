# Design

## Source of truth
- Status: Active draft
- Last refreshed: 2026-06-07
- Primary product surfaces:
  - Mobile-first Next.js MVP for `AI 사고 브리핑`.
  - Home/start surface, compensation-system loading, photo upload/camera capture, mock photo analysis, optional additional questions, 2D accident replay, editable scenario, reference-material generation, completion.
- Evidence reviewed:
  - `README.md` — product purpose, positioning, flow, limits, future expansion, execution guide.
  - `app/page.tsx` — full app flow, step metadata, state management, copy, Hanwha compensation-system loading mock, photo-analysis/edit UX, replay/reference-material screens.
  - `src/components/AppShell.tsx` — mobile shell, progress indicator, Hanwha Insurance header treatment.
  - `src/components/Button.tsx` — CTA variants and disabled state styling.
  - `src/components/Field.tsx` — form field styling and focus treatment.
  - `src/components/FileUploadCard.tsx` — upload plus camera capture interaction.
  - `src/components/InfoPill.tsx`, `LoadingPanel.tsx`, `Notice.tsx` — supporting UI primitives and global disclaimer.
  - `src/components/ReplayScene.tsx` — 2D road/intersection/parking/alley replay renderer, timeline, play controls, uploaded-photo overlay support for reference material.
  - `src/data/mockScenarios.ts` — additional interview questions and default scenario data.
  - `src/services/aiService.ts` — mock photo analysis, place-type-filtered scenario generation, narrative generation, future OpenAI/API seam.
  - `src/types/accident.ts` — accident, photo, interview, replay, scenario, and narrative domain model.
  - `tailwind.config.ts`, `app/globals.css` — Hanwha Orange palette, calm neutral palette, warm background, replay grid/road styles, motion token.
  - 2026-06-07 screen refinement pass — refreshed mobile shell/header, Hanwha logo asset, floating CTA tray, hero, upload cards, analysis confirmation card, question cards, replay scene, timeline controls, and reference-material preview.
  - 2026-06-07 wording/progress refinement — customer-facing wording uses “상황 정리”, progress is a single segmented indicator, and Step 2 emphasizes photo analysis content before supporting photo clues.
  - 2026-06-07 service deck output — `outputs/.../AI-사고-브리핑-서비스-설명자료.pptx`, 12-slide service explanation deck with Step 1–6 MVP screenshots.
  - 2026-06-07 presentation redesign reference — Toss Insurance official site/career-style content (`https://tossinsu.com/`): large direct Korean headlines, airy white sections, customer trust language, and simple policy/benefit card groupings.
  - No existing root `DESIGN.md`, `docs/design*`, Figma exports, screenshots, Storybook, or visual-regression baselines were found in the repository.

## Brand
- Personality:
  - Calm, trustworthy, clear, insurance-app-like, and supportive rather than playful.
  - Uses Hanwha-inspired warm orange as a high-salience action and confidence color, balanced with slate/calm neutrals.
  - Feels like a claims-support assistant, not an adjudication or blame-assignment tool.
- Trust signals:
  - Persistent disclaimer: “AI는 사고 원인, 과실, 책임을 판단하지 않습니다. 고객님의 사고 설명을 돕기 위한 보조 서비스입니다.”
  - “한화손해보험 보상 시스템” loading and basic-info retrieval mock to imply authenticated app context.
  - Structured rows for accident time, place, customer vehicle state, counterpart direction, impact area, and estimated accident type.
  - Explicit customer confirmation checkbox before reference material generation.
  - Uploaded/captured photo previews and reference-material composition over an uploaded scene image.
  - Clear visual distinction between customer vehicle and counterpart vehicle.
- Avoid:
  - Any language implying AI determines cause, liability, compensation, or final fault ratio.
  - Toy-like game visuals, comedic tone, exaggerated effects, or overly technical mock/debug copy in customer-facing screens.
  - Asking users to repeatedly re-enter facts already available from the compensation system, photos, or accepted analysis.
  - Showing place-type-inconsistent scenarios, e.g. parking-lot replay after a road/intersection analysis unless explicitly requested as an alternative.

## Product goals
- Goals:
  - Help customers recall and organize an accident situation shortly after a stressful event.
  - Make photo-first accident replay feel automatic: upload/capture photos, then receive a likely simulation with minimal mandatory input.
  - Convert unstructured memory into a concise narrative and structured reference data for a claims handler.
  - Position output as “사고 접수 후 참고자료 생성,” not as final accident filing, fault judgment, or automated claims decision.
  - Keep the MVP demo impressive around the replay/timeline and uploaded-photo reference material.
- Non-goals:
  - No actual accident cause, fault, responsibility, damage, payment, or compensation decision.
  - No real insurance/claims-system API integration.
  - No real Vision AI/photo analysis in the current MVP.
  - No physical simulation, exact map reconstruction, dashcam parsing, or production-grade 3D engine.
  - No final insurer accident intake submission UI in the current positioning.
- Success signals:
  - A user can complete the flow primarily through photo upload/capture and one optional question stage.
  - The recommended Step 4 replay is understandable without reading long text.
  - The top scenario matches prior place type and accepted analysis hints.
  - Users can correct analysis/scenario details without restarting.
  - The final generated reference material clearly separates customer-confirmed explanation from insurer review.

## Personas and jobs
- Primary personas:
  - Accident customer: recently involved in a vehicle accident, under stress, using a mobile insurance app.
  - Claims handler: later reviews customer-provided context and wants a quick visual/narrative reference.
- User jobs:
  - Customer: “사진만으로 사고 장면을 먼저 떠올리고, 틀린 부분만 고쳐서 설명 초안을 남기고 싶다.”
  - Customer: “내가 어느 차였고 상대 차량이 어디서 왔는지 쉽게 이해하고 확인하고 싶다.”
  - Claims handler: “고객이 확인한 사고 설명, 사진, 도식, 구조화 데이터를 빠르게 파악하고 싶다.”
- Key contexts of use:
  - Mobile-first, likely inside or adjacent to an insurer app after a claim exists.
  - Stressful, time-sensitive, low attention span, potentially roadside or after initial contact.
  - Users may have photos but incomplete memory; optional questions must not feel like a long form.

## Information architecture
- Primary navigation:
  - Linear step flow with explicit previous-step navigation after entry.
  - Home is a start surface; app steps use an `AppShell` with progress count and top-level disclaimer.
  - Optional branches: analysis edit, alternative scenarios, scenario edit, and final correction.
- Core routes/screens:
  - Single Next.js page route (`app/page.tsx`) with local state-driven screens.
  - Home: service positioning and start CTA.
  - Step 1: compensation-system basic-info loading mock, then photo upload/camera capture.
  - Step 2: combined photo-based analysis result and optional analysis correction.
  - Step 3: always-visible additional questions, then optional free-text additional info.
  - Step 4: recommended 2D accident situation summary and, on demand, alternative scenarios. Optional correction stays within this Step 4 flow.
  - Step 5: generated reference material preview with narrative, structured data, and uploaded-photo-based situation diagram.
  - Step 6: reference-material completion with mock reference number, PDF download, and restart.
- Content hierarchy:
  - Primary CTA and current step explanation first.
  - Safety/disclaimer and “not judgment” copy remain visible but compact.
  - Visual replay should precede dense structured details where possible.
  - Edits are secondary actions, available but not forced.
  - In analysis confirmation, show the photo analysis content used for scenario generation first; photo clues are supporting evidence below that content.

## Design principles
- Principle 1: Photo-first, low-friction flow.
  - Photos and preloaded compensation-system information should drive the default experience.
  - Ask only for unresolved or high-value context; do not re-ask accepted facts.
- Principle 2: Memory support, not judgment.
  - Every screen should reinforce that AI helps structure customer explanation only.
  - Generated content is a draft/reference for claims-handler review.
- Principle 3: Show before asking.
  - Present the likely replay first, then let the customer say “유사해요” or “수정할래요.”
  - Alternative scenarios remain behind an explicit user action to avoid overwhelming users.
- Principle 4: Make motion and direction legible.
  - Customer vehicle, counterpart vehicle, arrows, collision point, and timeline must all agree with each scenario’s direction/impact data.
  - Vehicles should stay on the rendered road/intersection/parking-lane geometry.
- Tradeoffs:
  - Mock Vision AI gives a strong demo but must be clearly positioned as non-final and non-diagnostic.
  - 2D simulation is more reliable and readable in the MVP than premature 3D; uploaded-photo composition is reserved for final reference material.
  - Optional questions improve accuracy but increase friction; keep them visible, concise, and skippable where possible.

## Visual language
- Color:
  - Primary action: `hanwha-500 #f37321`; stronger states use `hanwha-600 #ea650d` and `hanwha-700 #c94f08`.
  - Warm surfaces: `hanwha-50 #fff7ed`, `hanwha-100 #ffedd5`, `hanwha-200 #fed7aa`.
  - Neutrals: slate/calm palette for text, cards, borders, and background contrast.
  - Replay semantics: customer vehicle is Hanwha orange; counterpart vehicle is red/rose; collision point is a pulsing warm marker.
  - Presentation redesign rule: all slide backgrounds should be pure white. Avoid dark filled panels/black hero sections; use dark ink only for text, thin rules, and low-emphasis labels.
  - Presentation accent system: use Hanwha orange for numbers, dividers, highlight chips, and selected cards; use pale orange/cream only as small card fills, not full-slide backgrounds.
- Typography:
  - Korean-first UI using existing app font stack.
  - Strong section titles with `font-black`/bold hierarchy; supporting copy in smaller, readable slate text.
  - Keep labels direct and short; avoid long legal blocks except required confirmation copy.
- Spacing/layout rhythm:
  - Mobile card rhythm with rounded white panels, 16–24px internal spacing, and consistent vertical gaps.
  - One primary card/action group per step to reduce cognitive load.
  - Primary step CTA belongs in the bottom floating action tray, with enough scroll padding so it does not cover content.
  - Preserve thumb-friendly CTAs and avoid dense multi-column layouts on mobile.
  - Presentation rhythm: Toss-style airy pages with a single large headline, generous whitespace, and one proof object per slide. Step slides use left-side message hierarchy plus right-side light phone mockup.
- Shape/radius/elevation:
  - Soft rounded corners (`rounded-2xl`, `rounded-3xl`) and warm soft shadow (`shadow.soft`).
  - Pills for metadata and trust/status cues.
  - Elevated hero and step cards should feel app-like and reliable, not floating gimmicks.
  - The app shell should read like a polished mobile insurance surface: compact brand header, clear step progress, white cards over a warm calm background, and one dominant CTA per step.
  - Progress should be one segmented indicator only; avoid showing both a continuous bar and a second step bar.
  - Presentation cards: use clean white cards with 1px warm borders, soft shadows, and orange numeric badges. Avoid dark callout bars; replace them with outline cards or pale-orange chips.
- Motion:
  - Loading bars/spinners communicate system work: compensation info retrieval, photo analysis, replay generation, narrative generation.
  - Replay animation uses the scenario’s timeline frames: 사고 5초 전 / 3초 전 / 1초 전 / 충돌.
  - Motion must be simple, deterministic, and readable; avoid physics-like claims.
- Imagery/iconography:
  - Use `public/hanwha-logo.png` for the header brand mark.
  - Header should stay compact: Hanwha logo plus `AI 사고 브리핑`; avoid extra top chips such as standalone “Hanwha” or “AI 보조 서비스.”
  - Use schematic 2D roads/intersections for Step 4 simulation.
  - Use uploaded scene photo as the background only in generated reference material composition, with overlay contrast/scrim as needed.
  - Vehicle shapes should read as cars, not generic ovals; include front/rear orientation cues where possible.
  - Presentation screenshots: keep real MVP captures inside light phone/device frames. Frames should be white/light-gray/orange-accented rather than black.

## Components
- Existing components to reuse:
  - `AppShell`: header, progress, page shell.
  - `Notice`: global non-judgment disclaimer.
  - `Button`: primary, secondary, ghost CTA treatments.
  - `Field`: consistent labels, helper text, and focus treatment.
  - `FileUploadCard`: photo upload and camera capture slot UI.
  - `InfoPill`: compact metadata/status chips.
  - `LoadingPanel`: system/AI work-in-progress states.
  - `ReplayScene`: scenario preview, full replay, mini alternatives, static reference-material visual.
- New/changed components:
  - Refreshed `AppShell`, `Button`, `FileUploadCard`, `InfoPill`, `LoadingPanel`, `Notice`, and `ReplayScene` visual treatments for a calmer Hanwha-style mobile UI.
  - `AppShell` owns the compact logo header, segmented progress indicator, and bottom floating CTA tray.
  - If further iteration continues, consider extracting Step 2 analysis confirmation, Step 3 optional questions, and Step 5 reference preview into named components to keep `app/page.tsx` smaller.
- Variants and states:
  - `Button`: primary/secondary/ghost, full-width, disabled.
  - `ReplayScene`: `full`, `mini`, `static`; with or without `backgroundImageUrl`.
  - `FileUploadCard`: empty, uploaded preview, camera capture, upload source metadata.
  - Analysis/scenario correction: collapsed and expanded states.
  - Loading states: compensation lookup, photo analysis, replay generation, reference generation.
- Token/component ownership:
  - Color/elevation/motion tokens live in `tailwind.config.ts`.
  - Global background and replay surface utilities live in `app/globals.css`.
  - Domain types and replay frame schema live in `src/types/accident.ts` and should not be duplicated in UI components.
  - Mock AI behavior lives in `src/services/aiService.ts`; UI should call service functions rather than hardcoding AI outputs in components.

## Accessibility
- Target standard:
  - Aim for WCAG 2.1 AA for the MVP UI; treat this as a design target even if not yet fully audited.
- Keyboard/focus behavior:
  - Interactive controls should be reachable in logical step order.
  - Existing Tailwind focus rings should remain visible on buttons, fields, upload/camera controls, edit buttons, and confirmation checkbox.
  - Hidden file inputs must remain associated with visible labels/buttons.
- Contrast/readability:
  - Primary orange CTAs need sufficient text contrast; prefer white text on `hanwha-500/600` and dark text on light orange surfaces.
  - Keep small helper copy at readable sizes and avoid low-contrast warm text over orange gradients.
- Screen-reader semantics:
  - Maintain semantic headings per step and meaningful button labels.
  - Replay visuals need accompanying text summary, vehicle legend, timeline labels, and structured data so the experience is not image-only.
  - Uploaded/captured images should have descriptive alt text when displayed.
- Reduced motion and sensory considerations:
  - Global `prefers-reduced-motion` CSS is present for animations/transitions.
  - Keep replay controls manual and provide static timeline states for users who cannot use animation.

## Responsive behavior
- Supported breakpoints/devices:
  - Primary: mobile phone portrait, insurer-app style, centered max-width shell.
  - Secondary: tablet/desktop browser demo should remain usable with the mobile shell centered.
- Layout adaptations:
  - Mobile: single-column cards and full-width CTAs.
  - Larger screens: preserve mobile app frame rather than expanding into a sparse desktop layout unless a separate demo mode is designed.
- Touch/hover differences:
  - Touch targets should remain large enough for roadside/mobile use.
  - Hover styling may supplement but must not be the only indicator of interactivity.
  - Camera capture should gracefully degrade to file upload when browser/device camera capture is unavailable.

## Interaction states
- Loading:
  - Compensation-system basic info: progress bar and reassuring “loading from system” copy.
  - Photo analysis: “AI가 사고 단서를 확인 중입니다” style loading, without claiming real diagnosis.
  - Replay/reference generation: concise AI-working copy, then deterministic mock result.
- Empty:
  - Photo slots show clear upload/camera CTAs and required slot labels.
  - If no uploaded scene photo exists, final reference material falls back to a clean 2D replay diagram.
- Error:
  - Current MVP has limited error handling. Future state should cover unsupported file type, camera permission denied, photo preview failure, and service/API timeout.
- Success:
  - Uploaded photo previews, analysis-complete status, replay-ready status, checked confirmation, and reference-material completion number.
- Disabled:
  - Prevent progression while required async mocks are loading.
  - Final “참고자료 생성하기” remains disabled until customer confirmation is checked.
- Offline/slow network, if applicable:
  - For future API integration, show resumable progress and reassure that no final claim decision is being made by AI.
  - Keep local photo previews available even if backend analysis is delayed.

## Content voice
- Tone:
  - Korean, calm, concise, supportive, and practical.
  - Use “고객님/고객 차량” and “상대 차량” consistently.
  - Frame AI as a helper that organizes memory and creates a draft/reference.
- Terminology:
  - Preferred: “사고 참고자료”, “상황 정리”, “사진 단서”, “추가 확인”, “고객 확인값”, “보상 담당자 검토”.
  - Avoid as primary CTA/positioning: “사고 접수하기” or “접수서 제출” unless the product scope changes back to filing.
  - Required disclaimer uses “사고 원인, 과실, 책임” only to deny AI judgment.
- Microcopy rules:
  - Do not say “판단했습니다”, “과실을 산정했습니다”, “책임이 있습니다”, or similar.
  - Prefer “구성했습니다”, “정리했습니다”, “설명 초안입니다”, “참고자료로 활용될 수 있습니다”.
  - When mock analysis appears, phrase it as demo/photo clues and keep final review attributed to a claims handler.
  - Presentation copy rule: prefer short label-first phrases over long paragraphs. For the “기대효과” slide, use a 3-column matrix by 고객 / 보상 담당자 / 회사 with keyword-level outcomes and one-line subtext only.

## Implementation constraints
- Framework/styling system:
  - Next.js App Router, TypeScript, Tailwind CSS, local React state.
  - Keep the MVP frontend-centered and mock-data-driven.
- Design-token constraints:
  - Reuse `hanwha` and `calm` tokens from `tailwind.config.ts`; do not introduce ad hoc brand colors unless added as tokens.
  - Reuse existing rounded-card, pill, and soft-shadow patterns.
- Performance constraints:
  - Avoid heavy 3D engines or large external visual libraries for the MVP replay.
  - Keep photo previews local and lightweight; revoke object URLs if lifecycle complexity grows.
  - Replay animations should be CSS/React-state based and deterministic.
- Compatibility constraints:
  - Browser file upload and capture attributes support the demo; native-app camera/permission integration is future scope.
  - `src/services/aiService.ts` is the contract seam for OpenAI/Vision/backend replacement; preserve return types in `src/types/accident.ts`.
- Test/screenshot expectations:
  - For UI changes, run at least `npm run lint` and `npm run build` when code changes.
  - For photo-flow changes, verify in a browser: Step 4 pure 2D situation diagram, road-aligned vehicle motion, on-demand alternatives, and Step 5 uploaded-photo composition.
  - 2026-06-07 refinement validation covered home, Step 1, Step 2, Step 3, Step 4 playback, Step 5 reference material, checkbox-gated completion, `npm run lint`, and `npm run build`.
  - If a visual reference is later approved, use `$visual-ralph`; this `DESIGN.md` is the design contract, not a pixel-diff baseline.
  - For presentation redesigns, render every slide to PNG before delivery and confirm: white backgrounds, no dark filled panels, Step 1–6 screenshots present, and final expected-effects slide readable at thumbnail size.

## Open questions
- [ ] Brand governance / owner: confirm whether official Hanwha brand assets, logo usage, color specifications, and legal approvals are required for the competition demo. Impact: may require visual/token updates and logo restrictions.
- [ ] Claims-system contract / owner: define the real fields returned by the insurer compensation system and which fields are customer-editable. Impact: affects Step 1/2 data hierarchy and validation.
- [ ] Vision AI confidence / owner: decide how to display uncertainty when real Vision AI is added. Impact: prevents over-trust and supports explainability.
- [ ] Camera/native app integration / owner: decide whether capture is browser-only or native-app camera flow. Impact: permissions, storage, and UX copy.
- [ ] Accessibility audit / owner: confirm required standard and complete a full keyboard/screen-reader audit. Impact: timeline/replay controls, generated imagery alternatives, and confirmation flow.
- [ ] Reference-material output / owner: decide whether the final artifact is PDF, image, claim-handler note, backend record, or shareable link. Impact: Step 5/6 content, export UI, and data schema.
- [ ] Claims-handler view / owner: define how the generated reference material appears to internal users. Impact: may require a second persona surface beyond the customer flow.
