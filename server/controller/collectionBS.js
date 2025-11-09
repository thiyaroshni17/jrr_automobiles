// controller/bodyShopDay.js
const mongoose = require("mongoose");
const BodyShopDay = require("../models/collectionBS");
const JobCard = require("../models/jobcard"); // existing JobCard model
// BillCopy is optional; use registered model if it exists
let BillCopy = mongoose.models.BillCopy || null;

function parseDMY(dmy) {
  // expects "DD-MM-YYYY"
  if (typeof dmy !== "string") return null;
  const [dd, mm, yyyy] = dmy.split("-").map((x) => Number(x));
  if (!yyyy || !mm || !dd) return null;
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function atStartOfDayFromDMY(dmy) {
  const d = parseDMY(dmy);
  if (!d) return null;
  // normalize to local start-of-day for unique key consistency
  const local = new Date(d);
  local.setHours(0, 0, 0, 0);
  return local;
}

function normalizeEntries(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((e) => ({
    sno: Number(e.sno) > 0 ? Number(e.sno) : undefined,
    name: String(e.name || "").trim(),
    regNo: String(e.regno || e.regNo || "").trim(),
    mobileNo: String(e.mobileno || e.mobileNo || "").trim(),
    serviceType: String(e.serviceType || e["service type"] || "").trim(),
    modeOfPayment: String(e.modeOfPayment || e["mode of payment"] || "").trim(),
    vehicleName: String(e.vehicleName || e["vehicle name"] || "").trim(),
    jobcardNo: String(e.jobcardNo || e.Jobcardno || "").trim(),
    amount: Number(e.amount || 0),
  }));
}

function sumByJobcardNo(entries) {
  const map = new Map();
  (entries || []).forEach((e) => {
    const key = (e.jobcardNo || "").trim();
    if (!key) return;
    const val = Number(e.amount) || 0;
    map.set(key, (map.get(key) || 0) + val);
  });
  return map;
}

async function applyJobcardDeltas(deltaMap) {
  const ops = [];
  for (const [no, delta] of deltaMap.entries()) {
    if (!delta) continue;
    // Update JobCard totals (increment generic collections and amountCollected)
    ops.push(
      JobCard.updateOne(
        { $or: [{ jobcardNo: no }, { jobCardNo: no }, { jobcardno: no }] },
        { $inc: { "collections.bodyshop": delta, amountCollected: delta } }
      ).exec()
    );
    if (BillCopy) {
      ops.push(
        BillCopy.updateOne(
          { $or: [{ jobcardNo: no }, { jobCardNo: no }, { jobcardno: no }] },
          { $inc: { paidAmount: delta, "collections.bodyshop": delta } }
        ).exec()
      );
    }
  }
  await Promise.allSettled(ops);
}

function computeDeltaMap(prevEntries, nextEntries) {
  const prev = sumByJobcardNo(prevEntries);
  const next = sumByJobcardNo(nextEntries);
  const keys = new Set([...prev.keys(), ...next.keys()]);
  const delta = new Map();
  keys.forEach((k) => {
    delta.set(k, (next.get(k) || 0) - (prev.get(k) || 0));
  });
  return delta;
}

// CREATE/UPSERT day: POST /bodyshop/create
exports.createBodyShop = async (req, res) => {
  try {
    const { date, entries } = req.body || {};
    if (!date || !Array.isArray(entries)) {
      return res
        .status(400)
        .json({ success: false, message: "date (DD-MM-YYYY) and entries[] are required" });
    }
    const day = atStartOfDayFromDMY(date);
    if (!day) {
      return res.status(400).json({ success: false, message: "Invalid date format DD-MM-YYYY" });
    }
    const normalized = normalizeEntries(entries);

    const existing = await BodyShopDay.findOne({ date: day });
    const prevEntries = existing ? existing.entries : [];

    let doc;
    if (!existing) {
      doc = new BodyShopDay({ date: day, entries: normalized });
    } else {
      existing.entries = normalized;
      doc = existing;
    }

    await doc.save();

    const deltaMap = computeDeltaMap(prevEntries, doc.entries);
    await applyJobcardDeltas(deltaMap);

    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Create failed" });
  }
};

// UPDATE whole day: PUT /bodyshop/update/:id
exports.updateBodyShop = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await BodyShopDay.findById(id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const prevEntries = doc.entries.toObject();

    if (req.body.date) {
      const d = atStartOfDayFromDMY(req.body.date);
      if (!d) return res.status(400).json({ success: false, message: "Invalid date format DD-MM-YYYY" });
      doc.date = d;
    }
    if (Array.isArray(req.body.entries)) {
      doc.entries = normalizeEntries(req.body.entries);
    }

    await doc.save();

    const deltaMap = computeDeltaMap(prevEntries, doc.entries);
    await applyJobcardDeltas(deltaMap);

    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Update failed" });
  }
};

