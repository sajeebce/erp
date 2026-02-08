---
name: turborepo
description: This skill should be used when the user asks about "turborepo", "monorepo setup", "workspace configuration", "turbo.json", "tasks configuration", "build caching", "remote caching", "task orchestration", "dependency graph", or mentions "turbo run", "turbo build", "turbo dev". Provides guidance for Turborepo monorepo management.
---

# Turborepo Monorepo Management

Guides you through setting up and managing Turborepo 2.x monorepos with best practices.

## Quick Start

1. **Initialize**: `npx create-turbo@latest` or add to existing monorepo
2. **Configure**: Set up `turbo.json` with task definitions
3. **Run tasks**: Use `turbo run <task>` for cached task execution
4. **Optimize**: Enable remote caching for CI/CD

## turbo.json Configuration

> **Note**: In Turborepo 2.0+, the `pipeline` key was renamed to `tasks`.

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    }
  }
}
```

## Workspace Structure

```
my-turborepo/
├── apps/
│   ├── web/          # Next.js app
│   └── docs/         # Documentation site
├── packages/
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared configurations
│   └── tsconfig/     # Shared TypeScript configs
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

## Common Commands

```bash
# Run build in all workspaces
turbo run build

# Run dev in specific workspace
turbo run dev --filter=web

# Run with dependency awareness
turbo run build --filter=web...

# Prune for deployment
turbo prune --scope=web
```

## Task Configuration Options

### Dependencies

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    }
  }
}
```

The `^` microsyntax tells Turborepo to run the task in direct dependencies before the target package.

### Outputs

```json
{
  "tasks": {
    "build": {
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    }
  }
}
```

Outputs default to `["dist/**", "build/**"]`. Define all cacheable filesystem outputs.

### Environment Variables

```json
{
  "tasks": {
    "build": {
      "env": ["DATABASE_URL", "API_KEY"]
    }
  }
}
```

### Package-Specific Tasks

```json
{
  "tasks": {
    "web#build": {
      "env": ["API_SERVICE_KEY"]
    }
  }
}
```

### Persistent Tasks

```json
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Tasks marked as `persistent: true` run indefinitely (e.g., dev servers).

## Remote Caching

Enable remote caching for faster CI builds:

```bash
# Login to Vercel
npx turbo login

# Link to remote cache
npx turbo link
```

## Best Practices

1. **Keep tasks simple**: Define clear task dependencies
2. **Use filters**: Target specific workspaces to reduce build time
3. **Cache outputs**: Define all build outputs for effective caching
4. **Shared configs**: Centralize ESLint, TypeScript, and other configs
5. **Internal packages**: Use `"main": "./src/index.ts"` for development

## Migration from Turborepo 1.x

If upgrading from Turborepo 1.x, run the codemod:

```bash
npx @turbo/codemod migrate
```

This will automatically rename `pipeline` to `tasks` and apply other breaking changes.

## Troubleshooting

- **Cache misses**: Check `globalDependencies` and `inputs` configuration
- **Circular dependencies**: Review workspace imports with `turbo run build --graph`
- **Slow builds**: Enable remote caching and check task dependencies
