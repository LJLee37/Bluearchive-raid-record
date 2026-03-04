/**
 * SchaleDB raids.json에서 보스 데이터를 Prisma Boss 모델 형식으로 변환합니다.
 * 보스는 지형별로 분리됩니다 (예: binah_outdoor, binah_street).
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { SchaleDbRaidsFile, ParsedBoss } from './types';

const CACHE_DIR = join(process.cwd(), 'data', 'cache');
const OUTPUT_PATH = join(CACHE_DIR, 'parsed-bosses.json');

const TERRAIN_MAP: Record<string, ParsedBoss['terrain']> = {
  Indoor: 'INDOOR',
  Outdoor: 'OUTDOOR',
  Street: 'STREET',
};

const BULLET_TYPE_MAP: Record<string, ParsedBoss['attackType']> = {
  Normal: 'EXPLOSIVE', // Normal difficulty의 BulletType은 보통 무의미, BulletTypeInsane 사용
  Explosion: 'EXPLOSIVE',
  Pierce: 'PIERCING',
  Mystic: 'MYSTIC',
  Sonic: 'SONIC',
};

const ARMOR_TYPE_MAP: Record<string, ParsedBoss['armorType']> = {
  LightArmor: 'LIGHT',
  HeavyArmor: 'HEAVY',
  Unarmed: 'NORMAL',
  ElasticArmor: 'ELASTIC',
  CompositeArmor: 'COMPOSITE',
  Normal: 'NORMAL',
};

export function parseBosses(): ParsedBoss[] {
  const raidsKr: SchaleDbRaidsFile = JSON.parse(
    readFileSync(join(CACHE_DIR, 'raids-kr.json'), 'utf-8'),
  );
  const raidsEn: SchaleDbRaidsFile = JSON.parse(
    readFileSync(join(CACHE_DIR, 'raids-en.json'), 'utf-8'),
  );

  const parsed: ParsedBoss[] = [];
  const enRaidMap = new Map(raidsEn.Raid.map((r) => [r.Id, r]));

  for (const raid of raidsKr.Raid) {
    // Global 서버에서 미출시된 보스는 제외
    if (!raid.IsReleased[1]) continue;

    const enRaid = enRaidMap.get(raid.Id);

    // 각 지형별로 별도 Boss 레코드 생성
    for (const terrain of raid.Terrain) {
      const terrainSlug = terrain.toLowerCase();
      const bossId = `${raid.PathName}_${terrainSlug}`;

      parsed.push({
        id: bossId,
        nameKo: raid.Name,
        nameEn: enRaid?.Name ?? raid.DevName,
        terrain: TERRAIN_MAP[terrain] ?? 'OUTDOOR',
        // Insane+ 난이도의 공격 속성을 사용 (실질적인 보스 속성)
        attackType: BULLET_TYPE_MAP[raid.BulletTypeInsane] ?? 'EXPLOSIVE',
        armorType: ARMOR_TYPE_MAP[raid.ArmorType] ?? 'NORMAL',
        iconUrl: `https://schaledb.com/images/raid/Boss_Portrait_${raid.DevName}_Lobby.png`,
        isReleased: true,
        hpByDifficulty: null, // EnemyList에서 실제 HP 추출은 추후 구현
      });
    }
  }

  console.log(`  보스 ${parsed.length}개 파싱 완료`);
  return parsed;
}

if (require.main === module) {
  const result = parseBosses();
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  결과 저장: ${OUTPUT_PATH}`);
}
