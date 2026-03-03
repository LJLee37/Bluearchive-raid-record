# 블루아카이브 레이드 트래커 — 통합 기획서 v4.0

> 작성일: 2026-03-03
> 원본: 계획서 v3.0 (Master Integrated) + 전체 기획 문서 v1.3 통합
> 성격: 개인 기록 중심 → 공개 서비스 확장 가능한 웹 어플리케이션

-----

## 0. 원본 두 문서 비교 분석

### 문서 A: 「개발 계획서 v3.0 (Master Integrated)」

**성격**: 개인화 웹 어플리케이션 — “내 기록”에 집중하는 코어 설계 문서

**장점**

- **Roster(학생 명부) + 스냅샷 아키텍처**가 핵심 차별점으로 명확히 정의됨. 매번 스펙을 수동 입력하지 않고 명부에서 불러온 뒤 스냅샷으로 독립 저장하는 구조는 UX 측면에서 매우 우수.
- **양방향 동기화** 개념(기록 저장 시 명부에 역동기화 체크박스)이 실용적.
- **장비 슬롯 고정**: Student 마스터 데이터에 `gear1Type/gear2Type/gear3Type`을 고정하고 유저 데이터에는 티어만 저장 → 입력 필드 절반으로 줄임. 중복 방지와 데이터 정합성 모두 우수.
- **하이브리드 타임라인 에디터**: Time/Cost 이중 기준의 구조화된 JSON 택틱은 단순 텍스트 메모 대비 검색·분석·재현이 가능한 핵심 기능.
- **손패 고정(startingSkills)**: `Party.startingSkills Int[]`로 시작 스킬 슬롯 인덱스를 저장. 블루아카이브 고난이도 공략의 핵심 요소를 DB 레벨에서 지원.
- **대결전 서버사이드 난이도 검증**: `difficultyMax` 기반 서버 API 검증을 명시적으로 요구.
- **SchaleDB CDN 직접 연동**: 이미지 호스팅 비용 제로화 전략이 현실적.
- **Prisma 스키마가 완성도 높음**: `AlternateForm`의 `@unique` 제거로 본체 1:N 이격을 정확히 지원. `UserStudent` 모델이 독립적으로 존재.

**단점**

- 문서 분량이 압축적이라 **UI/UX 설계, 와이어프레임, 렌더링 전략, 폴더 구조가 전무**.
- **API 엔드포인트가 6개만 요약** — RESTful 설계의 전체상이 보이지 않음.
- **인증/권한 매트릭스, Rate Limiting 전략 없음**.
- **메타 분석/통계 기능이 Phase 5(v2.0)로 미뤄져 있어** MVP에서 공개 유저 유입 경로가 부재.
- **커뮤니티/공개 피드 관련 언급 전무** — 완전한 개인 도구에 머무를 리스크.
- **고려사항/리스크 분석(저작권, 스팸, 모바일 UX 등) 전무**.
- **경쟁 사이트 분석 없음** — 차별점이 기획자의 머릿속에만 존재.
- **DevOps(CI/CD, 모니터링, 테스팅) 전략 없음**.
- Student 모델에 `nameEn` 필드 누락 — 글로벌/JP 다국어 대응 시 문제.
- Boss 모델에 `nameEn` 필드 누락.
- User 모델에 `name`, `image`, `googleId`, `createdAt`, `updatedAt` 누락 — NextAuth 표준 필드 미반영.
- User 모델에 NextAuth 필수 테이블(`Account`, `Session`) 누락.
- `TotalAssaultRecord`에 `createdAt` 누락.
- `GrandAssaultRecord`에 `createdAt` 누락, `@@index` 누락.
- Tactic 모델에 `failureTags` 없음 — 실패 원인 분석 불가.
- Party 모델에 `description`, `createdAt` 누락.

-----

### 문서 B: 「전체 기획 문서 v1.3」

**성격**: 불특정 다수 대상 공개 웹 서비스 — 개인 기록 + 커뮤니티 + 메타 통계의 풀 스펙 기획

**장점**

- **문서 완성도가 압도적**: 14개 섹션으로 프로젝트 개요, 기술 스택, 시스템 아키텍처, 기능 명세, DB 스키마, API 설계, 페이지 구조, 인증, 마스터 데이터, Phase 계획, 배포, 리스크, 경쟁 분석, 학생 스펙 상세를 모두 커버.
- **게임 도메인 지식 요약(§1.4)**이 매우 상세 — 총력전/대결전 규칙, 조력자 제한, 이격 독립성 등이 표로 정리되어 비개발자도 이해 가능.
- **경쟁 사이트 분석(§13)**: mollulog, SchaleDB, BA Torment을 구체적으로 분석하고 차용 기능과 차별화 포인트를 도출.
- **학생 스펙 저장 항목 상세(§14)**: 조력자 스탯 유추 UI 흐름, 성급 UI 설계, 장비 슬롯 UI 설계, 이격 관리 방식까지 구현 레벨의 상세 기술.
- **렌더링 전략(ISR/SSR/CSR)** 페이지별 명시.
- **인증 & 권한 매트릭스**, **Rate Limiting 전략(Upstash Redis sliding window)** 포함.
- **리스크 분석**: 저작권, 데이터 정확성, 스팸/어뷰징, 모바일 UX 각각의 대응 전략.
- **비용 추정**: 초기 $0/월 구성, 스케일 시 예상 비용.
- **폴더 구조 Appendix** 포함.
- **기술 스택이 더 상세**: React Hook Form + Zod(폼), Recharts(차트), Tiptap(에디터), Vitest + Playwright(테스트), pnpm, ESLint + Prettier, GitHub Actions, Sentry 등 DevOps 전체 명시.

**단점**

