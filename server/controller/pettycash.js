// controller/pettycashDay.js
const mongoose = require("mongoose");
const PettyCashDay = require("../models/pettycash");

// Helpers
function atStartOfDay(d) {
  const dt = new Date(d || Date.now());
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function normalizeEntries(entriesInput) {
  const list = Array.isArray(entriesInput) ? entriesInput : [];
  return list.map((e) => ({
    sno: Number(e.sno) > 0 ? Number(e.sno) : undefined, // allow hook to fill
    description: String(e.description || "").trim(),
    amount: Number(e.amount || 0),
  }));
}

// CREATE/UPSERT day: POST /pettycash/create
exports.createPettyCash = async (req, res) => {
  try {
    const { date, entries } = req.body || {};
    if (!date || !Array.isArray(entries)) {
      return res
        .status(400)
        .json({ success: false, message: "date and entries[] are required" });
    }

    const day = atStartOfDay(date);
    const safeEntries = normalizeEntries(entries);

    // Upsert behavior: if the day exists, replace entries; else create new day
    let doc = await PettyCashDay.findOne({ date: day });
    if (!doc) {
      doc = new PettyCashDay({ date: day, entries: safeEntries });
    } else {
      doc.entries = safeEntries;
    }

    await doc.save();
    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    // Duplicate date unique constraint or validation errors can land here
    return res
      .status(500)
      .json({ success: false, message: e.message || "Create failed" });
  }
};

// UPDATE whole day: PUT /pettycash/update/:id
exports.updatePettyCash = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await PettyCashDay.findById(id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });

    if (req.body.date) doc.date = atStartOfDay(req.body.date);
    if (Array.isArray(req.body.entries)) {
      doc.entries = normalizeEntries(req.body.entries);
    }

    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Update failed" });
  }
};

// LIST days: GET /pettycash/list?start=YYYY-MM-DD&end=YYYY-MM-DD
exports.listPettyCash = async (req, res) => {
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
    const rows = await PettyCashDay.find(q).sort({ date: -1 });
    return res.json({ success: true, data: rows });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "List failed" });
  }
};

// GET one day: GET /pettycash/:id
exports.getPettyCashById = async (req, res) => {
  try {
    const row = await PettyCashDay.findById(req.params.id);
    if (!row)
      return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: row });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Fetch failed" });
  }
};

// DELETE day: DELETE /pettycash/delete/:id
exports.deletePettyCash = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await PettyCashDay.findById(id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });
    await doc.deleteOne();
    return res.json({ success: true, message: "Deleted" });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Delete failed" });
  }
};

// ENTRY-LEVEL: POST /pettycash/:id/entry
exports.addPettyEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await PettyCashDay.findById(id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });

    const entry = normalizeEntries([req.body || {}])[0];

    // Assign sno if not provided using max+1; replace with Counter() if desired
    if (!Number.isFinite(entry.sno) || entry.sno <= 0) {
      const maxSno =
        doc.entries.length > 0
          ? Math.max(...doc.entries.map((e) => Number(e.sno) || 0))
          : 0;
      entry.sno = maxSno + 1;
      // If you have a Counter per-day, you can do:
      // entry.sno = await Counter.next(`petty:${doc.date.toISOString().slice(0,10)}`);
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

// ENTRY-LEVEL: PUT /pettycash/:id/entry/:entryId
exports.updatePettyEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const doc = await PettyCashDay.findById(id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });

    const entry = doc.entries.id(entryId);
    if (!entry)
      return res.status(404).json({ success: false, message: "Entry not found" });

    if (req.body.description != null)
      entry.description = String(req.body.description).trim();
    if (req.body.amount != null) entry.amount = Number(req.body.amount) || 0;
    if (Number.isFinite(req.body.sno) && req.body.sno > 0)
      entry.sno = Number(req.body.sno);

    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Update entry failed" });
  }
};

// ENTRY-LEVEL: DELETE /pettycash/:id/entry/:entryId
exports.deletePettyEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const doc = await PettyCashDay.findById(id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });

    const entry = doc.entries.id(entryId);
    if (!entry)
      return res.status(404).json({ success: false, message: "Entry not found" });

    entry.deleteOne();
    await doc.save();
    return res.json({ success: true, data: doc });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Delete entry failed" });
  }
};
