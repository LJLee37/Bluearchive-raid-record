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
