#!/usr/bin/env node

const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function envFlag(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').toLowerCase());
}

function fail(message) {
  const error = new Error(message);
  error.isValidationFailure = true;
  throw error;
}

function fingerprint(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 16);
}

function countUrlStats(urls) {
  let httpUrlCount = 0;
  let invalidUrlCount = 0;
  for (const row of urls || []) {
    try {
      const parsed = new URL(String(row.url || ''));
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') httpUrlCount += 1;
      else invalidUrlCount += 1;
    } catch {
      invalidUrlCount += 1;
    }
  }
  return { httpUrlCount, invalidUrlCount };
}

function hasActionableNoResultsGuidance(messages) {
  const assistantText = (messages || [])
    .filter((message) => message.role === 'assistant' && message.contentType === 'text')
    .map((message) => String(message.content || '').toLowerCase())
    .join('\n');

  return [
    'could not find usable merchant results',
    'try refining',
    'product type or category',
    'brand, model, size, material, or color',
    'budget and delivery location',
    'real http or https merchant urls',
  ].every((fragment) => assistantText.includes(fragment));
}

async function findSessionId() {
  const explicit = String(process.env.SESSION_ID || '').trim();
  if (explicit) return explicit;
  if (!envFlag('FIND_LATEST_ZERO_RESULT')) fail('SESSION_ID is required unless FIND_LATEST_ZERO_RESULT=1');

  const run = await prisma.searchRun.findFirst({
    where: { searchResults: { none: {} } },
    orderBy: { createdAt: 'desc' },
    select: { sessionId: true },
  });
  if (!run) fail('No zero-result search run found');
  return run.sessionId;
}

async function main() {
  const sessionId = await findSessionId();
  const [session, messageBuckets, messages, runs, urls, agentBuckets] = await Promise.all([
    prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, createdAt: true, updatedAt: true, userId: true, profileId: true, usedSavedCriteriaId: true, priorityOrder: true },
    }),
    prisma.message.groupBy({ by: ['role', 'contentType'], where: { sessionId }, _count: { _all: true } }),
    prisma.message.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' }, select: { role: true, contentType: true, content: true } }),
    prisma.searchRun.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, queryText: true, rawSearchResponse: true, _count: { select: { searchResults: true } } },
    }),
    prisma.searchResult.findMany({ where: { searchRun: { sessionId } }, select: { url: true } }),
    prisma.agentCommunication.groupBy({ by: ['fromAgent', 'toAgent', 'messageType'], where: { sessionId }, _count: { _all: true } }),
  ]);

  if (!session) fail('Session not found');

  const urlStats = countUrlStats(urls);
  const zeroResultRuns = runs.filter((run) => run._count.searchResults === 0);
  const tableMessages = messageBuckets.filter((row) => row.contentType === 'table').reduce((sum, row) => sum + row._count._all, 0);
  const assistantTextMessages = messageBuckets.filter((row) => row.role === 'assistant' && row.contentType === 'text').reduce((sum, row) => sum + row._count._all, 0);
  const guidancePresent = hasActionableNoResultsGuidance(messages);
  const failures = [];

  if (runs.length < 1) failures.push('expected at least one search run');
  if (zeroResultRuns.length < 1) failures.push('expected at least one zero-result search run');
  if (assistantTextMessages < 1) failures.push('expected at least one assistant text message');
  if (!guidancePresent) failures.push('expected actionable no-results guidance in assistant text');
  if (tableMessages !== 0) failures.push('zero-result validation session should not include table messages');
  if (urlStats.invalidUrlCount > 0) failures.push('persisted result URLs must be HTTP or HTTPS only');

  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      privacy: 'Read-only zero-result validation. Raw query text, message content, merchant URLs, JWTs, secrets, lead details, profile names, and database URLs are not emitted.',
      mode: process.env.SESSION_ID ? 'explicit-session' : 'latest-zero-result-session',
    },
    session: {
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      hasUserId: Boolean(session.userId),
      hasProfileId: Boolean(session.profileId),
      hasUsedSavedCriteriaId: Boolean(session.usedSavedCriteriaId),
      hasPriorityOrder: Boolean(session.priorityOrder),
    },
    counts: {
      messages: messageBuckets.reduce((sum, row) => sum + row._count._all, 0),
      assistantTextMessages,
      tableMessages,
      searchRuns: runs.length,
      zeroResultSearchRuns: zeroResultRuns.length,
      searchResults: urls.length,
      httpResultUrls: urlStats.httpUrlCount,
      invalidResultUrls: urlStats.invalidUrlCount,
      agentCommunications: agentBuckets.reduce((sum, row) => sum + row._count._all, 0),
    },
    searchRuns: runs.map((run) => ({
      id: run.id,
      createdAt: run.createdAt,
      queryFingerprint: fingerprint(run.queryText),
      queryLength: String(run.queryText || '').length,
      resultCount: run._count.searchResults,
      rawSearchItemsCount: typeof run.rawSearchResponse === 'object' && run.rawSearchResponse ? run.rawSearchResponse.items ?? null : null,
    })),
    checks: {
      actionableNoResultsGuidancePresent: guidancePresent,
      hasZeroResultRun: zeroResultRuns.length > 0,
      tableMessagesSuppressed: tableMessages === 0,
      onlyHttpMerchantUrls: urlStats.invalidUrlCount === 0,
    },
    result: failures.length ? 'fail' : 'pass',
    failures,
  };

  console.log(JSON.stringify(output, null, 2));
  if (failures.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ result: 'fail', error: message }, null, 2));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
