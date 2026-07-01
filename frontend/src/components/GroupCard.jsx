import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function GroupCard({ group, currentUserId, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const memberCount = group.members?.length || 0;
  const isCreator = group.createdBy?._id === currentUserId;

  const handleDelete = async (e) => {
    // Prevent the Link from firing
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        `Delete "${group.name}"?\n\nThis will permanently remove the group along with all its expenses and payments. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeleteError("");
    setDeleting(true);
    try {
      await api.delete(`/groups/${group._id}`);
      onDeleted(group._id);
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Could not delete group.");
      setDeleting(false);
    }
  };

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm transition hover:border-gray-400 hover:shadow-md">
      <Link to={`/groups/${group._id}`} className="block p-5">
        <h3 className="pr-8 text-base font-semibold text-gray-900">{group.name}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          Created by {group.createdBy?.name || "Unknown"}
        </p>

        {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
      </Link>

      {isCreator && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Delete group ${group.name}`}
          className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deleting ? (
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border border-red-400 border-t-transparent"
              aria-hidden="true"
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default GroupCard;