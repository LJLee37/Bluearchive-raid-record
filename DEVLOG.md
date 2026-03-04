# 개발 로그

---

## 2026-03-04 (Phase 1 — 기반 인프라 & 마스터 데이터)

### 작업 요약

Phase 1의 전체 코드 구현을 완료했다. 5개의 feature 브랜치에 걸쳐 프로젝트 스캐폴딩부터 마스터 데이터 파이프라인, 기본 UI 레이아웃까지 구축했다.

### 완료 브랜치 및 커밋

| 순서 | 브랜치 | 커밋 메시지 | 주요 내용 |
|------|--------|------------|-----------|
| 1 | `feature/nextjs-init` | `feat: Next.js 프로젝트 초기 세팅` | Next.js 16 + TS + Tailwind v4 + shadcn/ui + ESLint + Prettier |
| 2 | `feature/prisma-schema` | `feat: Prisma v7 스키마 및 DB 설정 구현` | 20개 모델, 10개 enum, PG adapter, 싱글턴 클라이언트 |
| 3 | `feature/auth` | `feat: NextAuth.js v5 인증 시스템 구현` | Discord/Google OAuth, 로그인/에러 페이지, Prisma Adapter |
| 4 | `feature/seed-pipeline` | `feat: SchaleDB Seed 파이프라인 구현` | fetch/parse/seed 3단계 파이프라인 (학생 238명, 보스 20개, 시즌 228개, 이격 104개) |
| 5 | `feature/base-layout` | `feat: 기본 레이아웃 구현 (헤더, 사이드바, 반응형)` | Header, Sidebar, SidebarNav, UserMenu, 모바일 Sheet |

### plan.md 대비 변경사항 (주목할 점)

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

| 변경 항목 | plan.md (v5.0) | 실제 구현 | 사유 |
|-----------|---------------|-----------|------|
| `Student.releasedAt` | `DateTime` (필수) | **필드 제거** | SchaleDB에 출시일 데이터가 존재하지 않음 |
| `ArmorType` enum | 5종 (LIGHT/HEAVY/SPECIAL/ELASTIC/COMPOSITE) | **6종** (+NORMAL) | 게임 내 'Unarmed' 타입 5명의 학생 + 보스 방어타입 매핑 필요 |
| `Student.schaleDbId` | 없음 | `Int @unique` **신규 추가** | SchaleDB 숫자 ID 저장 (이미지 URL 등 CDN 연동에 필수) |
| `AlternateForm` 관계 | `baseFormLink AlternateForm?` (Student 측) | `baseFormLinks AlternateForm[]` | Prisma one-to-one은 @unique 필요 → 본체 1:N 이격 지원 불가. 관계 방향을 반전하여 해결 |

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

### 아직 남은 사항 (Phase 1 완전 완료 전 필요)

- [ ] GitHub에서 5개 PR 순서대로 머지
- [ ] Supabase 프로젝트 생성 + `DATABASE_URL` / `DIRECT_URL` 설정
- [ ] Discord Developer Portal에서 OAuth 앱 등록
- [ ] Google Cloud Console에서 OAuth 앱 등록
- [ ] `pnpm prisma migrate dev`로 실제 DB 마이그레이션 실행
- [ ] `pnpm seed:fetch && pnpm seed:parse && pnpm db:seed`로 마스터 데이터 투입 검증
- [ ] `Boss.hpByDifficulty` 데이터 확보 방안 조사 (SchaleDB enemy 데이터 또는 수동 입력)
