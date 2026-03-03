📄 블루아카이브 총력전/대결전 개인 기록 웹사이트 개발 계획서 v3.0 (Master Integrated)
1. 프로젝트 개요 및 핵심 가치
 * 목적: 블루아카이브 총력전 및 대결전의 개인 클리어 기록(파티 구성, 스펙, 점수, 등수, 택틱 등)을 체계적으로 보관하고 조회할 수 있는 개인화 웹 어플리케이션 구축.
 * 핵심 가치 제안:
   * 스냅샷 기반의 완벽한 기록 보존: 학생이 성장해도 과거의 클리어 스펙은 원형 그대로 보존.
   * '내 학생 명부(Roster)' 연동: 매번 스펙을 입력할 필요 없는 압도적 편의성과 동기화 기능.
   * 인게임 도메인 완벽 반영: 이격 독립성 1:N 완벽 지원, 2토/1인 대결전 체제, 손패 고정, 조력자 제한 완벽 구현, 학생 기본 장비 슬롯 고정 반영.
   * 하이브리드 타임라인 에디터: 시간(Time)과 코스트(Cost)를 모두 지원하는 구조화된 택틱 작성.
2. 기술 스택 및 아키텍처
 * Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
 * State Management: Zustand (클라이언트 전역 상태), TanStack Query (서버 상태 캐싱)
 * Backend: Next.js API Routes (Route Handlers)
 * Database & ORM: PostgreSQL (Supabase 호스팅), Prisma ORM
 * Auth: NextAuth.js v5 (Discord, Google OAuth)
 * Resource CDN: SchaleDB 정적 에셋 연동 (이미지 호스팅 비용 제로화)
 * Deployment: Vercel
3. 핵심 기능 명세
3.1 학생 명부(Roster) 및 스냅샷 아키텍처 (가장 중요)
 * 명부 시스템: 유저가 자신의 보유 학생 스펙을 미리 저장해두는 마스터 테이블(UserStudent) 구축.
 * 불러오기 및 스냅샷 저장: 기록을 작성할 때 명부에서 스펙을 불러오며, 기록 화면에서 자유롭게 수정 가능. 저장 시 DB에는 외래키 참조가 아닌 **독립된 파티 멤버 데이터(Snapshot)**로 복사.
 * 양방향 동기화: 기록 저장 시 "수정된 스펙을 내 학생 명부에 동기화하기" 체크박스를 제공하여 UX 극대화.
 * 장비 슬롯 고정: 학생별 착용 가능한 장비 종류(모자, 헤어핀 등)는 마스터 데이터(Student)에 고정하고, 유저 기록에는 티어(Tier) 숫자만 저장하여 중복 입력 방지.
3.2 조력자 스탯 '가설 추산(Best Guess)' 및 수동 입력
 * 조력자는 필수 스탯(레벨, 성급, 스킬, 공격력)을 무조건 기입해야 함.
 * 능력개방과 인연 랭크 변수로 인해 공격력만으로 방어력과 체력을 완벽히 역산하는 것은 불가능.
 * SchaleDB 데이터를 기반으로 가장 확률이 높은 방어력/체력을 추산하여 채워주고(isStatInferred=true), 유저가 실측값을 덮어쓸 수 있도록 지원.
3.3 구조화된 하이브리드 타임라인 택틱 및 손패 고정
 * 단순 텍스트 메모가 아닌, JSON 배열 형태의 구조화된 타임라인 에디터 제공 (Tactic.timeline).
 * 기준점 이중 지원: 시간(예: 02:45) 또는 코스트(예: 9.5) 중 원하는 방식으로 스킬 발동 기록.
 * 손패 고정(Starting Skills): 시작 스킬로 들고 가는 학생의 슬롯 인덱스(최대 3개)를 저장 (Party.startingSkills).
3.4 대결전 최신 메타 및 서버 검증 로직 (26.03.03 기준)
 * 방어타입 3종은 보스의 원본 방어타입을 포함하지 않을 수도 있음.
 * 3종 중 2종은 최대 Torment(토먼트) 난이도 상한, 1종은 최대 Insane(인세인) 난이도 상한.
 * 클라이언트 및 서버 API(difficultyMax 참조)에서 초과 난이도 입력을 원천 차단하는 검증 로직 필수 적용.
