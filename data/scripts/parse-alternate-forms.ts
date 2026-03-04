/**
 * SchaleDB students.json의 FavorAlts 필드에서 이격(AlternateForm) 관계를 추출합니다.
 *
 * 판별 로직:
 * - PathName에 언더스코어가 없는 학생 = 본체 (base)
 * - PathName에 언더스코어가 있는 학생 = 이격 (alternate)
 * - FavorAlts 배열에서 상호 참조 관계를 추적하여 본체-이격 매핑
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { SchaleDbStudent, ParsedAlternateForm } from './types';

const CACHE_DIR = join(process.cwd(), 'data', 'cache');
const OUTPUT_PATH = join(CACHE_DIR, 'parsed-alternate-forms.json');

// PathName에서 이격 라벨 추출
// 예: "azusa_swimsuit" → "수영복"
const ALT_LABEL_MAP: Record<string, string> = {
  swimsuit: '수영복',
  cycling: '자전거',
  newyear: '정월',
  dress: '드레스',
  cheerleader: '치어리더',
  camp: '캠프',
  band: '밴드',
  sportswear: '체육복',
  riding: '라이딩',
  bunny: '바니걸',
  maid: '메이드',
  hot_spring: '온천',
  small: '유년',
  default: '기본',
};

function extractLabel(pathName: string): string | null {
  const parts = pathName.split('_');
  if (parts.length <= 1) return null;

  // 마지막 부분 또는 언더스코어 이후 전체를 라벨로 사용
  const suffix = parts.slice(1).join('_');
  return ALT_LABEL_MAP[suffix] ?? suffix;
}

export function parseAlternateForms(): ParsedAlternateForm[] {
  const studentsKr: Record<string, SchaleDbStudent> = JSON.parse(
    readFileSync(join(CACHE_DIR, 'students-kr.json'), 'utf-8'),
  );

  // 숫자 ID → PathName 매핑 (Global 출시 학생만)
  const idToPathName = new Map<number, string>();
  for (const student of Object.values(studentsKr)) {
    if (student.IsReleased[1]) {
      idToPathName.set(student.Id, student.PathName);
    }
  }

  // 이격 관계 추출
  const forms: ParsedAlternateForm[] = [];
  const processed = new Set<string>();

  for (const student of Object.values(studentsKr)) {
    if (!student.IsReleased[1]) continue;
    if (!student.FavorAlts || student.FavorAlts.length === 0) continue;

    // 본체 판별: PathName에 언더스코어가 없는 것
    const isBase = !student.PathName.includes('_');
    if (!isBase) continue;

    // 이 학생의 이격들을 등록
    for (const altId of student.FavorAlts) {
      const altPathName = idToPathName.get(altId);
      if (!altPathName) continue;

      const key = `${student.PathName}:${altPathName}`;
      if (processed.has(key)) continue;
      processed.add(key);

      forms.push({
        baseStudentId: student.PathName,
        alternateStudentId: altPathName,
        label: extractLabel(altPathName),
      });
    }
  }

  console.log(`  이격 관계 ${forms.length}개 파싱 완료`);
  return forms;
}

if (require.main === module) {
  const result = parseAlternateForms();
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  결과 저장: ${OUTPUT_PATH}`);
}
