// controller/bodyShopDay.js
const BodyShopDay = require("../models/collectionBS.js");

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
    mobileNo: String(e.mobileNo || "").trim(),
    regNo: String(e.regNo || "").trim(),
    vehicle: String(e.vehicle || "").trim(), // new field
    modeOfService: String(e.modeOfService || "").trim(),  // mechanic | body shop
    modeOfPayment: String(e.modeOfPayment || "").trim(),  // gpay | cash | card
    amount: Number(e.amount || 0),
  }));
}

// CREATE/UPSERT day: POST /bodyshop/create
exports.createBodyShop = async (req, res) => {
  try {
    const { date, entries } = req.body || {};
    if (!date || !Array.isArray(entries)) {
      return res
        .status(400)
        .json({ success: false, message: "date and entries[] are required" });
    }
    const day = atStartOfDay(date);
    const safeEntries = normalizeEntries(entries);

    let doc = await BodyShopDay.findOne({ date: day });
    if (!doc) doc = new BodyShopDay({ date: day, entries: safeEntries });
    else doc.entries = safeEntries;

    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Create failed" });
  }
};

// UPDATE whole day: PUT /bodyshop/update/:id
exports.updateBodyShop = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await BodyShopDay.findById(id);
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

// LIST days: GET /bodyshop/list?start=YYYY-MM-DD&end=YYYY-MM-DD
exports.listBodyShop = async (req, res) => {
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
    const rows = await BodyShopDay.find(q).sort({ date: -1 });
    return res.json({ success: true, data: rows });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "List failed" });
  }
};

// GET one: GET /bodyshop/:id
exports.getBodyShopById = async (req, res) => {
  try {
    const row = await BodyShopDay.findById(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: row });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Fetch failed" });
  }
};

// DELETE day: DELETE /bodyshop/delete/:id
exports.deleteBodyShop = async (req, res) => {
  try {
    const doc = await BodyShopDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    await doc.deleteOne();
    return res.json({ success: true, message: "Deleted" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Delete failed" });
  }
};

// ENTRY-LEVEL: POST /bodyshop/:id/entry
exports.addBodyEntry = async (req, res) => {
  try {
    const doc = await BodyShopDay.findById(req.params.id);
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

// ENTRY-LEVEL: PUT /bodyshop/:id/entry/:entryId
exports.updateBodyEntry = async (req, res) => {
  try {
    const doc = await BodyShopDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const entry = doc.entries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    if (req.body.name != null) entry.name = String(req.body.name).trim();
    if (req.body.mobileNo != null) entry.mobileNo = String(req.body.mobileNo).trim();
    if (req.body.regNo != null) entry.regNo = String(req.body.regNo).trim();
    if (req.body.vehicle != null) entry.vehicle = String(req.body.vehicle).trim();
    if (req.body.modeOfService != null) entry.modeOfService = String(req.body.modeOfService).trim();
    if (req.body.modeOfPayment != null) entry.modeOfPayment = String(req.body.modeOfPayment).trim();
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

// ENTRY-LEVEL: DELETE /bodyshop/:id/entry/:entryId
exports.deleteBodyEntry = async (req, res) => {
  try {
    const doc = await BodyShopDay.findById(req.params.id);
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
