/**
 * 모든 파서를 순서대로 실행하여 파싱된 결과를 data/cache/에 저장합니다.
 *
 * 사용법: pnpm seed:parse
 */
import { writeFileSync } from 'fs';
import { join } from 'path';
import { parseStudents } from './parse-students';
import { parseBosses } from './parse-bosses';
import { parseSeasons } from './parse-seasons';
import { parseAlternateForms } from './parse-alternate-forms';

const CACHE_DIR = join(process.cwd(), 'data', 'cache');

function main() {
  console.log('SchaleDB 데이터 파싱 시작\n');

  console.log('[1/4] 학생 데이터 파싱...');
  const students = parseStudents();
  writeFileSync(join(CACHE_DIR, 'parsed-students.json'), JSON.stringify(students, null, 2));

  console.log('[2/4] 보스 데이터 파싱...');
  const bosses = parseBosses();
  writeFileSync(join(CACHE_DIR, 'parsed-bosses.json'), JSON.stringify(bosses, null, 2));

  console.log('[3/4] 시즌 데이터 파싱...');
  const seasons = parseSeasons();
  writeFileSync(join(CACHE_DIR, 'parsed-seasons.json'), JSON.stringify(seasons, null, 2));

  console.log('[4/4] 이격 관계 파싱...');
  const alternateForms = parseAlternateForms();
  writeFileSync(
    join(CACHE_DIR, 'parsed-alternate-forms.json'),
    JSON.stringify(alternateForms, null, 2),
  );

  console.log('\n파싱 완료 요약:');
  console.log(`  학생: ${students.length}명`);
  console.log(`  보스: ${bosses.length}개`);
  console.log(`  총력전 시즌: ${seasons.totalAssault.length}개`);
  console.log(`  대결전 시즌: ${seasons.grandAssault.length}개`);
  console.log(`  이격 관계: ${alternateForms.length}개`);
}

main();
