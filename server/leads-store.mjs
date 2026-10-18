import { MongoClient } from 'mongodb';

// One small connection pool per server process, shared by warm Vercel requests.
export function createMongoLeadStore() {
  let client, connecting, currentUri;
  return async function saveLead(lead, config) {
    const uri = config.MONGODB_URI;
    if (!uri?.startsWith('mongodb+srv://') && !uri?.startsWith('mongodb://')) throw Error('Database unavailable');
    const database = config.MONGODB_DATABASE || 'moki';
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(database)) throw Error('Database unavailable');
    if (!connecting || currentUri !== uri) {
      if (client) await client.close().catch(() => {});
      currentUri = uri;
      client = new MongoClient(uri, {
        maxPoolSize: 3, minPoolSize: 0, maxIdleTimeMS: 60_000,
        serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000,
        socketTimeoutMS: 10_000, waitQueueTimeoutMS: 8000,
      });
      const pendingClient = client;
      connecting = client.connect().catch(async error => {
        if (client === pendingClient) connecting = undefined;
        await pendingClient.close().catch(() => {});
        throw error;
      });
    }
    const connected = await connecting;
    const leads = connected.db(database).collection('demo_requests', { writeConcern: { w: 'majority', wtimeoutMS: 8000 } });
    let record;
    try {
      record = await leads.findOneAndUpdate(
        { _id: lead.requestId },
        { $setOnInsert: { ...lead, createdAt: new Date(), status: 'new' } },
        { upsert: true, returnDocument: 'after', projection: { requestHash: 1 }, maxTimeMS: 8000 },
      );
    } catch (error) {
      // Concurrent retries with the same ID must never create two enquiries.
      if (error.code !== 11000) throw error;
      record = await leads.findOne({ _id: lead.requestId }, { projection: { requestHash: 1 }, maxTimeMS: 8000 });
    }
    if (!record) throw Error('Save not confirmed');
    return { conflict: record.requestHash !== lead.requestHash };
  };
}

export const saveMongoLead = createMongoLeadStore();
