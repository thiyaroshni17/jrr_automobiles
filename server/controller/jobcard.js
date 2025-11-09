// controller/jobcard.js

const mongoose = require('mongoose');
const JobCard = require('../models/jobcard');           // schema has jobcardNo unique + fields used below
const Counter = require('../models/counter');           // {_id: "jobcard_YYYY", seq: Number} for numbering

// Helpers
const currentYear = () => new Date().getFullYear();     // use server year so numbering is consistent
const formatJobNo = (year, seq) => `JRR-${year}-${String(seq).padStart(5, '0')}`;

// Allocate next number atomically per year
async function nextJobcardNo() {
  const year = currentYear();
  const key = `jobcard_${year}`;
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  const seq = doc?.seq || 1;
  return formatJobNo(year, seq);
}

// Normalize rows: assign sno = 1..n and compute totalAmount = amount * quantity
function normalizeItems(items) {
  const arr = Array.isArray(items) ? items : [];
  return arr.map((it, idx) => {
    const quantity = Number(it.quantity || 0);
    const amount = Number(it.amount || 0);
    const totalAmount = Math.max(0, quantity * amount);
    return {
      ...it,
      sno: idx + 1,
      quantity,
      amount,
      totalAmount
    };
  });
}

// Create: POST /jobcard/create
exports.createJobCard = async (req, res) => {
  try {
    const body = req.body || {};

    // Map and normalize inputs
    const spares = normalizeItems(body.spares);
    const labours = normalizeItems(body.labours || body.labour);

    // Build document (do not trust client to send jobcardNo)
    const doc = new JobCard({
      // Number is assigned here; do not set from client
      date: body.date,                                   // expects "DD-MM-YYYY" from UI
      name: body.name,
      mobileno: body.mobileno,
      regno: body.regno,
      address: body.address,
      email: body.email,
      vehicleModel: body.vehicleModel || body['vehicle model'],
      brand: body.brand,
      fuelType: body.fuelType,                           // "petrol" | "diesel" | "ev"
      kilometers: body.kilometers ?? body.kilometer,    // unify to 'kilometers' in model
      spares,
      labours,
      remarks: body.remarks,
      advancePaid: Number(body.advancePaid || 0),
      ...(body.status ? { status: body.status } : {})   // "pending" | "completed"
    });

    // Allocate jobcardNo with a small retry in case of rare duplicate under high concurrency
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (!doc.jobcardNo) {
          doc.jobcardNo = await nextJobcardNo();
        }
        await doc.validate();
        await doc.save();
        return res.status(201).json({ success: true, data: doc });
      } catch (e) {
        // Handle duplicate key on unique jobcardNo (E11000)
        if (e && e.code === 11000 && /jobcardNo/.test(e.message || '')) {
          doc.jobcardNo = undefined; // regenerate on next loop
          continue;
        }
        throw e;
      }
    }

    return res.status(409).json({ success: false, message: 'Could not allocate jobcard number after retries' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Create failed' });
  }
};

// List all: GET /jobcard/list
exports.listJobCards = async (req, res) => {
  try {
    // Optional basic filters can be added here (status, regno, date range, etc.)
    const docs = await JobCard.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: docs });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'List failed' });
  }
};

// Get one: GET /jobcard/list/:id
exports.getJobCardById = async (req, res) => {
  try {
    const { id } = req.params || {};
    const doc = await JobCard.findById(id).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Fetch failed' });
  }
};

// Update: PUT /jobcard/update/:id
exports.updateJobCard = async (req, res) => {
  try {
    const { id } = req.params || {};
    const body = req.body || {};

    const existing = await JobCard.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    // Update allowed fields; keep jobcardNo unchanged
    if (typeof body.date === 'string') existing.date = body.date;
    if (typeof body.name === 'string') existing.name = body.name;
    if (typeof body.mobileno === 'string') existing.mobileno = body.mobileno;
    if (typeof body.regno === 'string') existing.regno = body.regno;
    if (typeof body.address === 'string') existing.address = body.address;
    if (typeof body.email === 'string') existing.email = body.email;
    if (typeof body.vehicleModel === 'string' || typeof body['vehicle model'] === 'string') {
      existing.vehicleModel = body.vehicleModel || body['vehicle model'];
    }
    if (typeof body.brand === 'string') existing.brand = body.brand;
    if (typeof body.fuelType === 'string') existing.fuelType = body.fuelType;
    if (typeof body.kilometers !== 'undefined' || typeof body.kilometer !== 'undefined') {
      existing.kilometers = Number(body.kilometers ?? body.kilometer ?? 0);
    }
    if (typeof body.remarks === 'string') existing.remarks = body.remarks;
    if (typeof body.advancePaid !== 'undefined') existing.advancePaid = Number(body.advancePaid || 0);
    if (typeof body.status === 'string') existing.status = body.status;

    if (Array.isArray(body.spares)) existing.spares = normalizeItems(body.spares);
    if (Array.isArray(body.labours) || Array.isArray(body.labour)) {
      existing.labours = normalizeItems(body.labours || body.labour);
    }

    await existing.save();
    return res.status(200).json({ success: true, data: existing });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Update failed' });
  }
};

// Delete: DELETE /jobcard/delete/:id
exports.deleteJobCard = async (req, res) => {
  try {
    const { id } = req.params || {};
    const deleted = await JobCard.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: deleted });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Delete failed' });
  }
};
