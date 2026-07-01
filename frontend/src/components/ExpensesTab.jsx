import { useState } from "react";
import api from "../api/axios";
import AddExpenseModal from "./AddExpenseModal";

function ExpensesTab({ groupId, members, expenses, loading, error, currentUserId, onExpenseAdded, onExpenseDeleted }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // Only the person who logged the expense (addedBy) may delete it
  const canDelete = (expense) => {
    if (!currentUserId) return false;
    return expense.addedBy?._id === currentUserId;
  };

  const handleDelete = async (expense) => {
    if (
      !window.confirm(
        `Delete "${expense.description}"?\n\n₹${expense.amount.toFixed(2)} paid by ${expense.paidBy?.name ?? "Unknown"}\n\nThis will affect group balances.`
      )
    ) {
      return;
    }

    setDeleteError("");
    setDeletingId(expense._id);
    try {
      await api.delete(`/groups/${groupId}/expenses/${expense._id}`);
      await onExpenseDeleted();
    } catch (err) {
      if (err.response) {
        setDeleteError(err.response.data?.message || "Could not delete expense. Please try again.");
      } else {
        setDeleteError("Could not reach the server. Is the backend running?");
      }
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Expenses</h2>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          Add Expense
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
        ) : expenses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
            No expenses yet — add one!
          </div>
        ) : (
          <ul className="space-y-3">
            {expenses.map((expense) => {
              const isDeleting = deletingId === expense._id;
              const showDelete = canDelete(expense);

              return (
                <li
                  key={expense._id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Description + amount */}
                    <span className="font-medium text-gray-900">{expense.description}</span>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-semibold text-gray-900">
                        ₹{expense.amount.toFixed(2)}
                      </span>

                      {/* Delete button — only for the person who logged it */}
                      {showDelete && (
                        <button
                          type="button"
                          onClick={() => handleDelete(expense)}
                          disabled={isDeleting || deletingId !== null}
                          aria-label="Delete expense"
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

                  {/* Meta row: paid by, added by (if different), date */}
                  <div className="mt-1 flex items-center justify-between text-sm text-gray-500">
                    <span>
                      Paid by {expense.paidBy?.name || "Unknown"}
                      {expense.addedBy && expense.addedBy._id !== expense.paidBy?._id && (
                        <span className="ml-1 text-gray-400">
                          · Added by {expense.addedBy.name}
                        </span>
                      )}
                    </span>
                    <span>{new Date(expense.createdAt).toLocaleDateString()}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isModalOpen && (
        <AddExpenseModal
          groupId={groupId}
          members={members}
          onClose={() => setIsModalOpen(false)}
          onCreated={onExpenseAdded}
        />
      )}
    </div>
  );
}

export default ExpensesTab;
