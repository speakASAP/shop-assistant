#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_INPUT = path.join(
  process.cwd(),
  'reports',
  'ux',
  'sa-g4-t1-synthetic-usage-2026-06-12.json',
);
const DEFAULT_OUTPUT = path.join(
  process.cwd(),
  'reports',
  'ux',
  'sa-g4-t1-aggregate-metrics-2026-06-12.json',
);

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, output: DEFAULT_OUTPUT };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--input') {
      args.input = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--output') {
      args.output = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function countBy(items, keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function aggregate(fixture) {
  const sessions = fixture.sessions || [];
  const messages = fixture.messages || [];
  const searchRuns = fixture.searchRuns || [];
  const searchResults = fixture.searchResults || [];
  const choices = fixture.choices || [];
  const agentCommunications = fixture.agentCommunications || [];
  const accountProfiles = fixture.accountProfiles || [];
  const savedCriteria = fixture.savedCriteria || [];

  const sessionIds = new Set(sessions.map((item) => item.id));
  const querySessionIds = new Set(messages.filter((item) => item.role === 'user' && item.contentType !== 'feedback').map((item) => item.sessionId));
  const feedbackSessionIds = new Set(messages.filter((item) => item.contentType === 'feedback').map((item) => item.sessionId));
  const sessionsWithResults = new Set(searchRuns.filter((run) => searchResults.some((result) => result.searchRunId === run.id)).map((run) => run.sessionId));
  const sessionsWithChoices = new Set(choices.map((item) => item.sessionId));
  const sessionsWithSavedCriteria = new Set(sessions.filter((item) => item.usedSavedCriteriaId).map((item) => item.id));
  const zeroResultRuns = searchRuns.filter((run) => !searchResults.some((result) => result.searchRunId === run.id));
  const resultCountsByRun = searchRuns.map((run) => searchResults.filter((result) => result.searchRunId === run.id).length);
  const runsBySession = sessions.map((item) => searchRuns.filter((run) => run.sessionId === item.id).length);
  const agentErrors = agentCommunications.filter((item) => item.messageType === 'error');

  return {
    metadata: {
      source: fixture.metadata?.id || 'unknown-fixture',
      generatedAt: new Date().toISOString(),
      privacy: fixture.metadata?.privacy,
      urlPolicy: fixture.metadata?.urlPolicy,
    },
    counts: {
      sessions: sessions.length,
      userBoundSessions: sessions.filter((item) => item.userId).length,
      profileScopedSessions: sessions.filter((item) => item.profileId).length,
      priorityScopedSessions: sessions.filter((item) => item.priorityOrder).length,
      sessionsWithAtLeastOneQueryMessage: [...querySessionIds].filter((id) => sessionIds.has(id)).length,
      searchRuns: searchRuns.length,
      searchResults: searchResults.length,
      zeroResultSearchRuns: zeroResultRuns.length,
      choices: choices.length,
      messages: messages.length,
      feedbackMessages: messages.filter((item) => item.contentType === 'feedback').length,
      agentCommunications: agentCommunications.length,
      agentErrors: agentErrors.length,
      accountProfiles: accountProfiles.length,
      savedCriteria: savedCriteria.length,
      sessionsUsingSavedCriteria: sessionsWithSavedCriteria.size,
    },
    rates: {
      querySessionRate: percent(querySessionIds.size, sessions.length),
      zeroResultRunRate: percent(zeroResultRuns.length, searchRuns.length),
      sessionChoiceRate: percent(sessionsWithChoices.size, sessions.length),
      resultSessionChoiceRate: percent([...sessionsWithChoices].filter((id) => sessionsWithResults.has(id)).length, sessionsWithResults.size),
      feedbackAfterResultsRate: percent([...feedbackSessionIds].filter((id) => sessionsWithResults.has(id)).length, sessionsWithResults.size),
      profileAdoptionRate: percent(sessions.filter((item) => item.profileId).length, sessions.length),
      savedCriteriaSessionRate: percent(sessionsWithSavedCriteria.size, sessions.length),
      agentErrorSessionRate: percent(new Set(agentErrors.map((item) => item.sessionId)).size, sessions.length),
    },
    distributions: {
      searchRunsPerSession: {
        average: Number((runsBySession.reduce((sum, count) => sum + count, 0) / Math.max(1, runsBySession.length)).toFixed(2)),
        p50: percentile(runsBySession, 50),
        p90: percentile(runsBySession, 90),
        max: Math.max(0, ...runsBySession),
      },
      resultCountPerSearchRun: {
        average: Number((resultCountsByRun.reduce((sum, count) => sum + count, 0) / Math.max(1, resultCountsByRun.length)).toFixed(2)),
        p50: percentile(resultCountsByRun, 50),
        p90: percentile(resultCountsByRun, 90),
        max: Math.max(0, ...resultCountsByRun),
        buckets: countBy(resultCountsByRun, (count) => (count === 0 ? '0' : count <= 2 ? '1-2' : count <= 4 ? '3-4' : '5+')),
      },
    },
    agentErrorsByType: countBy(agentErrors, (item) => `${item.fromAgent}->${item.toAgent}`),
  };
}

function main() {
  const args = parseArgs(process.argv);
  const fixture = JSON.parse(fs.readFileSync(args.input, 'utf8'));
  const metrics = aggregate(fixture);
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(metrics, null, 2)}\n`);
  console.log(JSON.stringify(metrics, null, 2));
}

main();
