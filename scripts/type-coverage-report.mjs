#!/usr/bin/env node

/**
 * TAC Portal — Type Coverage Report
 *
 * Scans the codebase and reports type safety metrics:
 *   - `any` type usage
 *   - `as unknown as` casts
 *   - `@ts-ignore` / `@ts-expect-error` suppressions
 *   - `console.log` file count
 *   - `dangerouslySetInnerHTML` usage
 *
 * Usage: node scripts/type-coverage-report.mjs
 */

import { execSync } from 'child_process';

const EXCLUDES =
    '--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.archive --exclude-dir=coverage';
const INCLUDES = '--include="*.ts" --include="*.tsx"';

function count(pattern, extra = '') {
    try {
        const cmd = `grep -rE ${JSON.stringify(pattern)} ${INCLUDES} ${EXCLUDES} ${extra} . 2>/dev/null | wc -l`;
        return parseInt(execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() }).trim(), 10) || 0;
    } catch {
        return 0;
    }
}

function countFiles(pattern) {
    try {
        const cmd = `grep -rl ${JSON.stringify(pattern)} ${INCLUDES} ${EXCLUDES} . 2>/dev/null | wc -l`;
        return parseInt(execSync(cmd, { encoding: 'utf-8', cwd: process.cwd() }).trim(), 10) || 0;
    } catch {
        return 0;
    }
}

// ── Metrics ──
const anyCount = count(': any|as any');
const unknownCasts = count('as unknown as');
const tsIgnore = count('@ts-ignore|@ts-expect-error');
const consoleLogFiles = countFiles('console\\.log');
const dangerousHTML = countFiles('dangerouslySetInnerHTML');
const eslintDisables = count('eslint-disable');

// ── Thresholds ──
const thresholds = {
    any: 200,
    unknownCasts: 10,
    tsIgnore: 20,
    consoleLogFiles: 50,
    dangerousHTML: 5,
    eslintDisables: 30,
};

// ── Output ──
console.log('');
console.log('╔══════════════════════════════════════════════════╗');
console.log('║       TAC Portal — Type Coverage Report         ║');
console.log('╠══════════════════════════════════════════════════╣');
console.log('');

const rows = [
    ['`any` type instances', anyCount, thresholds.any],
    ['`as unknown as` casts', unknownCasts, thresholds.unknownCasts],
    ['`@ts-ignore/@ts-expect-error`', tsIgnore, thresholds.tsIgnore],
    ['Files with `console.log`', consoleLogFiles, thresholds.consoleLogFiles],
    ['`dangerouslySetInnerHTML` files', dangerousHTML, thresholds.dangerousHTML],
    ['`eslint-disable` comments', eslintDisables, thresholds.eslintDisables],
];

const nameWidth = 34;
const numWidth = 8;

console.log(
    `  ${'Metric'.padEnd(nameWidth)} ${'Count'.padStart(numWidth)} ${'Limit'.padStart(numWidth)}  Status`
);
console.log(`  ${'─'.repeat(nameWidth)} ${'─'.repeat(numWidth)} ${'─'.repeat(numWidth)}  ──────`);

let hasFailure = false;

for (const [name, value, limit] of rows) {
    const status = value <= limit ? '✅' : '❌';
    if (value > limit) hasFailure = true;
    console.log(
        `  ${name.padEnd(nameWidth)} ${String(value).padStart(numWidth)} ${String(limit).padStart(numWidth)}  ${status}`
    );
}

console.log('');
console.log('╚══════════════════════════════════════════════════╝');
console.log('');

if (hasFailure) {
    console.log('⚠️  Some metrics exceed thresholds. See DEVSECOPS_CHECKLIST.md for guidance.');
    process.exit(1);
} else {
    console.log('✅ All type coverage metrics within acceptable limits.');
}
