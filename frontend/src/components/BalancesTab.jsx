function BalancesTab({ balances, loading, error }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div
          role="status"
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900"
        />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  if (balances.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
        No balances to show yet.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {balances.map((member) => {
        const isPositive = member.balance > 0.004;
        const isNegative = member.balance < -0.004;
        const colorClass = isPositive
          ? "bg-green-50 text-green-700"
          : isNegative
            ? "bg-red-50 text-red-700"
            : "bg-gray-100 text-gray-500";

        return (
          <li
            key={member.userId}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <span className="font-medium text-gray-900">{member.name}</span>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${colorClass}`}>
              {isPositive && `+₹${member.balance.toFixed(2)}`}
              {isNegative && `-₹${Math.abs(member.balance).toFixed(2)}`}
              {!isPositive && !isNegative && "Settled"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default BalancesTab;
