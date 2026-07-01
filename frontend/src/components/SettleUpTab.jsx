function SettleUpTab({ settlements, loading, error }) {
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

  if (settlements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center text-gray-500">
        Everyone&apos;s settled up.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {settlements.map((settlement, index) => (
        <li
          key={`${settlement.from}-${settlement.to}-${index}`}
          className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow-sm"
        >
          <span className="font-medium">{settlement.fromName}</span> pays{" "}
          <span className="font-medium">{settlement.toName}</span>{" "}
          <span className="font-semibold">₹{settlement.amount.toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}

export default SettleUpTab;
