const EPSILON = 1e-9;

/**
 * Builds a map of userId -> net balance from expenses and payments.
 *
 * Positive balance = the group owes this person money.
 * Negative balance = this person owes the group money.
 *
 * For each expense: payer gets credited the full amount, each split member gets debited their share.
 * For each payment: the payer's balance goes up (debt reduced), recipient's goes down.
 */
export const calculateBalances = (expenses, payments = []) => {
  const balances = {};

  const adjust = (userId, delta) => {
    const key = userId.toString();
    balances[key] = (balances[key] || 0) + delta;
  };

  for (const expense of expenses) {
    const payerId = expense.paidBy?._id ?? expense.paidBy;
    adjust(payerId, expense.amount);

    for (const split of expense.splits) {
      const splitUserId = split.user?._id ?? split.user;
      adjust(splitUserId, -split.amount);
    }
  }

  for (const payment of payments) {
    const fromId = payment.from?._id ?? payment.from;
    const toId = payment.to?._id ?? payment.to;
    adjust(fromId, payment.amount);
    adjust(toId, -payment.amount);
  }

  return balances;
};

/**
 * Takes a balance map and returns the minimum set of transactions to settle all debts.
 * Uses a greedy approach: match the biggest debtor against the biggest creditor, repeat.
 */
export const simplifyDebts = (balances) => {
  const creditors = [];
  const debtors = [];

  for (const [userId, balance] of Object.entries(balances)) {
    if (balance > EPSILON) {
      creditors.push({ userId, amount: balance });
    } else if (balance < -EPSILON) {
      debtors.push({ userId, amount: -balance });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settledAmount = Math.min(debtor.amount, creditor.amount);

    if (settledAmount > EPSILON) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settledAmount * 100) / 100,
      });
    }

    debtor.amount -= settledAmount;
    creditor.amount -= settledAmount;

    if (debtor.amount < EPSILON) i++;
    if (creditor.amount < EPSILON) j++;
  }

  return transactions;
};