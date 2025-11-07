// models/waterWashDay.js
const mongoose = require("mongoose");

const washEntrySchema = new mongoose.Schema(
  {
    sno: { type: Number }, // auto-numbered per day
    name: { type: String, trim: true },
    vehicle: { type: String, required: true, trim: true }, // required
    modeOfPayment: { type: String, trim: true }, // e.g., "cash" | "gpay"
    mobileNo: { type: String, trim: true },
    regNo: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 }, // required
  },
  { _id: true }
);

const waterWashDaySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true, index: true },
    entries: { type: [washEntrySchema], default: [] },
    totalDailyAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-assign S.No by array order if not provided
waterWashDaySchema.pre("validate", function () {
  this.entries.forEach((it, idx) => {
    if (!Number.isFinite(it.sno) || it.sno <= 0) it.sno = idx + 1;
  });
});

// Compute total amount on every save
waterWashDaySchema.pre("save", function () {
  this.totalDailyAmount = this.entries.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );
});

module.exports = mongoose.model("WaterWashDay", waterWashDaySchema);
