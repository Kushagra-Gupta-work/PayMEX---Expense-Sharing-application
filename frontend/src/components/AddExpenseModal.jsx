import { useEffect, useState } from "react";
import api from "../api/axios";

function AddExpenseModal({ groupId, members, onClose, onCreated }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(() => members[0]?._id || "");
  const [splitType, setSplitType] = useState("equal");
  const [customSplits, setCustomSplits] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const amountNum = parseFloat(amount) || 0;
  const customTotal = members.reduce((sum, m) => sum + (parseFloat(customSplits[m._id]) || 0), 0);
  const customDiff = Math.round((amountNum - customTotal) * 100) / 100;
  const customMatches = Math.abs(customDiff) < 0.01;

  const handleCustomChange = (memberId, value) => {
    setCustomSplits((prev) => ({ ...prev, [memberId]: value }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setError("");

    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    if (!paidBy) {
      setError("Select who paid");
      return;
    }

    const body = { description: description.trim(), amount: amountNum, paidBy, splitType };

    if (splitType === "custom") {
      const splits = members
        .map((m) => ({ user: m._id, amount: parseFloat(customSplits[m._id]) }))
        .filter((s) => Number.isFinite(s.amount) && s.amount > 0);

      if (splits.length === 0) {
        setError("Enter at least one member's split amount");
        return;
      }

      const splitsTotal = splits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(splitsTotal - amountNum) > 0.01) {
        setError(`Splits must add up to ₹${amountNum.toFixed(2)} (currently ₹${splitsTotal.toFixed(2)})`);
        return;
      }

      body.splits = splits;
    }

    setSubmitting(true);
    try {
      await api.post(`/groups/${groupId}/expenses`, body);
      await onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 id="add-expense-title" className="mb-4 text-lg font-semibold text-gray-900">
          Add an expense
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-4">
          <label htmlFor="expense-description" className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            id="expense-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner at the beach shack"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="expense-amount" className="mb-1 block text-sm font-medium text-gray-700">
            Amount (₹)
          </label>
          <input
            id="expense-amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="expense-paid-by" className="mb-1 block text-sm font-medium text-gray-700">
            Paid by
          </label>
          <select
            id="expense-paid-by"
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <span className="mb-1 block text-sm font-medium text-gray-700">Split</span>
          <div className="inline-flex rounded-md border border-gray-300 p-0.5">
            <button
              type="button"
              onClick={() => setSplitType("equal")}
              className={`rounded px-3 py-1 text-sm font-medium ${
                splitType === "equal" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Equal
            </button>
            <button
              type="button"
              onClick={() => setSplitType("custom")}
              className={`rounded px-3 py-1 text-sm font-medium ${
                splitType === "custom" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {splitType === "equal" && (
          <p className="mb-4 text-xs text-gray-500">
            Split evenly across all {members.length} group {members.length === 1 ? "member" : "members"}.
          </p>
        )}

        {splitType === "custom" && (
          <div className="mb-2 space-y-2">
            {members.map((m) => (
              <div key={m._id} className="flex items-center justify-between gap-3">
                <label htmlFor={`split-${m._id}`} className="text-sm text-gray-700">
                  {m.name}
                </label>
                <input
                  id={`split-${m._id}`}
                  type="number"
                  step="0.01"
                  min="0"
                  value={customSplits[m._id] || ""}
                  onChange={(e) => handleCustomChange(m._id, e.target.value)}
                  placeholder="0.00"
                  className="w-28 rounded-md border border-gray-300 px-2 py-1 text-right text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                />
              </div>
            ))}

            <p className={`text-xs font-medium ${customMatches ? "text-green-700" : "text-amber-600"}`}>
              {customMatches
                ? `Splits add up to ₹${amountNum.toFixed(2)}.`
                : customDiff > 0
                  ? `₹${customDiff.toFixed(2)} left to assign.`
                  : `₹${Math.abs(customDiff).toFixed(2)} over the total.`}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || (splitType === "custom" && !customMatches)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Adding..." : "Add expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddExpenseModal;