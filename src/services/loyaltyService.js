const Customer = require("../models/Customer");
const LoyaltyPoints = require("../models/LoyaltyPoints");
const Settings = require("../models/Settings");
exports.earnPoints = async ({
  customer,
  invoice,
  amount,
  store,
  createdBy,
}) => {
  if (!customer) return 0;
  const settings = await Settings.findOne({ store });
  const per = settings?.loyaltyEarnPerAmount || 100;
  const pts = settings?.loyaltyPointsPerAmount || 1;
  const points = Math.floor(amount / per) * pts;
  if (points > 0) {
    await Customer.findByIdAndUpdate(customer, {
      $inc: { loyaltyPoints: points, totalPurchaseAmount: amount },
    });
    await LoyaltyPoints.create({
      customer,
      invoice,
      points,
      type: "earn",
      store,
      createdBy,
      remarks: "Invoice purchase",
    });
  }
  return points;
};
