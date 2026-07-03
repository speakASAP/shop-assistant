#!/usr/bin/env node

const assert = require('assert');
const { of } = require('rxjs');

process.env.AI_SERVICE_URL = 'http://synthetic-ai.invalid';
delete process.env.AI_SERVICE_TOKEN;

const {
  SearchService,
  buildRecoveryQueries,
  isUsableProductUrl,
  normalizeResults,
} = require('../dist/sessions/search.service.js');

function makeLogger() {
  const entries = [];
  const record = (level, message, meta) => entries.push({ level, message, meta });
  return {
    entries,
    debug: (message, meta) => record('debug', message, meta),
    info: (message, meta) => record('info', message, meta),
    warn: (message, meta) => record('warn', message, meta),
    error: (message, meta) => record('error', message, meta),
  };
}

async function runNoResultProbe() {
  const logger = makeLogger();
  const calls = [];
  const httpService = {
    axiosRef: { defaults: { headers: { common: {} } } },
    post: (_url, body) => {
      calls.push(body.query_text);
      return of({ data: { items: [] } });
    },
  };
  const service = new SearchService(httpService, logger);
  const sensitiveSyntheticQuery = 'Please find me a compact repairable laptop under 700 EUR with delivery to Prague for a privacy probe';
  const results = await service.search(sensitiveSyntheticQuery, 5);
  const recoveryQueries = buildRecoveryQueries(sensitiveSyntheticQuery);

  assert.deepStrictEqual(results, []);
  assert.strictEqual(calls.length, 1 + recoveryQueries.length);
  assert.strictEqual(recoveryQueries.length, 3);
  assert(recoveryQueries.some((query) => query.includes('compact repairable laptop')));
  assert(!JSON.stringify(logger.entries).includes(sensitiveSyntheticQuery));

  return {
    resultCount: results.length,
    attemptedSearches: calls.length,
    recoveryQueryCount: recoveryQueries.length,
    rawQueryLogged: JSON.stringify(logger.entries).includes(sensitiveSyntheticQuery),
  };
}

async function runResultPreservationProbe() {
  const logger = makeLogger();
  let callCount = 0;
  const httpService = {
    axiosRef: { defaults: { headers: { common: {} } } },
    post: (_url, body) => {
      callCount += 1;
      if (callCount === 1) return of({ data: { items: [] } });
      return of({
        data: {
          items: [
            { title: ' Real merchant item ', url: 'https://merchant.example/products/1#tracking', position: 9 },
            { title: 'Duplicate merchant item', url: 'https://merchant.example/products/1/', position: 10 },
            { title: 'Invalid protocol', url: 'ftp://merchant.example/products/2', position: 11 },
            { title: '', url: 'https://merchant.example/products/3', position: 12 },
          ],
        },
      });
    },
  };
  const service = new SearchService(httpService, logger);
  const results = await service.search('show me durable stainless water bottle 750ml', 5);

  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].title, 'Real merchant item');
  assert.strictEqual(results[0].position, 1);
  assert.strictEqual(results[0].url, 'https://merchant.example/products/1#tracking');
  assert(results.every((item) => isUsableProductUrl(item.url)));

  const normalized = normalizeResults([
    { title: 'A', url: 'javascript:alert(1)', position: 1 },
    { title: 'B', url: 'http://merchant.example/b', position: 2 },
  ], 5);
  assert.strictEqual(normalized.length, 1);
  assert.strictEqual(normalized[0].position, 1);

  return {
    resultCount: results.length,
    attemptedSearches: callCount,
    invalidUrlCount: results.filter((item) => !isUsableProductUrl(item.url)).length,
    firstResultPosition: results[0].position,
  };
}

async function main() {
  const noResult = await runNoResultProbe();
  const resultPreservation = await runResultPreservationProbe();
  console.log(JSON.stringify({
    metadata: {
      probe: 'SA-G8-S1 deterministic synthetic search quality probes',
      privacy: 'Synthetic inputs only; output contains aggregate counts and booleans, no raw production query text.',
    },
    noResult,
    resultPreservation,
    result: 'pass',
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
