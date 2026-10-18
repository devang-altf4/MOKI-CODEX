import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { createLeadsHandler } from './leads.mjs';

const enquiry = () => ({ name: ' Preview Tester ', email: 'TESTER@example.com', company: 'Example Business', challenge: 'We would like a clearer website and an easier enquiry process.', service: 'web-development', website: '', source: 'demo-popup', page: '/', requestId: randomUUID() });
const config = { MONGODB_URI: 'mongodb://private-test-credential', MONGODB_DATABASE: 'moki_test' };
function fixture(options = {}) {
  const calls = [], records = new Map();
  const handler = createLeadsHandler({ getConfig: () => config, saveLead: async lead => {
    calls.push(lead);
    const previous = records.get(lead.requestId);
    if (!previous) records.set(lead.requestId, lead);
    return { conflict: Boolean(previous && previous.requestHash !== lead.requestHash) };
  }, ...options });
  const request = async (body = enquiry(), { method = 'POST', headers = {}, streamed = false, raw } = {}) => {
    const req = Readable.from([Buffer.from(raw ?? JSON.stringify(body))]);
    req.method = method; req.headers = { host: 'moki.test', origin: 'https://moki.test', 'content-type': 'application/json', ...headers };
    req.socket = { remoteAddress: '127.0.0.1' };
    if (!streamed) req.body = raw ?? body;
    const response = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, writeHead(status, values) { this.status = status; Object.assign(this.headers, values); }, end(value) { this.body = JSON.parse(value); this.writableEnded = true; } };
    await handler(req, response);
    return response;
  };
  return { request, calls, records };
}

test('saves only validated fields and confirms the database result without exposing credentials', async () => {
  const { request, calls } = fixture();
  const input = { ...enquiry(), isAdmin: true, arbitrary: { $where: 'bad' } };
  const response = await request(input);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { saved: true, reference: input.requestId });
  assert.equal(calls[0].name, 'Preview Tester');
  assert.equal(calls[0].email, 'tester@example.com');
  assert.equal(calls[0].isAdmin, undefined);
  assert.equal(calls[0].arbitrary, undefined);
  assert.equal(calls[0].website, undefined);
  assert.match(calls[0].requestHash, /^[a-f0-9]{64}$/);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.ok(!JSON.stringify(response.body).includes(config.MONGODB_URI));
});

test('retrying a successful request keeps one record; reusing its ID with changed details is rejected', async () => {
  const { request, records } = fixture();
  const input = enquiry();
  assert.equal((await request(input)).status, 200);
  assert.equal((await request(input)).status, 200);
  assert.equal(records.size, 1);
  assert.equal((await request({ ...input, company: 'Different Business' })).status, 409);
  assert.equal(records.size, 1);
});

test('rejects invalid and injected fields before accessing storage', async () => {
  const { request, calls } = fixture();
  for (const changes of [{ name: '' }, { email: 'wrong' }, { company: { $gt: '' } }, { challenge: 'short' }, { challenge: 'a'.repeat(4001) }, { service: 'unknown' }, { requestId: 'invalid' }, { source: 'untrusted' }, { page: '/?email=private' }, { website: 'https://spam.test' }]) {
    assert.equal((await request({ ...enquiry(), ...changes })).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('enforces method, same-origin, JSON and size restrictions', async () => {
  const { request, calls } = fixture();
  assert.equal((await request(undefined, { method: 'GET' })).status, 405);
  assert.equal((await request(undefined, { headers: { origin: 'https://another.test' } })).status, 403);
  assert.equal((await request(undefined, { headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  assert.equal((await request(undefined, { headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await request(undefined, { headers: { 'content-length': '25000' } })).status, 413);
  assert.equal((await request(undefined, { raw: '{bad', streamed: true })).status, 400);
  assert.equal((await request(undefined, { raw: 'a'.repeat(25000), streamed: true })).status, 413);
  assert.equal(calls.length, 0);
});

test('accepts Vite streams and Vercel-parsed string/object bodies', async () => {
  const { request, records } = fixture();
  assert.equal((await request(enquiry(), { streamed: true })).status, 200);
  assert.equal((await request(enquiry())).status, 200);
  assert.equal((await request(undefined, { raw: JSON.stringify(enquiry()) })).status, 200);
  assert.equal(records.size, 3);
});

test('missing configuration and driver failures never report saved or leak database errors', async () => {
  const missing = fixture({ getConfig: () => ({}) });
  assert.equal((await missing.request()).status, 503);
  assert.equal(missing.calls.length, 0);
  let attempts = 0;
  const { request } = fixture({ saveLead: async () => { attempts++; throw Error('private credentials and provider details'); } });
  const response = await request();
  assert.equal(response.status, 503);
  assert.equal(response.body.saved, undefined);
  assert.match(response.body.error, /could not be saved/);
  assert.ok(!response.body.error.includes('private'));
  assert.equal((await request()).status, 503);
  assert.equal(attempts, 2);
});

test('does not return success until storage acknowledges the request', async () => {
  let resolveSave;
  const { request } = fixture({ saveLead: () => new Promise(resolve => { resolveSave = resolve; }) });
  let completed = false;
  const pending = request().then(response => { completed = true; return response; });
  await Promise.resolve();
  assert.equal(completed, false);
  resolveSave({ conflict: false });
  assert.equal((await pending).status, 200);
});

test('limits submissions and allows them again after the request window expires', async () => {
  let time = 1000;
  const { request, calls } = fixture({ now: () => time });
  for (let i = 0; i < 8; i++) assert.equal((await request()).status, 200);
  const limited = await request();
  assert.equal(limited.status, 429);
  assert.equal(limited.headers['Retry-After'], '60');
  assert.equal(calls.length, 8);
  time += 16 * 60_000;
  assert.equal((await request()).status, 200);
});
