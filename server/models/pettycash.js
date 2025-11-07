// models/pettycashDay.js
const mongoose = require("mongoose");

const pettyItemSchema = new mongoose.Schema(
  {
    sno: { type: Number }, // auto-numbered per day
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true } // keep subdocument _id for entry-level edits/deletes
);

const pettyCashDaySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true, // one document per date
      index: true,
    },
    entries: { type: [pettyItemSchema], default: [] },
    totalDailyExpenses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Assign S.No when missing/invalid based on array order
pettyCashDaySchema.pre("validate", function () {
  this.entries.forEach((it, idx) => {
    if (!Number.isFinite(it.sno) || it.sno <= 0) it.sno = idx + 1;
  });
});

// Recompute total on every save
pettyCashDaySchema.pre("save", function () {
  this.totalDailyExpenses = this.entries.reduce(
    (sum, it) => sum + (Number(it.amount) || 0),
    0
  );
});

module.exports = mongoose.model("PettyCashDay", pettyCashDaySchema);
