const Coupon = require("../models/Coupon");
const calculateDiscount = require("../utils/calculateDiscount");
exports.applyCoupon = async (couponCode, subTotal) => {
  if (!couponCode) return { coupon: null, discountAmount: 0 };
  const coupon = await Coupon.findOne({
    couponCode: couponCode.toUpperCase(),
    status: true,
  });
  if (!coupon) return { coupon: null, discountAmount: 0 };
  const now = new Date();
  if (coupon.startDate && coupon.startDate > now)
    return { coupon: null, discountAmount: 0 };
  if (coupon.endDate && coupon.endDate < now)
    return { coupon: null, discountAmount: 0 };
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
    return { coupon: null, discountAmount: 0 };
  if (subTotal < coupon.minBillAmount)
    return { coupon: null, discountAmount: 0 };
  const d = calculateDiscount(
    subTotal,
    coupon.discountValue,
    coupon.discountType,
    coupon.maxDiscountAmount,
  );
  coupon.usedCount += 1;
  await coupon.save();
  return { coupon, discountAmount: d.discountAmount };
};
exports.paymentStatus = (grandTotal, paidAmount) =>
  paidAmount >= grandTotal ? "paid" : paidAmount > 0 ? "partial" : "pending";
