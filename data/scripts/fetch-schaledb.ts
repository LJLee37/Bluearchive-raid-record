/**
 * SchaleDB에서 학생/보스 데이터를 다운로드하여 data/cache/에 저장합니다.
 *
 * 사용법: pnpm seed:fetch
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), 'data', 'cache');

const URLS: Record<string, string> = {
  'students-kr.json': 'https://schaledb.com/data/kr/students.min.json',
  'students-en.json': 'https://schaledb.com/data/en/students.min.json',
  'raids-kr.json': 'https://schaledb.com/data/kr/raids.min.json',
  'raids-en.json': 'https://schaledb.com/data/en/raids.min.json',
};

async function fetchAndSave(filename: string, url: string): Promise<void> {
  const filepath = join(CACHE_DIR, filename);

  console.log(`  다운로드 중: ${filename}...`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.text();
    writeFileSync(filepath, data, 'utf-8');
    console.log(`  완료: ${filename} (${(data.length / 1024).toFixed(1)} KB)`);
  } catch (error) {
    // 네트워크 실패 시 캐시 데이터 사용 폴백
    if (existsSync(filepath)) {
      const cached = readFileSync(filepath, 'utf-8');
      console.warn(
        `  경고: ${filename} 다운로드 실패, 기존 캐시 사용 (${(cached.length / 1024).toFixed(1)} KB)`,
      );
      return;
    }
    throw new Error(`${filename} 다운로드 실패, 캐시도 없음: ${error}`);
  }
}

async function main() {
  console.log('SchaleDB 데이터 다운로드 시작\n');

  // 캐시 디렉토리 생성
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }

  // 모든 파일 병렬 다운로드
  await Promise.all(Object.entries(URLS).map(([filename, url]) => fetchAndSave(filename, url)));

  console.log('\n모든 데이터 다운로드 완료');
}

main().catch((error) => {
  console.error('다운로드 실패:', error);
  process.exit(1);
});
