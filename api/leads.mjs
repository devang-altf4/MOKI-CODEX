import { createLeadsHandler } from '../server/leads.mjs';

// Server-only: credentials never enter the browser bundle.
export default createLeadsHandler();
