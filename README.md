# unused

A CLI that finds unused files, exports, and dependencies in a TypeScript/JavaScript project - with a confidence score and a reason for every result, instead of a flat yes/no.

> **Status:** early v1. Core detection works; not yet published to npm.

## Why confidence scores?

Most dead-code tools give you a binary "unused" flag. In practice that's often wrong - a barrel file's exports are meant to be used externally, a `devDependency` might be invoked through an npm script instead of an `import`. `unused` tries to be honest about how sure it actually is, and tells you *why*, so you're not blindly deleting things a tool was overconfident about.

## Installation

This isn't published to npm yet - run it from source:

```bash
git clone https://github.com/codebyrashel/unused.git
cd unused
npm install
npm run build
npm link
```

## Usage

```bash
unused scan [path-to-tsconfig]
```

- `path-to-tsconfig` - optional, defaults to `./tsconfig.json`
- `--json` - output machine-readable JSON instead of formatted text, for scripting or CI

## Examples

```bash
# Scan the current project
unused scan

# Scan a project in another directory
unused scan ../my-other-project/tsconfig.json

# Get JSON output
unused scan --json
```


## Example output

```
$ unused scan

Scanning using: ./tsconfig.json

Summary: 2 possible issue(s) — 0 file(s), 0 export(s), 2 dependency(s)

Unused dependencies (2):
  15%  tsdown  (devDependency)
       Invoked in npm script "build" — likely a build/CLI tool, not meant to be imported.
  50%  typescript  (devDependency)
       Dev dependency with no import and no matching npm script. Could be a build tool used via config file.
```

## What it checks

- **Unused files** - files never imported anywhere in the project (entry points like `index.ts`/`cli.ts`/`main.ts` are excluded)
- **Unused exports** - exported functions, classes, and variables never referenced outside the file that declares them (type-only exports — interfaces, type aliases — are skipped in this version; barrel files like `index.ts` get lower confidence, since their exports are often meant for external consumers)
- **Unused dependencies** - packages in `package.json` never `import`ed and never referenced in an npm script

## Known limitations

- **Config-file usage isn't detected.** A `devDependency` like `typescript` or `eslint` is often used only through a config file (`tsconfig.json`, `eslint.config.js`) rather than an `import` or an npm script. This tool doesn't check for that yet, so those packages will show up at ~50% confidence with a note to verify manually - that's an honest "not sure," not a false positive.
- **No dynamic import detection.** Files/dependencies only loaded via dynamic `import()` calls, string-based `require()`, or bundler-specific config aren't tracked.
- **Single-project scans only.** No monorepo/workspace awareness yet — point it at one `tsconfig.json` at a time.