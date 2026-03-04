/**
 * SchaleDB 원본 데이터 타입 (students.json)
 */
export interface SchaleDbStudent {
  Id: number;
  IsReleased: boolean[];
  PathName: string;
  DevName: string;
  Name: string;
  School: string;
  SquadType: 'Main' | 'Support';
  TacticRole: string;
  BulletType: string;
  ArmorType: string;
  Equipment: string[];
  IsLimited: number[];
  FavorAlts: number[];
  StarGrade: number;
}

/**
 * SchaleDB 원본 데이터 타입 (raids.json)
 */
export interface SchaleDbRaid {
  Id: number;
  IsReleased: boolean[];
  MaxDifficulty: number[];
  PathName: string;
  DevName: string;
  Name: string;
  Terrain: string[];
  BulletType: string;
  BulletTypeInsane: string;
  ArmorType: string;
  EnemyList: number[][];
  BattleDuration: number[];
}

export interface SchaleDbSeason {
  SeasonId: number;
  SeasonDisplay: number | string;
  RaidId: number;
  Terrain: string;
  Start: number;
  End: number;
  RewardSet: number;
  RewardSetMax: number;
}

export interface SchaleDbEliminateSeason extends SchaleDbSeason {
  OpenDifficulty: Record<string, number>;
}

export interface SchaleDbRaidSeasons {
  Seasons: SchaleDbSeason[];
  EliminateSeasons: SchaleDbEliminateSeason[];
}

export interface SchaleDbRaidsFile {
  Raid: SchaleDbRaid[];
  RaidSeasons: SchaleDbRaidSeasons[];
}

/**
 * 파싱 결과 타입 (Prisma 모델에 매핑)
 */
export interface ParsedStudent {
  id: string;
  schaleDbId: number;
  nameKo: string;
  nameEn: string;
  school: string;
  role: 'STRIKER' | 'SPECIAL';
  studentClass: 'DEALER' | 'TANK' | 'HEALER' | 'SUPPORTER' | 'TACTICAL_SUPPORT';
  attackType: 'EXPLOSIVE' | 'PIERCING' | 'MYSTIC' | 'SONIC';
  armorType: 'LIGHT' | 'HEAVY' | 'SPECIAL' | 'ELASTIC' | 'COMPOSITE' | 'NORMAL';
  iconUrl: string;
  isLimited: boolean;
  gear1Type: string;
  gear2Type: string;
  gear3Type: string;
}

export interface ParsedBoss {
  id: string;
  nameKo: string;
  nameEn: string;
  terrain: 'INDOOR' | 'OUTDOOR' | 'STREET';
  attackType: 'EXPLOSIVE' | 'PIERCING' | 'MYSTIC' | 'SONIC';
  armorType: 'LIGHT' | 'HEAVY' | 'SPECIAL' | 'ELASTIC' | 'COMPOSITE' | 'NORMAL';
  iconUrl: string;
  isReleased: boolean;
  hpByDifficulty: Record<string, number> | null;
}

export interface ParsedTotalAssaultSeason {
  seasonNumber: number;
  bossId: string;
  region: 'GLOBAL' | 'JP';
  startAt: Date;
  endAt: Date;
}

export interface ParsedGrandAssaultSeason {
  seasonNumber: number;
  bossId: string;
  region: 'GLOBAL' | 'JP';
  startAt: Date;
  endAt: Date;
  armorSlots: {
    slotIndex: number;
    armorType: string;
    difficultyMax: string;
  }[];
}

export interface ParsedAlternateForm {
  baseStudentId: string;
  alternateStudentId: string;
  label: string | null;
}