- **Roster(학생 명부) 시스템이 완전히 빠져 있음** — 이것이 가장 치명적. 매 기록마다 파티 멤버 스펙을 처음부터 입력해야 하는 UX가 됨.
- **스냅샷 아키텍처 개념 없음** — `PartyMember`가 스냅샷인지 라이브 참조인지 모호. 학생이 성장하면 과거 기록 스펙도 덮어씌워질 위험.
- **장비 슬롯이 `gearType + gearTier` 쌍으로 PartyMember에 저장** — 학생마다 장비 종류가 고정인데, 매번 종류까지 입력하게 하는 것은 불필요. 문서 A의 “마스터에 종류 고정, 유저에는 티어만” 접근이 우월.
- **하이브리드 타임라인 에디터 없음** — Tiptap 리치텍스트와 타임스탬프 태그로 대체하지만, 구조화된 JSON 타임라인(Time/Cost 기준점) 대비 검색·분석 능력이 떨어짐.
- **손패 고정(startingSkills) 지원 없음** — 고난이도 공략의 핵심 데이터 누락.
- **커뮤니티 기능(좋아요, 북마크, 포크)이 API에 명시되어 있으나 스키마에서 보류** — 설계와 구현 사이 불일치.
- **AlternateForm에서 `baseStudentId`에 `@unique`가 걸려 있음** — 본체 1개에 이격 1개만 연결 가능. 미카 본체 → 수영복 + 크리스마스 + … 같은 1:N 이격을 지원 못함. 이것은 스키마 버그.
- **SchaleDB GitHub 리포가 2025년 6월에 아카이브됨** — Supabase Storage 자체 CDN 호스팅 전략은 유효하나, SchaleDB 에셋 URL 직접 참조 전략은 리스크. 문서 A의 SchaleDB “정적 에셋 연동” 전략도 동일 리스크 공유.
- 이미지 호스팅을 Supabase Storage로 명시했으나, 용량 제한(Free: 1GB)과 대역폭 제한(Free: 2GB/월) 고려 부족.
- Phase 계획이 6단계 9~14주로 야심적이나, 1인 개발로 커뮤니티+메타+대시보드까지 포함하면 비현실적일 수 있음.

-----

### 핵심 비교 매트릭스

|항목                         |문서 A (v3.0)   |문서 B (v1.3)   |통합 판정                      |
|---------------------------|:------------:|:------------:|---------------------------|
|Roster(학생 명부) 시스템          |✅ 핵심          |❌ 없음          |**A 채택**                   |
|스냅샷 아키텍처                   |✅ 명확          |❌ 모호          |**A 채택**                   |
|장비 슬롯 고정 (마스터→티어만)         |✅             |❌ (종류+티어 매번)  |**A 채택**                   |
|하이브리드 타임라인 (Time/Cost JSON)|✅             |❌ (텍스트)       |**A 채택**                   |
|손패 고정 (startingSkills)     |✅             |❌             |**A 채택**                   |
|AlternateForm 1:N 이격       |✅ (@unique 제거)|❌ (@unique 버그)|**A 채택**                   |
|게임 도메인 지식 문서화              |❌ 없음          |✅ 상세          |**B 채택**                   |
|경쟁 사이트 분석                  |❌ 없음          |✅ 3사 분석       |**B 채택**                   |
|렌더링 전략 (ISR/SSR/CSR)       |❌ 없음          |✅ 페이지별        |**B 채택**                   |
|인증/권한 매트릭스                 |❌ 없음          |✅             |**B 채택**                   |
|Rate Limiting              |❌ 없음          |✅ Redis       |**B 채택**                   |
|UI/UX 와이어프레임               |❌ 없음          |✅ ASCII       |**B 채택**                   |
|디자인 가이드라인                  |❌ 없음          |✅ 컬러/폰트       |**B 채택**                   |
|API 엔드포인트 전체               |❌ 6개 요약       |✅ 풀 REST      |**B 채택**                   |
|리스크/고려사항                   |❌ 없음          |✅ 4항목         |**B 채택**                   |
|DevOps/테스팅                 |❌ 없음          |✅ 전체          |**B 채택**                   |
|폴더 구조                      |❌ 없음          |✅             |**B 채택**                   |
|비용 추정                      |❌ 없음          |✅             |**B 채택**                   |
|학생 스펙 상세 + UI 설계           |❌ 간략          |✅ 구현 레벨       |**B 채택**                   |
|실패 원인 태그 (failureTags)     |❌ 없음          |✅             |**B 채택**                   |
|Tiptap 에디터 (택틱 본문)         |❌ 미언급         |✅             |**B 채택**                   |
|메타 분석 집계 방식                |Phase 5 후순위   |✅ 상세          |**B 채택** (단, Phase는 A식 후순위)|
|User 모델 완성도 (NextAuth)     |❌ 필드 부족       |✅             |**B 채택**                   |

**결론**: 문서 A의 **핵심 아키텍처 설계(Roster, 스냅샷, 장비고정, 타임라인, 손패, 1:N이격)**를 뼈대로 삼고, 문서 B의 **풀 스펙 기획 구조(도메인 지식, 경쟁 분석, UI/UX, API, 인증, DevOps, 리스크)**를 살로 붙인다.

-----

## 1. 프로젝트 개요

### 1.1 서비스 한 줄 설명

블루아카이브 총력전 · 대결전의 **개인 클리어 기록, 학생 명부, 파티 편성, 구조화된 택틱 노트**를 한 곳에서 관리하고, 장기적으로 메타 통계와 커뮤니티 공유로 확장하는 웹 서비스.

### 1.2 핵심 가치 제안

|Pain Point        |해결책                     |핵심 메커니즘                               |
|------------------|------------------------|--------------------------------------|
|매 시즌 점수·편성을 기억 못 함|시즌별 기록 아카이빙             |스냅샷 저장으로 과거 스펙 원형 보존                  |
|매번 학생 스펙을 처음부터 입력 |학생 명부(Roster)에서 원클릭 불러오기|UserStudent → PartyMember 스냅샷 복사      |
|클리어 영상 나중에 못 찾음   |택틱 노트에 영상 URL + 타임라인 연동 |하이브리드 타임라인 (Time/Cost JSON)           |
|손패·스킬 순서를 기록 못 함  |손패 고정 + 구조화된 타임라인       |Party.startingSkills + Tactic.timeline|
|장비 종류를 매번 선택해야 함  |학생별 장비 슬롯 종류 마스터 고정     |Student.gear1Type → PartyMember에는 티어만 |
|메타를 커뮤니티에서 일일이 찾음 |집계 기반 자동 메타 분석 (Phase 5)|Redis 캐싱 + Cron 집계                    |
|내 성장 추이를 모름       |시즌별 점수/랭킹 차트            |내 대시보드 통계                             |

### 1.3 타겟 유저

- **1차**: 총력전/대결전을 진지하게 공략하는 블루아카이브 유저 (개인 기록 관리)
- **2차**: 메타 참고만 하려는 라이트 유저 (비로그인 열람, Phase 5 이후)

### 1.4 게임 도메인 지식 요약

**총력전 (Total Assault)**

- 보스 1마리, 하루 3번 도전 (잔기 공유)
- 파티: 스트라이커 4 + 스페셜 2, 한 도전 내 파티 수 제한 없음
- 출전 제한: 동일 도전 내 이미 출전한 학생은 재출전 불가 (이격은 별개 취급)
- 조력자: 도전 전체에서 단 1회만 사용 가능. 내 학생 출전 여부와 별개
- 난이도: Normal → Hard → VeryHard → Hardcore → Extreme → Insane → Torment → Lunatic
- 지형: 실내(Indoor) / 야외(Outdoor) / 시가지(Street)
- 보스 공격 속성: 폭발/관통/신비/진동
- 보스 방어 타입: 경장갑/중장갑/특수장갑/탄력장갑/복합장갑 중 1종

