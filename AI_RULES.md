# AI Common Instructions & Git Rules

This file outlines the mandatory protocols and conventions for AI agents and developers working on the `bluearchive-record` project. All AI agents must read and adhere to these rules before performing any Git operations or code modifications.

## 1. Git Configuration (CRITICAL)

### GPG Signing

- **DISABLE GPG SIGNING:** GPG signing must be explicitly disabled for this project to avoid commit failures in environments without GPG keys.
- **Action:** Ensure `git config commit.gpgsign false` is applied or passed as a flag if necessary.
- **Troubleshooting:** If a commit fails due to "gpg failed to sign the data", immediately retry with `--no-gpg-sign`.

## 2. Branching Strategy

### Granularity

- **Feature Isolation:** Do NOT develop all features of a single project phase on one branch.
- **Rule:** Break down phases into smaller, distinct features and create a separate branch for each.
  - ❌ **Bad:** Working on UI, API, and DB all in `phase-1/dev`.
  - ✅ **Good:** `feature/login-ui`, `feature/auth-api`, `feature/db-schema`.

### Naming Convention

- **Format:** `type/description-kebab-case`
- **Types:**
  - `feature/`: New features
  - `fix/`: Bug fixes
  - `refactor/`: Code refactoring
  - `chore/`: Build tasks, config updates
  - `docs/`: Documentation changes

## 3. Commit Message Convention

### Style

- **Standard:** Use [Conventional Commits](https://www.conventionalcommits.org/).
- **Emoji:** **Avoid excessive use of emojis.** Keep messages professional and text-based.
- **Language:** Korean (unless otherwise specified).

### Format

`<type>: <description>`

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Examples

- ✅ `feat: 사용자 로그인 API 구현`
- ✅ `fix: 모바일 화면에서 네비게이션 바 깨짐 수정`
- ❌ `✨ feat: 로그인 추가!` (Avoid emojis)
- ❌ `Update files` (Too vague)

## 4. General Workflow

1.  **Context Check:** Always run `ls -F` and `git status` to understand the current directory state before taking action.
2.  **Safety:** Do not delete or overwrite existing configuration files without explicit user confirmation.
3.  **Verification:** After writing code, verify syntax or run build commands if applicable before committing.

## 5. System Privileges & Environment Constraints

### sudo 권한 없음

- AI 에이전트는 **`sudo` 권한을 보유하지 않는다.** `sudo`가 포함된 명령을 직접 실행해서는 안 된다.
- `sudo`가 필요한 작업이 발생할 경우:
  1. 왜 `sudo`가 필요한지 **사유를 사용자에게 명확히 설명**한다.
  2. 실행해야 할 **구체적인 명령어를 제시**한다.
  3. **사용자가 직접 해당 명령을 실행**하도록 안내한다.
- 예시:
  - ❌ `sudo apt install postgresql` (AI가 직접 실행)
  - ✅ "PostgreSQL 설치가 필요합니다. 다음 명령을 직접 실행해 주세요: `sudo apt install postgresql`"

### 임시 디렉토리 정책

- 임시 파일이나 디렉토리가 필요한 경우, **프로젝트 외부 경로를 사용하지 않는다.**
  - ❌ `/tmp/`, `/var/tmp/`, `~/tmp/` 등 시스템/사용자 홈 경로 사용 금지
  - ✅ 프로젝트 루트 하위에 `.tmp/` 또는 `tmp/` 디렉토리를 생성하여 사용
- 임시 디렉토리를 생성할 경우 `.gitignore`에 해당 경로가 포함되어 있는지 확인하고, 없으면 추가한다.
- 작업 완료 후 불필요한 임시 파일은 정리(삭제)한다.

## 6. Work Logging (작업 로그 기록)

- 각 작업(세션)이 완료되면 **`DEVLOG.md`에 로그를 기록**한다.
- 로그에 포함할 항목:
  1. **타임스탬프** (KST 기준, `YYYY-MM-DD HH:MM` 형식)
  2. **완료한 작업** — 이번 세션에서 AI가 완료한 항목을 체크리스트 형태로 기술
  3. **사용자 직접 액션 필요** — 사용자가 직접 해야 하는 항목과 그 이유를 명시 (sudo 명령, OAuth 앱 등록, 환경변수 설정, 외부 서비스 가입 등)
  4. **다음 AI 세션 할 일** — 다음 세션에서 AI가 이어서 할 작업 목록
  5. **주목할 점** — 향후 작업에 영향을 줄 수 있는 변경사항, 주의사항, 발견 사항
- 작업 내용에 따라 `README.md`, `plan.md` 등 관련 문서에도 필요한 업데이트를 반영한다.

### TODO.md 동기화 (필수)

- 세션 완료 시 반드시 **`TODO.md`를 DEVLOG와 함께 업데이트**한다.
  - 이번 세션에서 완료된 항목: `[ ]` → `[x]` 로 체크
  - 새로 발견된 작업 항목: 적절한 섹션에 추가
  - DEVLOG와 TODO.md는 항상 일관된 상태를 유지해야 한다.

### 로그 포맷

```markdown
### YYYY-MM-DD HH:MM (KST) — 작업 제목

**완료한 작업:**

- [x] 완료한 항목 1
- [x] 완료한 항목 2

**사용자 직접 액션 필요:**

- [ ] 사용자가 해야 할 항목 1
  - 이유: (AI가 직접 할 수 없는 이유 명시)
  - 명령/방법: `구체적인 명령어 또는 절차`
- [ ] 사용자가 해야 할 항목 2
  - 이유: ...

**다음 AI 세션 할 일:**

- [ ] 다음에 AI가 진행할 작업 1
- [ ] 다음에 AI가 진행할 작업 2

**주목할 점:**

- 특이사항 1
```
