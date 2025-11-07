// controller/waterWashDay.js
const WaterWashDay = require("../models/collectionWW.js");

// Helpers
function atStartOfDay(d) {
  const dt = new Date(d || Date.now());
  dt.setHours(0, 0, 0, 0);
  return dt;
}
function normalizeEntries(entriesInput) {
  const list = Array.isArray(entriesInput) ? entriesInput : [];
  return list.map((e) => ({
    sno: Number(e.sno) > 0 ? Number(e.sno) : undefined,
    name: String(e.name || "").trim(),
    vehicle: String(e.vehicle || "").trim(),
    modeOfPayment: String(e.modeOfPayment || "").trim(),
    mobileNo: String(e.mobileNo || "").trim(),
    regNo: String(e.regNo || "").trim(),
    amount: Number(e.amount || 0),
  }));
}

// CREATE/UPSERT day: POST /waterwash/create
exports.createWaterWash = async (req, res) => {
  try {
    const { date, entries } = req.body || {};
    if (!date || !Array.isArray(entries)) {
      return res
        .status(400)
        .json({ success: false, message: "date and entries[] are required" });
    }
    const day = atStartOfDay(date);
    const safe = normalizeEntries(entries);

    let doc = await WaterWashDay.findOne({ date: day });
    if (!doc) doc = new WaterWashDay({ date: day, entries: safe });
    else doc.entries = safe;

    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Create failed" });
  }
};

// UPDATE whole day: PUT /waterwash/update/:id
exports.updateWaterWash = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await WaterWashDay.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    if (req.body.date) doc.date = atStartOfDay(req.body.date);
    if (Array.isArray(req.body.entries)) doc.entries = normalizeEntries(req.body.entries);

    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Update failed" });
  }
};

// LIST days: GET /waterwash/list?start=YYYY-MM-DD&end=YYYY-MM-DD
exports.listWaterWash = async (req, res) => {
  try {
    const { start, end } = req.query || {};
    const q = {};
    if (start || end) {
      q.date = {};
      if (start) q.date.$gte = atStartOfDay(start);
      if (end) {
        const endDt = atStartOfDay(end);
        endDt.setDate(endDt.getDate() + 1);
        q.date.$lt = endDt;
      }
    }
    const rows = await WaterWashDay.find(q).sort({ date: -1 });
    return res.json({ success: true, data: rows });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "List failed" });
  }
};

// GET one: GET /waterwash/:id
exports.getWaterWashById = async (req, res) => {
  try {
    const row = await WaterWashDay.findById(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: row });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Fetch failed" });
  }
};

// DELETE day: DELETE /waterwash/delete/:id
exports.deleteWaterWash = async (req, res) => {
  try {
    const doc = await WaterWashDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    await doc.deleteOne();
    return res.json({ success: true, message: "Deleted" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Delete failed" });
  }
};

// ENTRY-LEVEL: POST /waterwash/:id/entry
exports.addWashEntry = async (req, res) => {
  try {
    const doc = await WaterWashDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const entry = normalizeEntries([req.body || {}])[0];

    if (!Number.isFinite(entry.sno) || entry.sno <= 0) {
      const maxSno =
        doc.entries.length > 0
          ? Math.max(...doc.entries.map((e) => Number(e.sno) || 0))
          : 0;
      entry.sno = maxSno + 1;
    }

    doc.entries.push(entry);
    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Add entry failed" });
  }
};

// ENTRY-LEVEL: PUT /waterwash/:id/entry/:entryId
exports.updateWashEntry = async (req, res) => {
  try {
    const doc = await WaterWashDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const entry = doc.entries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    if (req.body.name != null) entry.name = String(req.body.name).trim();
    if (req.body.vehicle != null) entry.vehicle = String(req.body.vehicle).trim();
    if (req.body.modeOfPayment != null) entry.modeOfPayment = String(req.body.modeOfPayment).trim();
    if (req.body.mobileNo != null) entry.mobileNo = String(req.body.mobileNo).trim();
    if (req.body.regNo != null) entry.regNo = String(req.body.regNo).trim();
    if (req.body.amount != null) entry.amount = Number(req.body.amount) || 0;
    if (Number.isFinite(req.body.sno) && req.body.sno > 0) entry.sno = Number(req.body.sno);

    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Update entry failed" });
  }
};

// ENTRY-LEVEL: DELETE /waterwash/:id/entry/:entryId
exports.deleteWashEntry = async (req, res) => {
  try {
    const doc = await WaterWashDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const entry = doc.entries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    entry.deleteOne();
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Delete entry failed" });
  }
};