**대결전 (Grand Assault)**

- 총력전 보스 1마리를 방어 타입 3종으로 각각 공략
- 방어 타입 3종은 보스의 원본 방어타입을 포함하지 않을 수도 있음
- 난이도 제한: 2종은 최대 Torment, 나머지 1종은 최대 Insane
- 조력자: 방어타입별 도전 각각에서 단 1회씩 사용 가능

**공통 규칙**

|규칙      |상세                             |
|--------|-------------------------------|
|파티 수    |한 도전 내 제한 없음                   |
|학생 재출전  |동일 도전 내 불가                     |
|이격 독립성  |이격끼리 출전 횟수 공유 안 함              |
|조력자     |도전당 1회 사용, 내 학생과 별개 계산         |
|조력자 + 본인|같은 학생을 내 학생 + 조력자로 각각 1회씩 사용 가능|

-----

## 2. 기술 스택

### 2.1 확정 스택

```
[Frontend]
- Framework:    Next.js 14 (App Router)
- Language:     TypeScript
- Styling:      Tailwind CSS + shadcn/ui
- State:        Zustand (글로벌) + TanStack Query (서버 상태)
- Form:         React Hook Form + Zod
- Chart:        Recharts
- Editor:       Tiptap (택틱 노트 리치텍스트)

[Backend]
- Runtime:      Next.js API Routes (Route Handlers)
- ORM:          Prisma
- Validation:   Zod (프론트/백 공유 스키마)

[Database & Services]
- Primary DB:   PostgreSQL via Supabase
- Cache:        Upstash Redis (메타 통계 집계 캐싱, Rate Limiting)
- Auth:         NextAuth.js v5 (Discord OAuth, Google OAuth)
- Resource CDN: SchaleDB 정적 에셋 연동 (1차) + Supabase Storage (폴백)

[DevOps]
- Hosting:      Vercel
- DB Hosting:   Supabase
- CI/CD:        GitHub Actions → Vercel 자동 배포
- Monitoring:   Vercel Analytics + Sentry
- Package:      pnpm
- Linting:      ESLint + Prettier
- Testing:      Vitest + Playwright (E2E)
```

### 2.2 SchaleDB 에셋 연동 전략 (통합 시 보완)

SchaleDB GitHub 리포가 2025년 6월에 아카이브되었으나 schaledb.com 웹사이트는 운영 중. 에셋 전략:

1. **1차**: SchaleDB CDN URL 직접 참조 (비용 제로, 의존성 리스크 있음)
1. **폴백**: 주요 에셋(학생 아이콘, 보스 아이콘)을 Supabase Storage에 미러링
1. **헬스체크**: 앱 빌드 시 SchaleDB 에셋 URL 접근 가능 여부 확인 스크립트 포함

### 2.3 스택 선택 근거

|선택                |이유                                         |
|------------------|-------------------------------------------|
|Next.js App Router|SSR로 메타 페이지 SEO 확보, API Routes로 모노레포 유지    |
|Supabase          |PostgreSQL + Storage + 무료 티어, 빠른 초기 셋업     |
|Prisma            |타입 안전 쿼리, 마이그레이션 관리 용이                     |
|Upstash Redis     |Serverless 환경 친화적, 통계 집계 캐싱 + Rate Limiting|
|shadcn/ui         |커스터마이즈 용이, 접근성 고려된 컴포넌트                    |
|Discord OAuth     |블루아카이브 유저 특성상 Discord 계정 보유율 높음            |
|SchaleDB CDN      |이미지 호스팅 비용 제로화 (폴백: Supabase Storage)      |

-----

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                      Client                          │
│          Next.js (SSR/CSR hybrid)                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Pages   │  │Components│  │  TanStack Query   │  │
│  │(App Dir) │  │(shadcn)  │  │  (캐싱/동기화)    │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└─────────────────────┬───────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────┐
│              Next.js API Routes (Vercel)             │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │   Auth   │  │ CRUD API │  │  Aggregation API  │  │
│  │(NextAuth)│  │(Prisma)  │  │  (Redis Cache)    │  │
│  └──────────┘  └──────────┘  └─────────┬─────────┘  │
└──────────────────────────────────────── │ ──────────┘
            │                             │
     ┌──────▼──────┐               ┌──────▼──────┐
     │  Supabase   │               │   Upstash   │
     │ PostgreSQL  │               │    Redis    │
     │  + Storage  │               │   (Cache)   │
     └─────────────┘               └─────────────┘
```

### 3.1 렌더링 전략

|페이지          |전략       |이유                    |
|-------------|---------|----------------------|
|메인 대시보드      |ISR (1시간)|시즌 정보, 자주 바뀌지 않음      |
|보스별 메타 페이지   |ISR (1시간)|SEO + 통계 캐싱 (Phase 5) |
|편성 상세 페이지    |SSR      |개인 데이터 포함 가능          |
|파티 빌더 / 기록 작성|CSR      |인터랙션 많음, Zustand 상태 관리|
|학생 명부(Roster)|CSR      |인증 필요, 개인화            |
|내 대시보드       |CSR      |인증 필요, 개인화            |

-----

## 4. 핵심 기능 명세

### 4.1 학생 명부(Roster) 및 스냅샷 아키텍처 ★ 최우선

*문서 A의 핵심 아키텍처를 그대로 채택*

- **명부 시스템**: 유저가 자신의 보유 학생 스펙을 미리 저장해두는 마스터 테이블(`UserStudent`).
- **불러오기 및 스냅샷 저장**: 기록 작성 시 명부에서 스펙을 불러오며, 기록 화면에서 자유롭게 수정 가능. 저장 시 DB에는 외래키 참조가 아닌 **독립된 파티 멤버 데이터(Snapshot)**로 복사.
- **양방향 동기화**: 기록 저장 시 “수정된 스펙을 내 학생 명부에 동기화하기” 체크박스 제공.
- **장비 슬롯 고정**: 학생별 착용 가능한 장비 종류(모자, 헤어핀 등)는 마스터 데이터(`Student.gear1Type/gear2Type/gear3Type`)에 고정하고, 유저 기록에는 **티어(Tier) 숫자만** 저장.

### 4.2 레이드 기록 트래킹

#### 기록 입력 항목

```
공통:
- 보스명 (마스터 데이터 select)
- 시즌 (날짜 기반 자동 감지 또는 직접 선택)
- 최종 점수
- 최종 등수 (선택, 시즌 종료 후 업데이트 가능)
- 티어 (플래티넘/골드/실버/브론즈, 시즌 종료 후)
- 메모