// LIST: GET /bodyshop/list?start=DD-MM-YYYY&end=DD-MM-YYYY
exports.listBodyShop = async (req, res) => {
  try {
    const { start, end } = req.query || {};
    const q = {};
    if (start || end) {
      q.date = {};
      if (start) {
        const s = atStartOfDayFromDMY(start);
        if (!s) return res.status(400).json({ success: false, message: "Invalid start date" });
        q.date.$gte = s;
      }
      if (end) {
        const e = atStartOfDayFromDMY(end);
        if (!e) return res.status(400).json({ success: false, message: "Invalid end date" });
        const nxt = new Date(e);
        nxt.setDate(nxt.getDate() + 1);
        q.date.$lt = nxt;
      }
    }
    const rows = await BodyShopDay.find(q).sort({ date: -1 });
    return res.json({ success: true, data: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "List failed" });
  }
};

// GET one: GET /bodyshop/:id
exports.getBodyShopById = async (req, res) => {
  try {
    const row = await BodyShopDay.findById(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: row });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Fetch failed" });
  }
};

// DELETE day: DELETE /bodyshop/delete/:id
exports.deleteBodyShop = async (req, res) => {
  try {
    const doc = await BodyShopDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const prevEntries = doc.entries.toObject();

    await doc.deleteOne();

    // Decrement jobcard totals for removed entries
    const zeroMap = computeDeltaMap(prevEntries, []); // results in negative deltas
    await applyJobcardDeltas(zeroMap);

    return res.json({ success: true, message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Delete failed" });
  }
};

// ENTRY-LEVEL: POST /bodyshop/:id/entry
exports.addBodyEntry = async (req, res) => {
  try {
    const doc = await BodyShopDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const prevEntries = doc.entries.toObject();

    const [entry] = normalizeEntries([req.body || {}]);
    if (!Number.isFinite(entry.sno) || entry.sno <= 0) {
      const maxSno =
        doc.entries.length > 0
          ? Math.max(...doc.entries.map((e) => Number(e.sno) || 0))
          : 0;
      entry.sno = maxSno + 1;
    }
    doc.entries.push(entry);
    await doc.save();

    const deltaMap = computeDeltaMap(prevEntries, doc.entries);
    await applyJobcardDeltas(deltaMap);

    return res.status(201).json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Add entry failed" });
  }
};

// ENTRY-LEVEL: PUT /bodyshop/:id/entry/:entryId
exports.updateBodyEntry = async (req, res) => {
  try {
    const doc = await BodyShopDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const prevEntries = doc.entries.toObject();

    const entry = doc.entries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    const patch = normalizeEntries([req.body || {}])[0];

    // Apply partial updates
    ["name","regNo","mobileNo","serviceType","modeOfPayment","vehicleName","jobcardNo","amount"].forEach((k) => {
      if (patch[k] !== undefined && patch[k] !== null) entry[k] = patch[k];
    });
    if (Number.isFinite(patch.sno) && patch.sno > 0) entry.sno = patch.sno;

    await doc.save();

    const deltaMap = computeDeltaMap(prevEntries, doc.entries);
    await applyJobcardDeltas(deltaMap);

    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Update entry failed" });
  }
};

// ENTRY-LEVEL: DELETE /bodyshop/:id/entry/:entryId
exports.deleteBodyEntry = async (req, res) => {
  try {
    const doc = await BodyShopDay.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });

    const prevEntries = doc.entries.toObject();

    const entry = doc.entries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });

    entry.deleteOne();
    await doc.save();

    const deltaMap = computeDeltaMap(prevEntries, doc.entries);
    await applyJobcardDeltas(deltaMap);

    return res.json({ success: true, data: doc });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message || "Delete entry failed" });
  }
};
