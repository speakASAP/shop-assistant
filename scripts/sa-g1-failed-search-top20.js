#!/usr/bin/env node

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function fingerprint(value) {
  return crypto.createHash('sha256').update(String(value || '').trim().toLowerCase()).digest('hex').slice(0, 16);
}

function average(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

async function main() {
  const limit = Math.max(20, Number.parseInt(process.env.SA_G1_FAILED_SEARCH_SAMPLE_LIMIT || '200', 10) || 200);
  const runs = await prisma.searchRun.findMany({
    where: { searchResults: { none: {} } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      sessionId: true,
      queryText: true,
      createdAt: true,
      rawSearchResponse: true,
      _count: { select: { searchResults: true } },
    },
  });

  const groups = new Map();
  for (const run of runs) {
    const key = fingerprint(run.queryText);
    const queryLength = String(run.queryText || '').length;
    const rawItemsCount = run.rawSearchResponse && typeof run.rawSearchResponse === 'object'
      ? Number(run.rawSearchResponse.items?.length ?? run.rawSearchResponse.itemsCount ?? 0) || 0
      : 0;
    const group = groups.get(key) || {
      queryFingerprint: key,
      count: 0,
      queryLengths: [],
      rawItemsCounts: [],
      firstSeenAt: run.createdAt,
      lastSeenAt: run.createdAt,
      sessionFingerprintSet: new Set(),
    };
    group.count += 1;
    group.queryLengths.push(queryLength);
    group.rawItemsCounts.push(rawItemsCount);
    if (run.createdAt < group.firstSeenAt) group.firstSeenAt = run.createdAt;
    if (run.createdAt > group.lastSeenAt) group.lastSeenAt = run.createdAt;
    group.sessionFingerprintSet.add(fingerprint(run.sessionId));
    groups.set(key, group);
  }

  const topFailedSearches = [...groups.values()]
    .sort((a, b) => b.count - a.count || a.queryFingerprint.localeCompare(b.queryFingerprint))
    .slice(0, 20)
    .map((group, index) => ({
      rank: index + 1,
      queryFingerprint: group.queryFingerprint,
      count: group.count,
      distinctSessionFingerprints: group.sessionFingerprintSet.size,
      queryLength: {
        min: Math.min(...group.queryLengths),
        max: Math.max(...group.queryLengths),
        average: average(group.queryLengths),
      },
      rawSearchItemsCount: {
        min: Math.min(...group.rawItemsCounts),
        max: Math.max(...group.rawItemsCounts),
        average: average(group.rawItemsCounts),
      },
      firstSeenAt: group.firstSeenAt,
      lastSeenAt: group.lastSeenAt,
    }));

  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: 'production-zero-result-search-runs',
      sampleLimit: limit,
      privacy: 'Hashed normalized query/session fingerprints and aggregate counts only. No raw query text, message content, merchant URLs, JWTs, secrets, lead details, profile names, or database URLs emitted.',
    },
    totals: {
      sampledZeroResultRuns: runs.length,
      uniqueQueryFingerprints: groups.size,
      topReturned: topFailedSearches.length,
    },
    topFailedSearches,
  };

  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
