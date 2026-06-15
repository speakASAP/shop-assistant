#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const BASE_URL = (process.env.BASE_URL || 'https://shop-assistant.alfares.cz').replace(/\/$/, '');
const CHROME_BIN = process.env.CHROME_BIN || '/usr/bin/google-chrome';
const REQUIRE_BROWSER_AUTH = process.env.REQUIRE_BROWSER_AUTH === '1';
const TIMEOUT_MS = Number(process.env.BROWSER_VERIFY_TIMEOUT_MS || 20000);
const CUSTOMER_TOKEN = readToken('CUSTOMER_TOKEN');
const ADMIN_TOKEN = readToken('ADMIN_TOKEN');
const NON_ADMIN_TOKEN = readToken('NON_ADMIN_TOKEN');

let failures = 0;
let skipped = 0;

function log(message) { console.log(message); }
function pass(message) { log(`PASS ${message}`); }
function fail(message) { failures += 1; log(`FAIL ${message}`); }
function skip(message) { skipped += 1; log(`SKIP ${message}`); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function assert(condition, message) { if (!condition) throw new Error(message); }

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

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.events = new Map();
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
        else resolve(message.result || {});
        return;
      }
      const listeners = this.events.get(message.method) || [];
      for (const listener of listeners) listener(message.params || {});
    };
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, TIMEOUT_MS);
    });
  }

  once(method) {
    return new Promise((resolve) => {
      const listener = (params) => {
        const listeners = this.events.get(method) || [];
        this.events.set(method, listeners.filter((item) => item !== listener));
        resolve(params);
      };
      const listeners = this.events.get(method) || [];
      listeners.push(listener);
      this.events.set(method, listeners);
    });
  }
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function waitForChrome(port) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await sleep(150);
    }
  }
  throw new Error('Chrome DevTools endpoint did not start');
}

