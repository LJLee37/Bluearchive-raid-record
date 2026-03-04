/**
 * 파싱된 마스터 데이터를 Prisma를 통해 PostgreSQL에 upsert합니다.
 *
 * 사용법: pnpm db:seed
 * 전제: pnpm seed:fetch && pnpm seed:parse 가 먼저 실행되어야 합니다.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';
import type {
  ParsedStudent,
  ParsedBoss,
  ParsedTotalAssaultSeason,
  ParsedGrandAssaultSeason,
  ParsedAlternateForm,
} from '../scripts/types';

const CACHE_DIR = join(process.cwd(), 'data', 'cache');

function loadParsedData<T>(filename: string): T {
  return JSON.parse(readFileSync(join(CACHE_DIR, filename), 'utf-8'));
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

async function seedStudents(prisma: PrismaClient, students: ParsedStudent[]) {
  console.log(`  학생 ${students.length}명 upsert 중...`);

  for (const student of students) {
    await prisma.student.upsert({
      where: { id: student.id },
      update: {
        schaleDbId: student.schaleDbId,
        nameKo: student.nameKo,
        nameEn: student.nameEn,
        school: student.school,
        role: student.role,
        studentClass: student.studentClass,
        attackType: student.attackType,
        armorType: student.armorType,
        iconUrl: student.iconUrl,
        isLimited: student.isLimited,
        gear1Type: student.gear1Type as any,
        gear2Type: student.gear2Type as any,
        gear3Type: student.gear3Type as any,
      },
      create: {
        id: student.id,
        schaleDbId: student.schaleDbId,
        nameKo: student.nameKo,
        nameEn: student.nameEn,
        school: student.school,
        role: student.role,
        studentClass: student.studentClass,
        attackType: student.attackType,
        armorType: student.armorType,
        iconUrl: student.iconUrl,
        isLimited: student.isLimited,
        gear1Type: student.gear1Type as any,
        gear2Type: student.gear2Type as any,
        gear3Type: student.gear3Type as any,
      },
    });
  }

  console.log(`  학생 upsert 완료`);
}

async function seedBosses(prisma: PrismaClient, bosses: ParsedBoss[]) {
  console.log(`  보스 ${bosses.length}개 upsert 중...`);

  for (const boss of bosses) {
    await prisma.boss.upsert({
      where: { id: boss.id },
      update: {
        nameKo: boss.nameKo,
        nameEn: boss.nameEn,
        terrain: boss.terrain,
        attackType: boss.attackType,
        armorType: boss.armorType,
        iconUrl: boss.iconUrl,
        isReleased: boss.isReleased,
        hpByDifficulty: boss.hpByDifficulty ?? Prisma.JsonNull,
      },
      create: {
        id: boss.id,
        nameKo: boss.nameKo,
        nameEn: boss.nameEn,
        terrain: boss.terrain,
        attackType: boss.attackType,
        armorType: boss.armorType,
        iconUrl: boss.iconUrl,
        isReleased: boss.isReleased,
        hpByDifficulty: boss.hpByDifficulty ?? Prisma.JsonNull,
      },
    });
  }

  console.log(`  보스 upsert 완료`);
}

async function seedTotalAssaultSeasons(prisma: PrismaClient, seasons: ParsedTotalAssaultSeason[]) {
  console.log(`  총력전 시즌 ${seasons.length}개 upsert 중...`);

  for (const season of seasons) {
    await prisma.totalAssaultSeason.upsert({
      where: {
        seasonNumber_region: {
          seasonNumber: season.seasonNumber,
          region: season.region,
        },
      },
      update: {
        bossId: season.bossId,
        startAt: season.startAt,
        endAt: season.endAt,
      },
      create: {
        seasonNumber: season.seasonNumber,
        bossId: season.bossId,
        region: season.region,
        startAt: season.startAt,
        endAt: season.endAt,
      },
    });
  }

  console.log(`  총력전 시즌 upsert 완료`);
}

async function seedGrandAssaultSeasons(prisma: PrismaClient, seasons: ParsedGrandAssaultSeason[]) {
  console.log(`  대결전 시즌 ${seasons.length}개 upsert 중...`);

  for (const season of seasons) {
    const upsertedSeason = await prisma.grandAssaultSeason.upsert({
      where: {
        seasonNumber_region: {
          seasonNumber: season.seasonNumber,
          region: season.region,
        },
      },
      update: {
        bossId: season.bossId,
        startAt: season.startAt,
        endAt: season.endAt,
      },
      create: {
        seasonNumber: season.seasonNumber,
        bossId: season.bossId,
        region: season.region,
        startAt: season.startAt,
        endAt: season.endAt,
      },
    });

    // 방어타입 슬롯 upsert
    for (const slot of season.armorSlots) {
      await prisma.grandAssaultArmorSlot.upsert({
        where: {
          seasonId_slotIndex: {
            seasonId: upsertedSeason.id,
            slotIndex: slot.slotIndex,
          },
        },
        update: {
          armorType: slot.armorType as any,
          difficultyMax: slot.difficultyMax as any,
        },
        create: {
          seasonId: upsertedSeason.id,
          slotIndex: slot.slotIndex,
          armorType: slot.armorType as any,
          difficultyMax: slot.difficultyMax as any,
        },
      });
    }
  }

  console.log(`  대결전 시즌 upsert 완료`);
}

async function seedAlternateForms(prisma: PrismaClient, forms: ParsedAlternateForm[]) {
  console.log(`  이격 관계 ${forms.length}개 upsert 중...`);

  for (const form of forms) {
    // 본체와 이격 학생이 모두 존재하는지 확인
    const [base, alt] = await Promise.all([
      prisma.student.findUnique({ where: { id: form.baseStudentId } }),
      prisma.student.findUnique({ where: { id: form.alternateStudentId } }),
    ]);

    if (!base || !alt) {
      console.warn(
        `  경고: 이격 관계 스킵 (${form.baseStudentId} → ${form.alternateStudentId}): 학생 미존재`,
      );
      continue;
    }

    await prisma.alternateForm.upsert({
      where: {
        alternateStudentId: form.alternateStudentId,
      },
      update: {
        baseStudentId: form.baseStudentId,
        label: form.label,
      },
      create: {
        baseStudentId: form.baseStudentId,
        alternateStudentId: form.alternateStudentId,
        label: form.label,
      },
    });
  }

  console.log(`  이격 관계 upsert 완료`);
}

async function main() {
  console.log('마스터 데이터 시드 시작\n');

  const prisma = createPrismaClient();

  try {
    // 파싱된 데이터 로드
    const students = loadParsedData<ParsedStudent[]>('parsed-students.json');
    const bosses = loadParsedData<ParsedBoss[]>('parsed-bosses.json');
    const seasons = loadParsedData<{
      totalAssault: ParsedTotalAssaultSeason[];
      grandAssault: ParsedGrandAssaultSeason[];
    }>('parsed-seasons.json');
    const alternateForms = loadParsedData<ParsedAlternateForm[]>('parsed-alternate-forms.json');

    // 순서대로 시드 (의존성 순서 준수)
    console.log('[1/5] 학생 시드...');
    await seedStudents(prisma, students);

    console.log('[2/5] 보스 시드...');
    await seedBosses(prisma, bosses);

    console.log('[3/5] 총력전 시즌 시드...');
    await seedTotalAssaultSeasons(prisma, seasons.totalAssault);

    console.log('[4/5] 대결전 시즌 시드...');
    await seedGrandAssaultSeasons(prisma, seasons.grandAssault);

    console.log('[5/5] 이격 관계 시드...');
    await seedAlternateForms(prisma, alternateForms);

    console.log('\n시드 완료!');
  } catch (error) {
    console.error('시드 실패:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
