#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_SYNTHETIC = path.join(process.cwd(), 'reports', 'ux', 'sa-g4-t1-aggregate-metrics-2026-06-12.json');
const DEFAULT_PRODUCTION = path.join(process.cwd(), 'reports', 'ux', 'sa-g4-t1-production-aggregate-metrics-2026-06-12.json');
const DEFAULT_OUTPUT = path.join(process.cwd(), 'reports', 'ux', 'sa-g4-t1-production-vs-synthetic-comparison-2026-06-12.json');

function parseArgs(argv) {
  const args = {
    synthetic: DEFAULT_SYNTHETIC,
    production: DEFAULT_PRODUCTION,
    output: DEFAULT_OUTPUT,
  };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === '--synthetic') {
      args.synthetic = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--production') {
      args.production = argv[i + 1];
      i += 1;
    } else if (argv[i] === '--output') {
      args.output = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function get(obj, pathParts) {
  return pathParts.reduce((value, key) => (value == null ? value : value[key]), obj);
}

function compareMetric(label, pathParts, synthetic, production) {
  const syntheticValue = get(synthetic, pathParts);
  const productionValue = get(production, pathParts);
  return {
    metric: label,
    synthetic: syntheticValue,
    production: productionValue,
    delta: typeof syntheticValue === 'number' && typeof productionValue === 'number'
      ? Number((productionValue - syntheticValue).toFixed(2))
      : null,
  };
}

function main() {
  const args = parseArgs(process.argv);
  const synthetic = JSON.parse(fs.readFileSync(args.synthetic, 'utf8'));
  const production = JSON.parse(fs.readFileSync(args.production, 'utf8'));

  const comparison = {
    metadata: {
      generatedAt: new Date().toISOString(),
      syntheticSource: synthetic.metadata?.source || args.synthetic,
      productionSource: production.metadata?.source || args.production,
      privacy: 'Compares aggregate metrics only. No raw messages, query text, profile names, lead details, JWTs, secrets, or database URLs included.',
      interpretation: 'Synthetic fixture validates metric mechanics; production aggregate reflects live persisted traffic availability.',
    },
    metrics: [
      compareMetric('sessions', ['counts', 'sessions'], synthetic, production),
      compareMetric('sessionsWithAtLeastOneQueryMessage', ['counts', 'sessionsWithAtLeastOneQueryMessage'], synthetic, production),
      compareMetric('searchRuns', ['counts', 'searchRuns'], synthetic, production),
      compareMetric('searchResults', ['counts', 'searchResults'], synthetic, production),
      compareMetric('zeroResultSearchRuns', ['counts', 'zeroResultSearchRuns'], synthetic, production),
      compareMetric('choices', ['counts', 'choices'], synthetic, production),
      compareMetric('feedbackMessages', ['counts', 'feedbackMessages'], synthetic, production),
      compareMetric('agentErrors', ['counts', 'agentErrors'], synthetic, production),
      compareMetric('accountProfiles', ['counts', 'accountProfiles'], synthetic, production),
      compareMetric('savedCriteria', ['counts', 'savedCriteria'], synthetic, production),
      compareMetric('zeroResultRunRate', ['rates', 'zeroResultRunRate'], synthetic, production),
      compareMetric('sessionChoiceRate', ['rates', 'sessionChoiceRate'], synthetic, production),
      compareMetric('feedbackAfterResultsRate', ['rates', 'feedbackAfterResultsRate'], synthetic, production),
      compareMetric('profileAdoptionRate', ['rates', 'profileAdoptionRate'], synthetic, production),
      compareMetric('agentErrorSessionRate', ['rates', 'agentErrorSessionRate'], synthetic, production),
    ],
    conclusion: production.counts?.sessions === 0
      ? 'Production aggregate still contains no persisted session traffic. UX prioritization cannot yet be based on live behavior frequency.'
      : 'Production aggregate contains persisted traffic and can be reviewed against the synthetic validation baseline.',
  };

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, `${JSON.stringify(comparison, null, 2)}\n`);
  console.log(JSON.stringify(comparison, null, 2));
}

main();
