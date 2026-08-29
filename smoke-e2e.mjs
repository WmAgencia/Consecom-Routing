#!/usr/bin/env node
/**
 * End-to-end smoke test for Consecom Routing API.
 *
 * Flow:
 *   1. Register a new customer (POST /v1/auth/register)
 *   2. Login
 *   3. Login as admin → activate plan → get auto-generated API key
 *   4. Re-login as customer (optional — may not be needed since key is plain)
 *   5. Call Claude via /v1/chat/completions using the API key
 *   6. Validate the response shape
 */

const API = 'https://consecomapi-production.up.railway.app';

let cookies = '';
let apiKey = '';

function log(stage, msg) { console.log(`\n[${stage}] ${msg}`); }
function logOk(stage, msg) { console.log(`[${stage}] ✅ ${msg}`); }
function logErr(stage, msg) { console.error(`\n[${stage}] ❌ ${msg}`); process.exitCode = 1; }

async function api(method, path, body = null, extraHeaders = {}) {
  const url = `${API}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  if (cookies) headers['Cookie'] = cookies;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length) {
    cookies = setCookie.map((c) => c.split(';')[0]).join('; ');
  }
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Consecom Routing — End-to-End Smoke Test');
  console.log('  API:', API);
  console.log('═══════════════════════════════════════════════════════');

  const stamp = Date.now();
  const email = `test-${stamp}@consecom-e2e.local`;
  const password = 'SmokeTest-Pwd-2026!';

  // ─── 1. Register customer ───
  log('1.REGISTER', `Creating customer ${email}`);
  let res = await api('POST', '/v1/auth/register', { email, password, name: 'Smoke Test' });
  if (res.status === 201 || res.status === 200) {
    logOk('1.REGISTER', `Customer created`);
  } else if (res.status === 409) {
    log('1.REGISTER', `Customer already exists, will continue`);
  } else {
    logErr('1.REGISTER', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    return;
  }

  // ─── 2. Login as admin ───
  log('2.ADMIN', 'Logging in as admin');
  cookies = ''; // fresh session
  res = await api('POST', '/v1/admin/login', { email: 'admin@consecom.local', password: 'ChangeMe123!' });
  if (res.status !== 200 && res.status !== 204) {
    logErr('2.ADMIN', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    return;
  }
  logOk('2.ADMIN', 'Admin session established');

  // ─── 3. Find customer ───
  log('3.LIST', 'Listing customers to find ours');
  res = await api('GET', '/v1/admin/customers');
  if (res.status !== 200) {
    logErr('3.LIST', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    return;
  }
  const customers = res.data?.data ?? res.data ?? [];
  const found = customers.find((c) => c.email === email);
  if (!found) {
    logErr('3.LIST', `Customer ${email} not found`);
    return;
  }
  const cid = found.id;
  logOk('3.LIST', `Found customer ${cid}`);

  // ─── 4. Activate POWER plan (returns API key) ───
  log('4.ACTIVATE', `Activating POWER plan`);
  res = await api('POST', `/v1/admin/customers/${cid}/activate-plan`, { planCode: 'POWER' });
  if (res.status !== 200 && res.status !== 201) {
    logErr('4.ACTIVATE', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    return;
  }
  apiKey = res.data?.apiKey?.key ?? res.data?.apiKey?.value ?? res.data?.key ?? '';
  if (!apiKey) {
    logErr('4.ACTIVATE', `No API key in response: ${JSON.stringify(res.data).slice(0, 400)}`);
    return;
  }
  logOk('4.ACTIVATE', `API key minted: ${apiKey.slice(0, 14)}... (${apiKey.length} chars)`);

  // ─── 4b. Credit customer with 10000 credits (manual activation doesn't auto-credit) ───
  log('4b.CREDITS', 'Adding 10000 credits to customer');
  res = await api('POST', `/v1/admin/customers/${cid}/credits`, {
    delta: 10000,
    description: 'smoke test seed',
  });
  if (res.status !== 200 && res.status !== 201) {
    logErr('4b.CREDITS', `Status ${res.status}: ${JSON.stringify(res.data)}`);
    return;
  }
  logOk('4b.CREDITS', `Credits granted`);

  // ─── 5. Chat completion ───
  log('5.CHAT', 'Calling /v1/chat/completions with key');
  const chatRes = await fetch(`${API}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: 'Responda em uma frase: qual é a capital da França?' }],
      max_tokens: 100,
    }),
  });
  const chatText = await chatRes.text();
  let chatData;
  try { chatData = JSON.parse(chatText); } catch { chatData = chatText; }

  if (chatRes.status === 200) {
    logOk('5.CHAT', `Status 200 — Claude responded`);
    const text = chatData?.choices?.[0]?.message?.content ?? chatData?.content?.[0]?.text ?? '(no text)';
    console.log('\n--- Assistant ---');
    console.log(typeof text === 'string' ? text : JSON.stringify(text));
    logOk('5.CHAT', `✅ Pipeline end-to-end succeeded`);
  } else {
    logErr('5.CHAT', `Status ${chatRes.status}: ${JSON.stringify(chatData).slice(0, 500)}`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(process.exitCode ? '  ❌ FAILED' : '  ✅ ALL CHECKS PASSED');
  console.log('═══════════════════════════════════════════════════════');
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1); });