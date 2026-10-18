import { createHash } from 'node:crypto';
import { saveMongoLead } from './leads-store.mjs';

const services = new Set(['', 'ai-strategy', 'workflow-automation', 'ai-agents', 'data-bi', 'crm-sales', 'marketing-automation', 'industry-solutions', 'web-development', 'seo']);
const sources = new Set(['demo-popup', 'contact-page']);
const unavailable = 'Your request could not be saved right now. Please retry, or use the email draft below.';

export function createLeadsHandler({ getConfig = () => process.env, saveLead = saveMongoLead, now = Date.now } = {}) {
  const visitors = new Map();
  let windowEnd = 0, count = 0, active = 0;
  return async function leads(req, res) {
    const send = (status, data) => {
      if (res.destroyed || res.writableEnded) return;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(data));
    };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { error: 'Please use the demo request form.' }); }
    const config = getConfig();
    try {
      const origin = req.headers.origin;
      if (req.headers['sec-fetch-site'] === 'cross-site' || (origin && (config.PUBLIC_ORIGIN ? origin !== config.PUBLIC_ORIGIN : new URL(origin).host !== req.headers.host))) return send(403, { error: 'Please submit the form from the MOKI website.' });
    } catch { return send(403, { error: 'This request could not be accepted.' }); }
    if (!req.headers['content-type']?.startsWith('application/json')) return send(415, { error: 'Please use the demo request form.' });
    let data;
    try {
      if (Number(req.headers['content-length']) > 24_000) { req.resume(); return send(413, { error: 'Please shorten your enquiry.' }); }
      data = req.body;
      if (data === undefined) {
        let size = 0; const chunks = [];
        for await (const chunk of req.iterator({ destroyOnReturn: false })) {
          size += chunk.length;
          if (size > 24_000) { req.resume(); return send(413, { error: 'Please shorten your enquiry.' }); }
          chunks.push(chunk);
        }
        data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } else {
        if (Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data)) > 24_000) return send(413, { error: 'Please shorten your enquiry.' });
        if (typeof data === 'string') data = JSON.parse(data);
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('invalid');
    } catch { return send(400, { error: 'Please check the form and try again.' }); }

    const text = (key, max, min = 1) => typeof data[key] === 'string' && data[key].trim().length >= min && data[key].length <= max && !/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(data[key]);
    if (!text('name', 120) || !text('email', 254) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || !text('company', 160) || !text('challenge', 4000, 15) || !services.has(data.service) || !sources.has(data.source) || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(data.requestId || '') || typeof data.website !== 'string' || data.website || typeof data.page !== 'string' || !/^\/[a-z0-9/-]{0,120}$/.test(data.page)) return send(400, { error: 'Add your name, a valid email, business name, and at least 15 characters about your challenge.' });
    if (!config.MONGODB_URI) return send(503, { error: unavailable });

    const time = now();
    for (const [key, value] of visitors) if (value.until <= time) visitors.delete(key);
    // Best-effort per-instance protection; no IP addresses are stored with leads.
    const forwarded = req.headers['x-forwarded-for'];
    const ip = config.VERCEL && typeof forwarded === 'string' ? (forwarded.split(',')[0]?.trim() || req.socket.remoteAddress) : req.socket.remoteAddress;
    const visitor = visitors.get(ip) || { count: 0, until: time + 15 * 60_000 };
    if (time >= windowEnd) { windowEnd = time + 60_000; count = 0; }
    if (visitor.count >= 8 || count >= 40 || active >= 4) { res.setHeader('Retry-After', '60'); return send(429, { error: 'Please wait a minute before trying again. You can also use the email draft below.' }); }
    visitors.set(ip, { ...visitor, count: visitor.count + 1 }); count++; active++;
    const lead = Object.fromEntries(['name', 'email', 'company', 'challenge', 'service', 'source', 'page'].map(key => [key, data[key].trim()]));
    lead.email = lead.email.toLowerCase();
    lead.requestHash = createHash('sha256').update(JSON.stringify(lead)).digest('hex');
    lead.requestId = data.requestId.toLowerCase();
    try {
      const result = await saveLead(lead, config);
      if (result.conflict) return send(409, { error: 'This form changed during a retry. Edit a field and submit it again.' });
      return send(200, { saved: true, reference: lead.requestId });
    } catch {
      // Never return connection strings, credentials, submitted details, or driver errors.
      return send(503, { error: unavailable });
    } finally { active--; }
  };
}
