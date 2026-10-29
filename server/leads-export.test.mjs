import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeadsExportHandler } from './leads-export.mjs';

const TOKEN = 'a'.repeat(40);
const stored = [
  { _id: 'b-id', name: 'New Lead', email: 'new@example.com', company: 'Acme', services: ['seo', 'web-development'], challenge: 'Need more enquiries.', source: 'contact-page', page: '/contact', status: 'new', createdAt: new Date('2026-10-19T20:33:43.903Z'), requestHash: 'secret-hash', requestId: 'b-id' },
  { _id: 'a-id', name: 'Old Lead', email: 'old@example.com', company: 'Beta', service: 'crm-sales', challenge: 'Leads get lost.', source: 'demo-popup', page: '/', status: 'new', createdAt: new Date('2026-10-18T12:08:13.282Z'), requestHash: 'secret-hash-2', requestId: 'a-id' },
];

function fixture(options = {}) {
  // `in`, not a default: an explicitly undefined token must stay undefined.
  const token = 'token' in options ? options.token : TOKEN;
  const list = options.list ?? (async () => stored);
  const calls = [];
  const handler = createLeadsExportHandler({
    getConfig: () => ({ MONGODB_URI: 'mongodb://private-test-credential', LEADS_EXPORT_TOKEN: token }),
    listLeads: async (config, limit) => { calls.push({ config, limit }); return list(); },
  });
  const request = async ({ method = 'GET', headers = {} } = {}) => {
    const req = { method, headers };
    const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, writeHead(status, values) { this.status = status; Object.assign(this.headers, values); }, end(value) { this.body = JSON.parse(value); this.writableEnded = true; } };
    await handler(req, res);
    return res;
  };
  return { request, calls };
}
const auth = (t = TOKEN) => ({ authorization: `Bearer ${t}` });

test('returns every lead, newest first as stored, without internal fields', async () => {
  const { request, calls } = fixture();
  const res = await request({ headers: auth() });
  assert.equal(res.status, 200);
  assert.equal(res.headers['Cache-Control'], 'no-store');
  assert.equal(res.body.count, 2);
  assert.deepEqual(res.body.leads[0], {
    reference: 'b-id', createdAt: '2026-10-19T20:33:43.903Z', name: 'New Lead', email: 'new@example.com', company: 'Acme',
    services: ['seo', 'web-development'], challenge: 'Need more enquiries.', source: 'contact-page', page: '/contact', status: 'new',
  });
  assert.equal(JSON.stringify(res.body).includes('secret-hash'), false);
  assert.equal(calls[0].limit, 1000);
});

test('maps the older single-service field into the services list', async () => {
  const { request } = fixture();
  const res = await request({ headers: auth() });
  assert.deepEqual(res.body.leads[1].services, ['crm-sales']);
});

test('refuses requests without the right token and never touches the database', async () => {
  const { request, calls } = fixture();
  for (const headers of [{}, auth('b'.repeat(40)), { authorization: TOKEN }, auth(`${TOKEN}x`)]) {
    const res = await request({ headers });
    assert.equal(res.status, 401);
    assert.equal(res.body.leads, undefined);
  }
  assert.equal(calls.length, 0);
});

test('stays closed when the export token is unset or too short', async () => {
  for (const token of [undefined, '', 'short-token']) {
    const { request, calls } = fixture({ token });
    const res = await request({ headers: auth(token ?? '') });
    assert.equal(res.status, 503);
    assert.equal(calls.length, 0);
  }
});

test('only answers GET', async () => {
  const { request } = fixture();
  const res = await request({ method: 'POST', headers: auth() });
  assert.equal(res.status, 405);
  assert.equal(res.headers.Allow, 'GET');
});

test('hides database errors', async () => {
  const { request } = fixture({ list: async () => { throw Error('mongodb://user:pass@host failed'); } });
  const res = await request({ headers: auth() });
  assert.equal(res.status, 503);
  assert.equal(JSON.stringify(res.body).includes('mongodb'), false);
});
