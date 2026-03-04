# 블루아카이브 레이드 트래커 (BA Raid Tracker)

블루아카이브 총력전/대결전의 **개인 클리어 기록, 학생 명부, 파티 편성, 택틱 노트**를 한 곳에서 관리하고, 장기적으로 메타 통계와 커뮤니티 공유로 확장하는 웹 서비스.

---

## 프로젝트 소개

| 문제                            | 해결책                                                |
| ------------------------------- | ----------------------------------------------------- |
| 매 시즌 점수/편성을 기억 못 함  | 시즌별 기록 아카이빙 (스냅샷 저장으로 과거 스펙 보존) |
| 매번 학생 스펙을 처음부터 입력  | 학생 명부(Roster)에서 원클릭 불러오기                 |
| 클리어 영상을 나중에 못 찾음    | 택틱 노트에 영상 URL + 타임라인 연동                  |
| 손패/스킬 순서를 기록 못 함     | 손패 고정 + 구조화된 타임라인                         |
| 장비 종류를 매번 선택해야 함    | 학생별 장비 슬롯 종류 마스터 고정, 티어만 입력        |
| 메타를 커뮤니티에서 일일이 찾음 | 집계 기반 자동 메타 분석                              |

### 타겟 유저

- **1차**: 총력전/대결전을 진지하게 공략하는 블루아카이브 유저 (개인 기록 관리)
- **2차**: 메타 참고만 하려는 라이트 유저 (비로그인 열람)

---

## 주요 기능

- **학생 명부 (Roster)** -- 보유 학생 스펙을 마스터 테이블에 미리 저장, 기록 작성 시 원클릭 불러오기
- **파티 빌더** -- 스트라이커 4 + 스페셜 2 편성, 손패 고정, 조력자 스탯 자동 유추
- **레이드 기록 트래킹** -- 총력전/대결전 시즌별 점수, 등수, 티어, 파티 편성을 스냅샷으로 독립 보존
- **택틱 노트** -- 리치텍스트 + 하이브리드 타임라인(시간/코스트 기준) + YouTube 연동 + 실패 원인 태그
- **개인 대시보드** -- 시즌별 점수/등수 추이 차트, 통계 요약
- **메타 분석 (Phase 5)** -- 보스별 학생 픽률, 시즌별 메타 변화 추이, Redis 캐싱 자동 집계

---

## 기술 스택

| 레이어              | 기술                                          |
| ------------------- | --------------------------------------------- |
| **프레임워크**      | Next.js 16 (App Router), TypeScript           |
| **스타일링**        | Tailwind CSS v4 + shadcn/ui                   |
| **클라이언트 상태** | Zustand (글로벌) + TanStack Query (서버 상태) |
| **폼/검증**         | React Hook Form + Zod (프론트/백 공유)        |
| **차트/에디터**     | Recharts, Tiptap                              |
| **ORM**             | Prisma v7 (PG adapter)                        |
| **데이터베이스**    | PostgreSQL (Supabase)                         |
| **캐시**            | Upstash Redis                                 |
| **인증**            | NextAuth.js v5 (Discord OAuth + Google OAuth) |
| **호스팅**          | Vercel                                        |
| **CI/CD**           | GitHub Actions                                |
| **모니터링**        | Vercel Analytics + Sentry                     |
| **패키지 매니저**   | pnpm                                          |
| **테스트**          | Vitest + Playwright (E2E)                     |

---

## 프로젝트 상태

> **현재: Phase 1 코드 구현 완료 / 외부 서비스 연결 대기 중** (2026-03-04)

| Phase | 내용                                                       | 기간 (예상) | 상태         |
| ----- | ---------------------------------------------------------- | ----------- | ------------ |
| 1     | 기반 인프라, Prisma 스키마, 인증, SchaleDB Seed 파이프라인 | 2~3주       | **코드 완료** |
| 2     | 학생 명부 (Roster) 시스템                                  | 2주         | 대기         |
| 3     | 파티 빌더, 스냅샷 기록, 검증 로직 **(핵심)**               | 3주         | 대기         |
| 4     | 택틱 노트, 기록 열람, 차트                                 | 2주         | 대기         |
| 5     | 개인 대시보드, 메타 분석, Redis 캐싱                       | 2~3주       | 대기         |
| 6     | 모바일 QA, 다크모드, SEO, 모니터링, 배포                   | 1주         | 대기         |

총 예상 기간: **12~14주** (1인 개발 기준)

---

## 문서

| 문서 | 설명 |
| ---- | ---- |
| [`plan.md`](./plan.md) | 통합 기획서 v5.1 — 도메인 지식, 스키마, API, UI, Phase 계획 등 14개 섹션 |
| [`DEVLOG.md`](./DEVLOG.md) | 개발 로그 — Phase별 작업 기록, 변경사항, 주목할 점 |
| [`AI_RULES.md`](./AI_RULES.md) | AI 에이전트 및 Git 컨벤션 규칙 |

---

## 시작하기

### 사전 요구사항

- Node.js 22+
- pnpm 10+
- Supabase 프로젝트 (PostgreSQL)
- Discord OAuth 앱 (Discord Developer Portal)
- Google OAuth 앱 (Google Cloud Console)

### 셋업

```bash
# 의존성 설치
pnpm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 DB URL, OAuth 키 등을 입력

# Prisma Client 생성
pnpm prisma generate

# DB 마이그레이션
pnpm prisma migrate dev

# SchaleDB 마스터 데이터 시드
pnpm seed:fetch    # SchaleDB에서 학생/보스 JSON 다운로드
pnpm seed:parse    # 다운로드된 데이터를 Prisma 형식으로 변환
pnpm db:seed       # PostgreSQL에 마스터 데이터 투입

# 개발 서버 실행
pnpm dev
```

### 주요 스크립트

| 스크립트           | 설명                                        |
| ------------------ | ------------------------------------------- |
| `pnpm dev`         | 개발 서버 실행 (Turbopack)                  |
| `pnpm build`       | 프로덕션 빌드                               |
| `pnpm lint`        | ESLint 검사                                 |
| `pnpm format`      | Prettier 포맷팅                             |
| `pnpm typecheck`   | TypeScript 타입 검사                        |
| `pnpm seed:fetch`  | SchaleDB JSON 다운로드 → `data/cache/`      |
| `pnpm seed:parse`  | 다운로드 데이터 파싱 → `data/cache/parsed-*` |
| `pnpm db:seed`     | 파싱된 데이터를 DB에 upsert                 |

---

## 개발 도구

이 프로젝트는 [opencode](https://opencode.ai)를 사용하여 개발합니다. opencode는 터미널 기반 AI 코딩 어시스턴트로, 코드 생성/수정/리팩토링 등 개발 전반에 활용합니다.

---

## 라이선스

TBD
