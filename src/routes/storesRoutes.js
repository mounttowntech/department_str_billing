const express = require("express");
const router = express.Router();

const storeController = require("../controllers/StoreController");

// ==========================================================
// CREATE STORE
// POST /api/stores/create
// ==========================================================

router.post(
  "/create",
  storeController.createStore
);

// ==========================================================
// GET ALL STORES
// GET /api/stores/all
// ==========================================================

router.get(
  "/all",
  storeController.getAllStores
);

// ==========================================================
// GET STORE BY ID
// GET /api/stores/:id
// ==========================================================

router.get(
  "/:id",
  storeController.getStoreById
);

// ==========================================================
// UPDATE STORE
// PUT /api/stores/update/:id
// ==========================================================

router.put(
  "/update/:id",
  storeController.updateStore
);

// ==========================================================
// DELETE STORE
// DELETE /api/stores/delete/:id
// ==========================================================

router.delete(
  "/delete/:id",
  storeController.deleteStore
);


module.exports = router;