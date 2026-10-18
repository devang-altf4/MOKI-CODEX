import type { IncomingMessage, ServerResponse } from 'node:http';
export function createLeadsHandler(options?: {
  getConfig?: () => Record<string, string | undefined>;
  saveLead?: (lead: Record<string, string>, config: Record<string, string | undefined>) => Promise<{ conflict: boolean }>;
  now?: () => number;
}): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
