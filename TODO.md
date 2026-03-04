# 블루아카이브 레이드 트래커 - 작업 체크리스트

현재 **Phase 1 코드 구현**은 완료되었으며, 외부 서비스 연결 및 인프라 설정이 필요한 상태입니다.

---

## 🚀 긴급: 외부 서비스 연결 (Phase 1 마무리)

### 1. 데이터베이스 (Supabase)

- [ ] [사용자] [Supabase](https://supabase.com) 프로젝트 생성
- [ ] [사용자] `.env.local`에 DB 연결 정보 설정
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 2. 인증 (OAuth)

- [ ] [사용자] [Discord Developer Portal](https://discord.com/developers/applications) 앱 등록
  - Callback: `http://localhost:3000/api/auth/callback/discord`
  - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` 설정
- [ ] [사용자] [Google Cloud Console](https://console.cloud.google.com) 앱 등록
  - Callback: `http://localhost:3000/api/auth/callback/google`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 설정
- [ ] [사용자] `NEXTAUTH_SECRET` 생성 및 설정 (`openssl rand -base64 32`)

### 3. 데이터 초기화 (Local 실행)

- [ ] [사용자] `pnpm prisma migrate dev` (DB 스키마 적용)
- [ ] [사용자] `pnpm db:seed` (마스터 데이터 투입)
- [ ] [사용자] `pnpm dev` (정상 작동 확인)

---

## 📅 향후 계획

### Phase 2: 학생 명부 (Roster) 시스템

- [ ] [AI] 보유 학생 목록 UI 구현
- [ ] [AI] 학생별 스펙(레벨, 성급, 스킬, 장비) 저장 로직
- [ ] [AI] SchaleDB 데이터 기반 자동 완성

### Phase 3: 파티 빌더 & 기록

- [ ] [AI] 1/2/3파티 편성 UI
- [ ] [AI] 점수/시간 계산기
- [ ] [AI] 기록 스냅샷 저장 기능

---

## 🛠 선택사항 (추후 진행)

- [ ] [AI] Upstash Redis 연결 (Phase 5)
- [ ] [AI] Sentry 모니터링 연결 (Phase 6)
