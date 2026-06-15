#!/usr/bin/env node
'use strict';

const BASE_URL = (process.env.BASE_URL || 'https://shop-assistant.alfares.cz').replace(/\/$/, '');
const REQUIRE_BROWSER_AUTH = process.env.REQUIRE_BROWSER_AUTH === '1';
const fs = require('fs');
const CUSTOMER_TOKEN = readToken('CUSTOMER_TOKEN');
const ADMIN_TOKEN = readToken('ADMIN_TOKEN');
const NON_ADMIN_TOKEN = readToken('NON_ADMIN_TOKEN');
const HEADLESS = process.env.HEADLESS !== '0';
const TIMEOUT_MS = Number(process.env.BROWSER_VERIFY_TIMEOUT_MS || 15000);

let failures = 0;
let skipped = 0;

function readToken(name) {
  const direct = process.env[name] || '';
  if (direct) return direct;
  const file = process.env[`${name}_FILE`] || '';
  if (!file) return '';
  try {
    return fs.readFileSync(file, 'utf8').replace(/[\r\n]/g, '');
  } catch {
    return '';
  }
}

function log(message) {
  console.log(message);
}

function pass(message) {
  log(`PASS ${message}`);
}

function fail(message) {
  failures += 1;
  log(`FAIL ${message}`);
}

function skip(message) {
  skipped += 1;
  log(`SKIP ${message}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function withPage(browser, token, fn) {
  const context = await browser.newContext();
  if (token) {
    await context.addInitScript((value) => {
      window.sessionStorage.setItem('shop_assistant_access_token', value);
    }, token);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(TIMEOUT_MS);
  try {
    await fn(page);
  } finally {
    await context.close();
  }
}

async function verifyPublicLockedStates(browser) {
  await withPage(browser, '', async (page) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    const body = await page.textContent('body');
    assert(body.includes('Shop Assistant'), 'landing page did not render Shop Assistant copy');
    assert(body.includes('Dashboard') || body.includes('dashboard'), 'landing page does not expose dashboard copy/link');
    pass('landing page renders commercial/customer-dashboard copy');
  });

  await withPage(browser, '', async (page) => {
    await page.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    const body = await page.textContent('body');
    assert(body.includes('Sign in') || body.includes('Alfares Auth'), 'dashboard did not render unauthenticated Auth gate');
    assert(!(await page.locator('#dashboard:not(.hidden)').count()), 'dashboard shell rendered without auth');
    pass('customer dashboard remains locked without auth');
  });

  await withPage(browser, '', async (page) => {
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('body');
    const body = await page.textContent('body');
    assert(body.includes('Admin access requires') || body.includes('authorized admin account'), 'admin page did not render admin Auth gate');
    assert(!(await page.locator('body.admin-unlocked').count()), 'admin shell unlocked without auth');
    pass('admin panel remains locked without auth');
  });

  await withPage(browser, '', async (page) => {
    await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/auth\.alfares\.cz\/login.*client_id=shop-assistant/, { timeout: TIMEOUT_MS });
    pass('login page redirects to Auth-hosted login with client id');
  });

  await withPage(browser, '', async (page) => {
    await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/auth\.alfares\.cz\/register.*client_id=shop-assistant/, { timeout: TIMEOUT_MS });
    pass('register page redirects to Auth-hosted registration with client id');
  });
}

async function verifyCustomer(browser) {
  if (!CUSTOMER_TOKEN) {
    if (REQUIRE_BROWSER_AUTH) fail('CUSTOMER_TOKEN not set; strict customer browser verification not run');
    else skip('CUSTOMER_TOKEN not set; customer browser verification not run');
    return;
  }
  await withPage(browser, CUSTOMER_TOKEN, async (page) => {
    await page.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#dashboard:not(.hidden)');
    const body = await page.textContent('body');
    assert(body.includes('Your shopping dashboard'), 'customer dashboard did not unlock');
    assert(body.includes('Recent request history'), 'customer history section missing');
    assert(body.includes('Saved searches'), 'saved searches section missing');
    assert(body.includes('Selected products'), 'selected products section missing');
    pass('customer token unlocks dashboard browser experience');
  });
}

async function verifyAdmin(browser) {
  if (!ADMIN_TOKEN) {
    if (REQUIRE_BROWSER_AUTH) fail('ADMIN_TOKEN not set; strict admin browser verification not run');
    else skip('ADMIN_TOKEN not set; admin browser verification not run');
    return;
  }
  await withPage(browser, ADMIN_TOKEN, async (page) => {
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('body.admin-unlocked');
    const body = await page.textContent('body');
    assert(body.includes('Admin Overview'), 'admin overview tab missing');
    assert(body.includes('Operations'), 'admin operations tab missing');
    assert(body.includes('Safe service settings'), 'admin settings tab missing');
    pass('admin token unlocks admin browser experience');
  });
}

async function verifyNonAdmin(browser) {
  if (!NON_ADMIN_TOKEN) {
    if (REQUIRE_BROWSER_AUTH) fail('NON_ADMIN_TOKEN not set; strict non-admin browser verification not run');
    else skip('NON_ADMIN_TOKEN not set; non-admin browser verification not run');
    return;
  }
  await withPage(browser, NON_ADMIN_TOKEN, async (page) => {
    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('body.admin-locked');
    const body = await page.textContent('body');
    assert(body.includes('does not have a Shop Assistant admin role') || body.includes('authorized admin account'), 'non-admin denial copy missing');
    pass('non-admin token remains denied from admin browser experience');
  });
}

async function main() {
  log('=== SA-G7 browser verification ===');
  log(`Target: ${BASE_URL}`);
  log(`Headless: ${HEADLESS ? 'yes' : 'no'}`);
  log('Token values are never printed by this script.');
  log('Tokens may be supplied through CUSTOMER_TOKEN_FILE, ADMIN_TOKEN_FILE, and NON_ADMIN_TOKEN_FILE to avoid shell history exposure.');
  if (REQUIRE_BROWSER_AUTH) {
    log('Strict browser auth mode: CUSTOMER_TOKEN, ADMIN_TOKEN, and NON_ADMIN_TOKEN are required.');
  }

  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    fail('Playwright is not available. Run with a Node environment that can require("playwright").');
    log('');
    log('=== Result ===');
    log(`Failures: ${failures}`);
    log(`Skipped authenticated browser checks: ${skipped}`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: HEADLESS });
  try {
    await verifyPublicLockedStates(browser);
    await verifyCustomer(browser);
    await verifyAdmin(browser);
    await verifyNonAdmin(browser);
  } finally {
    await browser.close();
  }

  log('');
  log('=== Result ===');
  log(`Failures: ${failures}`);
  log(`Skipped authenticated browser checks: ${skipped}`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  fail(error.message || String(error));
  log('');
  log('=== Result ===');
  log(`Failures: ${failures}`);
  log(`Skipped authenticated browser checks: ${skipped}`);
  process.exit(1);
});
