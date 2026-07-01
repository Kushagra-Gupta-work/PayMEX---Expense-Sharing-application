import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import GroupCard from "../components/GroupCard";
import CreateGroupModal from "../components/CreateGroupModal";

function Dashboard() {
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await api.get("/groups");
      setGroups(data.groups);
      setFetchError("");
    } catch (err) {
      if (err.response) {
        setFetchError(err.response.data?.message || "Could not load groups.");
      } else {
        setFetchError("Could not reach the server. Is the backend running?");
      }
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroups();
  }, [fetchGroups]);

  const handleGroupCreated = async (emailsNotFound) => {
    await fetchGroups();
    setNotice(
      emailsNotFound?.length
        ? `Group created. No account found for: ${emailsNotFound.join(", ")}`
        : "Group created."
    );
  };

  const handleGroupDeleted = (deletedGroupId) => {
    setGroups((prev) => prev.filter((g) => g._id !== deletedGroupId));
    setNotice("Group deleted.");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Your groups</h1>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Create group
          </button>
        </div>

        {notice && (
          <div className="mt-4 flex items-start justify-between rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss"
              className="ml-3 text-blue-700 hover:text-blue-900"
            >
              ×
            </button>
          </div>
        )}

        <div className="mt-6">
          {loadingGroups ? (
            <div className="flex justify-center py-16">
              <div
                role="status"
                aria-label="Loading"
                className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
              />
            </div>
          ) : fetchError ? (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{fetchError}</div>
          ) : groups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
              No groups yet — create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {groups.map((group) => (
                <GroupCard
                  key={group._id}
                  group={group}
                  currentUserId={user?._id}
                  onDeleted={handleGroupDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateGroupModal onClose={() => setIsModalOpen(false)} onCreated={handleGroupCreated} />
      )}
    </div>
  );
}

export default Dashboard;