총력전 전용:
- 난이도 선택 (Normal ~ Lunatic)
- 사용 파티 목록 (순서대로, 수 제한 없음)
  ※ 동일 도전 내 같은 학생 중복 출전 불가 (이격은 별개)
  ※ 조력자는 전체 도전에서 1회만 허용

대결전 전용:
- 방어타입 3종 각각에 대해:
  · 난이도 선택 (2종: Normal~Torment, 1종: Normal~Insane)
  · 해당 방어타입 점수
  · 사용 파티 목록 (순서대로, 수 제한 없음)
    ※ 방어타입별 도전 내 같은 학생 중복 출전 불가
    ※ 조력자는 방어타입별 도전 각각에서 1회씩 허용
  · difficultyMax 서버사이드 검증 필수
```

#### 기록 열람

- 시즌별 타임라인 뷰
- 보스별, 지형별, 등수/티어별 필터링
- 최고점 / 최근 기록 카드
- 점수 추이 라인 차트 (시즌 × 점수)
- 랭킹/등수 추이 차트

### 4.3 파티 빌더 & 편성 저장

#### 파티 빌더 UI (Roster 연동)

```
┌────────────────────────────────────────────────────────┐
│ 파티 빌더                    [명부에서 불러오기] [저장]  │
├──────────────┬─────────────────────────────────────────┤
│ 학생 검색     │  편성 영역                              │
│ 🔍 이름검색  │  스트라이커 (4슬롯)                     │
│ 필터:        │  [학생1][학생2][학생3][학생4]            │
│ ☐ 속성별    │  스페셜 (2슬롯)                         │
│ ☐ 지형별    │  [학생5][학생6]                         │
│              ├─────────────────────────────────────────┤
│ [학생목록]   │  손패 고정: [슬롯0][슬롯2][슬롯4]       │
│              ├─────────────────────────────────────────┤
│              │  파티 정보                              │
│              │  이름: [________________]               │
│              │  ☑ 저장 시 명부에 스펙 동기화            │
└──────────────┴─────────────────────────────────────────┘
```

※ 파티 수 제한 없음 — “+ 파티 추가” 버튼으로 동적 추가
※ 대결전의 경우 방어타입 탭(3개)별로 별도 파티 세트를 관리

#### 학생 슬롯 입력 흐름 (Roster 연동 시)

1. “명부에서 불러오기” → 학생 선택 → 명부 스펙 자동 채움
1. 기록 화면에서 스펙 자유 수정 가능
1. 저장 시 스냅샷으로 독립 복사 (외래키 참조 아님)
1. “명부에 동기화” 체크 시 → UserStudent에도 수정된 스펙 반영

### 4.4 조력자 스탯 ‘가설 추산(Best Guess)’ 및 수동 입력

*문서 A의 핵심 개념 + 문서 B의 상세 UI 흐름 결합*

- 조력자는 필수 스탯(레벨, 성급, 스킬 4종, 공격력)을 무조건 기입
- 능력개방과 인연 랭크 변수로 인해 공격력만으로 방어력/체력 완벽 역산 불가
- SchaleDB 데이터 기반 방어력/체력 추산 (isStatInferred=true)
- 유저가 실측값을 덮어쓸 수 있도록 지원 (isStatInferred=false)

```
UI 흐름:
[조력자 체크박스 ON]
  ┌─────────────────────────────────────────┐
  │ 레벨 [___]  성급 [★★★★★]              │  ← 필수
  │ 스킬 EX[_] 노말[_] 패시브[_] 강화[_]  │  ← 필수
  │ 공격력 [_______]                        │  ← 필수
  │ 장비 슬롯 1 [T__] 슬롯 2 [T__] 슬롯 3 [T__] │ ← 선택 (티어만)
  ├─────────────────────────────────────────┤
  │ ◉ 공격력으로 방어력/체력 자동 유추      │
  │ ○ 방어력/체력 직접 입력                 │
  └─────────────────────────────────────────┘
