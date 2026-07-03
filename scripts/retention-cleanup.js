#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const DEFAULT_TTL_DAYS = 30;
const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 1000;
const APPLY_CONFIRMATION = 'delete-old-anonymous-sessions';

const args = new Set(process.argv.slice(2));

function usage() {
  console.log(`Usage: node scripts/retention-cleanup.js [--dry-run] [--apply]

Deletes old anonymous Shop Assistant sessions by TTL. Dry-run is the default.
The runner only targets Session rows where userId IS NULL; account-bound
sessions are never selected by this script.

Options:
  --dry-run                  Count eligible sessions without deleting anything. Default.
  --apply                    Delete eligible anonymous sessions in batches.
  --help                     Show this help text.

Environment:
  DATABASE_URL                         PostgreSQL connection string for Prisma.
  RETENTION_ANONYMOUS_SESSION_TTL_DAYS Session age threshold in days. Default: ${DEFAULT_TTL_DAYS}.
  RETENTION_CLEANUP_BATCH_SIZE         Delete batch size. Default: ${DEFAULT_BATCH_SIZE}; max: ${MAX_BATCH_SIZE}.
  RETENTION_CLEANUP_APPLY_CONFIRM      Required for --apply; must equal "${APPLY_CONFIRMATION}".

Safety contract:
  - dry-run is the default and performs no writes;
  - --apply requires an explicit confirmation environment variable;
  - only anonymous sessions (Session.userId IS NULL) older than the TTL cutoff are deleted;
  - Prisma cascade deletes child messages, search runs, results, choices, and agent logs;
  - output is aggregate-only and does not print raw queries, messages, result URLs, JWTs, secrets, lead details, profile names, or database URLs.
`);
}

function parsePositiveInteger(value, fallback, name, max) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  if (max && parsed > max) return max;
  return parsed;
}

function getConfig() {
  const ttlDays = parsePositiveInteger(
    process.env.RETENTION_ANONYMOUS_SESSION_TTL_DAYS,
    DEFAULT_TTL_DAYS,
    'RETENTION_ANONYMOUS_SESSION_TTL_DAYS',
  );
  const batchSize = parsePositiveInteger(
    process.env.RETENTION_CLEANUP_BATCH_SIZE,
    DEFAULT_BATCH_SIZE,
    'RETENTION_CLEANUP_BATCH_SIZE',
    MAX_BATCH_SIZE,
  );
  const cutoff = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);
  return { ttlDays, batchSize, cutoff };
}

function assertMode() {
  if (args.has('--help') || args.has('-h')) {
    usage();
    return 'help';
  }
  if (args.has('--dry-run') && args.has('--apply')) {
    throw new Error('Use either --dry-run or --apply, not both');
  }
  return args.has('--apply') ? 'apply' : 'dry-run';
}

function assertApplyConfirmed() {
  if (process.env.RETENTION_CLEANUP_APPLY_CONFIRM !== APPLY_CONFIRMATION) {
    throw new Error(`--apply requires RETENTION_CLEANUP_APPLY_CONFIRM=${APPLY_CONFIRMATION}`);
  }
}

function buildWhere(cutoff) {
  return {
    userId: null,
    createdAt: { lt: cutoff },
  };
}

async function summarize(prisma, where) {
  const [eligibleCount, oldest, newest] = await Promise.all([
    prisma.session.count({ where }),
    prisma.session.findFirst({ where, orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
    prisma.session.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
  ]);
  return {
    eligibleAnonymousSessions: eligibleCount,
    oldestEligibleCreatedAt: oldest ? oldest.createdAt.toISOString() : null,
    newestEligibleCreatedAt: newest ? newest.createdAt.toISOString() : null,
  };
}

async function deleteBatch(prisma, where, batchSize) {
  const rows = await prisma.session.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: batchSize,
    select: { id: true },
  });
  if (!rows.length) return 0;

  const result = await prisma.session.deleteMany({
    where: {
      id: { in: rows.map((row) => row.id) },
      userId: null,
    },
  });
  return result.count;
}

async function main() {
  const mode = assertMode();
  if (mode === 'help') return;
  const config = getConfig();
  if (mode === 'apply') assertApplyConfirmed();

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const where = buildWhere(config.cutoff);
    const before = await summarize(prisma, where);
    let deletedAnonymousSessions = 0;
    let batches = 0;

    if (mode === 'apply') {
      while (true) {
        const deleted = await deleteBatch(prisma, where, config.batchSize);
        if (!deleted) break;
        deletedAnonymousSessions += deleted;
        batches += 1;
      }
    }

    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        mode,
        dryRun: mode !== 'apply',
        privacy: 'Aggregate retention cleanup report only. No raw queries, messages, result URLs, JWTs, secrets, lead details, profile names, or database URLs emitted.',
      },
      contract: {
        target: 'Session rows where userId IS NULL only',
        ttlField: 'Session.createdAt',
        ttlDays: config.ttlDays,
        cutoff: config.cutoff.toISOString(),
        batchSize: config.batchSize,
        accountBoundSessionsDeleted: 0,
      },
      before,
      result: {
        deletedAnonymousSessions,
        batches,
        mutationSkipped: mode !== 'apply',
      },
    };

    console.log(JSON.stringify(output, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
