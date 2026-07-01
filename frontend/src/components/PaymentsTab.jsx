import { useState } from "react";
import api from "../api/axios";
import RecordPaymentModal from "./RecordPaymentModal";

function PaymentsTab({ groupId, members, payments, loading, error, currentUserId, onPaymentRecorded }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Only the payer (from) or recipient (to) of a payment may delete it —

  const canDelete = (payment) => {
    if (!currentUserId) return false;
    return (
      payment.from?._id === currentUserId ||
      payment.to?._id   === currentUserId
    );
  };

  const handleDelete = async (payment) => {
    const label = `${payment.from?.name ?? "Someone"} → ${payment.to?.name ?? "Someone"} ₹${payment.amount.toFixed(2)}`;
    if (!window.confirm(`Delete this payment?\n\n${label}\n\nThis will affect group balances.`)) {
      return;
    }

    setDeleteError("");
    setDeletingId(payment._id);
    try {
      await api.delete(`/groups/${groupId}/payments/${payment._id}`);
      // Re-use the same callback as "record" - it re-fetches payments and
      // invalidates balances, which is exactly what a delete also needs.
      await onPaymentRecorded();
    } catch (err) {
      if (err.response) {
        setDeleteError(err.response.data?.message || "Could not delete payment. Please try again.");
      } else {
        setDeleteError("Could not reach the server. Is the backend running?");
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Record Payment
        </button>
      </div>

      {deleteError && (
        <div className="mt-3 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              role="status"
              aria-label="Loading"
              className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
            />
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : payments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
            No payments recorded yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {payments.map((payment) => {
              const isDeleting = deletingId === payment._id;
              const showDelete = canDelete(payment);

              return (
                <li
                  key={payment._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: from → to */}
                    <span className="text-sm text-gray-900">
                      <span className="font-medium">{payment.from?.name || "Unknown"}</span>
                      {" → "}
                      <span className="font-medium">{payment.to?.name || "Unknown"}</span>
                    </span>

                    {/* Right: amount + delete button (only for participants) */}
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-semibold text-green-700">
                        ₹{payment.amount.toFixed(2)}
                      </span>

                      {showDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(payment)}
                          disabled={isDeleting || deletingId !== null}
                          aria-label="Delete payment"
                          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isDeleting ? (
                            <span className="flex items-center gap-1">
                              <span
                                className="inline-block h-3 w-3 animate-spin rounded-full border border-red-400 border-t-transparent"
                                aria-hidden="true"
                              />
                              Deleting
                            </span>
                          ) : (
                            "Delete"
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: date + optional note */}
                  <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
                    <span>{new Date(payment.date).toLocaleDateString()}</span>
                    {payment.note && <span className="italic">{payment.note}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <RecordPaymentModal
          groupId={groupId}
          members={members}
          onClose={() => setIsModalOpen(false)}
          onRecorded={onPaymentRecorded}
        />
      )}
    </div>
  );
}

export default PaymentsTab;