```

### 4.5 구조화된 하이브리드 타임라인 택틱

*문서 A의 핵심 기능 + 문서 B의 Tiptap/failureTags 보완*

- **구조화된 타임라인**: JSON 배열 형태의 스킬 발동 기록 (`Tactic.timeline`)
- **기준점 이중 지원**: 시간(예: 02:45) 또는 코스트(예: 9.5) 중 선택
- **손패 고정**: `Party.startingSkills Int[]` — 시작 스킬 슬롯 인덱스 (최대 3개)
- **Tiptap 리치텍스트 본문**: 자유 메모 영역 (헤딩, 볼드, 체크리스트)
- **실패 원인 태그**: `failureTags String[]` — DPS_LACK, CC_FAIL, TIMING, SURVIVAL, RNG 등
- **영상 URL**: YouTube embed 미리보기

```
타임라인 JSON 예시:
[
  { "time": "03:30", "cost": null, "slot": 0, "action": "EX 사용", "note": "개막 즉시" },
  { "time": "02:45", "cost": 9.5, "slot": 2, "action": "EX 사용", "note": "크리 리트 필요" },
  { "time": null, "cost": 6.0, "slot": 1, "action": "EX 사용", "note": "" }
]
```

### 4.6 대결전 서버 검증 로직

- 방어타입 3종은 보스의 원본 방어타입을 포함하지 않을 수도 있음
- 3종 중 2종은 최대 Torment 난이도 상한, 1종은 최대 Insane 난이도 상한
- `GrandAssaultArmorSlot.difficultyMax` 필드를 참조하여 클라이언트 + 서버 API 양쪽에서 초과 난이도 입력 원천 차단
- Zod 스키마로 프론트/백 공유 검증

### 4.7 메타 분석 & 통계 (Phase 5)

후순위이나 설계는 미리 확정:

- 보스별 학생 픽률 Top 20 (포지션별, 모집/조력 구분)
- 난이도대별 픽률 분포, 성급 분포
- 시즌별 메타 변화 추이 차트
- 매 1시간 Redis 캐시 갱신 (Vercel Cron Job)
- 샘플 수 < 10이면 통계 미표시 (신뢰도 확보)

-----

## 5. 데이터베이스 스키마 (Prisma — 통합 v4.0)

*문서 A의 Roster/스냅샷/장비고정/손패/1:N이격 + 문서 B의 User완성/failureTags/NextAuth/인덱스*

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ══════════════════════════════════════════
// Enum
// ══════════════════════════════════════════

enum Role { STRIKER SPECIAL }
enum StudentClass { DEALER TANK HEALER SUPPORTER TACTICAL_SUPPORT }
enum AttackType { EXPLOSIVE PIERCING MYSTIC SONIC }
enum ArmorType { LIGHT HEAVY SPECIAL ELASTIC COMPOSITE }
enum Terrain { INDOOR OUTDOOR STREET }
enum Region { GLOBAL JP }
enum Difficulty { NORMAL HARD VERY_HARD HARDCORE EXTREME INSANE TORMENT LUNATIC }
enum Tier { PLATINUM GOLD SILVER BRONZE }
enum GearType { HAT GLOVES SHOES HAIRPIN BADGE BAG WATCH CHARM NECKLACE }

// ══════════════════════════════════════════
// 마스터 데이터 (정적, 관리자 제어)
// ══════════════════════════════════════════

model Student {
  id               String          @id  // "shiroko", "mika_swimsuit" 등 slug
  nameKo           String
  nameEn           String               // ← 문서 B에서 채택 (다국어)
  school           String
  role             Role
  studentClass     StudentClass
  attackType       AttackType
  armorType        ArmorType
  iconUrl          String
  isLimited        Boolean         @default(false)
  releasedAt       DateTime

  // 고정 장비 슬롯 정보 ← 문서 A 핵심 (유저 테이블에는 티어만 저장)
  gear1Type        GearType
  gear2Type        GearType
  gear3Type        GearType

  // 이격 관계 (1:N) ← 문서 A: @unique 제거
  baseFormLink     AlternateForm?  @relation("BaseStudent")
  alternateLinks   AlternateForm[] @relation("AlternateStudent")

  rosterMembers    UserStudent[]    // ← 문서 A: Roster 연동
  partyMembers     PartyMember[]

  @@map("students")
}

// 본체 ↔ 이격 관계 테이블 (본체 1 : 이격 N)
model AlternateForm {
  id                 String  @id @default(cuid())
  baseStudentId      String  // @unique 제거 → 본체 1:N 이격 지원 (문서 A)
  baseStudent        Student @relation("BaseStudent", fields: [baseStudentId], references: [id])
  alternateStudentId String
  alternateStudent   Student @relation("AlternateStudent", fields: [alternateStudentId], references: [id])
  label              String? // "수영복", "체육복" 등

  @@unique([baseStudentId, alternateStudentId])
  @@map("alternate_forms")
}

model Boss {
  id                  String               @id  // "binah_outdoor" (지형 분리)
  nameKo              String
  nameEn              String                    // ← 문서 B에서 채택
  terrain             Terrain
  attackType          AttackType
  armorType           ArmorType
  iconUrl             String
  isReleased          Boolean              @default(true)

  totalAssaultSeasons TotalAssaultSeason[]
  grandAssaultSeasons GrandAssaultSeason[]

  @@map("bosses")
}

model TotalAssaultSeason {
  id           Int                  @id @default(autoincrement())
  seasonNumber Int
  bossId       String
  boss         Boss                 @relation(fields: [bossId], references: [id])
  region       Region               @default(GLOBAL)
  startAt      DateTime
  endAt        DateTime

  records      TotalAssaultRecord[]

  @@unique([seasonNumber, region])
  @@map("total_assault_seasons")
}

model GrandAssaultSeason {
  id           Int                     @id @default(autoincrement())
  seasonNumber Int
  bossId       String
  boss         Boss                    @relation(fields: [bossId], references: [id])
  region       Region                  @default(GLOBAL)
  startAt      DateTime
  endAt        DateTime

  armorSlots   GrandAssaultArmorSlot[]
  records      GrandAssaultRecord[]

  @@unique([seasonNumber, region])
  @@map("grand_assault_seasons")
}

model GrandAssaultArmorSlot {
  id            String              @id @default(cuid())
  seasonId      Int
  season        GrandAssaultSeason  @relation(fields: [seasonId], references: [id])
  slotIndex     Int                 // 0, 1, 2
  armorType     ArmorType
  difficultyMax Difficulty          // TORMENT 또는 INSANE (서버사이드 검증)

  attempts      GrandAssaultAttempt[]

  @@unique([seasonId, slotIndex])
  @@map("grand_assault_armor_slots")
}

// ══════════════════════════════════════════
// 유저 데이터
// ══════════════════════════════════════════

model User {
  id                  String               @id @default(cuid())
  name                String?              // ← 문서 B
  email               String?              @unique
  image               String?              // ← 문서 B
  discordId           String?              @unique
  googleId            String?              @unique  // ← 문서 B
  createdAt           DateTime             @default(now())  // ← 문서 B
  updatedAt           DateTime             @updatedAt       // ← 문서 B

  roster              UserStudent[]        // ← 문서 A: 학생 명부
  totalAssaultRecords TotalAssaultRecord[]
  grandAssaultRecords GrandAssaultRecord[]
  parties             Party[]
  tactics             Tactic[]
  accounts            Account[]            // ← 문서 B: NextAuth 필수
  sessions            Session[]            // ← 문서 B: NextAuth 필수

  @@map("users")
}

// NextAuth 필수 테이블 (Account, Session, VerificationToken)
// → NextAuth Prisma Adapter가 자동 생성하는 표준 스키마 사용

// ── 학생 명부 (Roster) ← 문서 A 핵심 ──────────
model UserStudent {
  id                 String   @id @default(cuid())
  userId             String
  user               User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  studentId          String
  student            Student  @relation(fields: [studentId], references: [id])

  level              Int
  starLevel          Int
  uniqueStarLevel    Int?
  exSkillLevel       Int
  basicSkillLevel    Int
  enhancedSkillLevel Int
  subSkillLevel      Int
  gear1Tier          Int?     // 종류는 Student 마스터 참조, 여기는 티어만
  gear2Tier          Int?
  gear3Tier          Int?
  abilityUnlockAtk   Int      @default(0)
  abilityUnlockHp    Int      @default(0)
  abilityUnlockHeal  Int      @default(0)
  bondLevel          Int      @default(1)
  elephBondLevels    Json?

  updatedAt          DateTime @updatedAt

  @@unique([userId, studentId])
  @@map("user_students")
}

// ══════════════════════════════════════════
// 기록 (Records & Attempts)
// ══════════════════════════════════════════

model TotalAssaultRecord {
  id             String              @id @default(cuid())
  userId         String
  user           User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  seasonId       Int
  season         TotalAssaultSeason  @relation(fields: [seasonId], references: [id])

  difficulty     Difficulty
  finalScore     BigInt
  rank           Int?                // 최종 등수 (시즌 종료 후 업데이트)
  tier           Tier?               // 플래티넘/골드/실버/브론즈
  notes          String?
  recordedAt     DateTime            @default(now())
  createdAt      DateTime            @default(now())  // ← 문서 B
  updatedAt      DateTime            @updatedAt

  parties        TotalAssaultParty[]
  tactics        Tactic[]

  @@index([userId, seasonId])
  @@map("total_assault_records")
}

model TotalAssaultParty {
  id         String             @id @default(cuid())
  recordId   String
  record     TotalAssaultRecord @relation(fields: [recordId], references: [id], onDelete: Cascade)
  partyId    String
  party      Party              @relation(fields: [partyId], references: [id])
  partyOrder Int

  @@unique([recordId, partyOrder])
  @@map("total_assault_parties")
}

model GrandAssaultRecord {
  id             String                @id @default(cuid())
  userId         String
  user           User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  seasonId       Int
  season         GrandAssaultSeason    @relation(fields: [seasonId], references: [id])

  finalScore     BigInt
  rank           Int?
  tier           Tier?
  notes          String?
  recordedAt     DateTime              @default(now())
  createdAt      DateTime              @default(now())  // ← 문서 B
  updatedAt      DateTime              @updatedAt

  attempts       GrandAssaultAttempt[]
  tactics        Tactic[]

  @@index([userId, seasonId])  // ← 문서 B 인덱스
  @@map("grand_assault_records")
}

model GrandAssaultAttempt {
  id          String                @id @default(cuid())
  recordId    String
  record      GrandAssaultRecord    @relation(fields: [recordId], references: [id], onDelete: Cascade)
  armorSlotId String
  armorSlot   GrandAssaultArmorSlot @relation(fields: [armorSlotId], references: [id])

  difficulty  Difficulty
  score       BigInt

  parties     GrandAssaultParty[]

  @@unique([recordId, armorSlotId])
  @@map("grand_assault_attempts")
}

model GrandAssaultParty {
  id         String              @id @default(cuid())
  attemptId  String
  attempt    GrandAssaultAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  partyId    String
  party      Party               @relation(fields: [partyId], references: [id])
  partyOrder Int

  @@unique([attemptId, partyOrder])
  @@map("grand_assault_parties")
}

// ══════════════════════════════════════════
// 파티 편성 및 멤버 (스냅샷 저장)
// ══════════════════════════════════════════

model Party {
  id                  String              @id @default(cuid())
  userId              String
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  name                String
  description         String?             // ← 문서 B

  startingSkills      Int[]               // ← 문서 A: 손패 고정 인덱스 배열

  createdAt           DateTime            @default(now())  // ← 문서 B
  updatedAt           DateTime            @updatedAt

  members             PartyMember[]
  totalAssaultParties TotalAssaultParty[]
  grandAssaultParties GrandAssaultParty[]
  tactics             Tactic[]

  @@index([userId, createdAt(sort: Desc)])  // ← 문서 B 인덱스
  @@map("parties")
}

model PartyMember {
  id                 String   @id @default(cuid())
  partyId            String
  party              Party    @relation(fields: [partyId], references: [id], onDelete: Cascade)
  studentId          String
  student            Student  @relation(fields: [studentId], references: [id])

  slot               Int      // 0~3: 스트라이커, 4~5: 스페셜
  isSupport          Boolean  @default(false)

  // ── Snapshot 스탯 (명부에서 복사, 독립 저장) ──
  level              Int
  starLevel          Int
  uniqueStarLevel    Int?
  exSkillLevel       Int
  basicSkillLevel    Int
  enhancedSkillLevel Int
  subSkillLevel      Int
  gear1Tier          Int?     // 종류는 Student 마스터 참조, 여기는 티어만 ← 문서 A
  gear2Tier          Int?
  gear3Tier          Int?
  abilityUnlockAtk   Int      @default(0)
  abilityUnlockHp    Int      @default(0)
  abilityUnlockHeal  Int      @default(0)
  bondLevel          Int      @default(1)
  elephBondLevels    Json?

  // ── 조력자 전용 스탯 ──
  supportAtk         Int?
  supportDef         Int?
  supportHp          Int?
  isStatInferred     Boolean  @default(false)

  @@unique([partyId, slot])
  @@index([studentId])        // ← 문서 B 인덱스
  @@map("party_members")
}

// ══════════════════════════════════════════
// 택틱 노트 (하이브리드 타임라인)
// ══════════════════════════════════════════

model Tactic {
  id                   String              @id @default(cuid())
  userId               String
  user                 User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  totalAssaultRecordId String?
  totalAssaultRecord   TotalAssaultRecord? @relation(fields: [totalAssaultRecordId], references: [id])
  grandAssaultRecordId String?
  grandAssaultRecord   GrandAssaultRecord? @relation(fields: [grandAssaultRecordId], references: [id])
  partyId              String?
  party                Party?              @relation(fields: [partyId], references: [id])

  title                String
  videoUrl             String?
  content              String              // Tiptap JSON (리치텍스트)
  failureTags          String[]            // ← 문서 B: 실패 원인 태그

  // 하이브리드 타임라인 ← 문서 A 핵심
  // [{ time: "02:45", cost: 9.5, slot: 0, action: "EX 사용", note: "크리 리트" }]
  timeline             Json?

  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt

  @@map("tactics")
}
```

