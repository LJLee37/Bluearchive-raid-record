/**
 * SchaleDB raids.json에서 시즌 데이터를 파싱합니다.
 * - 총력전 (TotalAssaultSeason): RaidSeasons[n].Seasons
 * - 대결전 (GrandAssaultSeason): RaidSeasons[n].EliminateSeasons
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type {
  SchaleDbRaidsFile,
  SchaleDbRaid,
  ParsedTotalAssaultSeason,
  ParsedGrandAssaultSeason,
} from './types';

const CACHE_DIR = join(process.cwd(), 'data', 'cache');

// SchaleDB 난이도 인덱스 → Prisma Difficulty enum
const DIFFICULTY_INDEX_MAP: Record<number, string> = {
  0: 'NORMAL',
  1: 'HARD',
  2: 'VERY_HARD',
  3: 'HARDCORE',
  4: 'EXTREME',
  5: 'INSANE',
  6: 'TORMENT',
  7: 'LUNATIC',
};

const ARMOR_TYPE_MAP: Record<string, string> = {
  LightArmor: 'LIGHT',
  HeavyArmor: 'HEAVY',
  Unarmed: 'NORMAL',
  ElasticArmor: 'ELASTIC',
  CompositeArmor: 'COMPOSITE',
  Normal: 'NORMAL',
};

// SchaleDB region 인덱스: 0=JP, 1=Global
const REGION_MAP: Record<number, 'JP' | 'GLOBAL'> = {
  0: 'JP',
  1: 'GLOBAL',
};

function getRaidById(raids: SchaleDbRaid[], raidId: number): SchaleDbRaid | undefined {
  return raids.find((r) => r.Id === raidId);
}

function getTerrainSlug(terrain: string): string {
  return terrain.toLowerCase();
}

export function parseSeasons(): {
  totalAssault: ParsedTotalAssaultSeason[];
  grandAssault: ParsedGrandAssaultSeason[];
} {
  const raidsKr: SchaleDbRaidsFile = JSON.parse(
    readFileSync(join(CACHE_DIR, 'raids-kr.json'), 'utf-8'),
  );

  const totalAssault: ParsedTotalAssaultSeason[] = [];
  const grandAssault: ParsedGrandAssaultSeason[] = [];

  // JP(0)과 Global(1)만 처리
  for (const regionIndex of [0, 1]) {
    const regionData = raidsKr.RaidSeasons[regionIndex];
    if (!regionData) continue;

    const region = REGION_MAP[regionIndex];

    // 총력전 시즌
    for (const season of regionData.Seasons) {
      const raid = getRaidById(raidsKr.Raid, season.RaidId);
      if (!raid) {
        console.warn(`  경고: 총력전 시즌 ${season.SeasonId}의 Raid ID ${season.RaidId} 없음`);
        continue;
      }

      const terrainSlug = getTerrainSlug(season.Terrain);
      const bossId = `${raid.PathName}_${terrainSlug}`;

      totalAssault.push({
        seasonNumber: season.SeasonId,
        bossId,
        region,
        startAt: new Date(season.Start * 1000),
        endAt: new Date(season.End * 1000),
      });
    }

    // 대결전 시즌
    for (const season of regionData.EliminateSeasons) {
      const raid = getRaidById(raidsKr.Raid, season.RaidId);
      if (!raid) {
        console.warn(`  경고: 대결전 시즌 ${season.SeasonId}의 Raid ID ${season.RaidId} 없음`);
        continue;
      }

      const terrainSlug = getTerrainSlug(season.Terrain);
      const bossId = `${raid.PathName}_${terrainSlug}`;

      // OpenDifficulty에서 방어타입별 슬롯 추출
      const armorSlots = Object.entries(season.OpenDifficulty).map(
        ([armorType, maxDiffIndex], index) => ({
          slotIndex: index,
          armorType: ARMOR_TYPE_MAP[armorType] ?? 'NORMAL',
          difficultyMax: DIFFICULTY_INDEX_MAP[maxDiffIndex] ?? 'INSANE',
        }),
      );

      grandAssault.push({
        seasonNumber: season.SeasonId,
        bossId,
        region,
        startAt: new Date(season.Start * 1000),
        endAt: new Date(season.End * 1000),
        armorSlots,
      });
    }
  }

  console.log(
    `  총력전 시즌 ${totalAssault.length}개, 대결전 시즌 ${grandAssault.length}개 파싱 완료`,
  );
  return { totalAssault, grandAssault };
}

if (require.main === module) {
  const result = parseSeasons();
  writeFileSync(join(CACHE_DIR, 'parsed-seasons.json'), JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  결과 저장 완료`);
}
