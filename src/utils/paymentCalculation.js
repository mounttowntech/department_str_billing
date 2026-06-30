module.exports = (amount, paid) => {
  amount = Number(amount || 0);
  paid = Number(paid || 0);
  return {
    balanceAmount: Math.max(amount - paid, 0),
    returnAmount: Math.max(paid - amount, 0),
    paymentStatus:
      paid >= amount ? "Completed" : paid > 0 ? "Partial" : "Pending",
  };
};