### 5.1 인덱스 전략

```sql
-- 총력전
CREATE INDEX idx_ta_records_user_season  ON total_assault_records(user_id, season_id);
CREATE INDEX idx_ta_records_season       ON total_assault_records(season_id, difficulty);

-- 대결전
CREATE INDEX idx_ga_records_user_season  ON grand_assault_records(user_id, season_id);
CREATE INDEX idx_ga_attempts_record      ON grand_assault_attempts(record_id, armor_slot_id);

-- 파티 / 학생
CREATE INDEX idx_party_members_student   ON party_members(student_id);
CREATE INDEX idx_parties_user            ON parties(user_id, created_at DESC);
CREATE INDEX idx_alternate_forms_base    ON alternate_forms(base_student_id);
CREATE INDEX idx_alternate_forms_alt     ON alternate_forms(alternate_student_id);
```

### 5.2 설계 결정 사항 요약

1. **보스 ID 분리**: 같은 보스라도 지형이 다르면 별도 레코드 (`gebura_outdoor`, `gebura_indoor`)
1. **이격: AlternateForm 별도 테이블, `baseStudentId` @unique 제거** → 본체 1:N 이격 지원
1. **장비 종류는 마스터에 고정, 유저 데이터에는 티어만** → 입력 필드 절감, 데이터 정합성
1. **스냅샷 저장**: PartyMember는 UserStudent의 복사본으로 독립 저장 (외래키 참조 아님)
1. **Region: GLOBAL / JP** (KR = GLOBAL 통일)
1. **커뮤니티 테이블 (Like, Bookmark) 보류** → Phase 6 이후

-----

## 6. API 엔드포인트

