# 블루아카이브 레이드 트래커 — 통합 기획서 v5.0

> 작성일: 2026-03-03
> 원본: v4.0 (v3.0 + v1.3 통합) → v5.0 보완
> 성격: 개인 기록 중심 → 공개 서비스 확장 가능한 웹 어플리케이션

---

## 변경 이력

| 버전     | 주요 변경                                                       |
| -------- | --------------------------------------------------------------- |
| v1.3     | 풀 스펙 기획 (공개 서비스 중심, 14섹션)                         |
| v3.0     | 코어 아키텍처 재설계 (Roster, 스냅샷, 장비고정, 타임라인, 손패) |
| v4.0     | v1.3 + v3.0 통합 (양쪽 장점 결합, AlternateForm 1:N 수정)       |
| **v5.0** | **아래 5개 항목 보완**                                          |

**v5.0 변경 요약**

1. **Tier enum 복구**: 인게임에 등수 구간별 PLATINUM/GOLD/SILVER/BRONZE 티어가 존재함을 확인. v4.0의 `Tier` enum을 복구하고 서버별(Global/JP) 등수 구간 기준을 명시. 등수→티어 자동 변환은 앱 로직에서 Region 기반으로 처리.
2. **조력자 스탯 유추 알고리즘 구체화**: SchaleDB 스탯 테이블 기반 역산 로직의 구체적 설계를 `§4.4`에 추가.
3. **점수 범위 서버사이드 검증**: 보스/난이도별 HP 기반 최대 점수 제한 로직을 `§4.7`로 신설.
4. **마스터 데이터 Seed 전략 구체화**: SchaleDB JSON 파싱 → Prisma seed 투입 파이프라인을 `§9`에 상세 기술.
5. **v4.0의 원본 비교 분석 섹션(0절) 제거** → 변경 이력으로 대체.

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [핵심 기능 명세](#4-핵심-기능-명세)
5. [데이터베이스 스키마](#5-데이터베이스-스키마)
6. [API 엔드포인트](#6-api-엔드포인트)
7. [페이지 구조 & UI/UX](#7-페이지-구조--uiux)
8. [인증 & 권한](#8-인증--권한)
9. [마스터 데이터 Seed 전략](#9-마스터-데이터-seed-전략)
10. [개발 Phase 계획](#10-개발-phase-계획)
11. [배포 & 인프라](#11-배포--인프라)
12. [고려사항 & 리스크](#12-고려사항--리스크)
13. [경쟁 사이트 분석 & 차별화](#13-경쟁-사이트-분석--차별화)
14. [학생 스펙 저장 항목 상세](#14-학생-스펙-저장-항목-상세)

---

## 1. 프로젝트 개요

### 1.1 서비스 한 줄 설명

블루아카이브 총력전 · 대결전의 **개인 클리어 기록, 학생 명부, 파티 편성, 구조화된 택틱 노트**를 한 곳에서 관리하고, 장기적으로 메타 통계와 커뮤니티 공유로 확장하는 웹 서비스.

### 1.2 핵심 가치 제안

| Pain Point                      | 해결책                                | 핵심 메커니즘                              |
| ------------------------------- | ------------------------------------- | ------------------------------------------ |
| 매 시즌 점수·편성을 기억 못 함  | 시즌별 기록 아카이빙                  | 스냅샷 저장으로 과거 스펙 원형 보존        |
| 매번 학생 스펙을 처음부터 입력  | 학생 명부(Roster)에서 원클릭 불러오기 | UserStudent → PartyMember 스냅샷 복사      |
| 클리어 영상 나중에 못 찾음      | 택틱 노트에 영상 URL + 타임라인 연동  | 하이브리드 타임라인 (Time/Cost JSON)       |
| 손패·스킬 순서를 기록 못 함     | 손패 고정 + 구조화된 타임라인         | Party.startingSkills + Tactic.timeline     |
| 장비 종류를 매번 선택해야 함    | 학생별 장비 슬롯 종류 마스터 고정     | Student.gear1Type → PartyMember에는 티어만 |
| 메타를 커뮤니티에서 일일이 찾음 | 집계 기반 자동 메타 분석 (Phase 5)    | Redis 캐싱 + Cron 집계                     |
| 내 성장 추이를 모름             | 시즌별 점수/등수 차트                 | 내 대시보드 통계                           |

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

| 규칙          | 상세                                                |
| ------------- | --------------------------------------------------- |
| 파티 수       | 한 도전 내 제한 없음                                |
| 학생 재출전   | 동일 도전 내 불가                                   |
| 이격 독립성   | 이격끼리 출전 횟수 공유 안 함                       |
| 조력자        | 도전당 1회 사용, 내 학생과 별개 계산                |
| 조력자 + 본인 | 같은 학생을 내 학생 + 조력자로 각각 1회씩 사용 가능 |

**랭킹 & 보상 체계**

시즌 종료 시 **최종 등수(Rank)**에 따라 **티어(Tier)**가 결정되고, 티어별로 보상이 지급된다.
서버별(Global/JP) 등수 구간이 다르므로 주의.

| 티어     | Global(KR) 등수 범위 | JP 등수 범위      |
| -------- | -------------------- | ----------------- |
| PLATINUM | 1 ~ 12,000           | 1 ~ 20,000        |
| GOLD     | 12,001 ~ 55,000      | 20,001 ~ 120,000  |
| SILVER   | 55,001 ~ 100,000     | 120,001 ~ 240,000 |
| BRONZE   | 100,001 ~            | 240,001 ~         |

> DB에는 `rank Int?` (최종 등수)와 `tier Tier?` (결과 티어)를 저장한다.
> 등수→티어 자동 변환은 앱 로직에서 Region(GLOBAL/JP) 기반으로 처리한다.

---

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

### 2.2 SchaleDB 에셋 연동 전략

SchaleDB GitHub 리포가 2025년 6월에 아카이브되었으나 schaledb.com 웹사이트는 운영 중. 에셋 전략:

1. **1차**: SchaleDB CDN URL 직접 참조 (비용 제로, 의존성 리스크 있음)
2. **폴백**: 주요 에셋(학생 아이콘, 보스 아이콘)을 Supabase Storage에 미러링
3. **헬스체크**: 앱 빌드 시 SchaleDB 에셋 URL 접근 가능 여부 확인 스크립트 포함

### 2.3 스택 선택 근거

| 선택               | 이유                                                   |
| ------------------ | ------------------------------------------------------ |
| Next.js App Router | SSR로 메타 페이지 SEO 확보, API Routes로 모노레포 유지 |
| Supabase           | PostgreSQL + Storage + 무료 티어, 빠른 초기 셋업       |
| Prisma             | 타입 안전 쿼리, 마이그레이션 관리 용이                 |
| Upstash Redis      | Serverless 환경 친화적, 통계 집계 캐싱 + Rate Limiting |
| shadcn/ui          | 커스터마이즈 용이, 접근성 고려된 컴포넌트              |
| Discord OAuth      | 블루아카이브 유저 특성상 Discord 계정 보유율 높음      |
| SchaleDB CDN       | 이미지 호스팅 비용 제로화 (폴백: Supabase Storage)     |

---

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

| 페이지                | 전략        | 이유                             |
| --------------------- | ----------- | -------------------------------- |
| 메인 대시보드         | ISR (1시간) | 시즌 정보, 자주 바뀌지 않음      |
| 보스별 메타 페이지    | ISR (1시간) | SEO + 통계 캐싱 (Phase 5)        |
| 편성 상세 페이지      | SSR         | 개인 데이터 포함 가능            |
| 파티 빌더 / 기록 작성 | CSR         | 인터랙션 많음, Zustand 상태 관리 |
| 학생 명부(Roster)     | CSR         | 인증 필요, 개인화                |
| 내 대시보드           | CSR         | 인증 필요, 개인화                |

---

## 4. 핵심 기능 명세

### 4.1 학생 명부(Roster) 및 스냅샷 아키텍처

- **명부 시스템**: 유저가 자신의 보유 학생 스펙을 미리 저장해두는 마스터 테이블(`UserStudent`).
- **불러오기 및 스냅샷 저장**: 기록 작성 시 명부에서 스펙을 불러오며, 기록 화면에서 자유롭게 수정 가능. 저장 시 DB에는 외래키 참조가 아닌 **독립된 파티 멤버 데이터(Snapshot)**로 복사.
- **양방향 동기화**: 기록 저장 시 "수정된 스펙을 내 학생 명부에 동기화하기" 체크박스 제공.
- **장비 슬롯 고정**: 학생별 착용 가능한 장비 종류(모자, 헤어핀 등)는 마스터 데이터(`Student.gear1Type/gear2Type/gear3Type`)에 고정하고, 유저 기록에는 **티어(Tier) 숫자만** 저장.

### 4.2 레이드 기록 트래킹

#### 기록 입력 항목

```
공통:
- 보스명 (마스터 데이터 select)
- 시즌 (날짜 기반 자동 감지 또는 직접 선택)
- 최종 점수
- 최종 등수 (선택, 시즌 종료 후 업데이트 가능)
- 티어 (플래티넘/골드/실버/브론즈, 시즌 종료 후. 등수 입력 시 서버 기준으로 자동 계산)
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
- 등수 추이 차트

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

※ 파티 수 제한 없음 — "+ 파티 추가" 버튼으로 동적 추가
※ 대결전의 경우 방어타입 탭(3개)별로 별도 파티 세트를 관리

#### 학생 슬롯 입력 흐름 (Roster 연동 시)

1. "명부에서 불러오기" → 학생 선택 → 명부 스펙 자동 채움
2. 기록 화면에서 스펙 자유 수정 가능
3. 저장 시 스냅샷으로 독립 복사 (외래키 참조 아님)
4. "명부에 동기화" 체크 시 → UserStudent에도 수정된 스펙 반영

### 4.4 조력자 스탯 '가설 추산(Best Guess)' 및 수동 입력 (v5.0 구체화)

#### 기본 개념

- 조력자는 필수 스탯(레벨, 성급, 스킬 4종, 공격력)을 무조건 기입
- 능력개방과 인연 랭크 변수로 인해 공격력만으로 방어력/체력 완벽 역산 불가
- SchaleDB 데이터 기반 방어력/체력 추산 (isStatInferred=true)
- 유저가 실측값을 덮어쓸 수 있도록 지원 (isStatInferred=false)

#### 역산 알고리즘 상세 (v5.0 신규)

```
학생 스탯 구성:
  최종 스탯 = 기본 스탯(레벨) + 성급 보너스 + 인연 보너스 + 능력개방 보너스 + 장비 보너스

역산이 불완전한 이유:
  - 공격력으로부터 역산할 때, 인연 랭크(1~50 기여)와 능력개방(0~25)의
    정확한 값을 알 수 없어 방어력/체력에 동일한 인연·능력개방 값을 적용할 수 없음
  - 즉, 공격력 역산은 "기본+성급+장비" 이외의 변수가 복수 존재

추산 로직 (Best Guess):
  1. SchaleDB에서 해당 학생의 레벨별 기본 스탯 테이블을 로드
     - base_atk(level), base_def(level), base_hp(level)
  2. 성급 보너스 계산: SchaleDB의 성급별 스탯 보정 테이블 적용
     - star_bonus_atk(starLevel), star_bonus_def(starLevel), star_bonus_hp(starLevel)
  3. 입력된 공격력에서 잔여분 계산:
     - residual_atk = 입력공격력 - base_atk(level) - star_bonus_atk(starLevel) - gear_atk_estimate
  4. 잔여분에는 인연 보너스 + 능력개방 보너스가 혼합되어 있으므로,
     공격력 잔여 비율을 방어력/체력에도 동일 비율로 적용 (비례 추산):
     - ratio = residual_atk / (max_possible_atk_bonus)
     - estimated_def = base_def(level) + star_bonus_def + ratio * max_possible_def_bonus
     - estimated_hp  = base_hp(level)  + star_bonus_hp  + ratio * max_possible_hp_bonus
  5. 결과에 isStatInferred=true 플래그 설정

  ※ max_possible_xxx_bonus = 인연50 기준 보너스 + 능력개방25 보너스
  ※ 장비 보너스는 장비 티어가 입력된 경우에만 반영, 미입력 시 0 처리
  ※ 이 추산은 "가장 확률이 높은 근사값"이며, 정확한 값은 아님

  정확도 추정:
  - 인연 랭크 1~50 중 대부분의 유저는 20~50 구간에 위치
  - 능력개방은 0 또는 25(최대) 양극단이 많음
  - 비례 추산의 오차는 대체로 5~15% 이내로 예상
```

#### UI 흐름

```
[조력자 체크박스 ON]
  ┌─────────────────────────────────────────┐
  │ 레벨 [___]  성급 [★★★★★]              │  ← 필수
  │ 스킬 EX[_] 노말[_] 패시브[_] 강화[_]  │  ← 필수
  │ 공격력 [_______]                        │  ← 필수
  │ 장비 슬롯 1 [T__] 슬롯 2 [T__] 슬롯 3 [T__] │ ← 선택 (티어만)
  ├─────────────────────────────────────────┤
  │ ◉ 공격력으로 방어력/체력 자동 유추      │  → isStatInferred=true
  │   방어력: 3,245 (추산) 체력: 18,720 (추산)
  │ ○ 방어력/체력 직접 입력                 │  → isStatInferred=false
  │   방어력: [_______] 체력: [_______]
  └─────────────────────────────────────────┘
```

### 4.5 구조화된 하이브리드 타임라인 택틱

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

### 4.7 점수 범위 서버사이드 검증 (v5.0 신규)

메타 통계의 데이터 품질을 보장하기 위해, 기록 생성/수정 API에서 점수 범위를 검증한다.

```
검증 로직:

1. 최소 점수: 0 이상 (음수 불가)

2. 최대 점수 (난이도별 상한):
   - 각 난이도의 보스 HP × 상수 계수로 이론적 최대 점수 산출
   - 보스별 HP 데이터는 SchaleDB 기반 마스터 데이터에 저장
   - finalScore <= theoretical_max_score * 1.1 (10% 여유)
   ※ 정확한 점수 공식이 공개되지 않으므로 보수적 상한을 적용

3. 대결전 합산 검증:
   - GrandAssaultRecord.finalScore == sum(각 attempt.score)
   - 서버에서 합산 재계산 후 불일치 시 에러 반환

4. 난이도 정합성:
   - 총력전: 선택한 난이도가 해당 보스 시즌의 maxDifficulty 이하인지 확인
   - 대결전: 각 attempt.difficulty가 armorSlot.difficultyMax 이하인지 확인

5. 이상 데이터 플래그:
   - 상위 0.1% 점수 이상인 경우 isFlagged=true 자동 설정
   - 메타 통계 집계 시 flagged 데이터 별도 처리 가능

구현:
- Zod 스키마에 .refine()으로 검증 로직 포함
- 마스터 데이터 (보스 HP) 참조를 위한 서버사이드 조회 포함
```

### 4.8 메타 분석 & 통계 (Phase 5)

후순위이나 설계는 미리 확정:

- 보스별 학생 픽률 Top 20 (포지션별, 모집/조력 구분)
- 난이도대별 픽률 분포, 성급 분포
- 시즌별 메타 변화 추이 차트
- 매 1시간 Redis 캐시 갱신 (Vercel Cron Job)
- 샘플 수 < 10이면 통계 미표시 (신뢰도 확보)

---

## 5. 데이터베이스 스키마 (Prisma — v5.0)

_v4.0 대비 변경: `Tier` enum 제거, `tier` 필드 → `rankBracket` 필드, 점수 검증 관련 보스 HP 필드 추가_

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
  nameEn           String
  school           String
  role             Role
  studentClass     StudentClass
  attackType       AttackType
  armorType        ArmorType
  iconUrl          String
  isLimited        Boolean         @default(false)
  releasedAt       DateTime

  // 고정 장비 슬롯 정보 (유저 테이블에는 티어만 저장)
  gear1Type        GearType
  gear2Type        GearType
  gear3Type        GearType

  // 이격 관계 (1:N) — @unique 제거로 본체 1:N 이격 지원
  baseFormLink     AlternateForm?  @relation("BaseStudent")
  alternateLinks   AlternateForm[] @relation("AlternateStudent")

  rosterMembers    UserStudent[]
  partyMembers     PartyMember[]

  @@map("students")
}

// 본체 ↔ 이격 관계 테이블 (본체 1 : 이격 N)
model AlternateForm {
  id                 String  @id @default(cuid())
  baseStudentId      String  // @unique 없음 → 본체 1:N 이격 지원
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
  nameEn              String
  terrain             Terrain
  attackType          AttackType
  armorType           ArmorType
  iconUrl             String
  isReleased          Boolean              @default(true)

  // v5.0: 난이도별 HP 데이터 (점수 범위 검증용)
  // JSON 형태: { "NORMAL": 1000000, "HARD": 5000000, ... }
  hpByDifficulty      Json?

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
  name                String?
  email               String?              @unique
  image               String?
  discordId           String?              @unique
  googleId            String?              @unique
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt

  roster              UserStudent[]
  totalAssaultRecords TotalAssaultRecord[]
  grandAssaultRecords GrandAssaultRecord[]
  parties             Party[]
  tactics             Tactic[]
  accounts            Account[]            // NextAuth 필수
  sessions            Session[]            // NextAuth 필수

  @@map("users")
}

// NextAuth 필수 테이블 (Account, Session, VerificationToken)
// → NextAuth Prisma Adapter가 자동 생성하는 표준 스키마 사용

// ── 학생 명부 (Roster) ────────────────────
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
  tier           Tier?               // 플래티넘/골드/실버/브론즈 (등수 기반 자동 계산 또는 수동)
  notes          String?
  isFlagged      Boolean             @default(false)  // v5.0: 이상 데이터 플래그
  recordedAt     DateTime            @default(now())
  createdAt      DateTime            @default(now())
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
  tier           Tier?                 // 플래티넘/골드/실버/브론즈
  notes          String?
  isFlagged      Boolean              @default(false)  // v5.0: 이상 데이터 플래그
  recordedAt     DateTime              @default(now())
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  attempts       GrandAssaultAttempt[]
  tactics        Tactic[]

  @@index([userId, seasonId])
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
  description         String?

  startingSkills      Int[]               // 손패 고정 인덱스 배열 (예: [0, 2, 4])

  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  members             PartyMember[]
  totalAssaultParties TotalAssaultParty[]
  grandAssaultParties GrandAssaultParty[]
  tactics             Tactic[]

  @@index([userId, createdAt(sort: Desc)])
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
  gear1Tier          Int?     // 종류는 Student 마스터 참조, 여기는 티어만
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
  @@index([studentId])
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
  failureTags          String[]            // 실패 원인 태그

  // 하이브리드 타임라인
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
2. **이격: AlternateForm 별도 테이블, `baseStudentId` @unique 제거** → 본체 1:N 이격 지원
3. **장비 종류는 마스터에 고정, 유저 데이터에는 티어만** → 입력 필드 절감, 데이터 정합성
4. **스냅샷 저장**: PartyMember는 UserStudent의 복사본으로 독립 저장 (외래키 참조 아님)
5. **Region: GLOBAL / JP** (KR = GLOBAL 통일)
6. **Tier enum**: PLATINUM/GOLD/SILVER/BRONZE 4종. 서버별 등수 구간이 다르므로 (Global: 12,000/55,000/100,000 경계, JP: 20,000/120,000/240,000 경계) 등수→티어 변환은 앱 로직에서 Region 기반으로 처리
7. **v5.0: Boss.hpByDifficulty 추가** → 점수 범위 검증용 난이도별 HP 데이터
8. **v5.0: isFlagged 필드 추가** → 이상 데이터 자동 플래그, 메타 통계 품질 관리
9. **커뮤니티 테이블 (Like, Bookmark) 보류** → Phase 6 이후

---

## 6. API 엔드포인트

```
[인증]
POST   /api/auth/[...nextauth]

[학생 명부 (Roster)]
GET    /api/roster                  # 내 명부 목록
POST   /api/roster                  # 명부에 학생 추가/수정
DELETE /api/roster/:studentId       # 명부에서 학생 제거
POST   /api/roster/sync             # 파티 스냅샷 → 명부 역동기화

[레이드 기록]
GET    /api/records                  # 내 기록 목록 (페이지네이션)
POST   /api/records/total            # 총력전 기록 생성 (스냅샷 + 점수 검증)
POST   /api/records/grand            # 대결전 기록 생성 (difficultyMax + 합산 검증)
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

---

## 7. 페이지 구조 & UI/UX

### 7.1 사이트맵 (App Router)

```
/                          대시보드 (진행 중인 시즌, 최근 내 기록)
├── /roster                내 학생 명부 관리
├── /builder               파티 편성 + 기록 작성 (Roster Load, 스냅샷 저장)
├── /records               과거 기록 열람 및 필터링
├── /tactics               택틱 노트 (하이브리드 타임라인)
├── /dashboard             내 대시보드 (점수/등수 추이 차트)
├── /meta (Phase 5)        메타 허브
│   └── /meta/[bossSlug]   보스별 메타 상세
└── /settings              설정
```

### 7.2 핵심 페이지 UI 설명

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

#### 파티 빌더 (/builder)

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

#### 보스 메타 페이지 (/meta/[bossSlug]) — Phase 5

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
│  시즌별 메타 변화 차트                          │
│  [라인차트]                                     │
└─────────────────────────────────────────────────┘
```

### 7.3 디자인 가이드라인

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

---

## 8. 인증 & 권한

### 8.1 OAuth 제공자

- Discord OAuth (주) — 블루아카이브 커뮤니티 특성
- Google OAuth (부) — 접근성 확보

### 8.2 권한 매트릭스

| 기능                     | 비로그인 | 로그인 | 본인 |
| ------------------------ | :------: | :----: | :--: |
| 메타 통계 열람 (Phase 5) |    O     |   O    |  O   |
| 기록/편성/택틱 생성      |    X     |   O    |  O   |
| 기록/편성/택틱 수정/삭제 |    X     |   X    |  O   |
| 학생 명부 관리           |    X     |   O    |  O   |
| 내 대시보드              |    X     |   O    |  O   |

### 8.3 Rate Limiting

- 인증 API (기록/편성 생성): 30 req/min per user
- 마스터 데이터 API: 100 req/min per IP
- Upstash Redis sliding window 구현

---

## 9. 마스터 데이터 Seed 전략 (v5.0 구체화)

### 9.1 데이터 소스

SchaleDB는 블루아카이브의 가장 완전한 비공식 데이터베이스로, GitHub 리포(아카이브됨)와 웹사이트(운영 중) 양쪽에서 JSON 데이터를 제공한다.

```
SchaleDB 데이터 구조:
  /data/kr/students.json   — 학생 기본 정보, 스탯, 스킬
  /data/kr/raids.json      — 총력전 보스 정보, 난이도별 HP
  /data/kr/localization.json — 한국어/영어/일본어 이름
```

### 9.2 Seed 파이프라인

```
Phase 1에서 구현할 Seed 스크립트:

data/
├── scripts/
│   ├── fetch-schaledb.ts       # SchaleDB JSON 다운로드
│   ├── parse-students.ts       # 학생 데이터 파싱 → Prisma 형식 변환
│   ├── parse-bosses.ts         # 보스 데이터 파싱 → Prisma 형식 변환
│   ├── parse-seasons.ts        # 시즌 데이터 파싱 (날짜, 보스, 지형)
│   └── parse-alternate-forms.ts # 이격 관계 파싱
├── cache/
│   ├── students.json           # 다운로드된 원본 캐시
│   └── raids.json
└── seed/
    └── index.ts                # prisma db seed 진입점

실행 흐름:
1. pnpm seed:fetch
   → SchaleDB에서 students.json, raids.json 다운로드
   → data/cache/에 저장

2. pnpm seed:parse
   → parse-students.ts: SchaleDB → Prisma Student 형식 변환
     - id: PathName을 소문자 snake_case로 변환
     - nameKo/nameEn: localization에서 추출
     - role: STRIKER/SPECIAL 매핑
     - studentClass: DEALER/TANK/HEALER/SUPPORTER/TACTICAL_SUPPORT 매핑
     - attackType: BulletType → EXPLOSIVE/PIERCING/MYSTIC/SONIC 매핑
     - armorType: ArmorType → LIGHT/HEAVY/SPECIAL/ELASTIC/COMPOSITE 매핑
     - gear1Type/gear2Type/gear3Type: Equipment 슬롯 종류 매핑
     - isLimited: Tags 필드에서 추출
     - releasedAt: 출시일 매핑
   → parse-bosses.ts: SchaleDB Raid → Prisma Boss 형식 변환
     - id: PathName_Terrain 소문자 (예: binah_outdoor)
     - terrain: Terrain 매핑
     - hpByDifficulty: EnemyList의 HP 데이터 집계
   → parse-alternate-forms.ts: 이격 관계 추출
     - SchaleDB의 FamilyGroup 필드로 본체-이격 관계 파악

3. pnpm db:seed (= prisma db seed)
   → data/seed/index.ts 실행
   → upsert로 기존 데이터 보존하면서 신규/변경 데이터 반영
```

### 9.3 데이터 갱신 주기

```
- 신규 학생 추가: 게임 업데이트마다 (약 2주마다)
- 신규 시즌 추가: 시즌 시작 시 (약 2주마다)
- 갱신 방법: pnpm seed:fetch && pnpm seed:parse && pnpm db:seed
- 자동화 (Phase 6 이후): GitHub Actions cron으로 SchaleDB 변경 감지 → 자동 seed
```

### 9.4 초기 데이터 규모 추정

```
- 학생: ~250명 (이격 포함)
- 보스: ~15종 × 지형 2~3 = ~35 레코드
- 시즌 (총력전): Global ~80, JP ~86 = ~166 레코드
- 시즌 (대결전): 각 ~30 = ~60 레코드
- 이격 관계: ~50 레코드
```

---

## 10. 개발 Phase 계획

### Phase 1 — 기반 인프라 & 마스터 데이터 (2~3주)

- 프로젝트 초기 세팅 (Next.js + TypeScript + Tailwind + shadcn/ui)
- Supabase 연결 + Prisma v5.0 스키마 마이그레이션
- NextAuth.js Discord/Google OAuth 구현
- **SchaleDB Seed 파이프라인 구축** (fetch → parse → seed, §9 참조)
- 마스터 데이터 Seed 투입 (학생/보스/시즌, gearType, hpByDifficulty 포함)
- 기본 레이아웃 (헤더, 사이드바, 반응형)

### Phase 2 — Roster(학생 명부) 시스템 (2주)

- UserStudent 기반 보유 학생 스펙 등록/수정/삭제 UI
- 학생 검색 + 필터 컴포넌트
- 장비 슬롯은 종류 자동 표시 (마스터 참조), 티어만 입력

### Phase 3 — 파티 빌더 & 스냅샷 기록 (3주) — 프로젝트 핵심

- 명부에서 스펙 불러오기 → 기록 화면에서 수정 → 스냅샷 독립 저장
- 양방향 동기화 체크박스
- 손패 고정(startingSkills) UI
- 조력자 처리 (isStatInferred, Best Guess 추산, §4.4 역산 알고리즘 구현)
- **대결전 서버사이드 difficultyMax 검증** (Zod)
- **점수 범위 서버사이드 검증** (§4.7, hpByDifficulty 참조)
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
- isFlagged 데이터 별도 처리 로직

### Phase 6 — 완성도 & 배포 (1주)

- 모바일 반응형 QA
- 다크모드 완성
- 에러 처리 / 로딩 스켈레톤
- SEO 메타태그
- Sentry 에러 모니터링
- 프로덕션 배포

**총 예상 기간: 12~14주 (1인 개발 기준)**

---

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

| 서비스        | 플랜         | 월 비용   |
| ------------- | ------------ | --------- |
| Vercel        | Hobby (무료) | $0        |
| Supabase      | Free tier    | $0        |
| Upstash Redis | Free tier    | $0        |
| Sentry        | Free tier    | $0        |
| **합계**      |              | **$0/월** |

> 트래픽 증가 시 Supabase Pro ($25/월), Vercel Pro ($20/월) 고려

---

## 12. 고려사항 & 리스크

### 12.1 저작권

- 학생/보스 이미지는 아이콘/썸네일만 사용 (비상업 목적)
- SchaleDB 에셋 참조 또는 자체 CDN 미러링
- Nexon 팬사이트 정책 사전 확인 권장

### 12.2 SchaleDB 의존성

- GitHub 리포가 2025년 6월 아카이브됨 → 웹사이트 운영 지속 여부 모니터링
- 폴백: 주요 에셋 Supabase Storage 미러링 (Free 1GB 한도 내)
- **v5.0 추가**: Seed 스크립트에 SchaleDB 접근 불가 시 캐시 데이터 사용 폴백 포함

### 12.3 데이터 정확성

- 시즌 데이터는 관리자만 수정 가능
- 기록 입력 시 날짜 기반 자동 시즌 매핑
- **v5.0 추가**: 점수 범위 서버사이드 검증 (§4.7)으로 이상 데이터 차단
- **v5.0 추가**: isFlagged 자동 플래그로 메타 통계 오염 방지

### 12.4 모바일 UX

- 파티 빌더는 모바일에서 슬롯 탭 방식으로 전환
- 드래그앤드롭 대신 탭-to-select 방식 지원

---

## 13. 경쟁 사이트 분석 & 차별화

### 13.1 경쟁 대비 차별화 포인트

| 기능                    | mollulog | BA Torment | **본 서비스** |
| ----------------------- | :------: | :--------: | :-----------: |
| 공개 메타 통계          |    O     |     O      |  O (Phase 5)  |
| **학생 명부(Roster)**   |    X     |     X      | **O (핵심)**  |
| **스냅샷 기록 보존**    |    X     |     X      | **O (핵심)**  |
| **파티 빌더**           |    X     |     X      | **O (핵심)**  |
| **하이브리드 타임라인** |    X     |     X      | **O (핵심)**  |
| **손패 고정**           |    X     |     X      | **O (핵심)**  |
| 영상 + 파티 매핑        |    X     |     O      |       O       |
| 택틱 노트               |    X     |     X      |       O       |
| 점수 계산기             |    O     |     O      |     예정      |

### 13.2 차용 기능 (우선순위별)

| 출처       | 기능                            | 우선순위 |
| ---------- | ------------------------------- | :------: |
| mollulog   | 편성 횟수 & 모집/조력 구분 통계 |   높음   |
| mollulog   | 시즌 일정 D-day 뱃지            |   높음   |
| SchaleDB   | 마스터 데이터 소스 + 에셋 CDN   |   높음   |
| BA Torment | 영상 + 파티 매핑                |   높음   |
| mollulog   | 성급 분포 통계                  |   중간   |
| SchaleDB   | 스킬 요약 툴팁                  |   중간   |

---

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

---

## Appendix A. 폴더 구조

```
ba-raid-tracker/
├── app/
│   ├── (auth)/
│   ├── (main)/
│   │   ├── page.tsx              # 대시보드
│   │   ├── roster/               # 학생 명부
│   │   ├── builder/              # 파티 빌더 + 기록 작성
│   │   ├── records/              # 기록 열람
│   │   ├── tactics/              # 택틱 노트
│   │   ├── dashboard/            # 내 대시보드
│   │   └── meta/[bossSlug]/      # 보스 메타 (Phase 5)
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── roster/
│       ├── records/
│       ├── parties/
│       ├── tactics/
│       ├── meta/
│       ├── master/
│       └── users/
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── roster/                   # 명부 관련
│   ├── party/                    # 파티 빌더
│   ├── record/                   # 기록 관련
│   ├── meta/                     # 메타 통계
│   └── tactic/                   # 택틱 관련
├── lib/
│   ├── prisma.ts
│   ├── redis.ts
│   ├── auth.ts
│   ├── stat-calculator.ts        # v5.0: 조력자 스탯 유추 알고리즘
│   ├── score-validator.ts        # v5.0: 점수 범위 검증 로직
│   ├── tier-calculator.ts        # v5.0: 등수 + Region → Tier 자동 변환
│   └── validations/              # Zod 스키마 (프론트/백 공유)
├── data/
│   ├── scripts/                  # v5.0: SchaleDB 파싱 스크립트
│   │   ├── fetch-schaledb.ts
│   │   ├── parse-students.ts
│   │   ├── parse-bosses.ts
│   │   ├── parse-seasons.ts
│   │   └── parse-alternate-forms.ts
│   ├── cache/                    # 다운로드된 원본 캐시
│   └── seed/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
└── types/
```

---

_문서 끝 — 다음 단계: Phase 1 개발 시작_
