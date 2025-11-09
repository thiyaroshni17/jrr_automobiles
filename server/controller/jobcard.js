// controller/jobcard.js
const JobCard = require('../models/jobcard');

// Create
exports.createJobCard = async (req, res) => {
  try {
    const body = req.body || {};
    const doc = new JobCard({
      date: body.date,
      name: body.name,
      mobileno: body.mobileno,
      regno: body.regno,
      address: body.address,
      email: body.email,
      vehicleModel: body.vehicleModel || body['vehicle model'],
      brand: body.brand,
      fuelType: body.fuelType,
      kilometers: body.kilometers,
      spares: Array.isArray(body.spares) ? body.spares : [],
      labours: Array.isArray(body.labour) ? body.labour : Array.isArray(body.labours) ? body.labours : [],
      remarks: body.remarks,
      ...(body.status ? { status: body.status } : {}),
    });

    await doc.validate();
    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Create failed' });
  }
};

// Read
exports.getJobCardById = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Fetch failed' });
  }
};

// List
exports.listJobCards = async (_req, res) => {
  try {
    const rows = await JobCard.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || 'List failed' });
  }
};

// Update (allows manual status change)
exports.updateJobCard = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    const patch = req.body || {};
    const fields = [
      'date','name','mobileno','regno','address','email',
      'vehicleModel','brand','fuelType','kilometers',
      'spares','labours','remarks','status'
    ];
    fields.forEach(f => {
      if (patch[f] !== undefined) doc[f] = patch[f];
    });

    await doc.validate();
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Update failed' });
  }
};

// Delete
exports.deleteJobCard = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    await doc.deleteOne();
    return res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Delete failed' });
  }
};

// Add/Update/Delete Spares
exports.addSpare = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    const item = req.body || {};
    doc.spares.push({
      description: item.description,
      quantity: item.quantity,
      amount: item.amount,
      checkbox: !!item.checkbox
    });
    await doc.validate();
    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Add spare failed' });
  }
};

exports.updateSpare = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    const it = doc.spares.id(req.params.itemId);
    if (!it) return res.status(404).json({ success: false, message: 'Spare not found' });

    const patch = req.body || {};
    ['description','quantity','amount','checkbox'].forEach(k => {
      if (patch[k] !== undefined) it[k] = patch[k];
    });

    await doc.validate();
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Update spare failed' });
  }
};

exports.deleteSpare = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    const it = doc.spares.id(req.params.itemId);
    if (!it) return res.status(404).json({ success: false, message: 'Spare not found' });
    it.deleteOne();

    await doc.validate();
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Delete spare failed' });
  }
};

// Add/Update/Delete Labours
exports.addLabour = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    const item = req.body || {};
    doc.labours.push({
      description: item.description,
      quantity: item.quantity,
      amount: item.amount,
      checkbox: !!item.checkbox
    });
    await doc.validate();
    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Add labour failed' });
  }
};

exports.updateLabour = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    const it = doc.labours.id(req.params.itemId);
    if (!it) return res.status(404).json({ success: false, message: 'Labour not found' });

    const patch = req.body || {};
    ['description','quantity','amount','checkbox'].forEach(k => {
      if (patch[k] !== undefined) it[k] = patch[k];
    });

    await doc.validate();
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Update labour failed' });
  }
};

exports.deleteLabour = async (req, res) => {
  try {
    const doc = await JobCard.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    const it = doc.labours.id(req.params.itemId);
    if (!it) return res.status(404).json({ success: false, message: 'Labour not found' });
    it.deleteOne();

    await doc.validate();
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message || 'Delete labour failed' });
  }
};
