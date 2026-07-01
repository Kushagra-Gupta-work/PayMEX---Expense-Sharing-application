import { useEffect, useState } from "react";
import api from "../api/axios";

function RecordPaymentModal({ groupId, members, onClose, onRecorded }) {
  const [from, setFrom] = useState(() => members[0]?._id || "");
  const [to, setTo] = useState(() => members[1]?._id || members[0]?._id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const amountNum = parseFloat(amount) || 0;

  const handleSubmit = async () => {
    if (submitting) return;
    setError("");

    if (!from) { setError("Select who paid"); return; }
    if (!to) { setError("Select who received the payment"); return; }
    if (from === to) { setError("'From' and 'To' must be different people"); return; }
    if (!Number.isFinite(amountNum) || amountNum <= 0) { setError("Amount must be a positive number"); return; }
    if (!date) { setError("Date is required"); return; }

    setSubmitting(true);
    try {
      await api.post(`/groups/${groupId}/payments`, {
        from,
        to,
        amount: amountNum,
        date,
        note: note.trim(),
      });
      await onRecorded();
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
        aria-labelledby="record-payment-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-full w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
      >
        <h2 id="record-payment-title" className="mb-4 text-lg font-semibold text-gray-900">
          Record a payment
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="mb-4">
          <label htmlFor="payment-from" className="mb-1 block text-sm font-medium text-gray-700">
            Who paid
          </label>
          <select
            id="payment-from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="payment-to" className="mb-1 block text-sm font-medium text-gray-700">
            Who received
          </label>
          <select
            id="payment-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
          {from === to && from && (
            <p className="mt-1 text-xs text-amber-600">Payer and recipient must be different people.</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="payment-amount" className="mb-1 block text-sm font-medium text-gray-700">
            Amount (₹)
          </label>
          <input
            id="payment-amount"
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
          <label htmlFor="payment-date" className="mb-1 block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="payment-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="payment-note" className="mb-1 block text-sm font-medium text-gray-700">
            Note <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="payment-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. via GPay, cash"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

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
            disabled={submitting || from === to}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Recording..." : "Record payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecordPaymentModal;