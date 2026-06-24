#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function pass(message) {
  console.log(`PASS ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL ${message}`);
}

function requireIncludes(relativePath, source, needle, message) {
  if (source.includes(needle)) pass(`${relativePath}: ${message}`);
  else fail(`${relativePath}: missing ${message}`);
}

function requirePattern(relativePath, source, pattern, message) {
  if (pattern.test(source)) pass(`${relativePath}: ${message}`);
  else fail(`${relativePath}: missing ${message}`);
}

function forbidPattern(relativePath, source, pattern, message) {
  if (pattern.test(source)) fail(`${relativePath}: forbidden ${message}`);
  else pass(`${relativePath}: no ${message}`);
}

function checkPublicRedirectPage(relativePath, authPath) {
  const source = read(relativePath);

  requireIncludes(relativePath, source, "const AUTH_BASE = 'https://auth.alfares.cz';", 'Auth hosted base URL');
  requireIncludes(relativePath, source, "const CLIENT_ID = 'shop-assistant';", 'client_id=shop-assistant constant');
  requireIncludes(relativePath, source, "const STATE_KEY = 'shop_assistant_auth_state';", 'state storage key');
  requirePattern(relativePath, source, /sessionStorage\.setItem\(STATE_KEY,\s*state\)/, 'state stored before redirect');
  requirePattern(relativePath, source, /new URL\(['"]dashboard\.html['"],\s*window\.location\.href\)\.href/, 'dashboard return_url is built from current origin');
  requirePattern(relativePath, source, /new URLSearchParams\(\{\s*return_url:\s*returnUrl,\s*client_id:\s*CLIENT_ID,\s*state\s*\}\)/, 'redirect params include return_url, client_id, and state');
  requireIncludes(relativePath, source, `buildAuthUrl('${authPath}')`, `redirects to hosted ${authPath}`);

  forbidPattern(relativePath, source, /<input\b[^>]*\btype=["']?password["']?/i, 'password input');
  forbidPattern(relativePath, source, /fetch\s*\([^)]*\/auth\/(?:login|register)[^)]*method\s*:\s*['"]POST['"]/is, 'local credential POST to /auth/login or /auth/register');
  forbidPattern(relativePath, source, /<form\b[^>]*\bmethod=["']?post["']?[^>]*\baction=["'][^"']*\/auth\/(?:login|register)/i, 'local credential POST form');
}

function checkCallbackPage(relativePath, stateKey) {
  const source = read(relativePath);

  requireIncludes(relativePath, source, "const AUTH_BASE = 'https://auth.alfares.cz';", 'Auth hosted base URL');
  requireIncludes(relativePath, source, "const CLIENT_ID = 'shop-assistant';", 'client_id=shop-assistant constant');
  requireIncludes(relativePath, source, `const STATE_KEY = '${stateKey}';`, 'expected state key');
  requireIncludes(relativePath, source, "const ACCESS_TOKEN_KEY = 'shop_assistant_access_token';", 'transitional session token key');
  requirePattern(relativePath, source, /sessionStorage\.setItem\(STATE_KEY,\s*state\)/, 'state stored before redirect');
  requirePattern(relativePath, source, /new URLSearchParams\(\{\s*return_url:\s*returnUrl,\s*client_id:\s*CLIENT_ID,\s*state\s*\}\)/, 'redirect params include return_url, client_id, and state');
  requirePattern(relativePath, source, /window\.location\.hash[^\n]*access_token=/, 'callback reads access_token from URL fragment');
  requirePattern(relativePath, source, /new URLSearchParams\(window\.location\.hash\.slice\(1\)\)/, 'callback parses fragment params');
  requirePattern(relativePath, source, /params\.get\(['"]access_token['"]\)/, 'callback extracts access_token');
  requirePattern(relativePath, source, /params\.get\(['"]state['"]\)/, 'callback extracts returned state');
  requirePattern(relativePath, source, /sessionStorage\.getItem\(STATE_KEY\)/, 'callback loads expected state from sessionStorage');
  requirePattern(relativePath, source, /expectedState\s*!==\s*returnedState|returnedState\s*!==\s*expectedState/, 'callback rejects state mismatch');
  requirePattern(relativePath, source, /window\.history\.replaceState\(null,\s*document\.title,\s*window\.location\.pathname \+ window\.location\.search\)/, 'callback strips auth fragment with replaceState');
  requirePattern(relativePath, source, /sessionStorage\.setItem\(ACCESS_TOKEN_KEY,\s*accessToken\)/, 'callback stores access token in sessionStorage only');
  requirePattern(relativePath, source, /localStorage\.removeItem\(['"]accessToken['"]\)/, 'removes legacy localStorage accessToken');
  requirePattern(relativePath, source, /localStorage\.removeItem\(['"]refreshToken['"]\)/, 'removes legacy localStorage refreshToken');
  requirePattern(relativePath, source, /sessionStorage\.removeItem\(STATE_KEY\)/, 'removes state after successful callback');

  forbidPattern(relativePath, source, /localStorage\.setItem\(['"](?:accessToken|refreshToken)['"]/, 'legacy localStorage token writes');
}

function checkBackendValidation() {
  const authService = read('src/auth/auth.service.ts');
  const authController = read('src/auth/auth.controller.ts');
  const jwtGuard = read('src/auth/jwt-auth.guard.ts');

  requireIncludes('src/auth/auth.service.ts', authService, '/auth/validate', 'backend Auth validation endpoint');
  requirePattern('src/auth/auth.service.ts', authService, /httpService\.post<ValidateTokenResponse>\(/, 'backend validates token with POST');
  requirePattern('src/auth/auth.service.ts', authService, /\{\s*token\s*\}/, 'backend sends bearer token to Auth validation body');
  requirePattern('src/auth/jwt-auth.guard.ts', jwtGuard, /authHeader\.startsWith\(['"]Bearer ['"]\)/, 'guard requires Bearer token');
  requirePattern('src/auth/jwt-auth.guard.ts', jwtGuard, /authService\.validateToken\(token\)/, 'guard delegates token validation to AuthService');
  requirePattern('src/auth/auth.controller.ts', authController, /no Shop Assistant login\/register controller/i, 'no local login/register controller marker');
}

checkPublicRedirectPage('public/login.html', '/login');
checkPublicRedirectPage('public/register.html', '/register');
checkCallbackPage('public/dashboard.html', 'shop_assistant_auth_state');
checkCallbackPage('public/admin.html', 'shop_assistant_admin_auth_state');
checkBackendValidation();

if (failures.length) {
  console.error(`\nHosted Auth static contract check failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log('\nHosted Auth static contract check passed.');
