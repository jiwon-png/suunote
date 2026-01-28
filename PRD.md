📘 SSU-Note
Product Requirements Document (PRD) – Final Version
Phase 1 – MVP
개인 학습 구조화 기반 검증
1. Project Overview
1.1 서비스명

SSU-Note (Smart Study University Note)

1.2 Phase 1 문제 정의

현재 대학생의 학습 환경은 자료가 텍스트, 필기, 녹음, 영상 등으로 분산되어 있으며,
학습 정리는 개인의 시간과 역량에 크게 의존하고 있다.

Phase 1에서 SSU-Note가 다루는 핵심 질문은 다음과 같다.

“AI가 학습 흐름 안에서
사용자에게 지속적으로 사용 가능한 가치를 제공할 수 있는가?”

이는 단순한 AI 응답의 정확도 검증이 아니라,
AI가 학습 서비스의 ‘구성 요소’로서 정상적으로 동작하는지를 검증하는 단계이다.

1.3 Phase 1 목표

인증·CRUD·AI 연동을 포함한 웹 서비스 핵심 구조 구현

학습 텍스트 입력 → AI 처리 → 결과 저장 → 재조회까지의
완결된 학습 흐름 검증

Phase 2 고도화를 전제로 한
확장 가능한 데이터 구조와 UX 뼈대 확보

2. Product Scope (Phase 1)
2.1 In Scope

Google Social Login (Mock)

텍스트 기반 학습 노트 CRUD

AI 텍스트 처리

요약

핵심 포인트

학습 방향 제안

AI 결과 저장 및 재조회

단선 기반의 명확한 UX 흐름

2.2 Out of Scope (Phase 1)

Phase 1에서는 기능의 완성도가 아니라
서비스 구조와 흐름의 안정성을 검증하기 위해
다음 항목을 완성형 UI 기준으로는 제외한다.

개념 맵 전체 시각화 UI

학습 타임라인 전체 화면

퀴즈 독립 기능 제공

멀티모달 입력의 실제 OCR / STT 처리

※ 단,
위 기능들은 UX 힌트, 안내 문구, CTA 형태로는 부분 노출될 수 있으며,
완성형 기능은 Phase 2에서 확장한다.

3. Core Features (Phase 1)
3.1 Authentication

Google OAuth 기반 로그인 UI

사용자별 데이터 접근 분리 (Mock)

의미

인증은 단순 로그인 기능이 아니라,
모든 학습 데이터가 개인 학습 맥락에 귀속되기 위한 전제 조건이다.

3.2 Study Post Management (CRUD)

텍스트 기반 학습 노트 생성

목록 조회 / 상세 조회 / 삭제

의미

Study Post는 실제 강의 자료를 대체하는 Mock 학습 데이터이며,
Phase 2에서 멀티모달 입력으로 확장될 구조적 출발점이다.

3.3 AI Text Processing

입력 텍스트 기반 AI 처리

단일 프롬프트 기반 응답

결과 유형:

요약

핵심 포인트

학습 방향 제안

의미

AI의 목적은 정교한 분석이 아니라,
입력 → 처리 → 저장 → 재활용이라는
서비스형 AI 구조의 기술적 검증이다.

3.4 AI Result Persistence

AI 결과 데이터 저장

기존 학습 노트와 함께 재조회 가능

의미

AI를 단발성 도구가 아닌,
누적 가능한 학습 서비스 기능으로 정의한다.

4. UX / UI Structure (Phase 1)
4.1 UX 설계 원칙

기능보다 이해 가능성 우선

분기 없는 단선 흐름

결과의 즉시 확인

사용자는 “복잡한 설정을 하지 않는다”

4.2 UX Flow
Login
 → Study Post List
   → Study Post Create
     → AI Result View
       → List

4.3 사용자 경험 의도

사용자는 “AI가 학습을 도와준다”는 최소 경험을 얻고

개발자는 전체 데이터 흐름과 UX 연결이 끊기지 않는지 검증한다.

5. Data Modeling (Phase 1)
5.1 핵심 엔티티

User

StudyPost

AIResult

5.2 관계 구조
User 1 ─── N StudyPost
StudyPost 1 ─── 1 AIResult

5.3 확장 전제

Course / Session 개념은
Phase 1에서 개념적으로 도입되지만,

구조화·시각화·누적 분석 기능은
Phase 2에서 본격 확장한다.

6. Success Criteria (Phase 1)

Phase 1의 성공은 다음 질문으로 판단한다.

사용자는 SSU-Note를 AI 학습 도구로 인식하는가?

AI 결과는 저장되고 다시 활용 가능한가?

현재 구조가 Phase 2 확장을 자연스럽게 수용할 수 있는가?

📙 SSU-Note
Product Requirements Document (PRD)
Phase 2 – Advanced
학습 구조화 플랫폼
1. Phase 2 문제 정의

Phase 2의 핵심 질문은 다음과 같다.

“AI가 사용자의 학습 맥락을 이해하고,
수업 간 지식을 연결하며,
누적 학습을 설계할 수 있는가?”

이는 AI 응답 품질 문제가 아니라,
학습 구조를 설계하는 문제이다.

2. Phase 2 목표

학습 데이터를 개념·시간·관계 단위로 구조화

사용자가

무엇을 이해했는지

무엇을 놓쳤는지
스스로 인지 가능

SSU-Note를
단순 노트 앱 → 학습 인프라 플랫폼으로 진화

3. Product Scope (Phase 2)
3.1 Phase 2A – 구조화 중심 확장 (v0 기준 구현 영역)

Course(코스) 단위 학습 구조

코스 = 주차/주제별 학습 단위

개념 추출 및 연결 (Mock)

개념 맵 / 타임라인 힌트 UX

복습 진입 CTA

3.2 Phase 2B – 기능 고도화

멀티모달 학습 자료 실제 처리

개념 맵·타임라인 전체 시각화

퀴즈 고도화

대시보드 및 장기 분석 기능

4. Core Features (Phase 2)
4.1 Course / Session 구조

과목 하위에 코스(Course) 생성

코스는 주차/주제 단위 학습 묶음

모든 학습 데이터는 코스에 귀속

4.2 개념 맵

핵심 개념 노드 및 관계 관리

기본 화면에서는 전체 노출 ❌

Course 상세 화면에서만 전체 시각화

4.3 학습 타임라인

코스 기준 학습 흐름 누적

이전·다음 학습 연결 제공

기본 화면에서는 힌트 형태로만 노출

4.4 퀴즈 및 해설

개념 기반 퀴즈 생성

오답 시 개념 연결 중심 해설

평가가 아닌 이해 보조 도구로 설계

5. UX 변화의 본질

Phase 1: AI가 답한다

Phase 2: AI가 이해하고 연결한다

AI는 추가 기능이 아니라,
기존 학습 흐름 위에서 자연스럽게 드러나는 조력자로 동작한다.

6. Success Criteria (Phase 2)

코스 단위 재방문율

개념 연결 확장률

복습 기능 사용률

장기 사용 유지율