4. 데이터베이스 스키마 (Prisma ERD v3.0)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ── Enum ──────────────────────────────────
enum Role { STRIKER, SPECIAL }
enum StudentClass { DEALER, TANK, HEALER, SUPPORTER, TACTICAL_SUPPORT }
enum AttackType { EXPLOSIVE, PIERCING, MYSTIC, SONIC }
enum ArmorType { LIGHT, HEAVY, SPECIAL, ELASTIC, COMPOSITE } // 복합장갑 포함
enum Terrain { INDOOR, OUTDOOR, STREET }
enum Region { GLOBAL, JP }
enum Difficulty { NORMAL, HARD, VERY_HARD, HARDCORE, EXTREME, INSANE, TORMENT, LUNATIC }
enum Tier { PLATINUM, GOLD, SILVER, BRONZE }
enum GearType { HAT, GLOVES, SHOES, HAIRPIN, BADGE, BAG, WATCH, CHARM, NECKLACE }

// ── 마스터 데이터 (정적, 관리자 제어) ────────────────
model Student {
  id               String          @id // "shiroko", "mika" 등
  nameKo           String
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

  baseFormLink     AlternateForm?  @relation("BaseStudent")
  alternateLinks   AlternateForm[] @relation("AlternateStudent")
  
  rosterMembers    UserStudent[]
  partyMembers     PartyMember[]

  @@map("students")
}

model AlternateForm {
  id                 String  @id @default(cuid())
  baseStudentId      String  // @unique 제거, 본체 1:N 이격 지원
  baseStudent        Student @relation("BaseStudent", fields: [baseStudentId], references: [id])
  alternateStudentId String
  alternateStudent   Student @relation("AlternateStudent", fields: [alternateStudentId], references: [id])
  label              String?

  @@unique([baseStudentId, alternateStudentId])
  @@map("alternate_forms")
}

model Boss {
  id                  String               @id // "binah_outdoor" (지형 분리)
  nameKo              String
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
  slotIndex     Int                 
  armorType     ArmorType
  difficultyMax Difficulty          // 서버사이드 난이도 상한 검증용 (TORMENT 또는 INSANE)

  attempts      GrandAssaultAttempt[]

  @@unique([seasonId, slotIndex])
  @@map("grand_assault_armor_slots")
}

// ── 유저 데이터 및 명부(Roster) ──────────────────────
model User {
  id                  String               @id @default(cuid())
  email               String?              @unique
  discordId           String?              @unique
  
  roster              UserStudent[]        // 내 학생 명부
  totalAssaultRecords TotalAssaultRecord[]
  grandAssaultRecords GrandAssaultRecord[]
  parties             Party[]
  tactics             Tactic[]

  @@map("users")
}

// 내 학생 명부 (Master 스펙)
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
  gear1Tier          Int?
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

