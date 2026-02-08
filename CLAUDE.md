# Project Rules - NGO ERP

## Git & Commit Policy

- **NEVER add Claude as co-author** in any commit. No `Co-Authored-By` line.
- All commits must be authored solely by `sajeebce17@gmail.com`.
- Do not modify git user config.
- Follow conventional commit messages (e.g., `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).

## Tech Stack (2026 Latest Stable)

- **Framework**: Next.js 16.1.x (App Router, Turbopack)
- **UI Library**: React 19.2.x (React Compiler)
- **Language**: TypeScript 6.0.x (strict mode)
- **Styling**: Tailwind CSS 4.1.x + shadcn/ui
- **Database**: PostgreSQL 18.x with Prisma 7.x ORM
- **Cache**: Redis 7.x (ioredis)
- **Monorepo**: Turborepo 2.x (use `tasks` key in turbo.json, NOT `pipeline`)
- **Package Manager**: pnpm 10.x
- **Runtime**: Node.js 24.x LTS
- **Linting**: ESLint 10.x (flat config)
- **Charts**: Recharts 3.x

## Coding Standards

- Use Server Components by default; only add `'use client'` when strictly needed.
- Use the `use cache` directive for data caching (NOT the deprecated `unstable_cache`).
- Use `cacheLife()` and `cacheTag()` for cache management.
- Follow mobile-first responsive design.
- Ensure WCAG AA accessibility compliance (4.5:1 contrast ratio for text).
- All interactive elements must be keyboard accessible.

## Project Guidelines

- Reference `claude/skills/` for detailed guidelines on:
  - **Caching**: `claude/skills/cache-components/SKILL.md`
  - **Docker & DevOps**: `claude/skills/docker-devops/SKILL.md`
  - **Scalability**: `claude/skills/scalability/SKILL.md`
  - **Turborepo**: `claude/skills/turborepo/SKILL.md`
  - **Documentation**: `claude/skills/update-docs/SKILL.md`
  - **Web Design**: `claude/skills/web-design-guidelines/SKILL.md`
