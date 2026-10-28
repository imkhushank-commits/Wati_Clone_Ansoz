const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  waMessageId: { type: String, index: true, sparse: true },
  waId: { type: String, required: true, index: true },
  contactName: { type: String, default: '' },
  direction: { type: String, enum: ['inbound', 'outbound'], required: true },
  type: { type: String, default: 'text' },
  text: { type: String, default: '' },
  status: { type: String, default: 'received' },
  timestamp: { type: Date, default: Date.now, index: true },
  raw: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

messageSchema.index({ waMessageId: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Message', messageSchema);
