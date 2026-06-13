#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));

function envFlag(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').toLowerCase());
}

function usage() {
  console.log(`Usage: SESSION_ID=<id> node scripts/verify-query-persistence.js
       RUN_SYNTHETIC_QUERY=1 SYNTHETIC_QUERY=<text> node scripts/verify-query-persistence.js

Verifies that a Shop Assistant query session persisted messages, search runs, results,
and agent communications without printing query text, message content, tokens, secrets,
lead details, profile names, merchant URLs, or database URLs.

Environment:
  SESSION_ID             Existing session to inspect. No writes are performed.
  BASE_URL               API base URL for synthetic mode. Default: https://shop-assistant.alfares.cz
  RUN_SYNTHETIC_QUERY    Set to 1 to create a synthetic session and submit SYNTHETIC_QUERY.
  SYNTHETIC_QUERY        Required in synthetic mode. Never printed.
  SYNTHETIC_USER_ID      Optional synthetic user id. Default is timestamped.
  REQUIRE_RESULTS        Set to 1 to fail when the verified query has zero results.
`);
}

function fail(message) {
  const error = new Error(message);
  error.isValidationFailure = true;
  throw error;
}

function sanitizeBaseUrl(value) {
  return String(value || 'https://shop-assistant.alfares.cz').replace(/\/+$/, '');
}

async function postJson(baseUrl, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  return { status: response.status, json };
}

function countHttpUrls(results) {
  let httpUrlCount = 0;
  let invalidUrlCount = 0;
  for (const result of results || []) {
    try {
      const parsed = new URL(String(result.url || ''));
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        httpUrlCount += 1;
      } else {
        invalidUrlCount += 1;
      }
    } catch {
      invalidUrlCount += 1;
    }
  }
  return { httpUrlCount, invalidUrlCount };
}

async function createSyntheticQuery() {
  const query = String(process.env.SYNTHETIC_QUERY || '').trim();
  if (!query) fail('SYNTHETIC_QUERY is required when RUN_SYNTHETIC_QUERY=1');

  const baseUrl = sanitizeBaseUrl(process.env.BASE_URL);
  const syntheticUserId = String(process.env.SYNTHETIC_USER_ID || `synthetic-query-persistence-${new Date().toISOString().slice(0, 10)}-${Date.now()}`);

  const sessionResponse = await postJson(baseUrl, '/api/sessions', {
    userId: syntheticUserId,
    priorities: ['price', 'quality'],
  });
  if (sessionResponse.status !== 201 || !sessionResponse.json?.sessionId) {
    fail(`Synthetic session create failed with HTTP ${sessionResponse.status}`);
  }

  const sessionId = sessionResponse.json.sessionId;
  const queryResponse = await postJson(baseUrl, `/api/sessions/${encodeURIComponent(sessionId)}/query`, {
    text: query,
    priorities: ['price', 'quality'],
  });
  if (queryResponse.status !== 201) {
    fail(`Synthetic query submit failed with HTTP ${queryResponse.status}`);
  }

  const resultStats = countHttpUrls(queryResponse.json?.results || []);
  return {
    sessionId,
    synthetic: {
      baseUrl,
      sessionCreateStatus: sessionResponse.status,
      queryStatus: queryResponse.status,
      resultCount: Array.isArray(queryResponse.json?.results) ? queryResponse.json.results.length : 0,
      httpUrlCount: resultStats.httpUrlCount,
      invalidUrlCount: resultStats.invalidUrlCount,
    },
  };
}

