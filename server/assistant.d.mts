import type { IncomingMessage, ServerResponse } from 'node:http';
export function createAssistantHandler(options?: { getConfig?: () => Record<string, string | undefined>; fetchImpl?: typeof fetch; now?: () => number }): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
