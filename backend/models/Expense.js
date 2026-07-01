import mongoose from "mongoose";

const splitSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Split must reference a user"],
  },
  amount: {
    type: Number,
    required: [true, "Split must have an amount"],
  },
});

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "paidBy is required"],
    },
    // Who logged this expense — not necessarily who paid for it.
    // Only this person can delete the record.
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "addedBy is required"],
    },
    splits: {
      type: [splitSchema],
      required: [true, "Splits are required"],
      validate: {
        validator: (splits) => Array.isArray(splits) && splits.length > 0,
        message: "Expense must have at least one split",
      },
    },
    splitType: {
      type: String,
      enum: ["equal", "custom"],
      default: "equal",
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;