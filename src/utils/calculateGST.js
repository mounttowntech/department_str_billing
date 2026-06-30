module.exports = (amount, gst = 0, type = "Exclusive") => {
  amount = Number(amount || 0);
  gst = Number(gst || 0);
  if (type === "Inclusive") {
    const taxable = amount / (1 + gst / 100);
    return {
      taxableAmount: +taxable.toFixed(2),
      gstAmount: +(amount - taxable).toFixed(2),
      totalAmount: +amount.toFixed(2),
    };
  }
  const gstAmount = (amount * gst) / 100;
  return {
    taxableAmount: +amount.toFixed(2),
    gstAmount: +gstAmount.toFixed(2),
    totalAmount: +(amount + gstAmount).toFixed(2),
  };
};
