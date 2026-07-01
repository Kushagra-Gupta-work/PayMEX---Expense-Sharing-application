import mongoose from "mongoose";

// Tracks real-world settlements between members (e.g. "Alice paid Bob ₹500 via GPay").
// These are factored into balance calculations so debts stay accurate after people settle up.
const paymentSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Group is required"],
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Payer (from) is required"],
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient (to) is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    // Can be backdated, e.g. if someone forgot to log a payment from last week
    date: {
      type: Date,
      required: [true, "Payment date is required"],
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;