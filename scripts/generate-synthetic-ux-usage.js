#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_OUTPUT = path.join(
  process.cwd(),
  'reports',
  'ux',
  'sa-g4-t1-synthetic-usage-2026-06-12.json',
);

function parseArgs(argv) {
  const args = { output: DEFAULT_OUTPUT };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--output') {
      args.output = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function iso(minutes) {
  const start = new Date('2026-06-12T08:00:00.000Z');
  return new Date(start.getTime() + minutes * 60_000).toISOString();
}

function session(index, fields) {
  return {
    id: `synth-session-${String(index).padStart(2, '0')}`,
    createdAt: iso(index * 13),
    updatedAt: iso(index * 13 + 8),
    userId: fields.userId ?? null,
    profileId: fields.profileId ?? null,
    priorityOrder: fields.priorityOrder ?? null,
    entryPoint: fields.entryPoint,
    usedSavedCriteriaId: fields.usedSavedCriteriaId ?? null,
  };
}

function message(sessionId, offset, role, contentType, content) {
  return {
    id: `synth-message-${sessionId}-${String(offset).padStart(2, '0')}`,
    sessionId,
    role,
    contentType,
    content,
    createdAt: iso(Number(sessionId.slice(-2)) * 13 + offset),
  };
}

function searchRun(sessionId, index, queryText, resultCount, options = {}) {
  return {
    id: `synth-search-${sessionId}-${index}`,
    sessionId,
    queryText,
    refinedParams: {
      category: options.category,
      priorities: options.priorities ?? ['price', 'quality'],
      synthetic: true,
    },
    rawSearchResponse: {
      fixture: true,
      resultCount,
      recoveryAttempt: options.recoveryAttempt ?? 0,
    },
    createdAt: iso(Number(sessionId.slice(-2)) * 13 + index + 1),
  };
}

function searchResult(runId, position, title) {
  return {
    id: `synth-result-${runId}-${position}`,
    searchRunId: runId,
    title,
    url: `https://synthetic.invalid/shop-assistant/${runId}/${position}`,
    price: position === 1 ? 'synthetic-low' : 'synthetic-comparison',
    source: 'synthetic-fixture',
    position,
    snippet: 'Synthetic fixture result. Not a merchant URL and not user-facing evidence.',
    createdAt: iso(210 + position),
  };
}

function agentCommunication(sessionId, index, fromAgent, toAgent, messageType) {
  return {
    id: `synth-agent-${sessionId}-${index}`,
    sessionId,
    fromAgent,
    toAgent,
    messageType,
    content: `Synthetic ${messageType} event for aggregate UX metrics only.`,
    metadata: { synthetic: true, workflowId: `synth-flow-${sessionId}` },
    createdAt: iso(Number(sessionId.slice(-2)) * 13 + index),
  };
}

function buildFixture() {
  const userA = 'synthetic-user-family';
  const userB = 'synthetic-user-office';
  const profileA = 'synth-profile-parent';
  const profileB = 'synth-profile-student';

  const sessions = [
    session(1, { userId: userA, profileId: profileA, priorityOrder: ['price', 'quality', 'delivery'], entryPoint: 'public' }),
    session(2, { userId: userA, profileId: profileB, priorityOrder: ['quality', 'price'], entryPoint: 'test', usedSavedCriteriaId: 'synth-criteria-school' }),
    session(3, { entryPoint: 'public' }),
    session(4, { userId: userB, priorityOrder: ['delivery', 'price'], entryPoint: 'public' }),
    session(5, { userId: userA, profileId: profileA, priorityOrder: ['price'], entryPoint: 'test', usedSavedCriteriaId: 'synth-criteria-home' }),
    session(6, { entryPoint: 'public' }),
    session(7, { userId: userB, priorityOrder: ['quality', 'location'], entryPoint: 'admin-test' }),
    session(8, { userId: userA, priorityOrder: ['price', 'delivery'], entryPoint: 'public' }),
    session(9, { userId: userA, profileId: profileB, priorityOrder: ['quality'], entryPoint: 'public' }),
    session(10, { userId: userB, entryPoint: 'public' }),
    session(11, { userId: userA, priorityOrder: ['price', 'quality'], entryPoint: 'test', usedSavedCriteriaId: 'synth-criteria-home' }),
    session(12, { entryPoint: 'public' }),
  ];

  const messages = [
    message('synth-session-01', 1, 'user', 'text', 'Synthetic request: compare cordless vacuum options by price and delivery.'),
    message('synth-session-01', 3, 'assistant', 'text', 'Synthetic response with comparison results.'),
    message('synth-session-01', 7, 'user', 'feedback', 'Synthetic feedback: prefer quieter models.'),
    message('synth-session-02', 1, 'user', 'text', 'Synthetic request: school backpack with durable material.'),
    message('synth-session-02', 4, 'assistant', 'text', 'Synthetic response with ranked options.'),
    message('synth-session-03', 1, 'user', 'text', 'Synthetic request: rare spare part with exact dimensions.'),
    message('synth-session-03', 5, 'assistant', 'text', 'Synthetic empty-state response.'),
    message('synth-session-04', 1, 'user', 'voice', 'Synthetic voice request converted to text for aggregate-only fixture.'),
    message('synth-session-04', 4, 'assistant', 'text', 'Synthetic response with delivery-focused options.'),
    message('synth-session-05', 1, 'user', 'text', 'Synthetic saved criteria reuse request for household staples.'),
    message('synth-session-05', 4, 'assistant', 'text', 'Synthetic response with reusable comparison.'),
    message('synth-session-05', 8, 'user', 'feedback', 'Synthetic feedback: only show compact items.'),
    message('synth-session-06', 1, 'user', 'text', 'Synthetic request: ambiguous gift idea.'),
    message('synth-session-06', 5, 'assistant', 'text', 'Synthetic clarification prompt.'),
    message('synth-session-07', 1, 'user', 'text', 'Synthetic admin test request for result diagnostics.'),
    message('synth-session-07', 3, 'assistant', 'text', 'Synthetic diagnostics-ready response.'),
    message('synth-session-08', 1, 'user', 'text', 'Synthetic request: running shoes under budget.'),
    message('synth-session-08', 5, 'assistant', 'text', 'Synthetic response with product options.'),
    message('synth-session-09', 1, 'user', 'text', 'Synthetic request: tablet for student note taking.'),
    message('synth-session-09', 4, 'assistant', 'text', 'Synthetic response with comparison results.'),
    message('synth-session-09', 7, 'user', 'feedback', 'Synthetic feedback: prioritize battery life.'),
    message('synth-session-10', 1, 'user', 'text', 'Synthetic request: small desk lamp.'),
    message('synth-session-10', 4, 'assistant', 'text', 'Synthetic response with options.'),
    message('synth-session-11', 1, 'user', 'text', 'Synthetic saved criteria reuse request for kitchen tools.'),
    message('synth-session-11', 5, 'assistant', 'text', 'Synthetic response with selected criteria.'),
    message('synth-session-12', 1, 'user', 'text', 'Synthetic request: niche accessory with no matches.'),
    message('synth-session-12', 4, 'assistant', 'text', 'Synthetic empty-state response.'),
  ];

  const searchRuns = [
    searchRun('synth-session-01', 1, 'synthetic cordless vacuum price delivery', 4, { category: 'home' }),
    searchRun('synth-session-02', 1, 'synthetic durable school backpack', 3, { category: 'school' }),
    searchRun('synth-session-03', 1, 'synthetic rare spare part exact dimensions', 0, { category: 'parts' }),
    searchRun('synth-session-03', 2, 'synthetic spare part broader recovery', 0, { category: 'parts', recoveryAttempt: 1 }),
    searchRun('synth-session-04', 1, 'synthetic delivery focused office chair', 2, { category: 'furniture' }),
    searchRun('synth-session-05', 1, 'synthetic household staples saved criteria', 5, { category: 'home' }),
    searchRun('synth-session-06', 1, 'synthetic ambiguous gift idea', 0, { category: 'gifts' }),
    searchRun('synth-session-07', 1, 'synthetic admin diagnostics query', 2, { category: 'diagnostic' }),
    searchRun('synth-session-08', 1, 'synthetic running shoes budget', 4, { category: 'sports' }),
    searchRun('synth-session-09', 1, 'synthetic student tablet note taking', 3, { category: 'electronics' }),
    searchRun('synth-session-09', 2, 'synthetic student tablet battery priority', 2, { category: 'electronics', recoveryAttempt: 1 }),
    searchRun('synth-session-10', 1, 'synthetic small desk lamp', 1, { category: 'lighting' }),
    searchRun('synth-session-11', 1, 'synthetic kitchen tools saved criteria', 2, { category: 'kitchen' }),
    searchRun('synth-session-12', 1, 'synthetic niche accessory no matches', 0, { category: 'accessory' }),
  ];

  const searchResults = searchRuns.flatMap((run) =>
    Array.from({ length: run.rawSearchResponse.resultCount }, (_, i) =>
      searchResult(run.id, i + 1, `Synthetic result ${i + 1} for ${run.refinedParams.category}`),
    ),
  );

  const choices = [
    { id: 'synth-choice-01', sessionId: 'synth-session-01', searchResultId: 'synth-result-synth-search-synth-session-01-1-1', productUrl: 'https://synthetic.invalid/shop-assistant/synth-search-synth-session-01-1/1', chosenAt: iso(22) },
    { id: 'synth-choice-02', sessionId: 'synth-session-02', searchResultId: 'synth-result-synth-search-synth-session-02-1-2', productUrl: 'https://synthetic.invalid/shop-assistant/synth-search-synth-session-02-1/2', chosenAt: iso(34) },
    { id: 'synth-choice-03', sessionId: 'synth-session-05', searchResultId: 'synth-result-synth-search-synth-session-05-1-1', productUrl: 'https://synthetic.invalid/shop-assistant/synth-search-synth-session-05-1/1', chosenAt: iso(71) },
    { id: 'synth-choice-04', sessionId: 'synth-session-08', searchResultId: 'synth-result-synth-search-synth-session-08-1-3', productUrl: 'https://synthetic.invalid/shop-assistant/synth-search-synth-session-08-1/3', chosenAt: iso(112) },
    { id: 'synth-choice-05', sessionId: 'synth-session-10', searchResultId: 'synth-result-synth-search-synth-session-10-1-1', productUrl: 'https://synthetic.invalid/shop-assistant/synth-search-synth-session-10-1/1', chosenAt: iso(139) },
  ];

  const agentCommunications = sessions.flatMap((item, i) => {
    const base = [
      agentCommunication(item.id, 1, 'communication', 'search', 'request'),
      agentCommunication(item.id, 2, 'search', 'presentation', i === 2 || i === 5 || i === 11 ? 'error' : 'result'),
    ];
    return i % 3 === 0
      ? [...base, agentCommunication(item.id, 3, 'presentation', 'communication', 'response')]
      : base;
  });

  return {
    metadata: {
      id: 'sa-g4-t1-synthetic-usage-2026-06-12',
      generatedAt: new Date('2026-06-12T12:00:00.000Z').toISOString(),
      privacy: 'Synthetic only. No production raw queries, voice transcripts, lead contact details, profile names, JWTs, secrets, or user identifiers.',
      urlPolicy: 'All fixture URLs use synthetic.invalid so they cannot be mistaken for real merchant URLs.',
    },
    accountProfiles: [
      { id: profileA, userId: userA, name: 'Synthetic profile A', role: 'synthetic', createdAt: iso(0), updatedAt: iso(0) },
      { id: profileB, userId: userA, name: 'Synthetic profile B', role: 'synthetic', createdAt: iso(1), updatedAt: iso(1) },
    ],
    savedCriteria: [
      { id: 'synth-criteria-home', userId: userA, name: 'Synthetic saved criteria home', profileId: profileA, createdAt: iso(2), updatedAt: iso(2) },
      { id: 'synth-criteria-school', userId: userA, name: 'Synthetic saved criteria school', profileId: profileB, createdAt: iso(3), updatedAt: iso(3) },
      { id: 'synth-criteria-office', userId: userB, name: 'Synthetic saved criteria office', profileId: null, createdAt: iso(4), updatedAt: iso(4) },
    ],
    sessions,
    messages,
    searchRuns,
    searchResults,
    choices,
    agentCommunications,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const fixture = buildFixture();
  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(`Wrote ${args.output}`);
}

main();
