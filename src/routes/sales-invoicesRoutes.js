const router = require("express").Router();
const c = require("../controllers/SalesInvoiceController");

router.post(
  "/create",
  
  c.createSalesInvoice,
);
router.get(
  "/all",
 
  c.getAllSalesInvoice,
);
router.get(
  "/:id",
 
  c.getSalesInvoiceById,
);
router.put(
  "/:id",
  
  c.updateSalesInvoice,
);
router.delete(
  "/:id",
  
  c.deleteSalesInvoice,
);
module.exports = router;
