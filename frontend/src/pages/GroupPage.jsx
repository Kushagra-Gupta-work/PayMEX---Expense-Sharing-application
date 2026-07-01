import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ExpensesTab from "../components/ExpensesTab";
import BalancesTab from "../components/BalancesTab";
import SettleUpTab from "../components/SettleUpTab";
import PaymentsTab from "../components/PaymentsTab";
import AddMemberModal from "../components/AddMemberModal";

const TABS = [
  { id: "expenses", label: "Expenses" },
  { id: "payments", label: "Payments" },
  { id: "balances", label: "Balances" },
  { id: "settle", label: "Settle Up" },
];

function GroupPage() {
  const { groupId } = useParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("expenses");
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [groupError, setGroupError] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [expensesError, setExpensesError] = useState("");

  // Payments and balances are fetched lazily — only when that tab is first opened
  const [payments, setPayments] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentsError, setPaymentsError] = useState("");

  const [balancesData, setBalancesData] = useState(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [balancesError, setBalancesError] = useState("");

  const fetchGroup = useCallback(async () => {
    try {
      const { data } = await api.get(`/groups/${groupId}`);
      setGroup(data.group);
      setGroupError("");
    } catch (err) {
      setGroupError(err.response?.data?.message || "Could not load this group.");
    } finally {
      setLoadingGroup(false);
    }
  }, [groupId]);

  const fetchExpenses = useCallback(async () => {
    try {
      const { data } = await api.get(`/groups/${groupId}/expenses`);
      setExpenses(data.expenses);
      setExpensesError("");
    } catch (err) {
      setExpensesError(err.response?.data?.message || "Could not load expenses.");
    } finally {
      setLoadingExpenses(false);
    }
  }, [groupId]);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    setPaymentsError("");
    try {
      const { data } = await api.get(`/groups/${groupId}/payments`);
      setPayments(data.payments);
    } catch (err) {
      setPaymentsError(err.response?.data?.message || "Could not load payments.");
    } finally {
      setLoadingPayments(false);
    }
  }, [groupId]);

  const fetchBalances = useCallback(async () => {
    setLoadingBalances(true);
    setBalancesError("");
    try {
      const { data } = await api.get(`/groups/${groupId}/balances`);
      setBalancesData(data);
    } catch (err) {
      setBalancesError(err.response?.data?.message || "Could not load balances.");
    } finally {
      setLoadingBalances(false);
    }
  }, [groupId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGroup();
    fetchExpenses();
  }, [fetchGroup, fetchExpenses]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "payments" && payments === null && !loadingPayments) {
      fetchPayments();
    }
    if ((tabId === "balances" || tabId === "settle") && balancesData === null && !loadingBalances) {
      fetchBalances();
    }
  };

  const handleExpenseAdded = async () => {
    await fetchExpenses();
    setBalancesData(null); // invalidate so balances refresh next time
  };

  const handleExpenseDeleted = async () => {
    await fetchExpenses();
    setBalancesData(null);
  };

  const handlePaymentRecorded = async () => {
    await fetchPayments();
    setBalancesData(null);
  };

  const handleMemberAdded = async () => {
    await fetchGroup();
    setBalancesData(null);
  };

  if (loadingGroup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
        />
      </div>
    );
  }

  if (groupError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-10">
          <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            ← Back to dashboard
          </Link>
          <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{groupError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          ← Back to dashboard
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">{group?.name}</h1>
          <button
            type="button"
            onClick={() => setIsAddMemberModalOpen(true)}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Add Member
          </button>
        </div>

        <div className="mt-6 flex gap-1 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === "expenses" && (
            <ExpensesTab
              groupId={groupId}
              members={group?.members || []}
              expenses={expenses}
              loading={loadingExpenses}
              error={expensesError}
              currentUserId={user?._id}
              onExpenseAdded={handleExpenseAdded}
              onExpenseDeleted={handleExpenseDeleted}
            />
          )}
          {activeTab === "payments" && (
            <PaymentsTab
              groupId={groupId}
              members={group?.members || []}
              payments={payments || []}
              loading={loadingPayments}
              error={paymentsError}
              currentUserId={user?._id}
              onPaymentRecorded={handlePaymentRecorded}
            />
          )}
          {activeTab === "balances" && (
            <BalancesTab
              balances={balancesData?.balances || []}
              loading={loadingBalances}
              error={balancesError}
            />
          )}
          {activeTab === "settle" && (
            <SettleUpTab
              settlements={balancesData?.settlements || []}
              loading={loadingBalances}
              error={balancesError}
            />
          )}
        </div>
      </div>

      {isAddMemberModalOpen && (
        <AddMemberModal
          groupId={groupId}
          onClose={() => setIsAddMemberModalOpen(false)}
          onAdded={handleMemberAdded}
        />
      )}
    </div>
  );
}

export default GroupPage;