```
[인증]
POST   /api/auth/[...nextauth]

[학생 명부 (Roster)] ← 문서 A 핵심
GET    /api/roster                  # 내 명부 목록
POST   /api/roster                  # 명부에 학생 추가/수정
DELETE /api/roster/:studentId       # 명부에서 학생 제거
POST   /api/roster/sync             # 파티 스냅샷 → 명부 역동기화

[레이드 기록]
GET    /api/records                  # 내 기록 목록 (페이지네이션)
POST   /api/records/total            # 총력전 기록 생성 (스냅샷 Payload)
POST   /api/records/grand            # 대결전 기록 생성 (difficultyMax 서버 검증)
GET    /api/records/:id              # 기록 상세
PATCH  /api/records/:id              # 기록 수정
DELETE /api/records/:id              # 기록 삭제
PATCH  /api/records/:id/rank         # 시즌 종료 후 등수/티어 업데이트

[파티]
GET    /api/parties                  # 내 파티 목록
POST   /api/parties                  # 파티 생성
GET    /api/parties/:id              # 파티 상세
PATCH  /api/parties/:id              # 파티 수정
DELETE /api/parties/:id              # 파티 삭제

[택틱]
GET    /api/tactics                  # 내 택틱 목록
POST   /api/tactics                  # 택틱 생성
GET    /api/tactics/:id              # 택틱 상세
PATCH  /api/tactics/:id              # 택틱 수정
DELETE /api/tactics/:id              # 택틱 삭제

[메타 통계] (Phase 5)
GET    /api/meta/boss/:bossId        # 보스별 픽률/통계
GET    /api/meta/boss/:bossId/trend  # 시즌별 메타 변화

[마스터 데이터]
GET    /api/master/students          # 학생 목록 (gearType 포함)
GET    /api/master/bosses            # 보스 목록
GET    /api/master/seasons           # 시즌 목록

[유저]
GET    /api/users/me                 # 내 프로필
PATCH  /api/users/me                 # 내 프로필 수정
GET    /api/users/me/stats           # 내 통계 요약
```

### 6.1 응답 포맷 표준

```typescript
// 성공
{ "data": { ... }, "meta": { "total": 100, "page": 1, "limit": 20, "hasNext": true } }

// 에러
{ "error": { "code": "UNAUTHORIZED", "message": "로그인이 필요합니다." } }
```

-----

## 7. 페이지 구조 (App Router)

```
/                          대시보드 (진행 중인 시즌, 최근 내 기록)
├── /roster                내 학생 명부 관리 ← 문서 A 핵심
├── /builder               파티 편성 + 기록 작성 (Roster Load, 스냅샷 저장)
├── /records               과거 기록 열람 및 필터링
├── /tactics               택틱 노트 (하이브리드 타임라인)
├── /dashboard             내 대시보드 (점수/등수 추이 차트)
├── /meta (Phase 5)        메타 허브
│   └── /meta/[bossSlug]   보스별 메타 상세
└── /settings              설정
```

### 7.1 핵심 페이지 UI 설명

#### 메인 대시보드 (/)

```
┌─────────────────────────────────────────────────┐
│  BA Raid Tracker          [로그인] [Discord]     │
├─────────────────────────────────────────────────┤
│  현재 진행중인 레이드                             │
│  ┌──────────┐  ┌──────────┐                     │
│  │ 총력전   │  │ 대결전   │                     │
│  │ Yesod    │  │ ShiroKuro│                     │
│  │ D-3 남음 │  │ D-5 남음 │                     │
│  └──────────┘  └──────────┘                     │
├─────────────────────────────────────────────────┤
│  최근 내 기록 (로그인 시)                        │
│  [기록카드] [기록카드] [기록카드]                │
└─────────────────────────────────────────────────┘
```

-----

## 8. 인증 & 권한

### 8.1 OAuth 제공자

- Discord OAuth (주) — 블루아카이브 커뮤니티 특성
- Google OAuth (부) — 접근성 확보

### 8.2 권한 매트릭스

|기능                |비로그인|로그인|본인 |
|------------------|:--:|:-:|:-:|
|메타 통계 열람 (Phase 5)|✅   |✅  |✅  |
|기록/편성/택틱 생성       |❌   |✅  |✅  |
|기록/편성/택틱 수정/삭제    |❌   |❌  |✅  |
|학생 명부 관리          |❌   |✅  |✅  |
|내 대시보드            |❌   |✅  |✅  |

### 8.3 Rate Limiting

- 인증 API (기록/편성 생성): 30 req/min per user
- 마스터 데이터 API: 100 req/min per IP
- Upstash Redis sliding window 구현

-----

## 9. 디자인 가이드라인

```
컬러:
- Primary:    블루아카이브 테마 (#4A90E2 계열)
- Background: 다크모드 기본 (#0F1117)
- Surface:    (#1A1D27)
- Accent:     학생 속성별 컬러 코딩
  - 폭발(Explosive): #FF6B6B
  - 관통(Piercing):  #FFD93D
  - 신비(Mystic):    #6BCB77
  - 진동(Sonic):     #4D96FF

폰트:
- 한국어: Noto Sans KR
- 영어/숫자: Inter

기타:
- 다크모드 기본, 라이트모드 지원
- 모바일 반응형 필수
- 모바일: 드래그앤드롭 대신 탭-to-select 방식
```

-----

## 10. 개발 Phase 계획 (통합)

### Phase 1 — 기반 인프라 & 마스터 데이터 (2~3주)

- 프로젝트 초기 세팅 (Next.js + TypeScript + Tailwind + shadcn/ui)
- Supabase 연결 + Prisma v4.0 스키마 마이그레이션
- NextAuth.js Discord/Google OAuth 구현
- SchaleDB 스크립트 기반 마스터 데이터 Seed (학생/보스/시즌, gearType 포함)
- 기본 레이아웃 (헤더, 사이드바, 반응형)

### Phase 2 — Roster(학생 명부) 시스템 (2주) ★

- UserStudent 기반 보유 학생 스펙 등록/수정/삭제 UI
- 학생 검색 + 필터 컴포넌트
- 장비 슬롯은 종류 자동 표시 (마스터 참조), 티어만 입력

### Phase 3 — 파티 빌더 & 스냅샷 기록 (3주) ★★★ 프로젝트 핵심

- 명부에서 스펙 불러오기 → 기록 화면에서 수정 → 스냅샷 독립 저장
- 양방향 동기화 체크박스
- 손패 고정(startingSkills) UI
- 조력자 처리 (isStatInferred, Best Guess 추산)
- 대결전 서버사이드 difficultyMax 검증 (Zod)
- 편성 중복 학생 검증 (이격 독립, 조력자 별도 카운트)
- 레이드 기록 CRUD + 파티 연결

### Phase 4 — 택틱 노트 & 기록 열람 (2주)

