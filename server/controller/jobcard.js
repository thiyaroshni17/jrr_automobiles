// controllers/jobcardController.js
const mongoose = require('mongoose');
const JobCard = require('../models/jobcard'); // adjust path as needed

// Helpers
function normalizeServices(servicesInput) {
  const list = Array.isArray(servicesInput) ? servicesInput : [];
  return list.map((s, idx) => ({
    sno: idx + 1,                                 // backend-calculated serial
    description: String(s.description || '').trim(),
    amount: Number(s.amount || 0),
  }));
}

function computeTotal(services) {
  return services.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
}

// POST /api/jobcards
async function createJobCard(req, res) {
  try {
    const {
      customerName,
      email,
      mobileno,
      address,
      date,
      RegNo,
      vehicleModel,
      brand,
      dieselOrPetrol,
      kilometers,
      services,
      remarks,
    } = req.body || {};

    // Validate minimal required fields from schema
    if (!customerName || !mobileno || !RegNo || !vehicleModel) {
      return res.status(400).json({
        message: 'customerName, mobileno, RegNo, and vehicleModel are required',
      });
    }

    const normalizedServices = normalizeServices(services);
    const totalamount = computeTotal(normalizedServices);

    const doc = new JobCard({
      customerName,
      email,
      mobileno,
      address,
      date, // optional; model has default if not provided
      RegNo,
      vehicleModel,
      brand,
      dieselOrPetrol,
      kilometers,
      services: normalizedServices,
      totalamount, // backend-calculated total
      remarks,
    });

    const saved = await doc.save();
    return res.status(201).json(saved);
  } catch (err) {
    // Handle duplicate RegNo (unique index)
    if (err && err.code === 11000 && err.keyPattern && err.keyPattern.RegNo) {
      return res.status(409).json({ message: 'RegNo already exists' });
    }
    return res.status(500).json({ message: 'Failed to create jobcard', error: err?.message });
  }
}

// PUT /api/jobcards/:id
async function updateJobCard(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid JobCard id' });
    }

    const existing = await JobCard.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'JobCard not found' });
    }

    // Fields allowed to update
    const up = {};
    const updatable = [
      'customerName',
      'email',
      'mobileno',
      'address',
      'date',
      'RegNo',
      'vehicleModel',
      'brand',
      'dieselOrPetrol',
      'kilometers',
      'remarks',
    ];
    updatable.forEach((k) => {
      if (k in req.body) up[k] = req.body[k];
    });

    // If services provided, normalize and recompute total
    let servicesToSave = existing.services;
    if ('services' in req.body) {
      servicesToSave = normalizeServices(req.body.services);
    }
    const totalamount = computeTotal(servicesToSave);

    const updated = await JobCard.findByIdAndUpdate(
      id,
      { ...up, services: servicesToSave, totalamount },
      { new: true, runValidators: true }
    );

    return res.status(200).json(updated);
  } catch (err) {
    // Handle duplicate RegNo on update
    if (err && err.code === 11000 && err.keyPattern && err.keyPattern.RegNo) {
      return res.status(409).json({ message: 'RegNo already exists' });
    }
    return res.status(500).json({ message: 'Failed to update jobcard', error: err?.message });
  }
}

// GET /api/jobcards
async function listJobCards(req, res) {
  try {
    const docs = await JobCard.find().sort({ date: -1, _id: -1 });
    return res.status(200).json(docs);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to list jobcards', error: err?.message });
  }
}

// GET /api/jobcards/:id
async function getJobCardById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid JobCard id' });
    }
    const doc = await JobCard.findById(id);
    if (!doc) return res.status(404).json({ message: 'JobCard not found' });
    return res.status(200).json(doc);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch jobcard', error: err?.message });
  }
}

// DELETE /api/jobcards/:id
async function deleteJobCard(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid JobCard id' });
    }
    const doc = await JobCard.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'JobCard not found' });
    return res.status(200).json({ message: 'JobCard deleted', id });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete jobcard', error: err?.message });
  }
}

module.exports = {
  createJobCard,
  updateJobCard,
  listJobCards,
  getJobCardById,
  deleteJobCard,
};
