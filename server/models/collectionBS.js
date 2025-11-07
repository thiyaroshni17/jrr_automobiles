// models/bodyShopDay.js
const mongoose = require("mongoose");

const bodyEntrySchema = new mongoose.Schema(
  {
    sno: { type: Number },                // auto-numbered per day
    name: { type: String, trim: true },
    mobileNo: { type: String, trim: true },
    regNo: { type: String, trim: true },
    vehicle: { type: String, trim: true },            // added per new model
    modeOfService: { type: String, trim: true },      // "mechanic" | "body shop"
    modeOfPayment: { type: String, trim: true },      // "gpay" | "cash" | "card"
    amount: { type: Number, required: true, min: 0 }, // required
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

// Auto-assign S.No by array order if not provided
bodyShopDaySchema.pre("validate", function () {
  this.entries.forEach((it, idx) => {
    if (!Number.isFinite(it.sno) || it.sno <= 0) it.sno = idx + 1;
  });
});

// Compute total amount on every save
bodyShopDaySchema.pre("save", function () {
  this.totalDailyAmount = this.entries.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );
});

module.exports = mongoose.model("BodyShopDay", bodyShopDaySchema);
