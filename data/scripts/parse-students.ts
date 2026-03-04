/**
 * SchaleDB students.json을 Prisma Student 모델 형식으로 변환합니다.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { SchaleDbStudent, ParsedStudent } from './types';

const CACHE_DIR = join(process.cwd(), 'data', 'cache');
const OUTPUT_PATH = join(CACHE_DIR, 'parsed-students.json');

// SchaleDB → Prisma 매핑 테이블
const SQUAD_TYPE_MAP: Record<string, 'STRIKER' | 'SPECIAL'> = {
  Main: 'STRIKER',
  Support: 'SPECIAL',
};

const TACTIC_ROLE_MAP: Record<string, ParsedStudent['studentClass']> = {
  DamageDealer: 'DEALER',
  Tanker: 'TANK',
  Healer: 'HEALER',
  Supporter: 'SUPPORTER',
  Vehicle: 'TACTICAL_SUPPORT',
};

const BULLET_TYPE_MAP: Record<string, ParsedStudent['attackType']> = {
  Explosion: 'EXPLOSIVE',
  Pierce: 'PIERCING',
  Mystic: 'MYSTIC',
  Sonic: 'SONIC',
};

const ARMOR_TYPE_MAP: Record<string, ParsedStudent['armorType']> = {
  LightArmor: 'LIGHT',
  HeavyArmor: 'HEAVY',
  Unarmed: 'NORMAL',
  ElasticArmor: 'ELASTIC',
  CompositeArmor: 'COMPOSITE',
};

const GEAR_TYPE_MAP: Record<string, string> = {
  Hat: 'HAT',
  Gloves: 'GLOVES',
  Shoes: 'SHOES',
  Hairpin: 'HAIRPIN',
  Badge: 'BADGE',
  Bag: 'BAG',
  Watch: 'WATCH',
  Charm: 'CHARM',
  Necklace: 'NECKLACE',
};

function isLimited(isLimitedArr: number[]): boolean {
  // Global(인덱스 1) 기준으로 판단
  // 1 = limited, 3 = fes limited → true
  // 0 = permanent, 2 = welfare, 4 = permanent 3★ → false
  const globalValue = isLimitedArr[1] ?? isLimitedArr[0] ?? 0;
  return globalValue === 1 || globalValue === 3;
}

export function parseStudents(): ParsedStudent[] {
  const studentsKr: Record<string, SchaleDbStudent> = JSON.parse(
    readFileSync(join(CACHE_DIR, 'students-kr.json'), 'utf-8'),
  );
  const studentsEn: Record<string, SchaleDbStudent> = JSON.parse(
    readFileSync(join(CACHE_DIR, 'students-en.json'), 'utf-8'),
  );

  const parsed: ParsedStudent[] = [];

  for (const [id, student] of Object.entries(studentsKr)) {
    // Global 서버에서 미출시된 학생은 제외
    if (!student.IsReleased[1]) continue;

    const enStudent = studentsEn[id];
    if (!enStudent) {
      console.warn(`  경고: 영어 데이터 없음 - ${student.PathName} (${id})`);
      continue;
    }

    const armorType = ARMOR_TYPE_MAP[student.ArmorType];
    if (!armorType) {
      console.warn(`  경고: 알 수 없는 ArmorType '${student.ArmorType}' - ${student.PathName}`);
      continue;
    }

    parsed.push({
      id: student.PathName,
      schaleDbId: student.Id,
      nameKo: student.Name,
      nameEn: enStudent.Name,
      school: student.School,
      role: SQUAD_TYPE_MAP[student.SquadType] ?? 'STRIKER',
      studentClass: TACTIC_ROLE_MAP[student.TacticRole] ?? 'DEALER',
      attackType: BULLET_TYPE_MAP[student.BulletType] ?? 'EXPLOSIVE',
      armorType,
      iconUrl: `https://schaledb.com/images/student/icon/${student.Id}.webp`,
      isLimited: isLimited(student.IsLimited),
      gear1Type: GEAR_TYPE_MAP[student.Equipment[0]] ?? 'HAT',
      gear2Type: GEAR_TYPE_MAP[student.Equipment[1]] ?? 'HAIRPIN',
      gear3Type: GEAR_TYPE_MAP[student.Equipment[2]] ?? 'WATCH',
    });
  }

  console.log(`  학생 ${parsed.length}명 파싱 완료`);
  return parsed;
}

// 직접 실행 시
if (require.main === module) {
  const result = parseStudents();
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  결과 저장: ${OUTPUT_PATH}`);
}
