# 개발 로그

---

## 2026-03-04 16:54 (KST) — DEVLOG 로그 순서 규칙 추가 및 정렬

**완료한 작업:**

- [x] `AI_RULES.md` 섹션 6에 로그 순서 규칙 추가: 내림차순(최신 항목이 파일 상단), 새 로그는 헤더 바로 아래 삽입
- [x] `AI_RULES.md` 섹션 6에 서브섹션(`###`) 사용 규칙 추가: 동일 세션 연속 작업은 서브섹션, 별개 목적은 독립 `##` 항목으로 분리
- [x] `DEVLOG.md` 전체 로그를 내림차순으로 재정렬
- [x] 타임스탬프 없던 "Phase 1 기반 인프라" 항목에 커밋 `b93671d` 기준 시각(`13:32`) 부여
- [x] 브랜치 `docs/todo-management-rules`에 커밋 및 푸시 (PR #9에 자동 포함)

**사용자 직접 액션 필요:**

- [ ] [사용자] PR #9 검토 및 머지

**다음 AI 세션 할 일:**

- [ ] 사용자가 Supabase/OAuth 설정 완료 후 `pnpm prisma migrate dev` + `pnpm dev` 동작 확인 지원
- [ ] Phase 2 (학생 명부 시스템) 작업 시작

**주목할 점:**

- 기존 PR #9가 열려 있어 같은 브랜치에 추가 커밋함. 별도 PR 불필요.
- 서브섹션 규칙에 따라 13:50 항목의 13:59 Push & PR 내용은 서브섹션으로 유지 (동일 세션 연속 작업).

---

## 2026-03-04 16:42 (KST) — Git 반영 절차 규칙 추가 및 PR 생성

**완료한 작업:**

- [x] `AI_RULES.md` 섹션 4.1 신규 추가: 작업 완료 후 Git 반영 절차 명시 (브랜치 생성 → 커밋 → 푸시 → PR 생성 → DEVLOG 기록)
- [x] 브랜치 `docs/todo-management-rules` 생성 및 이번 세션 변경 파일(AI_RULES.md, DEVLOG.md, TODO.md) 커밋
- [x] 원격 푸시 및 PR #9 생성: https://github.com/LJLee37/Bluearchive-raid-record/pull/9

**사용자 직접 액션 필요:**

- [ ] [사용자] PR #9 검토 및 머지

**다음 AI 세션 할 일:**

- [ ] 사용자가 Supabase/OAuth 설정 완료 후 `pnpm prisma migrate dev` + `pnpm dev` 동작 확인 지원
- [ ] Phase 2 (학생 명부 시스템) 작업 시작

**주목할 점:**

- `AI_RULES.md`에 커밋/푸시/PR 규칙이 없어 이번 세션에서 Git 반영이 누락되었다. 섹션 4.1 추가로 해결.
- 이후 모든 세션은 작업 완료 후 반드시 브랜치 → 커밋 → 푸시 → PR 순서를 따라야 한다.

---

## 2026-03-04 16:39 (KST) — TODO.md 관리 규칙 개선 및 현황 동기화

**완료한 작업:**

- [x] `AI_RULES.md` 섹션 6 `TODO.md 동기화` 규칙 개정
  - 완료 항목 처리 방식 변경: `[x]` 체크 유지 → **TODO.md에서 완전 삭제** (이력은 DEVLOG.md에만 보존)
  - `TODO.md 구조 규칙` 신규 추가: 긴급/향후계획/선택사항 3단계 구조 명시
  - 담당자 태그 규칙 추가: `[사용자]` / `[AI]` 구분 표기 의무화
  - 항목 순서 규칙 추가: 같은 섹션 내 `[사용자]` 항목을 `[AI]` 항목보다 항상 위에 배치
- [x] `TODO.md` 현황 동기화 및 재구성
  - 완료된 항목 삭제: GitHub 관리 섹션 전체 (PR #7, PR #8 모두 머지 완료)
  - 모든 항목에 `[사용자]` / `[AI]` 담당자 태그 추가
  - 현재 모든 긴급 항목이 `[사용자]` 담당임을 명확히 표시

**사용자 직접 액션 필요:**

- 없음 (이번 세션은 문서 수정만 포함)

**다음 AI 세션 할 일:**

- [ ] 사용자가 Supabase/OAuth 설정 완료 후 `pnpm prisma migrate dev` + `pnpm dev` 동작 확인 지원
- [ ] Phase 2 (학생 명부 시스템) 작업 시작 시 plan.md 검토 후 TODO.md에 세부 항목 추가

**주목할 점:**

- 이제 TODO.md에는 `[x]` 항목이 존재하지 않는다. 완료 이력은 DEVLOG.md에서만 확인 가능.
- `[사용자]` 태그 항목은 AI가 직접 실행할 수 없는 외부 서비스 작업임.

---

## 2026-03-04 16:09 (KST) — AI 작업 로그 포맷 개선

**완료한 작업:**

- [x] `AI_RULES.md` 섹션 6 (Work Logging) 전면 개정
  - 로그 포함 항목을 기존 3개(타임스탬프, 작업 요약, 주목할 점)에서 5개로 확대
  - **완료한 작업** 섹션 추가 (체크리스트 형태)
  - **사용자 직접 액션 필요** 섹션 추가 (이유 및 구체적 명령/방법 명시)
  - **다음 AI 세션 할 일** 섹션 추가
  - **TODO.md 동기화** 규칙 명시 (완료 항목 체크, 신규 항목 추가, DEVLOG와 일관성 유지 의무)
  - 로그 포맷 예시 업데이트

**사용자 직접 액션 필요:**

- 없음 (이번 세션은 문서 수정만 포함)

**다음 AI 세션 할 일:**

- [ ] TODO.md의 Phase 1 마무리 항목들이 완료되면 DEVLOG + TODO.md 동기화 진행
- [ ] Phase 2 (학생 명부 시스템) 작업 시작 시 plan.md 검토 후 TODO.md에 세부 항목 추가

**주목할 점:**

- 이 규칙은 이번 세션부터 즉시 적용된다. 이후 모든 AI 세션은 새 로그 포맷을 사용해야 한다.
- DEVLOG 기존 항목들은 소급 변환하지 않는다.

---

## 2026-03-04 13:50 (KST) — AI 행동 원칙 업데이트

**작업 내용:**

`AI_RULES.md`에 2개 섹션을 신규 추가했다:

| 섹션 | 제목                                        | 내용                                                      |
| ---- | ------------------------------------------- | --------------------------------------------------------- |
| 5    | System Privileges & Environment Constraints | sudo 권한 제약, 임시 디렉토리 정책                        |
| 6    | Work Logging (작업 로그 기록)               | 작업 완료 시 DEVLOG.md에 타임스탬프 포함 로그 기록 의무화 |

**세부 변경:**

- **sudo 권한 없음**: AI 에이전트가 sudo 명령을 직접 실행하지 않도록 명시. sudo가 필요한 경우 사유 설명 + 구체적 명령어 제시 + 사용자 직접 실행 안내 절차 규정.
- **임시 디렉토리 정책**: `/tmp/` 등 프로젝트 외부 경로 사용 금지. 프로젝트 루트 하위 `.tmp/` 또는 `tmp/` 사용 의무화. `.gitignore` 확인 및 작업 후 정리 규정.
- **작업 로그 기록**: 타임스탬프(KST), 작업 요약, 주목할 점을 포함한 로그 포맷 정의. README.md 등 관련 문서 동기화 의무.

**브랜치:** `docs/ai-rules-update` (master 기반)

**주목할 점:**

- 이 규칙은 향후 모든 AI 에이전트 세션에 적용된다. 새로운 세션 시작 시 `AI_RULES.md`를 반드시 참조해야 한다.
- `README.md`의 문서 테이블에서 `AI_RULES.md` 설명을 업데이트하여 새 규칙 반영 여부를 확인해야 한다.

### 2026-03-04 13:59 (KST) — Push & PR 생성

**작업 내용:**

- `docs/ai-rules-update` 브랜치를 원격(`origin`)에 push
- GitHub CLI(`gh`)를 설치하여 PR 생성: [#7](https://github.com/LJLee37/Bluearchive-raid-record/pull/7)

**주목할 점:**

- `gh` CLI가 미설치 상태였으며, sudo 권한이 필요하여 사용자에게 설치 명령을 안내 후 사용자가 직접 설치/인증 완료. AI_RULES.md 섹션 5 규칙의 첫 적용 사례.

---

## 2026-03-04 13:32 (KST) — Phase 1 기반 인프라 & 마스터 데이터

> 타임스탬프: 커밋 `b93671d` (2026-03-04 13:32:47) 기준으로 부여

**작업 요약:**

Phase 1의 전체 코드 구현을 완료했다. 5개의 feature 브랜치에 걸쳐 프로젝트 스캐폴딩부터 마스터 데이터 파이프라인, 기본 UI 레이아웃까지 구축했다.

**완료 브랜치 및 커밋:**

| 순서 | 브랜치                  | 커밋 메시지                                         | 주요 내용                                                                         |
| ---- | ----------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1    | `feature/nextjs-init`   | `feat: Next.js 프로젝트 초기 세팅`                  | Next.js 16 + TS + Tailwind v4 + shadcn/ui + ESLint + Prettier                     |
| 2    | `feature/prisma-schema` | `feat: Prisma v7 스키마 및 DB 설정 구현`            | 20개 모델, 10개 enum, PG adapter, 싱글턴 클라이언트                               |
| 3    | `feature/auth`          | `feat: NextAuth.js v5 인증 시스템 구현`             | Discord/Google OAuth, 로그인/에러 페이지, Prisma Adapter                          |
| 4    | `feature/seed-pipeline` | `feat: SchaleDB Seed 파이프라인 구현`               | fetch/parse/seed 3단계 파이프라인 (학생 238명, 보스 20개, 시즌 228개, 이격 104개) |
| 5    | `feature/base-layout`   | `feat: 기본 레이아웃 구현 (헤더, 사이드바, 반응형)` | Header, Sidebar, SidebarNav, UserMenu, 모바일 Sheet                               |

**plan.md 대비 변경사항 (주목할 점):**

#### 1. 기술 스택 버전 변경

- **Next.js 14 → 16**: `create-next-app`으로 설치 시 최신 안정 버전(16.1.6)이 설치됨. App Router 기반이므로 기능상 호환성 문제 없음.
- **Tailwind CSS v3 → v4**: 최신 `create-next-app`이 v4를 사용. `@theme inline` 구문과 `@import "tailwindcss"` 방식으로 변경됨.
- **Prisma v5 → v7**: 최신 `@prisma/client` 7.4.2 설치. **중대한 아키텍처 변경**이 있음 (아래 상세 기술).

#### 2. Prisma v7 마이그레이션 이슈

Prisma v7에서 datasource 설정 방식이 완전히 바뀌었다:

- `schema.prisma`의 `url = env("DATABASE_URL")` / `directUrl` **제거됨** → `prisma.config.ts`로 이동 필요.
- 클라이언트 엔진이 `client` 타입으로 변경 → `new PrismaClient()` 시 반드시 `adapter` 또는 `accelerateUrl` 전달 필요.
- **해결**: `@prisma/adapter-pg` + `pg` 패키지를 통해 PostgreSQL adapter를 직접 주입하는 방식으로 구현.
- `prisma/prisma.config.ts` 파일을 신규 생성하여 마이그레이션용 URL 설정.

```typescript
// Prisma v7 방식
import { PrismaPg } from '@prisma/adapter-pg';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
new PrismaClient({ adapter });
```

#### 3. 데이터베이스 스키마 변경

| 변경 항목            | plan.md (v5.0)                              | 실제 구현                       | 사유                                                                                  |
| -------------------- | ------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| `Student.releasedAt` | `DateTime` (필수)                           | **필드 제거**                   | SchaleDB에 출시일 데이터가 존재하지 않음                                              |
| `ArmorType` enum     | 5종 (LIGHT/HEAVY/SPECIAL/ELASTIC/COMPOSITE) | **6종** (+NORMAL)               | 게임 내 'Unarmed' 타입 5명의 학생 + 보스 방어타입 매핑 필요                           |
| `Student.schaleDbId` | 없음                                        | `Int @unique` **신규 추가**     | SchaleDB 숫자 ID 저장 (이미지 URL 등 CDN 연동에 필수)                                 |
| `AlternateForm` 관계 | `baseFormLink AlternateForm?` (Student 측)  | `baseFormLinks AlternateForm[]` | Prisma one-to-one은 @unique 필요 → 본체 1:N 이격 지원 불가. 관계 방향을 반전하여 해결 |

#### 4. SchaleDB 데이터 분석 결과

실제 SchaleDB 데이터를 조사하여 발견한 사항:

- **학생 영어 이름**: `students.json`의 `Name` 필드는 로케일별 파일에만 존재. `/data/en/students.min.json`에서 별도 조회 필요.
- **`localization.json`**: UI 용어만 포함, 학생/보스 개별 이름은 미포함. plan.md의 "localization에서 추출" 기술은 부정확.
- **이격 관계**: `FavorAlts` 필드가 양방향 (base→alt, alt→base 모두 참조). PathName에 언더스코어 없음 = 본체로 판별하는 휴리스틱 적용.
- **`IsLimited`**: 배열 형태 `[JP, Global, CN]`, 값 의미: 0=상시, 1=한정, 2=복지(무료), 3=페스한정, 4=상시3성. Global(인덱스 1) 기준으로 1 또는 3이면 한정으로 판정.
- **`hpByDifficulty`**: `EnemyList`는 적 ID만 제공하고 실제 HP는 별도 데이터 소스 필요 → 우선 null 처리.
- **보스 공격 속성**: `BulletType`은 Normal 난이도용, `BulletTypeInsane`이 Insane+ 난이도의 실질적 공격 속성. 후자를 기준으로 매핑.

#### 5. 파싱 결과 검증 (2026-03-04 13:00 KST 기준)

```
학생: 238명 (Global 출시 기준)
보스: 20개 (13종 × 지형별 분리)
총력전 시즌: 168개 (JP 87 + Global 81)
대결전 시즌: 60개 (JP 32 + Global 28)
이격 관계: 104개
```

**아직 남은 사항 (Phase 1 완전 완료 전 필요):**

- [ ] Supabase 프로젝트 생성 + `DATABASE_URL` / `DIRECT_URL` 설정
- [ ] Discord Developer Portal에서 OAuth 앱 등록
- [ ] Google Cloud Console에서 OAuth 앱 등록
- [ ] `pnpm prisma migrate dev`로 실제 DB 마이그레이션 실행
- [ ] `pnpm seed:fetch && pnpm seed:parse && pnpm db:seed`로 마스터 데이터 투입 검증
- [ ] `Boss.hpByDifficulty` 데이터 확보 방안 조사 (SchaleDB enemy 데이터 또는 수동 입력)