// ── 기록 (Records & Attempts) ─────────────────────
model TotalAssaultRecord {
  id             String              @id @default(cuid())
  userId         String
  user           User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  seasonId       Int
  season         TotalAssaultSeason  @relation(fields: [seasonId], references: [id])
  
  difficulty     Difficulty
  finalScore     BigInt
  rank           Int?                // 최종 등수
  tier           Tier?               // 플래티넘, 골드 등
  notes          String?
  recordedAt     DateTime            @default(now())
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
  partyOrder Int                // 투입 순서

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
  rank           Int?                  // 최종 등수
  tier           Tier?                 // 플래티넘, 골드 등
  notes          String?
  recordedAt     DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  attempts       GrandAssaultAttempt[]
  tactics        Tactic[]

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

// ── 파티 편성 및 멤버 (스냅샷 저장) ──────────────────
model Party {
  id                  String              @id @default(cuid())
  userId              String
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  name                String
  
  startingSkills      Int[]               // 손패 고정 인덱스 배열 (예: [0, 2, 4])

  members             PartyMember[]
  totalAssaultParties TotalAssaultParty[]
  grandAssaultParties GrandAssaultParty[]
  tactics             Tactic[]

  @@map("parties")
}

model PartyMember {
  id                 String   @id @default(cuid())
  partyId            String
  party              Party    @relation(fields: [partyId], references: [id], onDelete: Cascade)
  studentId          String
  student            Student  @relation(fields: [studentId], references: [id])
  
  slot               Int      
  isSupport          Boolean  @default(false)

  // Snapshot 스탯
  level              Int
  starLevel          Int      
  uniqueStarLevel    Int?     
  exSkillLevel       Int
  basicSkillLevel    Int
  enhancedSkillLevel Int
  subSkillLevel      Int
  gear1Tier          Int?     // 타입은 Student(마스터) 참조, 여기는 티어만
  gear2Tier          Int?
  gear3Tier          Int?
  abilityUnlockAtk   Int      @default(0)
  abilityUnlockHp    Int      @default(0)
  abilityUnlockHeal  Int      @default(0)
  bondLevel          Int      @default(1)
  elephBondLevels    Json?    

  // 조력자 전용 스탯
  supportAtk         Int?
  supportDef         Int?
  supportHp          Int?
  isStatInferred     Boolean  @default(false)

  @@unique([partyId, slot])
  @@map("party_members")
}

// ── 택틱 노트 (하이브리드 타임라인) ────────────────────
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
  content              String              // 자유 메모 (리치 텍스트)
  
  // 시간/코스트 기반 타임라인 데이터
  // [{ time: "02:45", cost: 9.5, slot: 0, action: "EX 사용", note: "크리 리트" }]
  timeline             Json?               

  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt

  @@map("tactics")
}

5. API 엔드포인트 명세 (핵심 요약)
 * GET /api/roster: 내 학생 명부 목록 조회
 * POST /api/roster/sync: 기록 저장 시 파티의 스냅샷 데이터를 학생 명부 스펙에 덮어쓰기 (동기화)
 * POST /api/records/total: 총력전 기록 생성 (파티 스냅샷 데이터 전체 Payload 포함)
 * POST /api/records/grand: 대결전 기록 생성 (방어타입 3종 Payload 포함, difficultyMax 서버 검증)
 * PATCH /api/records/:id/rank: 시즌 종료 후 최종 등수(rank) 및 티어(tier) 업데이트
 * GET /api/master/students: 마스터 학생 데이터 조회 (SchaleDB 연동 데이터 셋, gearType 포함)
6. 페이지 구조 (App Router)
 * /: 대시보드 (진행 중인 시즌 정보 startAt/endAt 기반, 최근 내 기록)
 * /roster: 내 학생 명부 관리 페이지 (스펙 사전 세팅)
 * /records: 과거 클리어 기록 열람 및 필터링 (보스별, 지형별, 등수/티어별)
 * /builder: 파티 편성 및 기록 작성 (Roster Load, CSR 폼, Zustand 상태 관리)
 * /tactics: 하이브리드 타임라인(Cost/Time) 작성 및 영상 첨부 페이지
7. 개발 마일스톤 (Phase Plan)
 * Phase 1: 기반 인프라 & 마스터 데이터
   * Supabase 세팅 및 v3.0 Prisma 마이그레이션.
   * NextAuth 연결 및 SchaleDB 스크립트 기반 마스터 데이터(학생/보스/시즌) Seed 투입.
 * Phase 2: Roster(학생 명부) 시스템 구축
   * UserStudent 기반 보유 학생 스펙 등록 및 관리 UI 구축.
 * Phase 3: 파티 빌더 & 스냅샷 기록 (프로젝트의 핵심)
   * 명부 연동, 손패 고정, 조력자 처리(isStatInferred), 스냅샷 복사 저장, 대결전 서버사이드 폼 검증.
 * Phase 4: 하이브리드 타임라인 & 대시보드
   * Cost/Time 기반 택틱 에디터, 시즌 종료 후 등수/티어 입력 기능, 과거 기록 열람.
 * Phase 5 (v2.0 - 런칭 3개월 후): 메타 분석 시스템
   * 누적된 공개 데이터를 바탕으로 Redis를 활용한 픽률 통계 및 메타 제공.

