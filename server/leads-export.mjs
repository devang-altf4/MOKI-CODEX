import { createHash, timingSafeEqual } from 'node:crypto';
import { listMongoLeads } from './leads-store.mjs';

const LIMIT = 1000;
const digest = value => createHash('sha256').update(value).digest();

/** Constant-time check of an `Authorization: Bearer <token>` header against the configured token. */
function authorized(header, token) {
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  return timingSafeEqual(digest(header.slice(7)), digest(token));
}

const toRow = lead => ({
  reference: String(lead._id),
  createdAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : null,
  name: lead.name ?? '',
  email: lead.email ?? '',
  company: lead.company ?? '',
  // Older enquiries stored one `service`; newer ones a `services` list.
  services: Array.isArray(lead.services) ? lead.services : lead.service ? [lead.service] : [],
  challenge: lead.challenge ?? '',
  source: lead.source ?? '',
  page: lead.page ?? '',
  status: lead.status ?? '',
});

/**
 * Read-only feed of saved enquiries for the owner's leads spreadsheet. Closed unless
 * LEADS_EXPORT_TOKEN (32+ characters) is configured and sent as a Bearer token.
 */
export function createLeadsExportHandler({ getConfig = () => process.env, listLeads = listMongoLeads } = {}) {
  return async function leadsExport(req, res) {
    const send = (status, data) => {
      if (res.destroyed || res.writableEnded) return;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(JSON.stringify(data));
    };
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return send(405, { error: 'Use GET.' }); }
    const config = getConfig();
    const token = config.LEADS_EXPORT_TOKEN;
    if (typeof token !== 'string' || token.length < 32 || !config.MONGODB_URI) return send(503, { error: 'Leads export is not configured.' });
    if (!authorized(req.headers.authorization, token)) return send(401, { error: 'Not authorized.' });
    try {
      const leads = (await listLeads(config, LIMIT)).map(toRow);
      return send(200, { count: leads.length, generatedAt: new Date().toISOString(), leads });
    } catch {
      // Never return connection strings or driver errors.
      return send(503, { error: 'Leads are unavailable right now.' });
    }
  };
}