async function newPage(port, token) {
  const target = await fetchJson(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('CDP websocket failed'));
    setTimeout(() => reject(new Error('CDP websocket open timeout')), TIMEOUT_MS);
  });
  const cdp = new Cdp(ws);
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  if (token) {
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try { window.sessionStorage.setItem('shop_assistant_access_token', ${JSON.stringify(token)}); } catch (e) {}`
    });
  }
  return cdp;
}

async function navigate(cdp, url) {
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url });
  await loaded;
  await sleep(800);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true });
  return result.result ? result.result.value : undefined;
}

async function waitFor(cdp, expression, label) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await evaluate(cdp, expression)) return;
    await sleep(300);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function closePage(cdp) {
  try { await cdp.ws.close(); } catch {}
}

async function checkPage(port, url, token, fn) {
  const cdp = await newPage(port, token);
  try {
    await navigate(cdp, url);
    await fn(cdp);
  } finally {
    await closePage(cdp);
  }
}

async function verifyPublic(port) {
  await checkPage(port, `${BASE_URL}/`, '', async (cdp) => {
    const body = await evaluate(cdp, 'document.body.innerText');
    assert(body.includes('Shop Assistant'), 'landing page missing Shop Assistant copy');
    assert(body.includes('Dashboard') || body.includes('dashboard'), 'landing page missing dashboard copy/link');
    pass('landing page renders commercial/customer-dashboard copy');
  });

  await checkPage(port, `${BASE_URL}/dashboard.html`, '', async (cdp) => {
    const body = await evaluate(cdp, 'document.body.innerText');
    const unlocked = await evaluate(cdp, '!!document.querySelector("#dashboard:not(.hidden)")');
    assert(body.includes('Sign in') || body.includes('Alfares Auth'), 'dashboard auth gate copy missing');
    assert(!unlocked, 'dashboard unlocked without auth');
    pass('customer dashboard remains locked without auth');
  });

  await checkPage(port, `${BASE_URL}/admin.html`, '', async (cdp) => {
    const body = await evaluate(cdp, 'document.body.innerText');
    const unlocked = await evaluate(cdp, 'document.body.classList.contains("admin-unlocked")');
    assert(body.includes('Admin access requires') || body.includes('authorized admin account'), 'admin auth gate copy missing');
    assert(!unlocked, 'admin unlocked without auth');
    pass('admin panel remains locked without auth');
  });

  await checkPage(port, `${BASE_URL}/login.html`, '', async (cdp) => {
    await waitFor(cdp, 'location.href.includes("auth.alfares.cz/login") && location.href.includes("client_id=shop-assistant")', 'Auth login redirect');
    pass('login page redirects to Auth-hosted login with client id');
  });

  await checkPage(port, `${BASE_URL}/register.html`, '', async (cdp) => {
    await waitFor(cdp, 'location.href.includes("auth.alfares.cz/register") && location.href.includes("client_id=shop-assistant")', 'Auth register redirect');
    pass('register page redirects to Auth-hosted registration with client id');
  });
}

async function verifyCustomer(port) {
  if (!CUSTOMER_TOKEN) {
    if (REQUIRE_BROWSER_AUTH) fail('CUSTOMER_TOKEN not set; strict customer browser verification not run');
    else skip('CUSTOMER_TOKEN not set; customer browser verification not run');
    return;
  }
  await checkPage(port, `${BASE_URL}/dashboard.html`, CUSTOMER_TOKEN, async (cdp) => {
    await waitFor(cdp, '!!document.querySelector("#dashboard:not(.hidden)")', 'unlocked customer dashboard');
    const body = await evaluate(cdp, 'document.body.innerText');
    assert(body.includes('Your shopping dashboard'), 'customer dashboard heading missing');
    assert(body.includes('Recent request history'), 'customer history missing');
    assert(body.includes('Saved searches'), 'saved searches missing');
    assert(body.includes('Selected products'), 'selected products missing');
    pass('customer token unlocks dashboard browser experience');
  });
}

async function verifyAdmin(port) {
  if (!ADMIN_TOKEN) {
    if (REQUIRE_BROWSER_AUTH) fail('ADMIN_TOKEN not set; strict admin browser verification not run');
    else skip('ADMIN_TOKEN not set; admin browser verification not run');
    return;
  }
  await checkPage(port, `${BASE_URL}/admin.html`, ADMIN_TOKEN, async (cdp) => {
    await waitFor(cdp, 'document.body.classList.contains("admin-unlocked")', 'unlocked admin panel');
    let body = await evaluate(cdp, 'document.body.innerText');
    assert(body.includes('Admin Overview'), 'admin overview tab missing');
    assert(body.includes('Operations'), 'admin operations tab missing');
    assert(body.includes('Execution mode'), 'admin settings tab missing');
    await evaluate(cdp, 'document.querySelector("[data-tab=mode]")?.click(); true');
    await waitFor(cdp, 'document.querySelector("#panel-mode.active") && document.body.innerText.includes("Safe service settings")', 'visible admin settings panel');
    body = await evaluate(cdp, 'document.body.innerText');
    assert(body.includes('Safe service settings'), 'admin settings panel missing');
    pass('admin token unlocks admin browser experience');
  });
}

async function verifyNonAdmin(port) {
  if (!NON_ADMIN_TOKEN) {
    if (REQUIRE_BROWSER_AUTH) fail('NON_ADMIN_TOKEN not set; strict non-admin browser verification not run');
    else skip('NON_ADMIN_TOKEN not set; non-admin browser verification not run');
    return;
  }
  await checkPage(port, `${BASE_URL}/admin.html`, NON_ADMIN_TOKEN, async (cdp) => {
    await waitFor(cdp, 'document.body.classList.contains("admin-locked")', 'locked non-admin admin panel');
    const body = await evaluate(cdp, 'document.body.innerText');
    assert(body.includes('does not have a Shop Assistant admin role') || body.includes('authorized admin account'), 'non-admin denial copy missing');
    pass('non-admin token remains denied from admin browser experience');
  });
}

async function main() {
  log('=== SA-G7 Chrome browser verification ===');
  log(`Target: ${BASE_URL}`);
  log(`Chrome: ${CHROME_BIN}`);
  log('Token values are never printed by this script.');
  log('Tokens may be supplied through CUSTOMER_TOKEN_FILE, ADMIN_TOKEN_FILE, and NON_ADMIN_TOKEN_FILE.');

  if (typeof WebSocket !== 'function') {
    throw new Error('Node global WebSocket is unavailable; use Node 22+');
  }
  if (!fs.existsSync(CHROME_BIN)) {
    throw new Error(`Chrome binary not found: ${CHROME_BIN}`);
  }

  const port = Number(process.env.CHROME_REMOTE_DEBUGGING_PORT || (9300 + (process.pid % 500)));
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-g7-chrome-'));
  const chrome = spawn(CHROME_BIN, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  try {
    chrome.stderr.on('data', () => {});
    await waitForChrome(port);
    await verifyPublic(port);
    await verifyCustomer(port);
    await verifyAdmin(port);
    await verifyNonAdmin(port);
  } finally {
    chrome.kill('SIGTERM');
    fs.rmSync(userDataDir, { recursive: true, force: true });
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
