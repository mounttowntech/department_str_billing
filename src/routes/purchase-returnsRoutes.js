const express = require("express");

const router = express.Router();

const purchaseReturnController = require("../controllers/purchaseReturnController");

// Create Purchase Return
router.post(
  "/create",
  purchaseReturnController.createPurchaseReturn
);

// Get All Purchase Returns
router.get(
  "/all",
  purchaseReturnController.getPurchaseReturns
);

// Get Purchase Return By ID
router.get(
  "/:id",
  purchaseReturnController.getPurchaseReturnById
);

// Update Purchase Return
router.put(
  "/update/:id",
  purchaseReturnController.updatePurchaseReturn
);

// Update Return Status
router.patch(
  "/:id/status",
  purchaseReturnController.updateReturnStatus
);

// Delete Purchase Return (Soft Delete)
router.delete(
  "/delete/:id",
  purchaseReturnController.deletePurchaseReturn
);

module.exports = router;