#!/usr/bin/env node

const crypto = require('crypto');

function envFlag(name) {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').toLowerCase());
}

function fail(message) {
  const error = new Error(message);
  error.isValidationFailure = true;
  throw error;
}

function sanitizeBaseUrl(value) {
  return String(value || 'https://shop-assistant.alfares.cz').replace(/\/+$/, '');
}

function queryFingerprint(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 16);
}

function buildSyntheticNoResultsQuery() {
  const nonce = crypto.randomBytes(8).toString('hex');
  return `synthetic validation product qzvx-${nonce} noncommercial impossible merchant lookup size ${nonce}`;
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { status: response.status, json, textLength: text.length };
}

function countUrlStats(results) {
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

function hasActionableNoResultsGuidance(messages) {
  const assistantText = (messages || [])
    .filter((message) => message.role === 'assistant' && message.contentType === 'text')
    .map((message) => String(message.content || '').toLowerCase())
    .join('\n');

  const requiredFragments = [
    'could not find usable merchant results',
    'try refining',
    'product type or category',
    'brand, model, size, material, or color',
    'budget and delivery location',
    'real http or https merchant urls',
  ];

  return requiredFragments.every((fragment) => assistantText.includes(fragment));
}

async function main() {
  const baseUrl = sanitizeBaseUrl(process.env.BASE_URL);
  const query = String(process.env.SYNTHETIC_QUERY || '').trim() || buildSyntheticNoResultsQuery();
  const fingerprint = queryFingerprint(query);
  const requireZeroResults = !envFlag('ALLOW_SYNTHETIC_RESULTS');

  const sessionResponse = await requestJson(baseUrl, '/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      userId: `sa-g1-no-results-validation-${Date.now()}`,
      priorities: ['price', 'quality'],
    }),
  });

  if (sessionResponse.status !== 201 || !sessionResponse.json?.sessionId) {
    fail(`session create failed with HTTP ${sessionResponse.status}`);
  }

  const sessionId = sessionResponse.json.sessionId;
  const queryResponse = await requestJson(baseUrl, `/api/sessions/${encodeURIComponent(sessionId)}/query`, {
    method: 'POST',
    body: JSON.stringify({ text: query, priorities: ['price', 'quality'] }),
  });

  if (queryResponse.status !== 201) {
    fail(`query submit failed with HTTP ${queryResponse.status}`);
  }

  const results = Array.isArray(queryResponse.json?.results) ? queryResponse.json.results : [];
  const urlStats = countUrlStats(results);
  const messagesResponse = await requestJson(baseUrl, `/api/sessions/${encodeURIComponent(sessionId)}/messages`);

  if (messagesResponse.status !== 200 || !Array.isArray(messagesResponse.json?.messages)) {
    fail(`messages fetch failed with HTTP ${messagesResponse.status}`);
  }

  const messages = messagesResponse.json.messages;
  const assistantTextMessages = messages.filter((message) => message.role === 'assistant' && message.contentType === 'text').length;
  const tableMessages = messages.filter((message) => message.contentType === 'table').length;
  const guidancePresent = hasActionableNoResultsGuidance(messages);
  const failures = [];

  if (urlStats.invalidUrlCount > 0) failures.push('result URLs must be HTTP or HTTPS only');
  if (requireZeroResults && results.length !== 0) failures.push('synthetic failed-search probe returned results');
  if (requireZeroResults && tableMessages !== 0) failures.push('zero-result failed-search probe should not persist table messages');
  if (requireZeroResults && !guidancePresent) failures.push('assistant message did not include actionable no-results guidance');
  if (assistantTextMessages < 1) failures.push('expected at least one assistant text message');

  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      privacy: 'Synthetic live validation only. Raw query text, message content, merchant URLs, JWTs, secrets, lead details, profile names, and database URLs are not emitted.',
      baseUrl,
      queryFingerprint: fingerprint,
      mode: requireZeroResults ? 'strict-zero-result' : 'allow-synthetic-results',
    },
    session: { id: sessionId },
    http: {
      sessionCreateStatus: sessionResponse.status,
      queryStatus: queryResponse.status,
      messagesStatus: messagesResponse.status,
    },
    counts: {
      results: results.length,
      httpResultUrls: urlStats.httpUrlCount,
      invalidResultUrls: urlStats.invalidUrlCount,
      messages: messages.length,
      assistantTextMessages,
      tableMessages,
    },
    checks: {
      actionableNoResultsGuidancePresent: guidancePresent,
      zeroResultProbe: results.length === 0,
      tableMessagesSuppressed: tableMessages === 0,
      onlyHttpMerchantUrls: urlStats.invalidUrlCount === 0,
    },
    result: failures.length ? 'fail' : 'pass',
    failures,
  };

  console.log(JSON.stringify(output, null, 2));
  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ result: 'fail', error: message }, null, 2));
  process.exitCode = error && error.isValidationFailure ? 1 : 1;
});