async function inspectSession(sessionId, synthetic) {
  const [session, messageCounts, searchRuns, resultStats, agentCounts] = await Promise.all([
    prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        profileId: true,
        usedSavedCriteriaId: true,
        priorityOrder: true,
      },
    }),
    prisma.message.groupBy({
      by: ['role', 'contentType'],
      where: { sessionId },
      _count: { _all: true },
    }),
    prisma.searchRun.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
        rawSearchResponse: true,
        _count: { select: { searchResults: true } },
      },
    }),
    prisma.searchResult.groupBy({
      by: ['searchRunId'],
      where: { searchRun: { sessionId } },
      _count: { _all: true },
    }),
    prisma.agentCommunication.groupBy({
      by: ['fromAgent', 'toAgent', 'messageType'],
      where: { sessionId },
      _count: { _all: true },
    }),
  ]);

  if (!session) fail('Session not found');

  const urls = await prisma.searchResult.findMany({
    where: { searchRun: { sessionId } },
    select: { url: true },
  });
  const urlStats = countHttpUrls(urls);

  const counts = {
    messages: messageCounts.reduce((sum, row) => sum + row._count._all, 0),
    userMessages: messageCounts.filter((row) => row.role === 'user').reduce((sum, row) => sum + row._count._all, 0),
    assistantMessages: messageCounts.filter((row) => row.role === 'assistant').reduce((sum, row) => sum + row._count._all, 0),
    tableMessages: messageCounts.filter((row) => row.contentType === 'table').reduce((sum, row) => sum + row._count._all, 0),
    searchRuns: searchRuns.length,
    searchResults: resultStats.reduce((sum, row) => sum + row._count._all, 0),
    zeroResultSearchRuns: searchRuns.filter((run) => run._count.searchResults === 0).length,
    agentCommunications: agentCounts.reduce((sum, row) => sum + row._count._all, 0),
    agentErrors: agentCounts.filter((row) => row.messageType === 'error').reduce((sum, row) => sum + row._count._all, 0),
    httpResultUrls: urlStats.httpUrlCount,
    invalidResultUrls: urlStats.invalidUrlCount,
  };

  const failures = [];
  if (counts.messages < 2) failures.push('expected at least 2 persisted messages');
  if (counts.userMessages < 1) failures.push('expected at least 1 user message');
  if (counts.assistantMessages < 1) failures.push('expected at least 1 assistant message');
  if (counts.searchRuns < 1) failures.push('expected at least 1 search run');
  if (counts.agentCommunications < 2) failures.push('expected at least 2 agent communications');
  if (counts.invalidResultUrls > 0) failures.push('expected every persisted result URL to use HTTP or HTTPS');
  if (envFlag('REQUIRE_RESULTS') && counts.searchResults < 1) failures.push('expected at least 1 persisted search result because REQUIRE_RESULTS=1');

  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      privacy: 'Sanitized persistence validation only. Query text, message content, profile names, lead details, JWTs, secrets, merchant URLs, and database URLs are not emitted.',
      mode: synthetic ? 'synthetic-query' : 'existing-session-read-only',
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
    synthetic: synthetic || undefined,
    counts,
    searchRuns: searchRuns.map((run) => ({
      id: run.id,
      createdAt: run.createdAt,
      resultCount: run._count.searchResults,
      rawSearchItemsCount: typeof run.rawSearchResponse === 'object' && run.rawSearchResponse ? run.rawSearchResponse.items ?? null : null,
    })),
    agentCommunicationBuckets: agentCounts.map((row) => ({
      fromAgent: row.fromAgent,
      toAgent: row.toAgent,
      messageType: row.messageType,
      count: row._count._all,
    })),
    result: failures.length ? 'fail' : 'pass',
    failures,
  };

  console.log(JSON.stringify(output, null, 2));
  if (failures.length) process.exitCode = 1;
}

async function main() {
  if (args.has('--help') || args.has('-h')) {
    usage();
    return;
  }

  let sessionId = process.env.SESSION_ID;
  let synthetic = null;

  if (envFlag('RUN_SYNTHETIC_QUERY')) {
    const created = await createSyntheticQuery();
    sessionId = created.sessionId;
    synthetic = created.synthetic;
  }

  if (!sessionId) {
    usage();
    process.exitCode = 2;
    return;
  }

  await inspectSession(sessionId, synthetic);
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ result: 'fail', error: message }, null, 2));
    process.exitCode = error && error.isValidationFailure ? 1 : 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
