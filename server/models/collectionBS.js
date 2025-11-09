// models/bodyShopDay.js
const mongoose = require("mongoose");

const bodyEntrySchema = new mongoose.Schema(
  {
    sno: { type: Number },                  // auto-numbered per day
    name: { type: String, trim: true },
    regNo: { type: String, trim: true },
    mobileNo: { type: String, trim: true },
    serviceType: { type: String, trim: true },     // "bodyshop" | "mechanic"
    modeOfPayment: { type: String, trim: true },   // "gpay" | "cash" | "card"
    vehicleName: { type: String, trim: true },
    jobcardNo: { type: String, trim: true },       // e.g., "JRR-2025-00001"
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const bodyShopDaySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true, index: true },
    entries: { type: [bodyEntrySchema], default: [] },
    totalDailyAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Assign S.No by array order if missing
bodyShopDaySchema.pre("validate", function () {
  this.entries.forEach((it, idx) => {
    if (!Number.isFinite(it.sno) || it.sno <= 0) it.sno = idx + 1;
  });
});

// Compute total on save
bodyShopDaySchema.pre("save", function () {
  this.totalDailyAmount = this.entries.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );
});

module.exports = mongoose.model("BodyShopDay", bodyShopDaySchema);
