import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Group from "../models/Group.js";

const PERSON_SELECT = "name email";

// POST /api/groups/:groupId/payments
// Records that one member paid another — doesn't move real money, just logs it
export const recordPayment = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const memberIds = group.members.map((m) => m.toString());
    if (!memberIds.includes(req.userId.toString())) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const { from, to, amount, date, note } = req.body;

    if (!from || !mongoose.Types.ObjectId.isValid(from)) {
      return res.status(400).json({ message: "A valid 'from' user id is required" });
    }
    if (!memberIds.includes(from.toString())) {
      return res.status(400).json({ message: "'from' must be a member of this group" });
    }

    if (!to || !mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ message: "A valid 'to' user id is required" });
    }
    if (!memberIds.includes(to.toString())) {
      return res.status(400).json({ message: "'to' must be a member of this group" });
    }

    if (from.toString() === to.toString()) {
      return res.status(400).json({ message: "'from' and 'to' must be different users" });
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    let paymentDate = new Date();
    if (date !== undefined) {
      paymentDate = new Date(date);
      if (isNaN(paymentDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
    }

    const payment = await Payment.create({
      group: groupId,
      from,
      to,
      amount: Math.round(amount * 100) / 100,
      date: paymentDate,
      note: note || "",
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("from", PERSON_SELECT)
      .populate("to", PERSON_SELECT);

    return res.status(201).json({ payment: populatedPayment });
  } catch (error) {
    return res.status(500).json({ message: "Server error recording payment", error: error.message });
  }
};

// GET /api/groups/:groupId/payments
export const getGroupPayments = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const payments = await Payment.find({ group: groupId })
      .sort({ date: -1, createdAt: -1 })
      .populate("from", PERSON_SELECT)
      .populate("to", PERSON_SELECT);

    return res.status(200).json({ payments });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching payments", error: error.message });
  }
};

// DELETE /api/groups/:groupId/payments/:paymentId
// Only the payer or recipient can delete a payment
export const deletePayment = async (req, res) => {
  try {
    const { groupId, paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const payment = await Payment.findOne({ _id: paymentId, group: groupId });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found in this group" });
    }

    const currentUserId = req.userId.toString();
    const isParticipant =
      payment.from.toString() === currentUserId || payment.to.toString() === currentUserId;

    if (!isParticipant) {
      return res.status(403).json({ message: "Only the payer or recipient of a payment can delete it" });
    }

    await payment.deleteOne();
    return res.status(200).json({ message: "Payment deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting payment", error: error.message });
  }
};