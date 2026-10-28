require('dotenv').config();
const http = require('http');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN.split(',').map(s => s.trim()), methods: ['GET', 'POST'] }
});
app.use(cors({ origin: FRONTEND_ORIGIN.split(',').map(s => s.trim()) }));
// Preserve the exact request bytes so the Meta webhook signature can be checked.
app.use(express.json({
  verify: (req, res, buffer) => { if (req.originalUrl.startsWith('/webhook')) req.rawBody = Buffer.from(buffer); }
}));

const requireWhatsAppConfig = (res) => {
  const missing = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'].filter(key => !process.env[key]);
  if (missing.length) {
    res.status(503).json({ error: `WhatsApp is not configured. Add ${missing.join(' and ')} to src/server/.env.` });
    return false;
  }
  return true;
};

async function sendCloudApiText(to, body) {
  const version = process.env.WHATSAPP_API_VERSION || 'v23.0';
  const url = `https://graph.facebook.com/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to, type: 'text', text: { preview_url: false, body } })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result?.error?.message || 'WhatsApp Cloud API request failed');
    error.status = response.status;
    error.details = result;
    throw error;
  }
  return result;
}

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'wati-clone-backend', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// List chats ordered by latest activity.
app.get('/api/conversations', async (req, res, next) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { timestamp: -1 } },
      { $group: {
        _id: '$waId',
        waId: { $first: '$waId' },
        contactName: { $first: '$contactName' },
        lastMessage: { $first: '$text' },
        lastMessageType: { $first: '$type' },
        lastMessageAt: { $first: '$timestamp' },
        lastDirection: { $first: '$direction' },
        lastStatus: { $first: '$status' }
      } },
      { $sort: { lastMessageAt: -1 } },
      { $limit: 200 }
    ]);
    res.json({ conversations });
  } catch (err) { next(err); }
});

app.get('/api/messages/:waId', async (req, res, next) => {
  try {
    const waId = String(req.params.waId).replace(/[^0-9]/g, '');
    const messages = await Message.find({ waId }).sort({ timestamp: 1 }).limit(500).lean();
    res.json({ messages });
  } catch (err) { next(err); }
});

// Send a text reply to a customer from the website inbox.
app.post('/api/messages', async (req, res) => {
  if (!requireWhatsAppConfig(res)) return;
  const waId = String(req.body?.to || '').replace(/[^0-9]/g, '');
  const text = String(req.body?.text || '').trim();
  if (!waId || waId.length < 8 || !text || text.length > 4096) {
    return res.status(400).json({ error: 'Provide a valid customer number (country code, digits only) and message text (1–4096 characters).' });
  }
  try {
    const apiResult = await sendCloudApiText(waId, text);
    const saved = await Message.create({
      waMessageId: apiResult.messages?.[0]?.id,
      waId,
      direction: 'outbound',
      type: 'text',
      text,
      status: 'sent',
      timestamp: new Date(),
      raw: apiResult
    });
    io.emit('message:new', saved.toObject());
    res.status(201).json({ message: saved, whatsapp: apiResult });
  } catch (err) {
    console.error('WhatsApp send error:', err.details || err.message);
    res.status(err.status || 500).json({ error: err.message, details: err.details });
  }
});

// Meta verifies the webhook by sending a GET request with hub.challenge.
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).type('text/plain').send(String(challenge));
  }
  return res.sendStatus(403);
});

function validMetaSignature(req) {
  // Meta App Secret signature check is enabled when WHATSAPP_APP_SECRET is configured.
  if (!process.env.WHATSAPP_APP_SECRET) return process.env.NODE_ENV !== 'production';
  const signature = req.get('x-hub-signature-256');
  if (!signature || !req.rawBody) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.WHATSAPP_APP_SECRET).update(req.rawBody).digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

app.post('/webhook', async (req, res) => {
  if (!validMetaSignature(req)) return res.status(401).send('Invalid webhook signature');
  // Acknowledge quickly; Meta may retry webhooks if it does not receive a 2xx response.
  res.sendStatus(200);
  try {
    const entries = req.body?.entry || [];
    for (const entry of entries) {
      for (const change of (entry.changes || [])) {
        const value = change.value || {};
        if (change.field !== 'messages') continue;
        const contacts = value.contacts || [];
        for (const item of (value.messages || [])) {
          const waId = String(item.from || '');
          const contact = contacts.find(c => c.wa_id === waId);
          const text = item.text?.body || item.button?.text || item.interactive?.button_reply?.title || item.interactive?.list_reply?.title || (item.type === 'image' ? '[Image]' : item.type === 'document' ? '[Document]' : item.type === 'audio' ? '[Audio]' : item.type === 'video' ? '[Video]' : `[${item.type || 'message'}]`);
          // Idempotent save: Meta can retry delivery of the same webhook.
          const saved = await Message.findOneAndUpdate(
            { waMessageId: item.id },
            { $setOnInsert: {
              waMessageId: item.id, waId, contactName: contact?.profile?.name || '',
              direction: 'inbound', type: item.type || 'text', text,
              status: 'received', timestamp: item.timestamp ? new Date(Number(item.timestamp) * 1000) : new Date(), raw: item
            } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
          io.emit('message:new', saved.toObject());
        }
        for (const status of (value.statuses || [])) {
          const updated = await Message.findOneAndUpdate(
            { waMessageId: status.id }, { $set: { status: status.status || 'unknown' } }, { new: true }
          );
          if (updated) io.emit('message:status', { waMessageId: status.id, status: status.status });
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

io.on('connection', socket => {
  socket.emit('inbox:connected', { connected: true });
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI. Copy .env.example to .env and configure MongoDB first.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  server.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
}
start().catch(err => { console.error('Backend startup failed:', err.message); process.exit(1); });
