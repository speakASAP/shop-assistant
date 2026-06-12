#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((Number(numerator) / Number(denominator)) * 100).toFixed(1));
}

function asNumber(value) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

async function scalar(sql) {
  const rows = await prisma.$queryRawUnsafe(sql);
  return asNumber(Object.values(rows[0] || {})[0]);
}

async function rows(sql) {
  return prisma.$queryRawUnsafe(sql);
}

async function main() {
  const [
    sessions,
    userBoundSessions,
    profileScopedSessions,
    priorityScopedSessions,
    querySessions,
    searchRuns,
    searchResults,
    zeroResultSearchRuns,
    choices,
    messages,
    feedbackMessages,
    agentCommunications,
    agentErrors,
    accountProfiles,
    savedCriteria,
    resultSessions,
    choiceSessions,
    choiceResultSessions,
    feedbackResultSessions,
    agentErrorSessions,
  ] = await Promise.all([
    scalar('select count(*)::int as value from "Session"'),
    scalar('select count(*)::int as value from "Session" where "userId" is not null'),
    scalar('select count(*)::int as value from "Session" where "profileId" is not null'),
    scalar('select count(*)::int as value from "Session" where "priorityOrder" is not null'),
    scalar('select count(distinct "sessionId")::int as value from "Message" where role = \'user\' and "contentType" <> \'feedback\''),
    scalar('select count(*)::int as value from "SearchRun"'),
    scalar('select count(*)::int as value from "SearchResult"'),
    scalar('select count(*)::int as value from "SearchRun" sr where not exists (select 1 from "SearchResult" r where r."searchRunId" = sr.id)'),
    scalar('select count(*)::int as value from "Choice"'),
    scalar('select count(*)::int as value from "Message"'),
    scalar('select count(*)::int as value from "Message" where "contentType" = \'feedback\''),
    scalar('select count(*)::int as value from "AgentCommunication"'),
    scalar('select count(*)::int as value from "AgentCommunication" where "messageType" = \'error\''),
    scalar('select count(*)::int as value from "AccountProfile"'),
    scalar('select count(*)::int as value from "SavedSearchCriteria"'),
    scalar('select count(distinct sr."sessionId")::int as value from "SearchRun" sr where exists (select 1 from "SearchResult" r where r."searchRunId" = sr.id)'),
    scalar('select count(distinct "sessionId")::int as value from "Choice"'),
    scalar('select count(distinct c."sessionId")::int as value from "Choice" c where exists (select 1 from "SearchRun" sr join "SearchResult" r on r."searchRunId" = sr.id where sr."sessionId" = c."sessionId")'),
    scalar('select count(distinct m."sessionId")::int as value from "Message" m where m."contentType" = \'feedback\' and exists (select 1 from "SearchRun" sr join "SearchResult" r on r."searchRunId" = sr.id where sr."sessionId" = m."sessionId")'),
    scalar('select count(distinct "sessionId")::int as value from "AgentCommunication" where "messageType" = \'error\''),
  ]);

  const [runDistribution] = await rows(`
    with counts as (
      select s.id, count(sr.id)::int as run_count
      from "Session" s
      left join "SearchRun" sr on sr."sessionId" = s.id
      group by s.id
    )
    select
      coalesce(round(avg(run_count)::numeric, 2), 0)::float as average,
      coalesce(percentile_disc(0.5) within group (order by run_count), 0)::int as p50,
      coalesce(percentile_disc(0.9) within group (order by run_count), 0)::int as p90,
      coalesce(max(run_count), 0)::int as max
    from counts
  `);

  const [resultDistribution] = await rows(`
    with counts as (
      select sr.id, count(r.id)::int as result_count
      from "SearchRun" sr
      left join "SearchResult" r on r."searchRunId" = sr.id
      group by sr.id
    )
    select
      coalesce(round(avg(result_count)::numeric, 2), 0)::float as average,
      coalesce(percentile_disc(0.5) within group (order by result_count), 0)::int as p50,
      coalesce(percentile_disc(0.9) within group (order by result_count), 0)::int as p90,
      coalesce(max(result_count), 0)::int as max
    from counts
  `);

  const bucketRows = await rows(`
    with counts as (
      select sr.id, count(r.id)::int as result_count
      from "SearchRun" sr
      left join "SearchResult" r on r."searchRunId" = sr.id
      group by sr.id
    )
    select
      case
        when result_count = 0 then '0'
        when result_count <= 2 then '1-2'
        when result_count <= 4 then '3-4'
        else '5+'
      end as bucket,
      count(*)::int as count
    from counts
    group by bucket
  `);

  const agentErrorRows = await rows(`
    select concat("fromAgent", '->', "toAgent") as route, count(*)::int as count
    from "AgentCommunication"
    where "messageType" = 'error'
    group by route
    order by count desc, route asc
  `);

  const [windowRow] = await rows(`
    select min("createdAt") as "firstSessionAt", max("createdAt") as "lastSessionAt"
    from "Session"
  `);

  const metrics = {
    metadata: {
      source: 'production-aggregate',
      generatedAt: new Date().toISOString(),
      privacy: 'Aggregate counts only. No raw message content, query text, profile names, lead details, JWTs, secrets, or database URLs exported.',
      window: {
        firstSessionAt: windowRow?.firstSessionAt || null,
        lastSessionAt: windowRow?.lastSessionAt || null,
      },
    },
    counts: {
      sessions,
      userBoundSessions,
      profileScopedSessions,
      priorityScopedSessions,
      sessionsWithAtLeastOneQueryMessage: querySessions,
      searchRuns,
      searchResults,
      zeroResultSearchRuns,
      choices,
      messages,
      feedbackMessages,
      agentCommunications,
      agentErrors,
      accountProfiles,
      savedCriteria,
      sessionsUsingSavedCriteria: null,
    },
    rates: {
      querySessionRate: percent(querySessions, sessions),
      zeroResultRunRate: percent(zeroResultSearchRuns, searchRuns),
      sessionChoiceRate: percent(choiceSessions, sessions),
      resultSessionChoiceRate: percent(choiceResultSessions, resultSessions),
      feedbackAfterResultsRate: percent(feedbackResultSessions, resultSessions),
      profileAdoptionRate: percent(profileScopedSessions, sessions),
      savedCriteriaSessionRate: null,
      agentErrorSessionRate: percent(agentErrorSessions, sessions),
    },
    distributions: {
      searchRunsPerSession: {
        average: asNumber(runDistribution?.average),
        p50: asNumber(runDistribution?.p50),
        p90: asNumber(runDistribution?.p90),
        max: asNumber(runDistribution?.max),
      },
      resultCountPerSearchRun: {
        average: asNumber(resultDistribution?.average),
        p50: asNumber(resultDistribution?.p50),
        p90: asNumber(resultDistribution?.p90),
        max: asNumber(resultDistribution?.max),
        buckets: Object.fromEntries(bucketRows.map((row) => [row.bucket, asNumber(row.count)])),
      },
    },
    agentErrorsByType: Object.fromEntries(agentErrorRows.map((row) => [row.route, asNumber(row.count)])),
  };

  console.log(JSON.stringify(metrics, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