- Tiptap 에디터 통합 (리치텍스트 본문)
- 하이브리드 타임라인 에디터 (Time/Cost JSON)
- failureTags 실패 원인 태그
- YouTube embed 미리보기
- 기록 열람 (필터링, 점수 추이 차트)
- 시즌 종료 후 등수/티어 입력

### Phase 5 — 대시보드 & 메타 분석 (2~3주)

- 내 대시보드 (점수/등수 추이 Recharts)
- 통계 요약 카드
- 메타 집계 쿼리 + Redis 캐싱 + Vercel Cron
- 보스별 메타 페이지 (ISR)

### Phase 6 — 완성도 & 배포 (1주)

- 모바일 반응형 QA
- 다크모드 완성
- 에러 처리 / 로딩 스켈레톤
- SEO 메타태그
- Sentry 에러 모니터링
- 프로덕션 배포

**총 예상 기간: 12~14주 (1인 개발 기준)**

-----

## 11. 배포 & 인프라

### 11.1 환경 구성

- development: 로컬 + Supabase 개발용 프로젝트
- staging: Vercel preview (PR마다 자동 생성)
- production: Vercel production + Supabase production

### 11.2 환경 변수

```env
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SENTRY_DSN=
```

### 11.3 비용 추정 (초기)

|서비스          |플랜        |월 비용    |
|-------------|----------|--------|
|Vercel       |Hobby (무료)|$0      |
|Supabase     |Free tier |$0      |
|Upstash Redis|Free tier |$0      |
|Sentry       |Free tier |$0      |
|**합계**       |          |**$0/월**|


> 트래픽 증가 시 Supabase Pro ($25/월), Vercel Pro ($20/월) 고려

-----

## 12. 고려사항 & 리스크

### 12.1 저작권

- 학생/보스 이미지는 아이콘/썸네일만 사용 (비상업 목적)
- SchaleDB 에셋 참조 또는 자체 CDN 미러링
- Nexon 팬사이트 정책 사전 확인 권장

### 12.2 SchaleDB 의존성

- GitHub 리포가 2025년 6월 아카이브됨 → 웹사이트 운영 지속 여부 모니터링
- 폴백: 주요 에셋 Supabase Storage 미러링 (Free 1GB 한도 내)

### 12.3 데이터 정확성

- 시즌 데이터는 관리자만 수정 가능
- 기록 입력 시 날짜 기반 자동 시즌 매핑

### 12.4 모바일 UX

- 파티 빌더는 모바일에서 슬롯 탭 방식으로 전환
- 드래그앤드롭 대신 탭-to-select 방식 지원

-----

## 13. 경쟁 사이트 분석 & 차별화

### 13.1 경쟁 대비 차별화 포인트

|기능               |mollulog|BA Torment|**본 서비스**  |
|-----------------|:------:|:--------:|:---------:|
|공개 메타 통계         |✅       |✅         |✅ (Phase 5)|
|**학생 명부(Roster)**|❌       |❌         |**✅ 핵심**   |
|**스냅샷 기록 보존**    |❌       |❌         |**✅ 핵심**   |
|**파티 빌더**        |❌       |❌         |**✅ 핵심**   |
|**하이브리드 타임라인**   |❌       |❌         |**✅ 핵심**   |
|**손패 고정**        |❌       |❌         |**✅ 핵심**   |
|영상 + 파티 매핑       |❌       |✅         |✅          |
|택틱 노트            |❌       |❌         |✅          |
|점수 계산기           |✅       |✅         |예정         |

### 13.2 차용 기능 (우선순위별)

|출처        |기능                 |우선순위|
|----------|-------------------|:--:|
|mollulog  |편성 횟수 & 모집/조력 구분 통계|★★★ |
|mollulog  |시즌 일정 D-day 뱃지     |★★★ |
|SchaleDB  |마스터 데이터 소스 + 에셋 CDN|★★★ |
|BA Torment|영상 + 파티 매핑         |★★★ |
|mollulog  |성급 분포 통계           |★★☆ |
|SchaleDB  |스킬 요약 툴팁           |★★☆ |

-----

## 14. 학생 스펙 저장 항목 상세

### 14.1 확정 저장 항목

```
[레벨] 1~90+ (상한 가변)
[성급] 일반 1~5성 / 전무 1~4성 (5성 후 해금)
[스킬] EX 1~5 / 노말·패시브·강화패시브 각 1~10
[장비] 3슬롯 × 티어만 (종류는 마스터 고정)
[능력개방] 공격력/최대체력/회복력 각 0~25
[인연 랭크] 본체 1~100 / 이격별 1~100
[조력자 스탯] 공격력(필수), 방어력/체력(유추 또는 직접)
```

### 14.2 성급 UI

```
1~5성 → 5성 도달 시 "전무 해금" 토글 → 전무1~4성 추가 선택
표시: ★★★★★ UE②
DB: starLevel: 1~5, uniqueStarLevel: null | 1~4
```

### 14.3 장비 슬롯 UI

```
슬롯 1: [모자 — 자동표시] [T7▼]  또는 [미착용]
슬롯 2: [헤어핀 — 자동표시] [T8▼]  또는 [미착용]
슬롯 3: [목걸이 — 자동표시] [T10▼] 또는 [미착용]
※ 종류는 Student 마스터에서 자동 표시, 유저는 티어만 선택
※ 티어 상한은 마스터 데이터의 current_max_gear_tier로 관리
```

-----

## Appendix A. 폴더 구조

```
ba-raid-tracker/
├── app/
│   ├── (auth)/
│   ├── (main)/
│   │   ├── page.tsx              # 대시보드
│   │   ├── roster/               # 학생 명부 ← 문서 A 핵심
│   │   ├── builder/              # 파티 빌더 + 기록 작성
│   │   ├── records/              # 기록 열람
│   │   ├── tactics/              # 택틱 노트
│   │   ├── dashboard/            # 내 대시보드
│   │   └── meta/[bossSlug]/      # 보스 메타 (Phase 5)
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── roster/               # ← 문서 A
│       ├── records/
│       ├── parties/
│       ├── tactics/
│       ├── meta/
│       ├── master/
│       └── users/
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── roster/                   # 명부 관련 ← 문서 A
│   ├── party/                    # 파티 빌더
│   ├── record/                   # 기록 관련
│   ├── meta/                     # 메타 통계
│   └── tactic/                   # 택틱 관련
├── lib/
│   ├── prisma.ts
│   ├── redis.ts
│   ├── auth.ts
│   └── validations/              # Zod 스키마 (프론트/백 공유)
├── data/
│   └── seed/                     # SchaleDB 기반 마스터 데이터
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
└── types/
```

-----

*문서 끝 — 다음 단계: Phase 1 개발 시작*
