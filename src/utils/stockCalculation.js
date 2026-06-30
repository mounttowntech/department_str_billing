module.exports = (currentStock, quantity, operation, allowNegative = false) => {
  currentStock = Number(currentStock || 0);
  quantity = Number(quantity || 0);
  if (quantity <= 0) throw new Error("Quantity must be greater than 0");
  const add = ["purchase", "sales_return", "adjustment_in", "transfer_in"];
  const sub = ["sale", "purchase_return", "adjustment_out", "transfer_out"];
  let after = currentStock;
  if (add.includes(operation)) after = currentStock + quantity;
  else if (sub.includes(operation)) {
    if (!allowNegative && currentStock < quantity)
      throw new Error("Insufficient stock");
    after = currentStock - quantity;
  } else throw new Error("Invalid stock operation");
  return { beforeStock: currentStock, afterStock: after };
};
