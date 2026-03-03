# 블루아카이브 레이드 트래커 (BA Raid Tracker) — 전체 기획 문서

> 작성일: 2026-03-03  
> 버전: v1.3 (스키마 전면 재설계: 총력전/대결전 분리, 이격 모델, 커뮤니티 후순위, 기타 정정)  
> 성격: 불특정 다수 대상 공개 웹 서비스

-----

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
1. [기술 스택](#2-기술-스택)
1. [시스템 아키텍처](#3-시스템-아키텍처)
1. [기능 명세](#4-기능-명세)
1. [데이터베이스 스키마](#5-데이터베이스-스키마)
1. [API 설계](#6-api-설계)
1. [페이지 구조 & UI/UX](#7-페이지-구조--uiux)
1. [인증 & 권한](#8-인증--권한)
1. [정적 마스터 데이터](#9-정적-마스터-데이터)
1. [개발 Phase 계획](#10-개발-phase-계획)
1. [배포 & 인프라](#11-배포--인프라)
1. [고려사항 & 리스크](#12-고려사항--리스크)
1. [참조 사이트 분석 & 차용 기능 제안](#13-참조-사이트-분석--차용-기능-제안)
1. [학생 스펙 — 저장 항목 상세 & 추가 제안](#14-학생-스펙--저장-항목-상세--추가-제안)

-----

## 1. 프로젝트 개요

### 1.1 서비스 한 줄 설명

블루아카이브 총력전 · 대결전의 **레이드 기록, 파티 편성, 전략 노트, 메타 통계**를 한 곳에서 관리하고 커뮤니티와 공유하는 웹 서비스.

### 1.2 핵심 가치 제안

|Pain Point       |해결책                  |
|-----------------|---------------------|
|매 시즌 점수 기억 못 함   |시즌별 기록 자동 아카이빙       |
|파티 편성을 메모장에 적음   |비주얼 파티 빌더 + 저장       |
|클리어 영상 나중에 못 찾음  |택틱 노트에 영상 URL + 메모 연동|
|메타를 커뮤니티에서 일일이 찾음|집계 기반 자동 메타 분석       |
|내 성장 추이를 모름      |시즌별 점수/랭킹 차트         |

### 1.3 타겟 유저

- **주요**: 총력전/대결전을 진지하게 공략하는 블루아카이브 유저
- **부가**: 메타 참고만 하려는 라이트 유저 (비로그인 열람)

### 1.4 게임 도메인 지식 요약

**총력전 (Total Assault)**

- 보스 1마리, 하루 3번 도전 (잔기 공유)
- 파티: 스트라이커 4 + 스페셜 2, **한 도전 내 파티 수 제한 없음** (교체 후 재도전 가능)
- **출전 제한**: 동일 도전 내 이미 출전한 학생은 재출전 불가 (이격은 별개 취급 → 미카와 미카(수영복)는 동시 출전 가능)
- **조력자**: 도전 전체에서 단 1회만 사용 가능. 내 학생 출전 여부와 별개 (예: 미카 본인으로 1파티, 조력자로 미카 사용 가능)
- 난이도: Normal → Hard → VeryHard → Hardcore → Extreme → Insane → Torment → **Lunatic**
- 지형: 실내(Indoor) / 야외(Outdoor) / 시가지(Street)
- 보스 공격 속성: 폭발/관통/신비/진동
- 보스 방어 타입: 경장갑/중장갑/특수장갑/탄력장갑/복합장갑 중 1종 (복합장갑은 JP 서버 선행, 글로벌 서버는 ~4개월 후)

**대결전 (Grand Assault)**

- 총력전 보스 1마리를 **방어 타입 3종으로** 각각 공략
- 방어 타입은 경장갑/중장갑/특수장갑/탄력장갑/복합장갑 중 3종 선택
- 난이도 제한: **2종은 최대 Torment, 나머지 1종은 최대 Insane**
- 보스 공격 속성은 총력전과 동일
- **한 방어타입 도전 내 파티 수 제한 없음**, 출전 제한 동일 (이미 출전한 학생 재출전 불가, 이격 별개)
- **조력자**: 방어타입별 도전 각각에서 단 1회씩 사용 가능

**공통 규칙 요약**

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
- Editor:       Tiptap (마크다운/리치텍스트 — 택틱 노트용)

[Backend]
- Runtime:      Next.js API Routes (Route Handlers)
- ORM:          Prisma
- Validation:   Zod (공유 스키마)

[Database & Services]
- Primary DB:   PostgreSQL via Supabase
- Cache:        Upstash Redis (메타 통계 집계 캐싱)
- Auth:         NextAuth.js v5 (Discord OAuth, Google OAuth)
- Storage:      Supabase Storage (학생/보스 이미지 CDN)

[DevOps]
- Hosting:      Vercel
- DB Hosting:   Supabase
- CI/CD:        GitHub Actions → Vercel 자동 배포
- Monitoring:   Vercel Analytics + Sentry

[Dev Tools]
- Package:      pnpm
- Linting:      ESLint + Prettier
- Testing:      Vitest + Playwright (E2E)
```

### 2.2 스택 선택 근거

|선택                |이유                                               |
|------------------|-------------------------------------------------|
|Next.js App Router|SSR로 메타 페이지 SEO 확보, API Routes로 모노레포 유지          |
|Supabase          |PostgreSQL + Realtime + Storage + 무료 티어, 빠른 초기 셋업|
|Prisma            |타입 안전 쿼리, 마이그레이션 관리 용이                           |
|Upstash Redis     |Serverless 환경 친화적, 통계 집계 캐싱                      |
|shadcn/ui         |커스터마이즈 용이, 접근성 고려된 컴포넌트                          |
|Discord OAuth     |블루아카이브 유저 특성상 Discord 계정 보유율 높음                  |

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

|페이지       |전략       |이유              |
|----------|---------|----------------|
|메인 대시보드   |ISR (1시간)|메타 통계, 자주 바뀌지 않음|
|보스별 메타 페이지|ISR (1시간)|SEO + 통계 캐싱     |
|편성 상세 페이지 |SSR      |개인 데이터 포함 가능    |
|파티 빌더     |CSR      |인터랙션 많음         |
|내 대시보드    |CSR      |인증 필요, 개인화      |

-----

## 4. 기능 명세

### 4.1 레이드 기록 트래킹

#### 기록 입력 항목

```
공통:
- 보스명 (마스터 데이터 select)
- 시즌 (자동 감지 또는 직접 선택)
- 최종 점수
- 랭킹 백분위 (선택, 예: 상위 2.3%)
- 메모

총력전 전용:
- 난이도 선택 (Normal ~ Lunatic)
- 보스 방어타입 (시즌 고정, 자동 표시)
- 사용 파티 목록 (순서대로 추가, 파티 수 제한 없음)
  ※ 동일 도전 내 같은 학생 중복 출전 불가 (이격은 별개)
  ※ 조력자는 전체 도전에서 1회만 허용

대결전 전용:
- 방어타입 3종 각각에 대해:
  · 난이도 선택 (2종: Normal~Torment, 1종: Normal~Insane)
  · 해당 방어타입 점수
  · 사용 파티 목록 (순서대로 추가, 파티 수 제한 없음)
    ※ 방어타입별 도전 내 같은 학생 중복 출전 불가
    ※ 조력자는 방어타입별 도전 각각에서 1회씩 허용
```

#### 기록 열람

- 시즌별 타임라인 뷰
- 보스별 필터
- 최고점 / 평균점 / 최근 기록 카드
- 점수 추이 라인 차트 (시즌 × 점수)
- 랭킹 추이 차트

### 4.2 파티 빌더 & 편성 저장

#### 파티 빌더 UI

```
총력전 / 대결전 공통 레이아웃 (파티 1개 기준):
┌─────────────────────────────────────────┐
│  스트라이커 (4슬롯)                      │
│  [학생1][학생2][학생3][학생4]            │
│  스페셜 (2슬롯)                          │
│  [학생5][학생6]                          │
└─────────────────────────────────────────┘

※ 파티 수 제한 없음 — "+ 파티 추가" 버튼으로 동적 추가
※ 대결전의 경우 방어타입 탭(3개)별로 별도 파티 세트를 관리
```

#### 학생 슬롯 입력 항목

```
[필수]
- 학생 선택 (이름 검색 + 아이콘)
- 조력자 여부 (체크 시 → 조력자 입력 모드로 전환)
- 레벨 (1~90+)
- 성급
  · 일반 1~5성
  · 전무 1~4성 (5성 달성 후 활성화)
- 스킬 레벨 4종 (EX 1~5, 노말/패시브/강화패시브 각 1~10)
- 장비 (슬롯별 종류 + 티어, 미착용 선택 가능)
  · 슬롯 1: 모자/장갑/신발 + T1~T10
  · 슬롯 2: 헤어핀/뱃지/가방 + T1~T10
  · 슬롯 3: 시계/부적/목걸이 + T1~T10

[선택]
- 능력개방: 공격력/최대체력/회복력 각 0~25
- 인연 랭크: 1~100
- 이격 인연 랭크: 이격 존재 시 각 이격별 1~100

[조력자 모드 전용]
- 필수 입력 (비워둘 수 없음):
  · 레벨, 성급, 스킬 레벨 4종, 공격력
  · ※ 네 항목이 모두 있어야 방어력/체력 역산 가능
- 선택:
  · A) 공격력 기반 유추: 필수 항목 입력 시 방어력/체력 자동 추산
  · B) 직접 입력: 방어력/체력을 인게임에서 직접 확인 후 수동 입력
  · 장비 티어 (입력 가능하지만 생략 허용)
```

#### 편성 메타데이터

```
- 편성 이름
- 대상 보스 (태그)
- 지형 (Indoor / Outdoor / Street)
- 설명 (선택)
- 택틱 노트 연결 (선택)
```

> 커뮤니티 기능(공개 피드, 좋아요, 북마크, 포크)은 후순위 개발로 보류.  
> Phase 1~5는 로그인 기반 개인 기록/편성/추이에 집중.

### 4.3 메타 분석 & 통계

#### 집계 대상 (공개 기록 기반)

```
보스별:
- 학생 픽률 Top 20 (포지션별)
- 난이도대별 픽률 분포
- 시즌별 메타 변화 (픽률 추이)

점수대별:
- 상위 1% 편성 패턴
- 상위 10% 편성 패턴
- 일반 편성 패턴

속성/지형별:
- 필수 학생 (픽률 70% 이상)
- 대체 학생 군

기간별:
- 시즌 초반 vs 후반 메타 변화
```

#### 집계 방식

- 매 1시간 Redis 캐시 갱신 (Vercel Cron Job)
- 샘플 수 < 10이면 통계 미표시 (신뢰도 확보)

### 4.4 택틱 기록 (전략 노트)

```
입력 항목:
- 제목
- 연결된 레이드 기록 (선택)
- 연결된 파티 편성 (선택)
- 클리어 영상 URL (YouTube)
- 본문 (Tiptap 리치텍스트 에디터)
  - 헤딩 / 볼드 / 이탤릭
  - 체크리스트 (공략 단계 체크)
  - 타임스탬프 태그 (예: [0:45] EX 스킬 발동 타이밍)
- 실패 원인 태그 (멀티셀렉트)
  - DPS 부족 / CC 실패 / 스킬 타이밍 / 생존 / 운 / 기타
```

-----

## 5. 데이터베이스 스키마

### 5.1 ERD 개요

```
[마스터 데이터]
Student ──────< AlternateForm (이격 관계 테이블)
Boss ──────────< TotalAssaultSeason
               < GrandAssaultSeason ──< GrandAssaultArmorSlot

[유저 데이터]
User ──────────< TotalAssaultRecord ──< TotalAssaultParty
               < GrandAssaultRecord ──< GrandAssaultAttempt ──< GrandAssaultParty
               < Party ──────────────< PartyMember
               < Tactic

Party ←────── TotalAssaultParty (참조)
Party ←────── GrandAssaultParty (참조)
Party ←────── Tactic (선택 참조)
```

**설계 원칙**

- 총력전 · 대결전 기록 및 시즌 테이블을 완전히 분리 (카운팅 별개)
- 보스는 총력전 기준 정의. 같은 보스라도 지형이 다르면 별도 ID  
  (예: `gebura_outdoor`, `gebura_indoor`)
- 대결전 시즌은 방어타입 3종을 `GrandAssaultArmorSlot` 테이블로 관리
- 이격 관계는 `AlternateForm` 별도 테이블로 명시적 저장 (본체 1 : 이격 N)
- 커뮤니티 기능(Like, Bookmark) 스키마는 후순위 개발 시 추가
- KR 서버 = 글로벌 서버 → Region은 `GLOBAL` / `JP` 두 종만 사용

### 5.2 상세 스키마 (Prisma 형식)

```prisma
// ══════════════════════════════════════════
// 마스터 데이터 (정적, 관리자만 수정)
// ══════════════════════════════════════════

// ── 학생 ──────────────────────────────────
model Student {
  id              String      @id  // "shiroko", "mika", "mika_swimsuit" 등 slug
  nameKo          String
  nameEn          String
  school          String
  role            Role        // STRIKER | SPECIAL
  studentClass    StudentClass // DEALER | TANK | HEALER | SUPPORTER | TACTICAL_SUPPORT
  attackType      AttackType  // EXPLOSIVE | PIERCING | MYSTIC | SONIC
  armorType       ArmorType   // LIGHT | HEAVY | SPECIAL | ELASTIC
  iconUrl         String

  // 한정 여부: 복각 여부 판단, 유저 보유 가능성 추정,
  // 메타 분석 시 "비한정 대체 가능 여부" 안내 등에 활용
  isLimited       Boolean     @default(false)

  // 출시 일자: 최신순 정렬, 시즌 교차 분석
  // ("이 학생이 없었던 시즌" 필터링 등)에 활용
  releasedAt      DateTime

  // 이격 관계 (AlternateForm 테이블로 관리)
  // 본체인 경우 alternateForms에 이격 목록이 연결됨
  // 이격인 경우 baseForm에 본체가 연결됨
  baseFormLink    AlternateForm? @relation("BaseStudent")
  alternateLinks  AlternateForm[] @relation("AlternateStudent")

  partyMembers    PartyMember[]
  @@map("students")
}

// 본체 ↔ 이격 관계 테이블
// 이격이 있는 학생(본체)을 기준으로 모든 이격을 저장
// 예) 미카(본체) → 미카(수영복), 미카(크리스마스)
// 이격도 Student 레코드를 가지며, 이격은 출전 횟수를 본체와 공유하지 않음
model AlternateForm {
  id                String   @id @default(cuid())
  baseStudentId     String   @unique  // 본체 학생 ID (1:N에서 1쪽, 본체당 행 1개)
  baseStudent       Student  @relation("BaseStudent", fields: [baseStudentId], references: [id])
  alternateStudentId String           // 이격 학생 ID
  alternateStudent  Student  @relation("AlternateStudent", fields: [alternateStudentId], references: [id])
  // 이격 설명 (선택): "수영복", "체육복" 등 코스튬 구분용
  label             String?

  @@unique([baseStudentId, alternateStudentId])
  @@map("alternate_forms")
}

// ── 보스 ──────────────────────────────────
// 총력전 기준으로 정의.
// 같은 보스라도 지형이 다르면 별도 레코드.
// 예) id="gebura_outdoor", id="gebura_indoor"
// 대결전은 Boss를 참조하는 GrandAssaultSeason으로 관리.
model Boss {
  id              String      @id  // "binah_outdoor", "shirokuro_indoor" 등
  nameKo          String
  nameEn          String
  terrain         Terrain     // INDOOR | OUTDOOR | STREET
  attackType      AttackType  // 보스 공격 속성
  armorType       ArmorType   // 총력전 방어타입
  iconUrl         String
  isReleased      Boolean     @default(true)

  totalAssaultSeasons   TotalAssaultSeason[]
  grandAssaultSeasons   GrandAssaultSeason[]
  @@map("bosses")
}

// ── 총력전 시즌 ────────────────────────────
model TotalAssaultSeason {
  id              Int         @id @default(autoincrement())
  seasonNumber    Int         // 실제 시즌 번호 (예: 82)
  bossId          String
  boss            Boss        @relation(fields: [bossId], references: [id])
  region          Region      // GLOBAL | JP
  startAt         DateTime
  endAt           DateTime

  records         TotalAssaultRecord[]
  @@unique([seasonNumber, region])
  @@map("total_assault_seasons")
}

// ── 대결전 시즌 ────────────────────────────
model GrandAssaultSeason {
  id              Int         @id @default(autoincrement())
  seasonNumber    Int         // 실제 시즌 번호 (예: 27)
  bossId          String
  boss            Boss        @relation(fields: [bossId], references: [id])
  region          Region      // GLOBAL | JP
  startAt         DateTime
  endAt           DateTime

  armorSlots      GrandAssaultArmorSlot[]
  records         GrandAssaultRecord[]
  @@unique([seasonNumber, region])
  @@map("grand_assault_seasons")
}

// 대결전 시즌의 방어타입 슬롯 (3개 고정)
// difficultyMax: 2종=TORMENT, 1종=INSANE
model GrandAssaultArmorSlot {
  id              String      @id @default(cuid())
  seasonId        Int
  season          GrandAssaultSeason @relation(fields: [seasonId], references: [id])
  slotIndex       Int         // 0, 1, 2
  armorType       ArmorType
  difficultyMax   Difficulty  // TORMENT 또는 INSANE

  attempts        GrandAssaultAttempt[]
  @@unique([seasonId, slotIndex])
  @@map("grand_assault_armor_slots")
}

// ══════════════════════════════════════════
// 유저 데이터
// ══════════════════════════════════════════

model User {
  id              String      @id @default(cuid())
  name            String?
  email           String?     @unique
  image           String?
  discordId       String?     @unique
  googleId        String?     @unique
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  totalAssaultRecords   TotalAssaultRecord[]
  grandAssaultRecords   GrandAssaultRecord[]
  parties               Party[]
  tactics               Tactic[]
  accounts              Account[]
  sessions              Session[]
  @@map("users")
}

// ── 총력전 기록 ────────────────────────────
model TotalAssaultRecord {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  seasonId        Int
  season          TotalAssaultSeason @relation(fields: [seasonId], references: [id])

  difficulty      Difficulty
  finalScore      BigInt
  rankPercentile  Float?      // 0.0~100.0, null=미입력
  notes           String?
  recordedAt      DateTime    @default(now())
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // 투입 파티 목록 (순서 있음, 수 제한 없음)
  parties         TotalAssaultParty[]
  tactics         Tactic[]
  @@map("total_assault_records")
}

// 총력전 기록 내 파티 투입 순서
model TotalAssaultParty {
  id              String      @id @default(cuid())
  recordId        String
  record          TotalAssaultRecord @relation(fields: [recordId], references: [id], onDelete: Cascade)
  partyId         String
  party           Party       @relation(fields: [partyId], references: [id])
  partyOrder      Int         // 투입 순서 (1부터)

  @@unique([recordId, partyOrder])
  @@map("total_assault_parties")
}

// ── 대결전 기록 ────────────────────────────
model GrandAssaultRecord {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  seasonId        Int
  season          GrandAssaultSeason @relation(fields: [seasonId], references: [id])

  finalScore      BigInt      // 3종 합산
  rankPercentile  Float?
  notes           String?
  recordedAt      DateTime    @default(now())
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  attempts        GrandAssaultAttempt[]
  tactics         Tactic[]
  @@map("grand_assault_records")
}

// 대결전 방어타입별 도전 기록
model GrandAssaultAttempt {
  id              String      @id @default(cuid())
  recordId        String
  record          GrandAssaultRecord @relation(fields: [recordId], references: [id], onDelete: Cascade)
  armorSlotId     String
  armorSlot       GrandAssaultArmorSlot @relation(fields: [armorSlotId], references: [id])

  difficulty      Difficulty
  score           BigInt

  // 투입 파티 목록 (순서 있음, 수 제한 없음)
  parties         GrandAssaultParty[]
  @@unique([recordId, armorSlotId])
  @@map("grand_assault_attempts")
}

// 대결전 방어타입별 도전 내 파티 투입 순서
model GrandAssaultParty {
  id              String      @id @default(cuid())
  attemptId       String
  attempt         GrandAssaultAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  partyId         String
  party           Party       @relation(fields: [partyId], references: [id])
  partyOrder      Int         // 투입 순서 (1부터)

  @@unique([attemptId, partyOrder])
  @@map("grand_assault_parties")
}

// ── 파티 (편성 저장) ───────────────────────
model Party {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  name            String
  description     String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  members                 PartyMember[]
  totalAssaultParties     TotalAssaultParty[]
  grandAssaultParties     GrandAssaultParty[]
  tactics                 Tactic[]
  @@map("parties")
}

// ── 파티 멤버 (학생 스펙) ──────────────────
model PartyMember {
  id              String      @id @default(cuid())
  partyId         String
  party           Party       @relation(fields: [partyId], references: [id], onDelete: Cascade)
  studentId       String
  student         Student     @relation(fields: [studentId], references: [id])

  // 0~3: 스트라이커, 4~5: 스페셜
  slot            Int

  // 조력자: 도전당 1회, 내 학생 출전과 별개
  isSupport       Boolean     @default(false)

  // 레벨 (1~90+, 상한 가변)
  level           Int

  // 성급
  starLevel       Int         // 1~5
  uniqueStarLevel Int?        // 1~4 (전무; 5성 후에만, null=전무 없음)

  // 스킬 레벨
  exSkillLevel       Int      // 1~5
  basicSkillLevel    Int      // 1~10
  enhancedSkillLevel Int      // 1~10
  subSkillLevel      Int      // 1~10

  // 장비 슬롯 3개 (종류 + 티어, null=미착용)
  // 슬롯1: HAT/GLOVES/SHOES
  // 슬롯2: HAIRPIN/BADGE/BAG
  // 슬롯3: WATCH/CHARM/NECKLACE
  gear1Type       GearType?
  gear1Tier       Int?        // T1~T10 (상한 가변)
  gear2Type       GearType?
  gear2Tier       Int?
  gear3Type       GearType?
  gear3Tier       Int?

  // 능력개방 (5성 후 해금, 각 0~25)
  abilityUnlockAtk  Int      @default(0)   // 공격력
  abilityUnlockHp   Int      @default(0)   // 최대체력
  abilityUnlockHeal Int      @default(0)   // 회복력

  // 인연 랭크 (1~100, 스탯 기여 1~50)
  bondLevel       Int         @default(1)

  // 이격 인연 랭크 { "mika_swimsuit": 40 }, 이격 없으면 null
  elephBondLevels Json?

  // 조력자 전용 스탯 (isSupport=true 시)
  // 필수: level, starLevel, skill 4종, supportAtk (역산 기준)
  // 선택: supportDef, supportHp, 장비 티어
  supportAtk        Int?     // 공격력 (필수)
  supportDef        Int?     // 방어력 (선택/유추)
  supportHp         Int?     // 최대체력 (선택/유추)
  isStatInferred    Boolean  @default(false)  // true=방어력/체력이 유추값

  @@unique([partyId, slot])
  @@map("party_members")
}

// ── 택틱 노트 ──────────────────────────────
model Tactic {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 총력전 또는 대결전 기록에 연결 (선택)
  totalAssaultRecordId  String?
  totalAssaultRecord    TotalAssaultRecord? @relation(fields: [totalAssaultRecordId], references: [id])
  grandAssaultRecordId  String?
  grandAssaultRecord    GrandAssaultRecord? @relation(fields: [grandAssaultRecordId], references: [id])

  // 특정 파티에도 연결 가능 (선택)
  partyId         String?
  party           Party?      @relation(fields: [partyId], references: [id])

  title           String
  videoUrl        String?     // YouTube URL
  content         String      // Tiptap JSON
  failureTags     String[]    // ["DPS_LACK","CC_FAIL","TIMING","SURVIVAL","RNG"]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@map("tactics")
}

// NextAuth 필수 테이블
model Account { ... }
model Session { ... }

// ══════════════════════════════════════════
// Enum 정의
// ══════════════════════════════════════════

enum Role {
  STRIKER
  SPECIAL
}

enum StudentClass {
  DEALER            // 딜러
  TANK              // 탱커
  HEALER            // 힐러
  SUPPORTER         // 서포터
  TACTICAL_SUPPORT  // 택티컬 서포트 (T.S.)
}

enum AttackType {
  EXPLOSIVE   // 폭발
  PIERCING    // 관통
  MYSTIC      // 신비
  SONIC       // 진동
}

enum ArmorType {
  LIGHT       // 경장갑
  HEAVY       // 중장갑
  SPECIAL     // 특수장갑
  ELASTIC     // 탄력장갑
  COMPOSITE   // 복합장갑 (JP 선행, Global 추후 추가)
}

enum Terrain {
  INDOOR    // 실내
  OUTDOOR   // 야외
  STREET    // 시가지
}

enum Difficulty {
  NORMAL
  HARD
  VERY_HARD
  HARDCORE
  EXTREME
  INSANE
  TORMENT
  LUNATIC   // 2025년 7월 게부라 시즌부터 추가
}

// KR 서버 = 글로벌 서버이므로 GLOBAL로 통일
enum Region {
  GLOBAL  // KR(한국) 및 글로벌 통합
  JP      // 일본 서버 (약 4개월 선행)
}

enum GearType {
  // 슬롯 1
  HAT GLOVES SHOES
  // 슬롯 2
  HAIRPIN BADGE BAG
  // 슬롯 3
  WATCH CHARM NECKLACE
}
```

### 5.3 인덱스 전략

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

### 5.4 설계 결정 사항 메모

**① 보스 ID 분리 (같은 보스, 다른 지형)**
같은 보스라도 지형이 다르면 사용 학생과 메타가 완전히 달라지므로 별도 레코드로 분리한다.  
`id = "gebura_outdoor"`, `id = "gebura_indoor"` 형태의 slug로 구분.  
`nameKo`/`nameEn`은 동일해도 무방.

**② 이격을 AlternateForm 별도 테이블로 처리**
`Student` 자기참조 대신 `AlternateForm` 테이블을 별도로 두어 본체↔이격 관계를 명시적으로 저장.  
이격도 독립 `Student` 레코드를 가지므로 `PartyMember` 관계를 그대로 활용 가능.  
본체 1개에 이격 여러 개를 연결하며, `label` 필드로 “수영복”, “체육복” 등 코스튬 구분.  
이격은 본체와 출전 횟수를 공유하지 않으므로 동시 편성 가능.

**③ `isLimited` 및 `releasedAt` 필드 이유**
`isLimited`: 한정 학생은 재픽업 기회가 희소해 유저 보유율이 낮음.  
메타 분석 시 “비한정 대체 편성” 안내, 보유율 기반 필터링에 활용.  
`releasedAt`: 출시 전 시즌과 출시 후 시즌을 구분해 통계 신뢰도를 높임.  
학생 목록 정렬, “당시 사용 가능했던 학생” 필터링에도 사용.

**④ Region: GLOBAL / JP 두 종으로 통일**
KR 서버 = 글로벌 서버이므로 `GLOBAL`로 통일.  
JP 서버는 약 4개월 선행 운영되므로 별도 관리.  
`KR`이라는 값은 사용하지 않음.

**⑤ 커뮤니티 테이블 (Like, Bookmark) 보류**
현재 스키마에서 제외. 후순위 개발 시 Party에 `isPublic`, `likeCount` 필드 추가 예정.

## 6. API 설계

### 6.1 엔드포인트 목록

```
[인증]
POST   /api/auth/[...nextauth]

[레이드 기록]
GET    /api/records                  # 내 기록 목록 (페이지네이션)
POST   /api/records                  # 기록 생성
GET    /api/records/:id              # 기록 상세
PATCH  /api/records/:id              # 기록 수정
DELETE /api/records/:id              # 기록 삭제

[파티]
GET    /api/parties                  # 공개 파티 피드
POST   /api/parties                  # 파티 생성
GET    /api/parties/:id              # 파티 상세
PATCH  /api/parties/:id              # 파티 수정
DELETE /api/parties/:id              # 파티 삭제
POST   /api/parties/:id/like         # 좋아요 토글
POST   /api/parties/:id/bookmark     # 북마크 토글
POST   /api/parties/:id/fork         # 내 파티로 복사

[택틱]
GET    /api/tactics                  # 공개 택틱 피드
POST   /api/tactics                  # 택틱 생성
GET    /api/tactics/:id              # 택틱 상세
PATCH  /api/tactics/:id              # 택틱 수정
DELETE /api/tactics/:id              # 택틱 삭제

[메타 통계]
GET    /api/meta/boss/:bossId        # 보스별 픽률/통계
GET    /api/meta/boss/:bossId/trend  # 시즌별 메타 변화

[마스터 데이터]
GET    /api/master/students          # 학생 목록
GET    /api/master/bosses            # 보스 목록
GET    /api/master/seasons           # 시즌 목록

[유저]
GET    /api/users/:id                # 유저 프로필 (공개)
GET    /api/users/me                 # 내 프로필
PATCH  /api/users/me                 # 내 프로필 수정
GET    /api/users/me/stats           # 내 통계 요약
```

### 6.2 응답 포맷 표준

```typescript
// 성공
{
  "data": { ... },
  "meta": {           // 페이지네이션 시
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasNext": true
  }
}

// 에러
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "로그인이 필요합니다."
  }
}
```

-----

## 7. 페이지 구조 & UI/UX

### 7.1 사이트맵

```
/                          랜딩 / 메인 대시보드
├── /meta                  메타 허브
│   └── /meta/[bossSlug]   보스별 메타 상세
├── /parties               공개 편성 피드
│   ├── /parties/new       파티 빌더 (로그인)
│   └── /parties/[id]      편성 상세
├── /tactics               공개 택틱 피드
│   └── /tactics/[id]      택틱 상세
├── /dashboard             내 대시보드 (로그인)
│   ├── /dashboard/records 내 기록 관리
│   ├── /dashboard/parties 내 편성 관리
│   └── /dashboard/stats   내 통계
├── /profile/[userId]      유저 공개 프로필
└── /settings              설정 (로그인)
```

### 7.2 핵심 페이지 UI 설명

#### 메인 페이지 (/)

```
┌─────────────────────────────────────────────────┐
│  BA Raid Tracker          [로그인] [Discord]     │
├─────────────────────────────────────────────────┤
│  현재 진행중인 레이드                             │
│  ┌──────────┐  ┌──────────┐                     │
│  │ 총력전   │  │ 대결전   │                     │
│  │ Binah    │  │ ...      │                     │
│  │ D-3 남음 │  │ D-5 남음 │                     │
│  └──────────┘  └──────────┘                     │
├─────────────────────────────────────────────────┤
│  이번 시즌 핫 편성 Top 3                         │
│  [편성카드] [편성카드] [편성카드]                │
├─────────────────────────────────────────────────┤
│  보스별 메타 픽률 미리보기                        │
│  [보스1] [보스2] [보스3] ...                     │
└─────────────────────────────────────────────────┘
```

#### 파티 빌더 (/parties/new)

```
┌────────────────────────────────────────────────────┐
│  파티 빌더          [저장] [공개로 전환] [초기화]   │
├──────────────┬─────────────────────────────────────┤
│ 학생 검색    │  편성 영역                           │
│ 🔍 이름검색 │  스트라이커                           │
│ 필터:        │  [하루카][슌][코코나][이즈나]        │
│ ☐ 총력전    │  스페셜                              │
│ ☐ 속성별   │  [세리나][  비어있음  ]               │
│ ☐ 지형별   ├─────────────────────────────────────┤
│             │  파티 정보                           │
│ [학생목록]  │  이름: [________________]            │
│             │  보스: [Binah ▼]                    │
│             │  지형: [야외 ▼]                     │
│             │  공개: [◉공개 ○비공개]              │
└──────────────┴─────────────────────────────────────┘
```

#### 보스 메타 페이지 (/meta/[bossSlug])

```
┌─────────────────────────────────────────────────┐
│  Binah (총력전) — 신비속성 / 야외              │
│  이번 시즌 공개 기록: 1,243건                  │
├─────────────────────────────────────────────────┤
│  [전체] [Torment] [Insane] [Extreme] ...       │
├─────────────────────────────────────────────────┤
│  스트라이커 픽률 Top 10                         │
│  1위 하루카   ████████████ 87%                 │
│  2위 슌       ██████████   74%                 │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  스페셜 픽률 Top 10                             │
│  ...                                            │
├─────────────────────────────────────────────────┤
│  시즌별 메타 변화 차트                          │
│  [라인차트]                                     │
├─────────────────────────────────────────────────┤
│  고득점 공개 편성 모음                          │
│  [편성카드] [편성카드] ...                      │
└─────────────────────────────────────────────────┘
```

### 7.3 디자인 가이드라인

```
컬러:
- Primary:    블루아카이브 테마 컬러 (#4A90E2 계열)
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
- 모바일 반응형 필수 (모바일 유저 비중 높음)
- 학생 아이콘: Supabase Storage CDN 호스팅
```

-----

## 8. 인증 & 권한

### 8.1 OAuth 제공자

```
Discord OAuth (주)   — 블루아카이브 커뮤니티 특성상 선호
Google OAuth  (부)   — 접근성 확보용
```

### 8.2 권한 매트릭스

|기능          |비로그인|로그인|본인|
|------------|----|---|--|
|메타 통계 열람    |✅   |✅  |✅ |
|공개 편성 열람    |✅   |✅  |✅ |
|공개 택틱 열람    |✅   |✅  |✅ |
|편성 좋아요/북마크  |❌   |✅  |✅ |
|편성 포크       |❌   |✅  |✅ |
|기록 생성       |❌   |✅  |✅ |
|기록/편성/택틱 수정 |❌   |❌  |✅ |
|내 대시보드      |❌   |✅  |✅ |
|타인 비공개 편성 열람|❌   |❌  |✅ |

### 8.3 Rate Limiting

```
- 공개 API (메타, 편성 피드): 100 req/min per IP
- 인증 API (기록/편성 생성): 30 req/min per user
- 포크/좋아요: 60 req/min per user
→ Upstash Redis로 sliding window rate limit 구현
```

-----

## 9. 정적 마스터 데이터

### 9.1 학생 데이터 관리 전략

학생 데이터는 게임 업데이트마다 갱신이 필요하므로 두 가지 방법 중 선택:

**방법 A: DB 저장 (권장)**

- Prisma seed 스크립트로 초기 데이터 투입
- 신규 학생 추가 시 관리자 페이지 또는 수동 seed
- 장점: 쿼리 Join 편리, 필터링 용이

**방법 B: JSON 정적 파일**

- `/data/students.json` 형태로 관리
- 장점: 관리 간단, CDN 캐싱
- 단점: DB 관계 설정 불가

→ **방법 A 선택** (파티 멤버와 Join 쿼리 필요하기 때문)

### 9.2 마스터 데이터 초기 목록

```
보스 (총력전):
Binah, Chesed, Hieronymus, Kaiten FX Mk.0, Hod,
ShiroKuro, Perorozilla, GOF, Kaitenger, ...

보스 (대결전):
Goz, EN-22 Armored Train, Heesung, ...

학생 데이터 출처:
- 블루아카이브 Wiki (schale.gg 등 커뮤니티 DB 참조)
- 직접 JSON 구축 → DB seed
```

### 9.3 시즌 데이터

```
시즌은 서버별(Global/JP)로 날짜가 다르므로
Region 필드로 구분하여 관리.
초기에는 Global 서버 기준으로 구현 후 JP 서버 확장.
```

-----

## 10. 개발 Phase 계획

### Phase 1 — 기반 구축 (약 2~3주)

```
✅ 프로젝트 초기 세팅 (Next.js + TypeScript + Tailwind)
✅ Supabase 연결 + Prisma 스키마 마이그레이션
✅ NextAuth.js Discord OAuth 구현
✅ 마스터 데이터 seed (학생 50명 + 보스 10개)
✅ 기본 레이아웃 (헤더, 푸터, 사이드바)
✅ 레이드 기록 CRUD (API + UI)
✅ 내 기록 목록 / 상세 페이지
```

### Phase 2 — 파티 빌더 (약 2~3주)

```
✅ 학생 검색 + 필터 컴포넌트
✅ 드래그앤드롭 슬롯 편성 UI
✅ 파티 저장 / 수정 / 삭제
✅ 레이드 기록 ↔ 파티 연결
✅ 공개 편성 피드 (최신순)
✅ 좋아요 / 북마크 / 포크
```

### Phase 3 — 택틱 노트 (약 1~2주)

```
✅ Tiptap 에디터 통합
✅ 택틱 CRUD
✅ YouTube embed 미리보기
✅ 실패 태그 시스템
✅ 파티 ↔ 택틱 연결
```

### Phase 4 — 메타 분석 (약 2~3주)

```
✅ 집계 쿼리 설계 (학생 픽률, 점수대별)
✅ Upstash Redis 캐싱 레이어
✅ Vercel Cron Job (1시간마다 집계)
✅ 보스별 메타 페이지 (픽률 차트)
✅ 시즌별 메타 추이 차트
✅ 내 편성 vs 메타 비교 기능
```

### Phase 5 — 대시보드 & 통계 (약 1~2주)

```
✅ 내 대시보드 (점수 추이 차트)
✅ 랭킹 백분위 추이
✅ 유저 공개 프로필 페이지
✅ 내 통계 요약 카드
```

### Phase 6 — 완성도 & 배포 (약 1주)

```
✅ 모바일 반응형 QA
✅ 다크모드 완성
✅ 에러 처리 / 로딩 스켈레톤
✅ SEO 메타태그 (보스 메타 페이지)
✅ Sentry 에러 모니터링
✅ 프로덕션 배포
```

**총 예상 기간: 9~14주 (혼자 개발 기준)**

-----

## 11. 배포 & 인프라

### 11.1 환경 구성

```
development:  로컬 + Supabase 로컬 or 개발용 프로젝트
staging:      Vercel preview (PR마다 자동 생성)
production:   Vercel production + Supabase production
```

### 11.2 환경 변수

```env
# Database
DATABASE_URL=
DIRECT_URL=          # Supabase direct connection (마이그레이션용)

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring
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

## 13. 참조 사이트 분석 & 차용 기능 제안

### 13.1 몰루로그 (mollulog.net)

**주요 기능**

- 미래시: Global/JP 서버 기준 예정 컨텐츠 일정 (총력전, 대결전, 이벤트, 픽업)
- 총력전/대결전 순위·통계: 시즌별 보스 결과 + 학생 편성 횟수/픽률
- 학생부: 학생별 최근 1년 총력전/대결전 편성 횟수 및 성급 분포 통계
- 로그인 후 내 정보 관리 기능
- 청휘석 플래너, 인연 랭크 계산기, 총력전 점수 계산기 등 유틸리티

**차용하면 좋은 기능**

|기능                     |설명                                 |우선순위|
|-----------------------|-----------------------------------|----|
|**편성 횟수 & 모집/조력 구분 통계**|학생별로 “모집 학생” vs “조력 학생”으로 분리된 픽률 표시|★★★ |
|**성급 분포 통계**           |편성된 학생의 성급(1성/2성/3성/4성/5성) 분포      |★★★ |
|**시즌 일정 뱃지**           |현재 진행 중인 레이드 + D-day 표시            |★★★ |
|**총력전 점수 계산기**         |남은 시간, 현재 HP 기준 예상 점수 계산           |★★☆ |
|**인연 랭크 계산기**          |목표 인연 랭크까지 필요 경험치/선물 계산            |★☆☆ |

### 13.2 SchaleDB (schaledb.com)

**주요 기능**

- 블루아카이브 비공식 종합 데이터베이스
- 학생 프로필, 스킬 상세, 스탯 테이블
- 스킬 데미지/힐량 수치 계산기
- 장비, 고유무기(전무) 정보
- 보스 정보, 드롭 테이블

**차용하면 좋은 기능**

|기능            |설명                                   |우선순위|
|--------------|-------------------------------------|----|
|**마스터 데이터 소스**|학생/보스 기초 데이터를 SchaleDB에서 참조하여 seed 구성|★★★ |
|**학생 아이콘/이미지**|SchaleDB 에셋 URL 참조 (CDN)             |★★★ |
|**스킬 요약 툴팁**  |파티 빌더에서 학생 hover 시 스킬 요약 표시          |★★☆ |
|**스탯 비교 뷰**   |스킬 레벨/장비 변경에 따른 예상 스탯 변화 표시          |★☆☆ |

### 13.3 BA Torment (bluearchive-torment.netlify.app)

**주요 기능**

- 파티 찾기 & 요약: Plana Stats 데이터 기반 시즌별 클리어 조합 열람
- 통계: 전체 총력전 추이 + 캐릭터별 사용 통계
- 영상: YouTube 클리어 영상 + 파티 정보 매핑 (souriki-border 방식)
- ARONA AI: 편성/공략 관련 질문 챗봇 (Beta)
- 점수 계산기: 총력전/대결전/종합전술시험 점수 계산

**차용하면 좋은 기능**

|기능                     |설명                                    |우선순위|
|-----------------------|--------------------------------------|----|
|**영상 + 파티 매핑**         |클리어 영상에 사용 편성 정보를 함께 태깅               |★★★ |
|**내 스펙으로 클리어 가능 여부 체크**|공개된 클리어 조합과 내 학생 보유 현황 비교             |★★★ |
|**점수 계산기**             |현재 남은 시간·HP 기반 예상 점수 산출               |★★☆ |
|**AI 편성 추천**           |내 보유 학생 기반 편성 추천 챗봇 (Claude API 활용 가능)|★☆☆ |

### 13.4 경쟁 사이트 대비 차별화 포인트

기존 사이트들은 **공개 통계 열람** 중심이지만, 본 서비스는 **개인 기록 + 커뮤니티**를 결합하는 게 핵심 차별점이다.

|기능              |mollulog|BA Torment|본 서비스 |
|----------------|--------|----------|------|
|공개 메타 통계        |✅       |✅         |✅     |
|개인 기록 저장        |제한적     |❌         |✅ (핵심)|
|파티 빌더           |❌       |❌         |✅ (핵심)|
|영상 + 파티 매핑      |❌       |✅         |✅     |
|택틱 노트           |❌       |❌         |✅ (핵심)|
|내 학생으로 클리어 가능 여부|❌       |✅         |✅ (예정)|
|점수 계산기          |✅       |✅         |✅ (예정)|

-----

## 14. 학생 스펙 — 저장 항목 상세 & 추가 제안

### 14.1 확정 저장 항목 (전체)

```
[레벨]
- 1~90 (업데이트로 상한 변동 가능, DB 제약 없이 유연하게)

[성급]
- 일반 성급: 1성 ~ 5성
- 전무 성급: 전무1성 ~ 전무4성
  ※ 전무는 5성 달성 후에만 개방, 전무1성부터 순차 해금

[스킬 4종]
- EX 스킬: 1~5
- 노말 스킬: 1~10
- 패시브 스킬: 1~10
- 강화패시브 스킬: 1~10

[장비 — 고정 3슬롯, 슬롯별 종류 + 티어]
슬롯 1 (HEAD 계열): 모자 / 장갑 / 신발
슬롯 2 (ACC 계열):  헤어핀 / 뱃지 / 가방
슬롯 3 (SPEC 계열): 시계 / 부적 / 목걸이
  ※ 티어: T1~T10 (현재 최대), 업데이트로 상한 변동 예정
  ※ 미착용 시 type=null, tier=null

[능력개방 — 공격력/최대체력/회복력 각각 독립]
- 공격력 능력개방: 0~25
- 최대체력 능력개방: 0~25
- 회복력 능력개방: 0~25
  ※ 5성 달성 시 해금, 오파츠+제약해제결전 재료 소모

[인연 랭크]
- 본체 인연 랭크: 1~100 (스탯 기여는 1~50)
- 이격별 인연 랭크: 각 이격 1~100 (이격이 있는 학생에 한해)
  ※ 이격은 본체와 별개 캐릭터 취급 → 동시 편성 가능, 출전 횟수 미공유

[조력자 플래그]
- isSupport: true/false
  ※ 도전당 1회만 사용 가능, 내 학생 출전과 별개
  ※ 같은 학생을 내 학생으로 + 조력자로 각각 1회 사용 가능

[조력자 전용 스탯 (isSupport=true 시)]
- 공개 확인 가능: 공격력, 방어력, 최대체력, 레벨, 성급, 스킬 레벨, 장비 티어
- 필수 입력 (비워둘 수 없음): 레벨, 성급, 스킬 레벨 4종, 공격력
  ※ 다섯 항목 조합으로 방어력/체력 역산 가능, 하나라도 누락 시 유추 불가
- 선택 입력: 방어력, 최대체력, 장비 티어
- 입력 방식:
  A) 공격력 기반 유추: 필수 항목 입력 → 방어력/체력 자동 추산 (isStatInferred=true)
  B) 직접 입력: 필수 항목 + 방어력/체력 수동 입력 (isStatInferred=false)
```

### 14.2 조력자 스탯 유추 기능 설계

```
기획 의도:
- 조력자는 인게임에서 공격력/방어력/체력/레벨/성급/스킬/장비티어만 확인 가능
- 대부분의 유저는 레벨 + 성급 + 공격력 + 스킬 레벨을 확인하고 기록
- 방어력/체력은 확인하기 번거로움 → 두 가지 입력 방식 제공

[필수 입력 - 항상 비워둘 수 없음]
- 레벨 (공격력 역산의 기준값 중 하나)
- 성급 (공격력 역산의 기준값 중 하나)
- 스킬 레벨 4종 (공격력 역산의 기준값 중 하나)
- 공격력 (실제 인게임 확인 수치)
  ※ 레벨 + 성급 + 스킬 레벨 + 공격력을 조합해야 정확한 역산이 가능
  ※ 네 항목 중 하나라도 없으면 나머지 스탯 유추 불가

[선택 입력 - 비워도 됨]
- 장비 티어 (확인 가능하지만 생략 허용)

방식 A — 공격력 기반 유추 (추천):
  1. 레벨 + 성급 + 스킬 레벨 + 공격력 입력 (전부 필수)
  2. SchaleDB 스탯 테이블 기반으로 방어력/체력 자동 추산
  3. isStatInferred=true 저장, UI에 "추산값" 뱃지 표시
  ※ 공격력을 직접 확인했으므로 공격력은 실측값, 나머지만 추산

방식 B — 직접 입력:
  1. 레벨 + 성급 + 스킬 레벨 + 공격력 입력 (전부 필수)
  2. 방어력/체력을 인게임에서 직접 확인 후 수동 입력
  3. isStatInferred=false, 모든 값이 실측값

UI 흐름:
[조력자 체크박스 ON]
  ┌─────────────────────────────────────────┐
  │ 레벨 [___]  성급 [★★★★★]              │  ← 필수
  │ 스킬 EX[_] 노말[_] 패시브[_] 강화[_]  │  ← 필수
  │ 공격력 [_______]                        │  ← 필수
  │ 장비 슬롯 1 [___] 슬롯 2 [___] 슬롯 3 [___] │ ← 선택
  ├─────────────────────────────────────────┤
  │ ◉ 공격력으로 방어력/체력 자동 유추      │
  │ ○ 방어력/체력 직접 입력                 │
  └─────────────────────────────────────────┘
```

### 14.3 성급 UI 설계 메모

```
성급 입력 흐름:
1. 1성 ~ 5성 선택 (기본 별 아이콘 5개)
2. 5성 달성 시 → "전무 해금" 토글 활성화
3. 전무 해금 시 전무1성 ~ 전무4성 추가 선택

표시 예시:
- "5성 / 전무 없음"  → ★★★★★
- "5성 / 전무 2성"  → ★★★★★ UE②
- "3성"            → ★★★

DB 저장:
- starLevel: 1~5 (일반 성급)
- uniqueStarLevel: null | 1~4 (전무 성급)
```

### 14.4 장비 슬롯 UI 설계 메모

```
3슬롯 × (종류 선택 + 티어 선택):

슬롯 1: [모자▼] [T7▼]  또는  [미착용]
슬롯 2: [헤어핀▼] [T8▼]  또는  [미착용]
슬롯 3: [목걸이▼] [T10▼]  또는  [미착용]

주의사항:
- 티어 상한이 업데이트로 변경될 수 있으므로 DB에 하드코딩 대신
  마스터 데이터에 current_max_gear_tier: Int 변수로 관리
- 슬롯별 허용 장비 종류는 고정 (슬롯1=HEAD계열, 슬롯2=ACC계열, 슬롯3=SPEC계열)
```

### 14.5 이격(Alternate Form) 관리 방식

```
이격 정의:
- 동일 인물의 다른 버전 (예: 미카 / 미카(수영복))
- 인게임에서 별개 학생 취급 → 출전 횟수 미공유
- 같은 파티에 이격 동시 편성 가능

Student 마스터 데이터:
- baseStudentId: String? (이격의 경우 원본 학생 ID 참조)
- isAlternate: Boolean

PartyMember.elephBondLevels:
- { "student_id": bond_level } JSON
- 예: { "mika_swimsuit": 40, "mika_xmas": 25 }
- UI: 학생 선택 시 이격 목록 자동 렌더링

편성 중복 허용 로직 (프론트엔드 검증):
- isSupport=false: 같은 도전 내 동일 studentId 1회만 허용
- 단, baseStudentId가 같더라도 studentId가 다르면 별개 취급
- 조력자(isSupport=true): 별도 카운트, 도전당 1회만 허용
```

### 12.1 저작권 이슈

```
리스크: 학생 이미지, 보스 이미지 사용 시 Nexon 저작권
대응:
- 아이콘/썸네일만 사용 (상업적 목적 없음)
- 공식 위키 / schale.gg 등에서 참조하는 방식
- 필요 시 아이콘 직접 크롭 후 CDN 업로드
- Nexon의 팬사이트 정책 사전 확인 권장
```

### 12.2 데이터 정확성

```
리스크: 시즌 정보, 보스 정보가 틀릴 경우 집계 오염
대응:
- 시즌 데이터는 관리자만 수정 가능
- 기록 입력 시 날짜 기반 자동 시즌 매핑
- 이상 데이터 신고 기능 추가 (Phase 후반)
```

### 12.3 스팸 / 어뷰징

```
리스크: 허위 점수 기록으로 메타 통계 오염
대응:
- 점수 범위 서버사이드 validation (보스/난이도별 최대점 기준)
- 좋아요 어뷰징: 계정당 1회 제한 (DB 유니크 제약)
- 신고 시스템 (Phase 후반)
```

### 12.4 모바일 UX

```
리스크: 파티 빌더가 모바일에서 사용 불편
대응:
- 모바일에서는 슬롯 탭 방식으로 변환
- 드래그앤드롭 대신 탭-to-select 방식 지원
```

-----

## Appendix. 폴더 구조

```
ba-raid-tracker/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 레이아웃
│   ├── (main)/                   # 메인 레이아웃
│   │   ├── page.tsx              # 메인
│   │   ├── meta/[bossSlug]/      # 보스 메타
│   │   ├── parties/              # 편성 피드
│   │   ├── tactics/              # 택틱 피드
│   │   ├── dashboard/            # 내 대시보드
│   │   └── profile/[userId]/     # 유저 프로필
│   └── api/                      # API Routes
│       ├── auth/[...nextauth]/
│       ├── records/
│       ├── parties/
│       ├── tactics/
│       ├── meta/
│       ├── master/
│       └── users/
├── components/
│   ├── ui/                       # shadcn/ui 기본 컴포넌트
│   ├── party/                    # 파티 빌더 관련
│   ├── record/                   # 기록 관련
│   ├── meta/                     # 메타 통계 관련
│   └── tactic/                   # 택틱 관련
├── lib/
│   ├── prisma.ts                 # Prisma 클라이언트
│   ├── redis.ts                  # Upstash 클라이언트
│   ├── auth.ts                   # NextAuth 설정
│   └── validations/              # Zod 스키마
├── data/
│   └── seed/                     # 마스터 데이터 seed 파일
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
└── types/                        # 공유 TypeScript 타입
```

-----

*문서 끝 — 다음 단계: Phase 1 개발 시작*
