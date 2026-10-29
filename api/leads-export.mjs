import { createLeadsExportHandler } from '../server/leads-export.mjs';

// Server-only, token-protected feed for the owner's leads spreadsheet.
export default createLeadsExportHandler();
