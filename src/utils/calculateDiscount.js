module.exports = (
  amount,
  discountValue = 0,
  discountType = "flat",
  max = 0,
) => {
  let d =
    discountType === "percentage"
      ? (amount * discountValue) / 100
      : Number(discountValue || 0);
  if (max > 0) d = Math.min(d, max);
  return {
    discountAmount: +d.toFixed(2),
    finalAmount: +Math.max(amount - d, 0).toFixed(2),
  };
};
