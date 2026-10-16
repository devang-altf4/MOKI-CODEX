import { createAssistantHandler } from '../server/assistant.mjs';

// The same server-only endpoint is used locally and on Vercel.
export default createAssistantHandler();
