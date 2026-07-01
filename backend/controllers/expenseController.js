import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import Payment from "../models/Payment.js";
import { calculateBalances, simplifyDebts } from "../utils/debtSimplifier.js";

const PERSON_SELECT = "name email";

// POST /api/groups/:groupId/expenses
// Supports "equal" (split evenly, remainder goes to last person) or "custom" (caller provides exact splits)
export const addExpense = async (req, res) => {
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

    const { description, amount, paidBy, splitType = "equal", splitBetween, splits } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    if (!paidBy || !mongoose.Types.ObjectId.isValid(paidBy)) {
      return res.status(400).json({ message: "A valid paidBy user id is required" });
    }

    if (!memberIds.includes(paidBy.toString())) {
      return res.status(400).json({ message: "paidBy must be a member of the group" });
    }

    if (!["equal", "custom"].includes(splitType)) {
      return res.status(400).json({ message: "splitType must be 'equal' or 'custom'" });
    }

    let finalSplits;

    if (splitType === "equal") {
      // Default to all members if no subset is specified
      const participantIds =
        Array.isArray(splitBetween) && splitBetween.length ? splitBetween : memberIds;
      const uniqueParticipants = [...new Set(participantIds.map(String))];

      const invalidParticipant = uniqueParticipants.find((id) => !memberIds.includes(id));
      if (invalidParticipant) {
        return res.status(400).json({ message: "All split participants must be members of the group" });
      }

      const n = uniqueParticipants.length;
      if (n === 0) {
        return res.status(400).json({ message: "At least one participant is required" });
      }

      // Work in paise to avoid floating point drift; any leftover goes to the last person
      const totalCents = Math.round(amount * 100);
      const baseCents = Math.floor(totalCents / n);
      const remainderCents = totalCents - baseCents * n;

      finalSplits = uniqueParticipants.map((userId, idx) => ({
        user: userId,
        amount: (baseCents + (idx === n - 1 ? remainderCents : 0)) / 100,
      }));
    } else {
      if (!Array.isArray(splits) || splits.length === 0) {
        return res.status(400).json({ message: "splits array is required for a custom split" });
      }

      for (const split of splits) {
        if (!split || !split.user || !mongoose.Types.ObjectId.isValid(split.user)) {
          return res.status(400).json({ message: "Each split must reference a valid user id" });
        }
        if (typeof split.amount !== "number" || !Number.isFinite(split.amount) || split.amount < 0) {
          return res.status(400).json({ message: "Each split amount must be a non-negative number" });
        }
        if (!memberIds.includes(split.user.toString())) {
          return res.status(400).json({ message: "All split participants must be members of the group" });
        }
      }

      const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(splitTotal - amount) > 0.01) {
        return res.status(400).json({
          message: `Splits must sum to the total amount (splits sum to ${splitTotal.toFixed(2)}, expected ${amount.toFixed(2)})`,
        });
      }

      finalSplits = splits.map((s) => ({
        user: s.user,
        amount: Math.round(s.amount * 100) / 100,
      }));
    }

    const expense = await Expense.create({
      group: groupId,
      description: description.trim(),
      amount,
      paidBy,
      addedBy: req.userId,
      splits: finalSplits,
      splitType,
    });

    const populatedExpense = await Expense.findById(expense._id)
      .populate("paidBy", PERSON_SELECT)
      .populate("addedBy", PERSON_SELECT)
      .populate("splits.user", PERSON_SELECT);

    return res.status(201).json({ expense: populatedExpense });
  } catch (error) {
    return res.status(500).json({ message: "Server error adding expense", error: error.message });
  }
};

// GET /api/groups/:groupId/expenses
export const getGroupExpenses = async (req, res) => {
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

    const expenses = await Expense.find({ group: groupId })
      .sort({ createdAt: -1 })
      .populate("paidBy", PERSON_SELECT)
      .populate("addedBy", PERSON_SELECT)
      .populate("splits.user", PERSON_SELECT);

    return res.status(200).json({ expenses });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching expenses", error: error.message });
  }
};

// DELETE /api/groups/:groupId/expenses/:expenseId
// Only the person who logged the expense (addedBy) can delete it
export const deleteExpense = async (req, res) => {
  try {
    const { groupId, expenseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({ message: "Invalid expense id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const expense = await Expense.findOne({ _id: expenseId, group: groupId });
    if (!expense) {
      return res.status(404).json({ message: "Expense not found in this group" });
    }

    if (expense.addedBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only the person who added this expense can delete it" });
    }

    await expense.deleteOne();
    return res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting expense", error: error.message });
  }
};

// GET /api/groups/:groupId/balances
// Calculates net balances and the minimal set of transfers to settle up
// Both expenses and payments are factored in
export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findById(groupId).populate("members", PERSON_SELECT);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => m._id.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const [expenses, payments] = await Promise.all([
      Expense.find({ group: groupId }),
      Payment.find({ group: groupId }),
    ]);

    const balanceMap = calculateBalances(expenses, payments);

    const nameById = {};
    group.members.forEach((m) => {
      nameById[m._id.toString()] = m.name;
    });

    const balances = group.members.map((m) => ({
      userId: m._id.toString(),
      name: m.name,
      balance: Math.round((balanceMap[m._id.toString()] || 0) * 100) / 100,
    }));

    const settlements = simplifyDebts(balanceMap).map((t) => ({
      from: t.from,
      to: t.to,
      fromName: nameById[t.from] || "Unknown",
      toName: nameById[t.to] || "Unknown",
      amount: t.amount,
    }));

    return res.status(200).json({ balances, settlements });
  } catch (error) {
    return res.status(500).json({ message: "Server error calculating balances", error: error.message });
  }
};