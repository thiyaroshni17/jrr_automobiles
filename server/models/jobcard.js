// models/jobcard.js
const mongoose = require('mongoose');
const Counter = require('./counter'); // requires models/counter.js (see below)

// Subdocument for services
const serviceSchema = new mongoose.Schema({
  sno: { type: Number, required: true },               // backend-calculated
  description: { type: String, required: true },
  amount: { type: Number, required: true },
});

// Main JobCard schema
const JobcardSchema = new mongoose.Schema({
  jobcardID: { type: String, unique: true, index: true }, // auto-filled via pre-save
  customerName: { type: String, required: true },
  email: { type: String },
  mobileno: { type: String, required: true },
  address: { type: String },
  date: { type: Date, default: Date.now },
  RegNo: { type: String, required: true, unique: true },
  vehicleModel: { type: String, required: true },
  brand: { type: String },
  dieselOrPetrol: { type: String },
  kilometers: { type: String },
  services: [serviceSchema],
  totalamount: { type: Number, default: 0 },              // backend-calculated
  remarks: { type: String },
});

// Per-year incremental ID generator (e.g., JRR-2025-00001)
async function getNextJobcardId() {
  const year = new Date().getFullYear();
  const key = `jobcard_${year}`;
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  const padded = String(doc.seq).padStart(5, '0');
  return `JRR-${year}-${padded}`;
}

// Assign jobcardID automatically if not set
JobcardSchema.pre('save', async function (next) {
  try {
    if (!this.jobcardID) {
      this.jobcardID = await getNextJobcardId();
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('JobCard', JobcardSchema);
