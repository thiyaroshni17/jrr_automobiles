/// models/jobcard.js
const mongoose = require('mongoose');
const Counter = require('./counter');                // your Counter model
const BodyShopDay = require('./collectionBS');       // your BodyShopDay model

const lineItemSchema = new mongoose.Schema({
  description: { type: String, trim: true },
  quantity: { type: Number, default: 0 },
  amount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  checkbox: { type: Boolean, default: false },
  sno: { type: Number }, // auto-numbered 1..n
}, { _id: true, timestamps: false });

const jobcardSchema = new mongoose.Schema({
  jobcardNo: { type: String, unique: true, index: true }, // e.g., JRR-2025-00001
  date: { type: String, trim: true }, // "DD-MM-YYYY"
  name: { type: String, trim: true },
  mobileno: { type: String, trim: true },
  regno: { type: String, trim: true },
  address: { type: String, trim: true },
  email: { type: String, trim: true },
  vehicleModel: { type: String, trim: true },
  brand: { type: String, trim: true },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'ev'] },
  kilometers: { type: Number, default: 0 },

  spares: { type: [lineItemSchema], default: [] },
  labours: { type: [lineItemSchema], default: [] },

  remarks: { type: String, trim: true },

  grandTotal: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },

  // Optional compatibility fields if you also track collections elsewhere
  collections: {
    bodyshop: { type: Number, default: 0 },
    waterwash: { type: Number, default: 0 },
    pettycash: { type: Number, default: 0 },
  },
  amountCollected: { type: Number, default: 0 },

  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
}, { timestamps: true });

function parseYearFromDMY(dmy) {
  if (typeof dmy !== 'string') return new Date().getFullYear();
  const parts = dmy.split('-').map(Number);
  return Number(parts?.[2]) || new Date().getFullYear();
}

function pad(n, width = 5) {
  const s = String(n || 0);
  return s.length >= width ? s : '0'.repeat(width - s.length) + s;
}

async function nextJobcardSequence(year) {
  const key = `jobcard_${year}`;
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq || 1;
}

function recomputeLines(list) {
  let sum = 0;
  (list || []).forEach((item, idx) => {
    item.sno = idx + 1;
    const qty = Number(item.quantity) || 0;
    const amt = Number(item.amount) || 0;
    item.totalAmount = qty * amt;
    sum += item.totalAmount;
  });
  return sum;
}

async function sumBodyshopByJobcardNo(jobcardNo) {
  if (!jobcardNo) return 0;
  const agg = await BodyShopDay.aggregate([
    { $unwind: '$entries' },
    { $match: { 'entries.jobcardNo': jobcardNo } },
    { $group: { _id: null, total: { $sum: '$entries.amount' } } },
  ]);
  return Number(agg?.[0]?.total || 0);
}

jobcardSchema.pre('validate', async function () {
  const doc = this;

  // 1) Auto-assign jobcardNo if missing (format: JRR-YYYY-00001)
  if (doc.isNew && !doc.jobcardNo) {
    const yr = parseYearFromDMY(doc.date);
    const seq = await nextJobcardSequence(yr);
    doc.jobcardNo = `JRR-${yr}-${pad(seq)}`;
  }

  // 2) Recompute line S.No and totals
  const sparesSum = recomputeLines(doc.spares);
  const labourSum = recomputeLines(doc.labours);
  doc.grandTotal = sparesSum + labourSum;

  // 3) Sync advancePaid from BodyShopDay aggregated by jobcardNo
  const collected = await sumBodyshopByJobcardNo(doc.jobcardNo);
  doc.collections = doc.collections || {};
  doc.collections.bodyshop = collected;
  doc.amountCollected = collected;
  doc.advancePaid = collected;

  // 4) Balance
  doc.balance = Number(doc.grandTotal) - Number(doc.advancePaid);

  // 5) Auto status unless explicitly modified
  if (!doc.isModified('status')) {
    const items = [...(doc.spares || []), ...(doc.labours || [])];
    const hasItems = items.length > 0;
    const allChecked = hasItems && items.every(it => it.checkbox === true);
    doc.status = allChecked ? 'completed' : 'pending';
  }
});

module.exports = mongoose.model('JobCard', jobcardSchema);
