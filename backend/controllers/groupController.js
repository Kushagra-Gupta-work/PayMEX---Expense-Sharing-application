import mongoose from "mongoose";
import Group from "../models/Group.js";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";

const MEMBER_SELECT = "name email";

// POST /api/groups
// Creator is always added as a member regardless of what emails are passed in
export const createGroup = async (req, res) => {
  try {
    const { name, memberEmails } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const emails = Array.isArray(memberEmails) ? memberEmails : [];
    const normalizedEmails = emails
      .filter((e) => typeof e === "string" && e.trim())
      .map((e) => e.toLowerCase().trim());

    const foundUsers = normalizedEmails.length
      ? await User.find({ email: { $in: normalizedEmails } })
      : [];

    const foundEmails = foundUsers.map((u) => u.email);
    const notFoundEmails = normalizedEmails.filter((e) => !foundEmails.includes(e));

    const memberIdSet = new Set(foundUsers.map((u) => u._id.toString()));
    memberIdSet.add(req.userId.toString());

    const group = await Group.create({
      name: name.trim(),
      members: Array.from(memberIdSet),
      createdBy: req.userId,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("members", MEMBER_SELECT)
      .populate("createdBy", MEMBER_SELECT);

    return res.status(201).json({
      group: populatedGroup,
      ...(notFoundEmails.length && { emailsNotFound: notFoundEmails }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error creating group", error: error.message });
  }
};

// GET /api/groups
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate("members", MEMBER_SELECT)
      .populate("createdBy", MEMBER_SELECT)
      .sort({ createdAt: -1 });

    return res.status(200).json({ groups });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching groups", error: error.message });
  }
};

// GET /api/groups/:groupId
export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    const group = await Group.findById(groupId)
      .populate("members", MEMBER_SELECT)
      .populate("createdBy", MEMBER_SELECT);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => m._id.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    return res.status(200).json({ group });
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching group", error: error.message });
  }
};

// POST /api/groups/:groupId/members
// Any existing member can add someone new by email
export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid group id" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.toString() === req.userId.toString());
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });
    if (!userToAdd) {
      return res.status(404).json({ message: "No user found with that email" });
    }

    const alreadyMember = group.members.some((m) => m.toString() === userToAdd._id.toString());
    if (alreadyMember) {
      return res.status(409).json({ message: "User is already a member of this group" });
    }

    group.members.push(userToAdd._id);
    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate("members", MEMBER_SELECT)
      .populate("createdBy", MEMBER_SELECT);

    return res.status(200).json({ group: populatedGroup });
  } catch (error) {
    return res.status(500).json({ message: "Server error adding member", error: error.message });
  }
};

// DELETE /api/groups/:groupId
// Only the group creator can do this; cascades to expenses and payments
export const deleteGroup = async (req, res) => {
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

    if (group.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Only the group creator can delete this group" });
    }

    await Expense.deleteMany({ group: groupId });
    await Payment.deleteMany({ group: groupId });
    await group.deleteOne();

    return res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting group", error: error.message });
  }
};